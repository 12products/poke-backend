# Performance Audit Report

**Date:** 2026-02-24
**Codebase:** Poke Backend (NestJS + Prisma + Twilio)

---

## Critical Issues

### 1. `forEach` + `async` Anti-Pattern — Concurrency Bomb & Silent Failures
- **`message.service.ts:142-157`** — `resendMessage()` uses `allMessages.forEach(async ...)`. Despite the `await` inside, `forEach` does not await returned promises. All Twilio API calls fire simultaneously with no concurrency control. Errors become unhandled rejections.
- **`reminders.service.ts:140-147`** — `sendReminders()` calls `this.messageService.create(reminder.id)` inside `.forEach()` without `await`. All SMS sends fire concurrently and untracked.
- **Fix:** Replace with `for...of` loops with controlled concurrency, or use a job queue (e.g., `@nestjs/bull`).

### 2. No Distributed Locking — Duplicate Sends on Multi-Instance
- **`reminders.service.ts:123-148`** — Cron jobs run in-process via `@nestjs/schedule`. If horizontally scaled to N instances, every cron fires N times simultaneously with no deduplication, causing duplicate SMS sends.
- **`message.service.ts:118-157`** — Same issue with `resendMessage()`.
- **Fix:** Use a distributed job queue (Bull/BullMQ with Redis) or distributed locking.

### 3. `@nestjs/platform-fastify` is a devDependency but Used at Runtime
- **`package.json:49`** vs **`main.ts:3`** — The app creates a `NestFastifyApplication` using `FastifyAdapter`, but `@nestjs/platform-fastify` is listed as a devDependency. In production (where devDeps are pruned), the app will crash on startup.
- **Fix:** Move `@nestjs/platform-fastify` to `dependencies`. Remove unused `@nestjs/platform-express`.

### 4. No Rate Limiting Anywhere
- **Entire app** — No `@nestjs/throttler` in dependencies. Every endpoint is unprotected.
- **`message.controller.ts:15-20`** — The public `POST /message/sms` webhook has no auth AND no rate limiting. An attacker can trigger unbounded DB queries and Twilio calls.
- **Fix:** Add `@nestjs/throttler` globally with stricter limits on public/SMS endpoints.

---

## High Severity Issues

### 5. Missing Database Indexes
- **`Reminder.userId`** — Used in `WHERE` clauses for the primary user-facing endpoint (`GET /reminders`). No index = full table scan.
- **`Reminder.notificationTime`** — Queried every 5 minutes by `sendReminders()` cron. No index.
- **`Message.active` + `Message.nextSend`** — Queried every minute by `resendMessage()` cron. No index.
- **Fix:** Add to `schema.prisma`:
  ```prisma
  // On Reminder model
  @@index([userId])
  @@index([notificationTime])

  // On Message model
  @@index([active, nextSend])
  ```

### 6. Race Condition — Check-Then-Act on Message Creation
- **`message.service.ts:20-24`** — `create()` checks if a Message exists, deletes it, then creates a new one. Concurrent calls for the same reminder will both see no existing message, both create, and one fails on the unique constraint.
- **Fix:** Use a Prisma upsert or database-level transaction with a lock.

### 7. SMS Sent Synchronously in Request Path
- **`message.service.ts:40`** — `create()` calls `await this.sendMessage()` which hits Twilio before returning. The entire HTTP request blocks on an external API call.
- **`message.controller.ts:11`** — `POST /message` endpoint triggers Twilio directly.
- **Fix:** Queue SMS sends asynchronously.

### 8. Prisma Client Not a Proper Singleton — 3x Connection Pools
- **`database.module.ts:5-9`** — `DatabaseModule` is NOT `@Global()`. Each importing module (`MessageModule`, `RemindersModule`, `UsersModule`) gets its own `PrismaClient` instance, tripling connection pool usage.
- **Fix:** Add `@Global()` decorator to `DatabaseModule`.

### 9. No Shutdown Hooks — Database Connection Leaks
- **`database.service.ts:10-14`** — `enableShutdownHooks()` is defined but never called.
- **`main.ts`** — `app.enableShutdownHooks()` is never called, so `OnModuleDestroy` hooks never fire.
- **Fix:** Call `app.enableShutdownHooks()` in `main.ts` and implement `onModuleDestroy` with `$disconnect()`.

