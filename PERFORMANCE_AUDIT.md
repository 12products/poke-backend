# Performance Audit Report — poke-backend

**Date:** 2026-02-24
**Stack:** NestJS + Fastify + Prisma + Twilio + Supabase Auth

---

## Critical Issues

### 1. N+1 Queries in `resendMessage` Cron (forEach + async)

**File:** `src/message/message.service.ts:142-157`

```typescript
allMessages.forEach(async (message) => {
  await this.sendMessage(message.reminder.id)  // DB query per message
  await this.update({ ... })                    // another DB query per message
})
```

- `.forEach()` does NOT await async callbacks — all iterations fire concurrently as untracked promises
- For N messages: 2N+1 queries (1 initial fetch + N sendMessage lookups + N updates)
- Unhandled promise rejections can crash the process (Node 15+)
- **Fix:** Use `for...of` loop, include `reminder.user` in the initial `findMany`, batch updates with `$transaction`

### 2. N+1 Queries in `sendReminders` Cron (fire-and-forget)

**File:** `src/reminders/reminders.service.ts:140-147`

```typescript
remindersToSend.forEach((reminder) => {
  this.messageService.create(reminder.id)  // no await, up to 4 DB queries per reminder
})
```

- `messageService.create()` returns a Promise that is completely discarded
- Each call does: findOne + conditionally remove + create + sendMessage = up to 4 DB queries
- No backpressure — hammers DB and Twilio simultaneously
- **Fix:** Use `for...of` with `await`, or `Promise.all` with concurrency control

### 3. Missing Database Indexes

**File:** `prisma/schema.prisma`

| Model | Query Pattern | Missing Index |
|-------|--------------|---------------|
| `Reminder` | `findMany({ where: { userId } })` | `@@index([userId])` |
| `Reminder` | `findMany({ where: { notificationTime } })` | `@@index([notificationTime])` |
| `Message` | `findMany({ where: { active, nextSend lte } })` | `@@index([active, nextSend])` |

The cron jobs run every 1-5 minutes and do full table scans without index support.

### 4. Missing Rate Limiting

No rate limiting anywhere. The public `POST /v1/message/sms` webhook (`@Public()`) can be hit by anyone with no throttling, triggering arbitrary DB + Twilio processing.

### 5. Missing `await` on `this.remove()` — Fire-and-Forget DB Delete

**File:** `src/message/message.service.ts:106`

```typescript
this.remove({ reminderId: reminder.id })  // async, not awaited
```

Race condition: cron can resend the message before the delete completes.

---

## High Severity Issues

### 6. Auth Guard Calls Supabase on Every Request (No Caching)

**Files:** `src/auth/supabase.strategy.ts`, `src/app.module.ts:27-31`

The `PokeAuthGuard` is a global `APP_GUARD`. Every authenticated request triggers a full Supabase token validation with no in-process cache. A short-lived TTL cache (30-60s) for valid JWTs would eliminate redundant network calls.

### 7. Cron Fetches All Reminders, Filters Day-of-Week in Memory

**File:** `src/reminders/reminders.service.ts:127-136`

```typescript
let remindersToSend = await this.db.reminder.findMany({
  where: { notificationTime: getNotificationTime(now) },
})
remindersToSend = remindersToSend.filter((reminder) => {
  const userLocalNow = utcToZonedTime(now, reminder.timeZone)
  return reminder.notificationDays.includes(userLocalNow.getDay())
})
```

Fetches all time-matching reminders then discards non-matching days in JS. No batch limit either — memory spike risk.

### 8. Sequential Awaits That Could Be Parallelized

**File:** `src/reminders/reminders.service.ts:27-31`

```typescript
const currentReminders = await this.findAll(user.id)      // independent
const currentUser = await this.db.user.findUnique({ ... }) // independent
```

**Fix:** `Promise.all([this.findAll(user.id), this.db.user.findUnique(...)])`

### 9. Extra DB Round-Trips for Ownership Checks

**File:** `src/reminders/reminders.service.ts:69-121`

