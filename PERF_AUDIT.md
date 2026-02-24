# Performance Audit Report

Automated analysis of the poke-backend codebase. Issues are grouped by category and ranked by severity.

---

## Critical Issues

### 1. N+1 Queries in Cron Jobs

**`src/reminders/reminders.service.ts:124-148`** — The `sendReminders` cron fetches reminders, then calls `messageService.create()` in a `forEach` loop. Each `create()` triggers 3 sequential DB queries (findOne, create, sendMessage→findUnique with include). For N reminders, this is **3N+1 queries**.

**`src/message/message.service.ts:118-158`** — The `resendMessage` cron fetches messages with `include: { reminder: true }`, then calls `sendMessage()` which **re-fetches** the reminder with `include: { user: true }` for every message. The already-loaded data is discarded.

**Fix:** Fetch with `include: { user: true }` (or `{ reminder: { include: { user: true } } }`) upfront and pass data through instead of re-querying.

### 2. `forEach` + async = Fire-and-Forget Promises (Two Locations)

**`src/message/message.service.ts:142`**
```typescript
allMessages.forEach(async (message) => {
  await this.sendMessage(message.reminder.id)
  await this.update({ ... })
})
```

**`src/reminders/reminders.service.ts:140`**
```typescript
remindersToSend.forEach((reminder) => {
  this.messageService.create(reminder.id)  // promise not awaited
})
```

`forEach` does not await async callbacks. All iterations fire simultaneously with **zero concurrency control**, errors are **silently swallowed**, and the outer method returns before any work completes.

**Fix:** Replace with `Promise.allSettled()` + `.map()`, or use `for...of` with `await`. Add a concurrency limiter (e.g., `p-limit`) for large batches.

### 3. Race Condition — Duplicate SMS Sends