### 10. No Timeouts on External Calls
- **`twilio.service.ts:27-31`** — No timeout on Twilio API calls. A hanging call blocks forever.
- **`subscriptions.service.ts:28`** — No timeout on Apple receipt verification.
- **`database.service.ts`** — No Prisma connection/query timeout configured.

### 11. 5-Minute Cron Misses Non-Aligned Reminders
- **`reminders.service.ts:123`** — Cron fires at XX:00, XX:05, XX:10, etc. A reminder set for 10:03 is never picked up because `getNotificationTime` matches exact hour+minute.
- **Fix:** Change to `EVERY_MINUTE` or use range-based time matching.

### 12. No Twilio Webhook Signature Validation
- **`message.controller.ts:17`** — The `@Public()` SMS webhook does not verify `X-Twilio-Signature`. Anyone can forge incoming messages.

---

## Medium Severity Issues

### 13. N+1 Query in `receiveMessage()`
- **`message.service.ts:93-110`** — Loads ALL reminders for a user with `include: { reminders: true }`, then iterates in-memory to find matching emoji. Should use a filtered DB query instead.

### 14. N+1 Query in `resendMessage()` Cron
- **`message.service.ts:142-157`** — For each message, `sendMessage()` does a separate `findUnique` + `include: { user: true }`. The initial `findMany` should eagerly load `reminder.user`.

### 15. Sequential DB Queries That Could Be Parallelized
- **`reminders.service.ts:26-31`** — `create()` calls `findAll(user.id)` then `db.user.findUnique()` sequentially. These are independent and could use `Promise.all()`.

### 16. Unbounded `findAll()` Methods
- **`message.service.ts:59-61`** — `findAll()` returns every message in the DB with no pagination.
- **`users.service.ts:24-26`** — `findAll()` returns every user with no pagination.
- **`reminders.controller.ts:20-23`** — `GET /reminders` has no pagination.

### 17. Day-of-Week Filtering Done in Application Code
- **`reminders.service.ts:133-136`** — After fetching all time-matching reminders, filters by day in JavaScript. Could be pushed to the DB query.

### 18. Unawaited `remove()` in Receive Path
- **`message.service.ts:106`** — `this.remove()` is not awaited. Response sent before delete completes, creating a race with the resend cron.

### 19. `appleReceiptVerify.config()` Called Per-Request
- **`subscriptions.service.ts:22-25`** — Reconfigures the Apple receipt library on every single call. Should be done once in the constructor.

### 20. Supabase Auth Makes External Call on Every Request
- **`auth.guard.ts` + `supabase.strategy.ts`** — Global auth guard calls Supabase's `getUser()` API on every non-public request. No JWT-only verification or caching.

---

## Low Severity Issues

### 21. Fastify Listens on Localhost Only
- **`main.ts:22`** — `app.listen(port)` without `'0.0.0.0'` defaults to localhost, which fails in containers.

### 22. Wildcard CORS
- **`main.ts:16`** — `origin: '*'` allows all cross-origin requests.

### 23. `getNotificationTime` Uses Hardcoded Year 2001
- **`utils.ts:8-16`** — Fragile time normalization that could cause confusion with range queries.

### 24. No Body Size Limit Configured
- **`main.ts`** — Relies on Fastify's default 1 MiB limit with no explicit configuration.

---

## Priority Action Items

| Priority | Action | Impact |
|----------|--------|--------|
| P0 | Fix `forEach(async)` — use `for...of` or queue | Prevents concurrency bombs, silent failures |
| P0 | Move `@nestjs/platform-fastify` to dependencies | Prevents production crash |
| P0 | Add distributed job queue for cron work | Prevents duplicate SMS on scale-out |
| P1 | Add missing DB indexes (3 indexes) | Eliminates full table scans on hot paths |
| P1 | Add `@nestjs/throttler` rate limiting | Prevents API abuse |
| P1 | Make `DatabaseModule` global | Reduces connection pool waste by 3x |
| P1 | Fix race condition in message creation | Prevents constraint violations |
| P2 | Add timeouts to all external calls | Prevents resource exhaustion |
| P2 | Queue SMS sends out of request path | Improves response latency |
| P2 | Enable shutdown hooks + Prisma disconnect | Prevents connection leaks |
| P2 | Fix cron timing to not miss reminders | Ensures all reminders fire |
| P3 | Add pagination to list endpoints | Prevents unbounded memory usage |
| P3 | Optimize N+1 queries | Reduces DB round-trips |
| P3 | Cache/local-verify JWTs in auth guard | Reduces per-request latency |
