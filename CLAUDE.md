# CLAUDE.md - Poke Backend Codebase Guide

## Project Overview

**Poke** is a personal accountability system that helps users achieve their goals through SMS reminders. Users create recurring reminders that are sent via text message at scheduled times and days. Users can respond to confirm completion, and Poke tracks progress and sends follow-up reminders if needed.

### Key Features
- Create recurring reminders with customizable schedules
- SMS notifications via Twilio integration
- Text-based response system with emoji confirmations
- Automatic follow-up reminders (up to 4 attempts, hourly intervals)
- Subscription management with Apple In-App Purchase integration
- Supabase authentication

## Technology Stack

### Core Framework
- **NestJS 8.x** - Progressive Node.js framework
- **Fastify** - High-performance web framework (instead of Express)
- **TypeScript 4.3** - Type-safe JavaScript

### Database & ORM
- **PostgreSQL** - Primary database
- **Prisma 3.7.0** - Type-safe ORM with migrations

### Key Dependencies
- **Twilio** - SMS messaging service
- **@nestjs/schedule** - Cron job scheduling
- **@nestjs/config** - Environment configuration
- **nestjs-supabase-auth** - Supabase authentication integration
- **date-fns & date-fns-tz** - Date manipulation with timezone support
- **node-apple-receipt-verify** - Apple IAP verification

### Development Tools
- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting
- **Jest** - Testing framework

## Architecture & Project Structure

```
poke-backend/
├── src/
│   ├── auth/                 # Authentication & authorization
│   │   ├── auth.guard.ts     # Global auth guard (Supabase)
│   │   ├── auth.module.ts
│   │   ├── current-user.decorator.ts  # Extract current user
│   │   ├── public.decorator.ts        # Mark routes as public
│   │   └── supabase.strategy.ts
│   ├── database/             # Prisma service wrapper
│   │   ├── database.service.ts        # PrismaClient extension
│   │   └── database.module.ts
│   ├── message/              # Message management
│   │   ├── message.controller.ts      # SMS webhook endpoint
│   │   ├── message.service.ts         # Message CRUD & scheduling
│   │   └── message.module.ts
│   ├── reminders/            # Reminder management
│   │   ├── reminders.controller.ts    # CRUD endpoints
│   │   ├── reminders.service.ts       # Business logic & scheduling
│   │   └── reminders.module.ts
│   ├── subscriptions/        # Apple IAP management
│   │   ├── subscriptions.controller.ts
│   │   ├── subscriptions.service.ts   # Receipt verification
│   │   └── subscriptions.module.ts
│   ├── twilio/               # Twilio integration
│   │   ├── twilio.controller.ts
│   │   ├── twilio.service.ts          # Send/receive SMS
│   │   └── twilio.module.ts
│   ├── users/                # User management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── app.module.ts         # Root module
│   ├── app.controller.ts
│   ├── main.ts               # Application entry point
│   ├── constants.ts          # Shared constants (emojis)
│   └── utils.ts              # Utility functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── test/                     # E2E tests
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
├── nest-cli.json
└── insomnia.json             # API testing collection
```

## Database Schema

### Reminder
- **id**: UUID (primary key)
- **text**: Reminder message
- **notificationTime**: Time to send (DateTime with TZ, normalized to 2001-01-01)
- **notificationDays**: Array of days (0=Sunday, 6=Saturday)
- **userId**: Foreign key to User
- **emoji**: Unique emoji identifier for responses
- **color**: UI color (default: "blue")
- **timeZone**: User's timezone (e.g., "America/New_York")
- **createdAt/updatedAt**: Timestamps

### User
- **id**: UUID (primary key, from Supabase)
- **name**: Optional display name
- **phone**: Unique phone number (no + prefix in DB)
- **onboarded**: Boolean flag
- **activeSubscription**: Current subscription product ID (nullable)
- **reminders**: One-to-many with Reminder

### Message
- **id**: UUID (primary key)
- **reminderId**: Foreign key to Reminder (one-to-one)
- **createdAt**: Message creation time
- **nextSend**: Next scheduled send time (normalized DateTime)
- **tries**: Send attempt counter (1-4)
- **active**: Boolean, becomes false after 4 tries

## Key Components and Services

### RemindersService (`src/reminders/reminders.service.ts`)

**Responsibilities:**
- CRUD operations for reminders
- Scheduled reminder dispatch (every 5 minutes via `@Cron`)
- Emoji assignment (sequential with random start)
- Subscription validation (free users get 1 reminder max)

**Key Methods:**
- `create(user, data)`: Creates reminder with timezone-aware scheduling
- `sendReminders()`: Cron job that finds and dispatches reminders
- Filters reminders by `notificationTime` and `notificationDays`

