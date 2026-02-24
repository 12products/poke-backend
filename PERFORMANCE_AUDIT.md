# Performance Audit: poke-backend

**Date:** 2026-02-24
**Scope:** Full codebase review — database, API, scheduling, dependencies, configuration

---

## CRITICAL Issues

### 1. Missing Database Indexes (`prisma/schema.prisma`)

Zero `@@index` declarations in the entire schema. Two cron jobs run full table scans on every tick:

- `resendMessage` (every minute): queries `Message` by `nextSend` + `active` — no composite index
- `sendReminders` (every 5 min): queries `Reminder` by `notificationTime` — no index
- `Reminder.userId` (used in `findAll`): no index on this foreign key

**Fix:** Add to `schema.prisma`:
```prisma
model Reminder {
  @@index([notificationTime])
  @@index([userId])
}

model Message {
  @@index([active, nextSend])
}
```

### 2. `forEach(async ...)` Anti-Pattern (`message.service.ts:142`, `reminders.service.ts:140`)

`Array.forEach` does **not** await async callbacks. All Twilio API calls + DB writes fire simultaneously with zero error handling — failures are silently swallowed. Appears in both cron jobs.

**Fix:** Replace with `for...of` loops with try/catch, or use `Promise.allSettled()` with concurrency control.

### 3. N+1 Query in `resendMessage` Cron (`message.service.ts:121-157`)

Fetches all messages with `include: { reminder: true }`, then for each message calls `sendMessage(reminder.id)` which **re-fetches the same reminder** from the DB with `include: { user: true }`. For N messages: 1 initial query + N reminder re-fetches + N message updates.

**Fix:** Include `{ reminder: { include: { user: true } } }` in the initial query and pass the loaded data to `sendMessage` instead of just the ID.

### 4. `@nestjs/platform-fastify` in devDependencies (`package.json:48`)

The app uses Fastify at runtime (`main.ts`), but the package is listed under `devDependencies`. Production deploys without devDependencies will **crash on startup**.

**Fix:** Move `@nestjs/platform-fastify` to `dependencies`.

### 5. Public Endpoint with No Webhook Validation (`message.controller.ts:15-20`)

`POST /v1/message/sms` is `@Public()` with no Twilio `X-Twilio-Signature` verification. Anyone can trigger DB queries and Twilio API calls by spoofing requests.

**Fix:** Add Twilio webhook signature validation via a guard or middleware.

---

## HIGH Severity

### 6. No Rate Limiting

No `@nestjs/throttler`, Fastify rate-limit plugin, or any rate-limiting anywhere. The public SMS endpoint and Apple receipt endpoint are wide open to abuse.

### 7. No Request Validation (`main.ts`)

No `ValidationPipe` registered globally. Raw user JSON goes directly into Prisma queries, wasting DB round-trips on malformed requests.

### 8. Sequential DB Calls That Could Be Parallel (`reminders.service.ts:27-35`)

`findAll(userId)` and `findUnique(userId)` are independent but run sequentially. Should use `Promise.all()`.

### 9. Redundant Check-Then-Act DB Pattern (`reminders.service.ts:86, 98`)

`findUnique` to check ownership, then `update`/`delete` as a separate query. Could use `findFirst({ where: { id, userId } })` to combine into one query.

### 10. Unbounded Cron Query (`message.service.ts:121-138`)

`findMany` with no `take` limit runs every minute. As data grows, this loads the entire active message table into memory.

### 11. `twilio-cli` in Production Dependencies (`package.json:44`)

CLI tool with hundreds of transitive dependencies bloating the production bundle. Should be in `devDependencies` or removed.

### 12. Outdated Prisma 3.7.0 (`package.json:32`)

Two major versions behind. Prisma 5.x has significant query engine improvements, connection pool improvements, and SQL JOINs for relation loading.

### 13. TypeScript Target `es2017` (`tsconfig.json:9`)

Forces TypeScript to downgrade native async/await to slower generator state machines. Should be `es2022` for any modern Node.js.

### 14. `appleReceiptVerify.config()` Called Per-Request (`subscriptions.service.ts:22-25`)

Global config mutation on every subscription verification instead of once in the constructor.

### 15. Missing `@Body()` Decorator (`message.controller.ts:10-13`)

`sendMessage(reminderId)` has no parameter decorator — `reminderId` is always `undefined`, causing a wasted DB query on every call.

---

## MEDIUM Severity

### 16. Unused `@nestjs/platform-express` in Production Dependencies (`package.json:30`)

App uses Fastify, but Express is still bundled as a production dependency.

### 17. No Cascade Delete in Prisma Schema (`schema.prisma:37`)

Manual two-query delete workaround in code instead of `onDelete: Cascade`. Adds extra DB round-trips and risks orphaned rows on failure.

### 18. GET Endpoint Performs DB Write (`users.controller.ts:12-15`)

`GET /v1/users/onboard` uses check-then-create instead of a single `upsert` call.

### 19. `enableShutdownHooks` Never Called (`database.service.ts`)

The Prisma shutdown hook method exists but is never invoked from `main.ts`, risking DB connection leaks on shutdown.

### 20. `this.remove()` Not Awaited (`message.service.ts:106`)

Fire-and-forget DB delete in `receiveMessage` — acknowledged pokes may continue being resent.

### 21. No Connection Pool Configuration (`database.service.ts`)

`PrismaClient` instantiated with zero configuration — no pool size, timeout, or logging.

### 22. No Response Compression (`main.ts`)

No `@fastify/compress` registered — all responses sent uncompressed.

### 23. No HTTP Cache Headers on GET Endpoints

Every client request triggers a full DB round-trip regardless of whether data changed.

### 24. NestJS 8.x — Two Major Versions Behind (`package.json:25-31`)

Missing DI container and HTTP adapter performance improvements from v9/v10.

### 25. `DatabaseModule` Not `@Global()` (`database.module.ts`)

Re-imported in every feature module instead of being globally available once.

### 26. In-Memory Filter After DB Fetch (`reminders.service.ts:133-136`)

Fetches all time-matching reminders, then filters by day-of-week in JavaScript. All non-matching rows are fetched and immediately discarded.

### 27. No Timeout on Apple Receipt Verification (`subscriptions.service.ts:28-29`)

External HTTPS call to Apple with no timeout configured — can block indefinitely.

### 28. Fastify Adapter Has No Performance Options (`main.ts:12`)

No `connectionTimeout`, `bodyLimit`, or logger config passed to `FastifyAdapter`.

### 29. Source Maps and Declarations in Production Build (`tsconfig.json:4,10`)

`sourceMap: true` and `declaration: true` add unnecessary build time and startup overhead in production.

### 30. Missing Environment Config (`.env.example`)

No `NODE_ENV`, `PORT`, or database connection pool parameters documented.
