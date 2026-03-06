# Performance Issues Report

## Critical Issues

### 1. Async forEach Anti-Pattern (Race Condition)
**File:** `src/message/message.service.ts:142-157`

```typescript
allMessages.forEach(async (message) => {
  await this.sendMessage(message.reminder.id)
  // ...
  await this.update({...})
})
```

**Problem:** `forEach` does not await async callbacks. All iterations fire concurrently without the caller knowing when they finish. If the cron job fires again before the previous batch completes, race conditions cause duplicate sends and incorrect retry counts.

**Fix:** Use `for...of` for sequential execution or `Promise.all(allMessages.map(...))` for controlled parallel execution.

---

### 2. N+1 Query in `resendMessages` Cron Job
**File:** `src/message/message.service.ts:142-157`

The query at line 121-137 already includes `{ reminder: true }`, so each message has its reminder loaded. But `sendMessage()` (line 143) calls `findUnique()` again to re-fetch the same reminder. This creates N extra queries for N messages.

**Fix:** Pass the already-loaded `message.reminder` directly instead of re-querying by ID.

---

### 3. Fire-and-Forget Async in `sendReminders` Cron
**File:** `src/reminders/reminders.service.ts:140-147`

```typescript
remindersToSend.forEach((reminder) => {
  this.messageService.create(reminder.id)  // not awaited
})
```

**Problem:** `messageService.create()` is async but never awaited. Errors are silently lost, and the cron job reports completion before work finishes.

**Fix:** `await Promise.all(remindersToSend.map(r => this.messageService.create(r.id)))`

---

## High Severity

### 4. Unbounded `findAll()` Queries (No Pagination)
**Files:**
- `src/message/message.service.ts:59-60` — `this.db.message.findMany()` (all messages)
- `src/users/users.service.ts:24-25` — `this.db.user.findMany()` (all users)
- `src/reminders/reminders.service.ts:61-66` — all reminders for a user

**Problem:** No `take`/`skip` limits. As tables grow, these queries return unbounded result sets, causing memory exhaustion and slow responses.

**Fix:** Add pagination parameters (`skip`, `take`) and enforce a maximum page size.

---

### 5. Application-Level Filtering Instead of Database Filtering
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

**Problem:** Fetches all reminders matching the time, then filters by day-of-week in JS. Transfers unnecessary rows from the database.

**Fix:** Pre-compute the valid days and push filtering into the WHERE clause, or store a denormalized schedule that can be queried directly.

---

### 6. Missing Database Indexes on Hot Columns
**File:** `prisma/schema.prisma`

Columns frequently used in cron WHERE clauses lack explicit indexes:
- `Reminder.notificationTime` (queried every 5 min)
- `Message.active` + `Message.nextSend` (queried every 1 min)

**Fix:** Add indexes in the Prisma schema:
```prisma
model Reminder {
  @@index([notificationTime])
}
model Message {
  @@index([active, nextSend])
}
```

---

### 7. Two Sequential Queries That Could Be One
**File:** `src/reminders/reminders.service.ts:26-31`

```typescript
const currentReminders = await this.findAll(user.id)
const currentUser = await this.db.user.findUnique({ where: { id: user.id } })
```

**Fix:** Single query with `include: { reminders: true }`.

---

### 8. Broken Parameter Binding
**File:** `src/message/message.controller.ts:10-13`

```typescript
@Post()
sendMessage(reminderId: string) {  // not bound from request
  return this.messageService.sendMessage(reminderId)
}
```

`reminderId` is never populated — it will always be `undefined`. This is a bug.

---

## Medium Severity

### 9. Missing Rate Limiting
**File:** `src/main.ts`

No rate limiting middleware. The `POST /message/sms` endpoint (Twilio webhook) and other routes are open to abuse, risking Twilio cost spikes and DB overload.

---

### 10. Missing Response Compression
**File:** `src/main.ts`

No gzip/brotli compression configured on the Fastify adapter.

---

### 11. Over-Fetching in SMS Receive Handler
**File:** `src/message/message.service.ts:93-98`

Loads all user reminders (`include: { reminders: true }`) just to find one matching emoji. Could use a targeted query instead.

---

### 12. Expensive `JSON.stringify` in Logging Hot Path
**File:** `src/reminders/reminders.service.ts:88-90`

```typescript
this.logger.log(`Updating reminder ${reminder.id} with ${JSON.stringify(data)}`)
```

Serializes the full data object on every update. Use lazy/conditional logging or log only the ID.

---

### 13. Silent Error Swallowing on Message Deletion
**File:** `src/reminders/reminders.service.ts:102-112`

Deletion failure is caught and logged, but the reminder is still deleted afterward, leaving orphaned messages. No retry or transactional guarantee.

---

### 14. No Explicit Connection Pool Tuning
**File:** `src/database/database.service.ts`

PrismaClient uses default pool settings. Under concurrent cron + API load, connection exhaustion is possible.

**Fix:** Configure `connection_limit` in the database URL or Prisma datasource config.

---

### 15. CORS Allows All Origins
**File:** `src/main.ts`

```typescript
app.enableCors({ origin: '*' })
```

Not a perf issue per se, but combined with missing rate limiting, it amplifies abuse risk.