**Important Pattern:**
```typescript
// Time normalization: stores only hour/minute, normalizes to 2001-01-01
getNotificationTime(date) // Returns date with month:1, day:1, year:2001
```

### MessageService (`src/message/message.service.ts`)

**Responsibilities:**
- Message lifecycle management
- SMS sending via Twilio
- Receiving and processing user responses
- Automatic retry scheduling (hourly, up to 4 times)

**Key Methods:**
- `create(reminderId)`: Creates message, schedules first send
- `sendMessage(reminderId)`: Sends SMS with emoji confirmation request
- `receiveMessage(req)`: Webhook handler for Twilio SMS responses
- `resendMessage()`: Cron job (every minute) for retry logic

**Retry Logic:**
- Tries 1-4: Sends every hour using `getNextSendTime()`
- After try 4: Sets `active=false`, stops retrying
- User emoji response: Deletes message, stops retries

### TwilioService (`src/twilio/twilio.service.ts`)

**Responsibilities:**
- Low-level Twilio API integration
- SMS sending and TwiML response generation

**Key Methods:**
- `sendMessage(body, phone)`: Sends SMS to user
- `respondToMessage(pokeResponse)`: Generates TwiML response for webhooks

### AuthGuard & Decorators

**Global Authentication:**
- `PokeAuthGuard`: Applied globally via `APP_GUARD`
- Uses Supabase JWT strategy
- `@Public()`: Decorator to bypass auth (e.g., Twilio webhook)
- `@CurrentUser()`: Extracts authenticated user from request

### SubscriptionsService (`src/subscriptions/subscriptions.service.ts`)

**Responsibilities:**
- Apple In-App Purchase verification
- Subscription status management

**Key Behavior:**
- Validates receipts against both production and sandbox
- Updates `user.activeSubscription` with product ID
- Free users limited to 1 reminder

## Development Workflows

### Setup & Installation

```bash
# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
yarn prisma generate

# Run migrations
yarn prisma migrate dev

# Start development server
yarn start:dev
```

### Common Commands

```bash
# Development
yarn start:dev          # Watch mode with hot reload
yarn start:debug        # Debug mode with inspector

# Building
yarn prebuild           # Cleans dist/ and generates Prisma client
yarn build              # Compiles TypeScript

# Production
yarn start:prod         # Runs compiled code from dist/

# Code Quality
yarn lint               # ESLint with auto-fix
yarn format             # Prettier formatting

# Testing
yarn test               # Unit tests
yarn test:watch         # Watch mode
yarn test:cov           # Coverage report
yarn test:e2e           # E2E tests

# Database
yarn prisma studio      # GUI for database
yarn prisma migrate dev # Create migration
yarn prisma generate    # Regenerate client

# Utilities
yarn ping               # Runs ping.sh (keep-alive script)
```

### Adding a New Feature Module

1. **Generate module scaffolding:**
   ```bash
   nest generate resource feature-name
   ```

2. **Register in `app.module.ts`:**
   ```typescript
   imports: [
     // ...
     FeatureNameModule,
   ]
   ```

3. **Follow the service/controller pattern:**
   - Service: Business logic, database operations
   - Controller: Route handlers, request validation
   - Module: Dependency injection setup

4. **Use DatabaseService for Prisma:**
   ```typescript
   constructor(private readonly db: DatabaseService) {}
   ```

### Database Changes

1. **Modify `prisma/schema.prisma`**
2. **Create migration:**
   ```bash
   yarn prisma migrate dev --name descriptive_name
   ```
3. **Prisma client auto-regenerates**
4. **Update TypeScript code using new schema**

## Configuration & Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Twilio
TWILIO_ACCOUNT_ID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE=+15555555555

