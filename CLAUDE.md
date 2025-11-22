# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Poke is a personal accountability system backend built with NestJS. Users create recurring goals/reminders and receive SMS notifications via Twilio. They can respond to texts to confirm completion or snooze reminders.

## Tech Stack

- **Framework**: NestJS 8.x with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with Passport JWT
- **SMS**: Twilio
- **Scheduling**: @nestjs/schedule for cron jobs
- **Payments**: Apple In-App Purchase verification

## Common Commands

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma generate

# Run database migrations
yarn prisma migrate dev

# Start development server
yarn start:dev

# Build for production
yarn prebuild && yarn build

# Start production server
yarn start:prod

# Run tests
yarn test

# Run e2e tests
yarn test:e2e

# Lint and fix
yarn lint

# Format code
yarn format
```

## Project Structure

```
src/
├── auth/           # Supabase JWT authentication, guards, decorators
├── database/       # Prisma database service
├── message/        # Message scheduling and delivery logic
├── reminders/      # Reminder CRUD and management
├── subscriptions/  # Apple IAP subscription verification
├── twilio/         # Twilio SMS integration
├── users/          # User management
├── constants.ts    # App constants
├── utils.ts        # Utility functions
├── app.module.ts   # Root module
└── main.ts         # Application entry point

prisma/
└── schema.prisma   # Database schema (Reminder, User, Message models)
```

## Key Patterns

- **Authentication**: Routes are protected by default via `PokeAuthGuard`. Use `@Public()` decorator to make routes public.
- **Current User**: Use `@CurrentUser()` decorator to get the authenticated user in controllers.
- **Database Access**: Inject `DatabaseService` (extends PrismaClient) for database operations.
- **Timezone Handling**: All times are stored in UTC. The app runs with `TZ=UTC`. User timezones are stored per reminder.

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `TWILIO_ACCOUNT_ID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` - Twilio credentials
- `APPLE_SHARED_SECRET` - For Apple IAP receipt verification

## Database Models

- **User**: Phone-based identification, tracks subscription status
- **Reminder**: User's recurring goals with notification time, days, timezone, emoji, color
- **Message**: Tracks pending/active SMS reminders with retry logic
