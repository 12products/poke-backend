# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

Poke is a personal accountability system backend built with NestJS. Users set up recurring goals and receive SMS reminders via Twilio. They can respond to texts to confirm completion or snooze reminders.

## Tech Stack

- **Framework**: NestJS 8.x with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with Passport.js
- **SMS**: Twilio for sending/receiving messages
- **Payments**: Apple In-App Purchases for subscriptions
- **Scheduling**: @nestjs/schedule for cron jobs

## Common Commands

```bash
# Development
yarn start:dev          # Start dev server with hot reload (TZ=UTC)
yarn start:prod         # Start production server

# Build
yarn build              # Build the project (runs prisma generate first)

# Testing
yarn test               # Run unit tests
yarn test:e2e           # Run end-to-end tests
yarn test:cov           # Run tests with coverage

# Code Quality
yarn lint               # Run ESLint with auto-fix
yarn format             # Run Prettier formatting

# Database
yarn prisma generate    # Generate Prisma client
yarn prisma migrate dev # Run migrations in development
yarn prisma studio      # Open Prisma Studio GUI
```

## Architecture

### Module Structure

The app follows NestJS module architecture in `src/`:

- `auth/` - Supabase JWT authentication with guards and decorators
- `database/` - Prisma database service
- `message/` - Message queue management for scheduled reminders
- `reminders/` - Core reminder CRUD operations
- `subscriptions/` - Apple IAP subscription verification
- `twilio/` - Twilio SMS integration for sending/receiving
- `users/` - User management

### Database Schema (Prisma)

Located in `prisma/schema.prisma`:

- **User** - Phone number, subscription status, onboarding state
- **Reminder** - Text, schedule (days/time), timezone, emoji, color
- **Message** - Tracks pending SMS with retry logic (tries, nextSend, active)

### Key Patterns

- All routes protected by `PokeAuthGuard` by default; use `@Public()` decorator for public endpoints
- `@CurrentUser()` decorator extracts authenticated user
- Server runs in UTC timezone (`TZ=UTC`)
- Notification days are 0-indexed (0 = Sunday, 6 = Saturday)

## Environment Variables

Required in `.env` (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `TWILIO_ACCOUNT_ID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` - Twilio credentials
- `APPLE_SHARED_SECRET` - For App Store receipt validation