- `findOne()` (line 69): fetches then checks `userId` in JS — could use `findFirst({ where: { id, userId } })`
- `update()` (line 86): fetch-then-update — could use single `updateMany` with compound `where`
- `remove()` (line 94): 3 sequential queries with no transaction — if delete fails, messages are already deleted

---

## Medium Severity Issues

### 10. No Response Compression

**File:** `src/main.ts`

No `@fastify/compress` configured. All JSON payloads sent uncompressed.

### 11. Overfetching — No `select` Clauses Anywhere

Every Prisma query returns all columns. No `select` is used in the entire codebase. Internal fields leak to API responses.

### 12. Unbounded `findAll` Without Pagination

| File | Method | Issue |
|------|--------|-------|
| `src/users/users.service.ts:24` | `findAll()` | Returns entire User table |
| `src/message/message.service.ts:59` | `findAll()` | Returns every Message ever created |
| `src/reminders/reminders.service.ts:61` | `findAll(userId)` | No limit on user's reminders |

### 13. Check-Then-Act Patterns (TOCTOU Race Conditions)

- `src/message/message.service.ts:18-24`: findOne → remove → create could be a single `upsert`
- `src/users/users.service.ts:10-18`: findOne → create could be a single `upsert`

### 14. Apple Receipt Config Re-Initialized Per Request

**File:** `src/subscriptions/subscriptions.service.ts:21-25`

`appleReceiptVerify.config()` is called inside `create()` on every request. Should be called once in `onModuleInit`.

### 15. No Caching Layer

No caching (Redis, in-memory LRU, or `@nestjs/cache-manager`) anywhere. Frequently accessed data (user lookups, reminder counts) always hits the database.

### 16. Unnecessary `async` on Synchronous Function

**File:** `src/twilio/twilio.service.ts:19-23`

`respondToMessage()` does no async work but is marked `async`, adding unnecessary Promise wrapping.

### 17. Redundant `return await`

**File:** `src/message/message.service.ts:66, 115`

`return await` in non-try/catch context adds an unnecessary microtask.

---

## Low Severity Issues

### 18. Wildcard CORS (`origin: '*'`)

**File:** `src/main.ts:16` — Allows any domain. Amplifies abuse risk with missing rate limiting.

### 19. Unhandled Bootstrap Promise

**File:** `src/main.ts:27` — `bootstrap()` rejection is not caught. Should use `.catch()` with `process.exit(1)`.

### 20. Race Condition Between Cron Jobs

`sendReminders` (every 5 min) creates messages fire-and-forget while `resendMessage` (every 1 min) queries the same messages. A message can be sent twice if the cron overlaps with an in-flight create.

### 21. Missing Null Checks After `findUnique`

**Files:** `src/message/message.service.ts:70-80`, `src/reminders/reminders.service.ts:73,86,98`

`findUnique` can return `null`. Accessing properties without null checks causes `TypeError` crashes, especially in fire-and-forget cron contexts.

### 22. Empty Twilio Controller

**File:** `src/twilio/twilio.controller.ts` — Zero routes, still instantiated and registers `/v1/twilio` prefix.

---

## Priority Fix Order

1. **Fix cron loops** (#1, #2) — Biggest immediate impact. Replace `.forEach` with proper async iteration.
2. **Add database indexes** (#3) — Quick win, massive query performance improvement.
3. **Add rate limiting** (#4) — Security + performance protection.
4. **Fix fire-and-forget awaits** (#5) — Correctness bug causing race conditions.
5. **Cache auth tokens** (#6) — Reduces latency on every authenticated request.
6. **Add batch limits to cron queries** (#7) — Prevents memory spikes at scale.
7. **Parallelize independent queries** (#8) — Easy refactor for lower latency.
8. **Consolidate ownership checks** (#9) — Fewer DB round-trips per request.
9. **Add pagination** (#12) — Prevents unbounded memory usage.
10. **Add compression, caching, select clauses** (#10, #11, #15) — Incremental improvements.
