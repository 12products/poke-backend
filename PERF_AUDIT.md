# Performance Audit Report

**Date:** 2026-02-24
**Codebase:** poke-backend (NestJS + Prisma + Twilio + Supabase Auth)

---

## Critical Issues

### 1. Missing Database Indexes

**Files:** `prisma/schema.prisma`, `src/reminders/reminders.service.ts`, `src/message/message.service.ts`

| Column | Used In | Frequency | Impact |
|--------|---------|-----------|--------|
| `Reminder.userId` | `findAll(userId)` on every GET /reminders | Per-request | Full table scan |
| `Reminder.notificationTime` | `sendReminders()` cron | Every 5 minutes | Full table scan |
| `Message.active` + `Message.nextSend` | `resendMessage()` cron | Every 1 minute | Full table scan |

**Fix:** Add to `schema.prisma`:
```prisma
model Reminder {
  @@index([userId])
  @@index([notificationTime])
}
model Message {
  @@index([active, nextSend])
}
```

---

### 2. `forEach` + `async` Anti-Pattern (Uncontrolled Concurrency + Silent Failures)

**File:** `src/message/message.service.ts:142`
```typescript
allMessages.forEach(async (message) => {
    await this.sendMessage(message.reminder.id)
    // ...
    await this.update({ ... })
})
```

`Array.forEach` does **not** await async callbacks. This fires all messages concurrently with:
- No backpressure on Twilio API (could hit rate limits)
- No error handling (unhandled promise rejections)
- The cron method returns before any sends complete

**Same pattern at:** `src/reminders/reminders.service.ts:140-147` — `forEach` with unawaited `this.messageService.create()`.

**Fix:** Use `for...of` loop or batch with concurrency control.

---

### 3. N+1 Query Pattern in `resendMessage` Cron

**File:** `src/message/message.service.ts:142-157`

For N messages: 1 (findMany) + N (re-fetch reminder+user via `sendMessage`) + N (update) = **2N+1 queries**.

The initial `findMany` already includes `{ reminder: true }`, but `sendMessage()` re-fetches the reminder with `include: { user: true }`. The user data could be included in the original query instead.

**Fix:** Use `include: { reminder: { include: { user: true } } }` in the original query and pass the loaded data directly.

---

## High Severity

### 4. Unawaited Promise in Webhook Handler

**File:** `src/message/message.service.ts:106`
```typescript
this.remove({ reminderId: reminder.id })  // missing await!
```

This fire-and-forget DB deletion in the Twilio webhook has no error handling. If it fails, the reminder is not cleaned up and no one is notified.

---

### 5. JWT Verification on Every Request With No Caching

**Files:** `src/auth/auth.guard.ts:13-24`, `src/auth/supabase.strategy.ts:8-23`

`PokeAuthGuard` is registered as `APP_GUARD` — full JWT cryptographic verification runs on every non-public request. The same token verified 10 times in 5 seconds performs 10 identical crypto operations.

**Fix:** Add an in-memory LRU cache keyed by raw JWT with short TTL (30-60s).

---

### 6. Synchronous Webhook Processing Risks Twilio Timeout

**File:** `src/message/message.service.ts:87-116`

The `POST /v1/message/sms` handler performs DB lookup, loops through reminders, deletes data, and builds TwiML all synchronously. Twilio webhooks have a 15-second timeout — a slow DB could cause retries and duplicate processing.

---

### 7. Database Connection Pool Not Properly Managed

**File:** `src/database/database.service.ts`

- `DatabaseModule` is not marked `@Global()`, so importing it in multiple modules could create multiple `PrismaClient` instances with separate connection pools.
- The `onModuleInit` shutdown hook may not be wired up properly, risking connection leaks on restart.
- No explicit connection pool size configuration.

---

## Medium Severity

### 8. Overly Broad Queries — No `select` Anywhere

Every Prisma query fetches all columns. Key examples:

| Location | Only Needs | Fetches |
|----------|-----------|---------|
| `reminders.service.ts:127` (cron) | `timeZone, notificationDays, emoji, id` | All 10 fields |
| `message.service.ts:93` (webhook) | `reminder.emoji, reminder.id` | All user + all reminder fields |
| `message.service.ts:121` (cron) | `message.reminder.id` | All message + all reminder fields |

---

### 9. Application-Side Filtering Instead of DB-Side

**File:** `src/reminders/reminders.service.ts:133-136`
```typescript
remindersToSend = remindersToSend.filter((reminder) => {
    const userLocalNow = utcToZonedTime(now, reminder.timeZone)
    return reminder.notificationDays.includes(userLocalNow.getDay())
})
```

All reminders matching a time slot are fetched, then filtered in JS by day-of-week. At scale, this fetches many rows only to discard most of them.

---

### 10. Unbounded Queries Without Pagination

| Method | File | Issue |
|--------|------|-------|
| `UsersService.findAll()` | `users.service.ts:24` | Returns ALL users, no limit |
| `MessageService.findAll()` | `message.service.ts:59` | Returns ALL messages, no limit |
| `RemindersService.findAll(userId)` | `reminders.service.ts:61` | No limit per user |
| `sendReminders()` cron | `reminders.service.ts:127` | Unbounded result set |

---

### 11. External API Calls Without Timeouts or Circuit Breakers

| Service | File | Issue |
|---------|------|-------|
| Twilio SMS | `twilio/twilio.service.ts:26-33` | No timeout, no retry, no circuit breaker |
| Apple receipt verification | `subscriptions/subscriptions.service.ts:21-41` | No timeout, no caching of validated receipts |

---

### 12. `appleReceiptVerify.config()` Called Per-Request

**File:** `src/subscriptions/subscriptions.service.ts:22-25`

The config call mutates global module state on every `create()` invocation. Should be called once in the constructor.

---

## Low Severity

### 13. No Cascade Deletes

**File:** `prisma/schema.prisma`

No `onDelete: Cascade` defined on relations. Manual two-step deletion in `reminders.service.ts:101-120` requires extra queries and risks inconsistent state.

### 14. `notificationTime` Uses Full DateTime for Time-Only Data

**File:** `src/utils.ts:8-16`

All times normalized to `2001-02-01` — wasteful use of `Timestamptz` when only hours:minutes matter. PostgreSQL `time` type would be more appropriate.

### 15. No Rate Limiting on Public Endpoints

The `POST /v1/message/sms` endpoint is public and unauthenticated. No rate limiting means it can be abused to trigger unbounded DB queries and Twilio API calls.

### 16. No Response Caching

No caching middleware or interceptors. Frequently-accessed endpoints like `GET /reminders` hit the database on every request.

---

## Summary

| Severity | Count | Key Theme |
|----------|-------|-----------|
| **Critical** | 3 | Missing indexes, uncontrolled concurrency, N+1 queries |
| **High** | 4 | Unawaited promises, JWT overhead, webhook timeouts, connection pool |
| **Medium** | 5 | Broad queries, unbounded results, no timeouts, app-side filtering |
| **Low** | 4 | No cascades, no rate limiting, no caching, wasteful types |
