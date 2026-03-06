# Performance Issues Report - Poke Backend

## HIGH Severity

### 1. Async forEach Anti-Pattern (Uncontrolled Concurrency)
**File:** `src/message/message.service.ts:142-157`

```typescript
allMessages.forEach(async (message) => {
  await this.sendMessage(message.reminder.id)
  const nextSend = getNextSendTime(new Date(), message.tries)
  const active = message.tries < 4
  await this.update({
    where: { id: message.id },
    data: { nextSend, tries: message.tries + 1, active },
  })
})
```

**Problem:** `forEach` with async callbacks does not await the promises. The enclosing function returns immediately, leading to uncontrolled parallel executions, unhandled promise rejections, and potential database connection exhaustion.

**Fix:** Use `for...of` with `await` for sequential processing, or `Promise.all(allMessages.map(...))` for controlled parallelism.

---

### 2. Fire-and-Forget Promise (Missing Await)
**File:** `src/reminders/reminders.service.ts:140-147`

```typescript
remindersToSend.forEach((reminder) => {
  this.logger.log(...)
  this.messageService.create(reminder.id)  // <-- no await!
})
```

**Problem:** `messageService.create()` returns a Promise that is never awaited. Errors from message creation are silently lost. Under load, this can spawn unbounded concurrent database operations.

**Fix:** Use `Promise.all()` or `for...of` with proper `await`.

---

### 3. Missing Database Indexes on Cron-Queried Columns
**File:** `prisma/schema.prisma`

The two cron jobs query these columns every 1-5 minutes, but none have indexes:

| Column(s) | Queried In | Frequency |
|---|---|---|
| `Reminder.notificationTime` | `reminders.service.ts:127` | Every 5 min |
| `Message.nextSend` + `Message.active` | `message.service.ts:121-138` | Every 1 min |
| `Reminder.userId` | `reminders.service.ts:62` | Every request |

**Problem:** Full table scans on every cron tick and every API request. Performance degrades linearly with data growth.

**Fix:** Add indexes in `schema.prisma`:
```prisma
model Reminder {
  @@index([notificationTime])
  @@index([userId])
}

model Message {
  @@index([active, nextSend])
}
```

---

## MEDIUM Severity

### 4. N+1 Query in Reminder Creation
**File:** `src/reminders/reminders.service.ts:26-32`

```typescript
const currentReminders = await this.findAll(user.id)   // Query 1
const currentUser: User = await this.db.user.findUnique({
  where: { id: user.id },                               // Query 2
})
```

**Problem:** Two sequential database round-trips when a single query with `include` would suffice. The user data is already available from the auth guard.

**Fix:** Pass the user object from the controller (already authenticated) or combine into a single query.

---

### 5. Redundant Check-Then-Delete in Message Creation
**File:** `src/message/message.service.ts:18-24`

```typescript
const hasMessage = await this.findOne({ reminderId })  // Query 1
if (hasMessage) {
  await this.remove({ reminderId })                     // Query 2
}
// then create...                                       // Query 3
```

**Problem:** Three database round-trips when Prisma's `upsert()` or a single `deleteMany` + `create` would reduce this to 1-2 round-trips.

---

### 6. Application-Side Filtering of Reminders
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

**Problem:** Fetches ALL reminders matching the time, then filters in JS by day-of-week. With many users, this loads unnecessary rows into memory.

**Fix:** Where possible, push the day-of-week filter into the database query using `notificationDays: { has: currentDay }`.

---

### 7. No Connection Pool Configuration
**File:** `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Problem:** Uses Prisma's default connection pool size (based on `num_cpus * 2 + 1`). With frequent cron jobs and concurrent SMS webhook handling, connections could be exhausted. No explicit pool size or timeout configuration.

**Fix:** Configure pool size in DATABASE_URL: `?connection_limit=10&pool_timeout=10`.

---

### 8. No Caching Layer
**Throughout the codebase**

**Problem:** No caching of any kind. Frequently accessed data (user subscription status, reminder counts, timezone info) is queried from the database on every request and every cron tick.

**Fix:** Add in-memory caching (e.g., NestJS `CacheModule`) for hot data like user subscription status.

---

## LOW Severity

### 9. Unbounded `findAll()` Methods
**Files:** `src/users/users.service.ts:24`, `src/message/message.service.ts:59`

```typescript
findAll(): Promise<User[]> {
  return this.db.user.findMany()  // No limit, no pagination
}
```

**Problem:** Returns entire tables without pagination. While not currently called from API endpoints, these are latent issues that will cause memory problems as data grows.

---

### 10. Overly Permissive CORS
**File:** `src/main.ts:15-18`

```typescript
app.enableCors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
})
```

**Problem:** Allows any origin. While primarily a security concern, it also means the server processes preflight requests from any domain unnecessarily.

---

### 11. Missing Authorization Check on User Update (Security)
**File:** `src/users/users.controller.ts:17-20`

```typescript
@Patch(':id')
update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
  return this.usersService.update({ where: { id }, data })
}
```

**Problem:** No verification that the authenticated user matches the `:id` param. Any authenticated user can modify any other user's profile data.

**Fix:** Add `@CurrentUser()` decorator and verify `user.id === id` before proceeding.

---

### 12. Missing Await on `remove()` in SMS Webhook
**File:** `src/message/message.service.ts:106`

```typescript
this.remove({ reminderId: reminder.id })  // Not awaited!
pokeResponse = 'Great work!'
```

**Problem:** The message deletion is fire-and-forget. The SMS response is sent before deletion completes, risking race conditions if another cron tick fires before the delete finishes.

---

### 13. Sequential Awaits That Could Be Parallel
**File:** `src/message/message.service.ts:142-157`

Inside the loop, `sendMessage()` and `update()` are run sequentially per message. The DB update doesn't depend on the SMS result.

**Fix:** `Promise.all([this.sendMessage(...), this.update(...)])` per message.

---

## Summary

| # | Issue | Severity | File |
|---|---|---|---|
| 1 | Async forEach anti-pattern | HIGH | message.service.ts |
| 2 | Fire-and-forget promise | HIGH | reminders.service.ts |
| 3 | Missing database indexes | HIGH | schema.prisma |
| 4 | N+1 query in create | MEDIUM | reminders.service.ts |
| 5 | Redundant check-then-delete | MEDIUM | message.service.ts |
| 6 | App-side filtering | MEDIUM | reminders.service.ts |
| 7 | No connection pool config | MEDIUM | schema.prisma |
| 8 | No caching layer | MEDIUM | (throughout) |
| 9 | Unbounded findAll() | LOW | users/message service |
| 10 | Permissive CORS | LOW | main.ts |
| 11 | Missing auth check on user update | HIGH | users.controller.ts |
| 12 | Missing await on remove() | MEDIUM | message.service.ts |
| 13 | Sequential awaits | LOW | message.service.ts |