# Apple IAP
APPLE_SHARED_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Supabase (configured via nestjs-supabase-auth)
# Refer to nestjs-supabase-auth documentation
```

### Important Configuration Notes

- **Timezone**: All scripts run with `TZ=UTC` environment variable
- **Port**: Defaults to 3000, configurable via `PORT` env var
- **CORS**: Currently set to `origin: '*'` (needs production update)
- **API Prefix**: All routes prefixed with `/v1`

## Code Conventions & Style

### TypeScript Style (Prettier)
- **Single quotes**: `'string'`
- **No semicolons**: `const foo = 'bar'`
- **2-space indentation**
- **Trailing commas**: ES5 style
- **Arrow function parens**: Always included

### ESLint Rules
- TypeScript recommended rules enabled
- Disabled rules:
  - `explicit-function-return-type`: Return types optional
  - `explicit-module-boundary-types`: Boundary types optional
  - `no-explicit-any`: `any` allowed

### NestJS Patterns

**Dependency Injection:**
```typescript
@Injectable()
export class MyService {
  constructor(
    private readonly db: DatabaseService,
    private readonly otherService: OtherService
  ) {}
}
```

**Controller Structure:**
```typescript
@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.resourceService.findAll(user.id)
  }
}
```

**Cron Jobs:**
```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async scheduledTask() {
  // Implementation
}
```

### Naming Conventions

- **Services**: `feature.service.ts` (e.g., `reminders.service.ts`)
- **Controllers**: `feature.controller.ts`
- **Modules**: `feature.module.ts`
- **Interfaces/Types**: Use Prisma-generated types (e.g., `Reminder`, `User`)
- **DTOs**: Use Prisma input types (e.g., `Prisma.ReminderCreateInput`)

## Testing

### Test Structure
- **Unit tests**: `*.spec.ts` files alongside source
- **E2E tests**: `test/` directory with `jest-e2e.json` config
- **Coverage**: Output to `coverage/` directory

### Running Tests
```bash
yarn test              # Run all unit tests
yarn test:watch        # Watch mode
yarn test:cov          # With coverage
yarn test:e2e          # End-to-end tests
```

## Deployment Considerations

### Pre-deployment Checklist
1. **Update CORS configuration** in `main.ts` with production origin
2. **Verify environment variables** are set in production
3. **Run database migrations** on production database
4. **Configure Twilio webhook URL** to point to `/v1/message/sms`
5. **Ensure timezone**: Production server should run with `TZ=UTC`

### Twilio Webhook Setup
- **Endpoint**: `POST https://your-domain.com/v1/message/sms`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Authentication**: None (public endpoint)
- **Response**: TwiML XML

### Cron Jobs in Production
Two critical cron jobs run automatically:
1. **Reminder Dispatch**: Every 5 minutes (`RemindersService.sendReminders`)
2. **Message Retry**: Every minute (`MessageService.resendMessage`)

Ensure your hosting platform keeps the process alive for cron execution.

## Working with this Codebase (AI Assistant Guidelines)

### When Adding Features

1. **Check subscription limits**: If feature affects reminders, validate subscription
2. **Handle timezones carefully**: Use `date-fns-tz` and `utcToZonedTime()`
3. **User authorization**: Always verify `userId` matches authenticated user
4. **Database operations**: Use transactions for multi-step operations when needed
5. **Logging**: Use NestJS Logger for consistent log output

### Common Patterns to Follow

**Authorization Pattern:**
```typescript
async findOne(where: Prisma.ReminderWhereUniqueInput, userId: string) {
  const reminder = await this.db.reminder.findUnique({ where })
  return reminder.userId === userId ? reminder : null
}
```

**Time Normalization Pattern:**
```typescript
import { getNotificationTime } from './utils'

// Always normalize when storing/querying times
const normalizedTime = getNotificationTime(new Date(inputTime))
```

**Emoji Assignment Pattern:**
```typescript
// Sequential emoji assignment with random start
const currentReminders = await this.findAll(user.id)
const idx = currentReminders.length
  ? getNextIndex(currentReminders)
  : (Math.random() * emojis.length) | 0
```

### Critical Files to Review Before Changes

- **utils.ts**: Time normalization logic (affects all scheduling)
- **constants.ts**: Emoji list (affects reminder creation)
- **schema.prisma**: Database schema (affects all data operations)
- **auth.guard.ts**: Authentication logic (affects all protected routes)

### Testing Changes

1. **Unit test** the service method
2. **Manual test** with Insomnia/Postman (use `insomnia.json`)
3. **Test Twilio webhook** locally with ngrok or similar
4. **Verify cron jobs** by checking logs

### Debugging Tips

- **Enable debug logging**: `yarn start:debug`
- **Check Prisma queries**: Set `DATABASE_URL` log level
- **Twilio webhook issues**: Check TwiML response format
- **Timezone problems**: Log both UTC and zoned times
- **Cron not firing**: Verify `ScheduleModule.forRoot()` in `app.module.ts`

### Known Limitations & TODOs

1. **CORS**: Currently set to `*`, needs production domain
2. **Cascade deletes**: Handled manually in code (Prisma limitation)
3. **Phone number format**: Stored without `+` prefix, added when needed
4. **Subscription sync**: No webhook for Apple subscription status changes
5. **Message retries**: Hard-coded to 4 attempts with hourly intervals

### Important Gotchas

- **Time storage**: All times normalized to 2001-01-01 for comparison
- **Phone format**: Database stores without `+`, Twilio needs `+`
- **One-to-one Message-Reminder**: Delete message before creating new one
- **Free tier**: Users without subscription limited to 1 reminder
- **Cron timing**: 5-minute granularity for reminders, 1-minute for retries

---

**Last Updated**: 2025-11-16
**Maintained By**: Development Team
**For Questions**: Check README.md or repository documentation