**`src/message/message.service.ts:118-158`** — The `resendMessage` cron runs `EVERY_MINUTE`. Because sends are fire-and-forget (issue #2), the `update` to increment `tries`/set `nextSend` happens asynchronously after the cron returns. The next tick can re-read the same un-updated messages and **send duplicate SMS**.

**Fix:** Atomically mark messages as "in-progress" before sending (e.g., `updateMany` to set a processing flag), or update `nextSend` to a future value before calling Twilio.

### 4. No Timeout/Retry/Circuit Breaker on Twilio API

**`src/twilio/twilio.service.ts:26-33`** — The Twilio `messages.create()` call has no timeout configured. A hung HTTP connection blocks the caller indefinitely. No retry logic for transient failures. No circuit breaker if Twilio is down — every cron tick piles up failing requests.

**Fix:** Configure `twilio(accountID, authToken, { timeout: 10000 })`. Wrap in try/catch with exponential backoff or use a circuit-breaker library.

### 5. Multiple PrismaClient Instances

**`src/database/database.module.ts:5-9`** — `DatabaseModule` is not `@Global()` and is imported separately by `RemindersModule`, `MessageModule`, and `UsersModule`. Each gets its own `DatabaseService` instance = **three separate connection pools**.

**Fix:** Add `@Global()` to `DatabaseModule`, import it once in `AppModule`, remove from feature modules.

### 6. Fastify Adapter in devDependencies

**`package.json:48`** — `@nestjs/platform-fastify` is in `devDependencies` but imported in production code (`main.ts`). Running `npm install --production` will crash the app.

**Fix:** Move to `dependencies`.

---

## High Severity Issues

### 7. Unbounded Queries in Cron Jobs

**`src/message/message.service.ts:121-138`** and **`src/reminders/reminders.service.ts:127-131`** — Both cron queries use `findMany` with no `take` (LIMIT). As data grows, these load unbounded rows into memory.

**Fix:** Add `take` limits and process in batches with cursor-based pagination.

### 8. Missing Database Indexes

**`prisma/schema.prisma`** — Critical query patterns have no supporting indexes:

| Query Pattern | Missing Index |
|---|---|
| `Reminder` filtered by `userId` | `@@index([userId])` |
| `Reminder` filtered by `notificationTime` (every 5 min cron) | `@@index([notificationTime])` |
| `Message` filtered by `active` + `nextSend` (every 1 min cron) | `@@index([active, nextSend])` |

### 9. No Graceful Shutdown

**`src/main.ts`** — `app.enableShutdownHooks()` is never called. `DatabaseService` has `enableShutdownHooks()` but it's **dead code** (never invoked). Also missing `OnModuleDestroy` with `$disconnect()`. DB connections leak on shutdown, and cron jobs are killed mid-execution.

**Fix:** Add `app.enableShutdownHooks()` in `main.ts`. Implement `OnModuleDestroy` on `DatabaseService` to call `$disconnect()`.

### 10. Missing Transaction Boundaries

**`src/message/message.service.ts:18-43`** — `create()` does find → delete → create → sendMessage as separate operations. If any step fails mid-way, data is left in an inconsistent state (e.g., old message deleted, new one never created).

**`src/reminders/reminders.service.ts:94-121`** — `remove()` deletes messages then the reminder in separate calls. A crash between them creates orphaned state.

**Fix:** Wrap multi-step mutations in `this.db.$transaction([...])`.

### 11. No Rate Limiting

No `@nestjs/throttler` or Fastify rate-limit plugin. Critical unprotected endpoints:
- `POST /v1/message/sms` — public, no auth
- `GET /v1/` — health check, trivially abused

### 12. No Input Validation

No `ValidationPipe`, no DTOs with `class-validator`. Raw Prisma types used as controller body types. Arbitrary fields pass through directly to Prisma queries.

**Fix:** Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` and create proper DTOs.

---

## Medium Severity Issues

### 13. Sequential DB Calls That Should Be Parallelized

**`src/reminders/reminders.service.ts:26-31`** — `findAll(user.id)` and `findUnique({ where: { id: user.id } })` are independent but run sequentially.

**Fix:** `const [reminders, user] = await Promise.all([...])`.

### 14. Redundant Find-Then-Mutate Patterns

**`src/message/message.service.ts:20-24`** — Find then delete then create → should be `upsert`.
**`src/users/users.service.ts:10-18`** — Find then create → should be `upsert`.
**`src/reminders/reminders.service.ts:77-91, 94-121`** — Find for ownership check then update/delete → combine userId into the `where` clause.

### 15. In-Memory Filtering Instead of DB Query

**`src/reminders/reminders.service.ts:133-136`** — Fetches ALL reminders for a time slot, then filters by day-of-week in JavaScript. The `notificationDays` check could use Prisma's `has` operator.

### 16. Over-Fetching (No `select` Anywhere)

Every query fetches all columns. Notable: `reminders.service.ts:29` only needs `activeSubscription` but fetches entire User; `reminders.service.ts:86,98` only need `userId` but fetch everything.

### 17. No Response Compression

No `@fastify/compress` installed or registered. All responses sent uncompressed.

### 18. Wildcard CORS `origin: '*'`

**`src/main.ts:16`** — Comment says "Todo: need to update origin once we deploy." Allows any domain to hit the API.

### 19. No Concurrency Guard on Cron Jobs

`@nestjs/schedule` does not prevent overlapping executions. If `resendMessage` takes >1 minute, the next tick starts processing the same messages.

### 20. `appleReceiptVerify.config()` Called Per-Request

**`src/subscriptions/subscriptions.service.ts:22-25`** — Global config called on every `create()` instead of once at startup.

---

## Low Severity Issues

### 21. `twilio-cli` in Production Dependencies

**`package.json:44`** — CLI tool (~30MB) bundled in production. Only `twilio` SDK is needed.

### 22. Source Maps in Production Build

**`tsconfig.json:10`** — `"sourceMap": true` increases build size and exposes source structure.

### 23. `console.log` Instead of NestJS Logger

**`src/main.ts:24`** — Bypasses log level configuration and formatting.

### 24. Fastify Listens on Localhost Only

**`src/main.ts:22`** — `app.listen(port)` without `'0.0.0.0'` binds to 127.0.0.1, inaccessible from outside containers.

### 25. No Environment Variable Validation

**`src/app.module.ts:17`** — `ConfigModule.forRoot()` with no `validationSchema`. Missing env vars cause cryptic runtime errors instead of startup failures.

### 26. NestJS v8 (End-of-Life)

**`package.json:25-30`** — All `@nestjs/*` packages at `^8.0.0`. NestJS 9/10 brought significant performance improvements.

### 27. No Security Headers (Helmet)

No `@fastify/helmet` or equivalent. Missing `Content-Security-Policy`, `Strict-Transport-Security`, etc.
