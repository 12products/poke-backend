# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Poke is a personal accountability backend API. Users set up recurring goals and receive SMS reminders via Twilio. They can respond to texts to confirm completion or snooze reminders. The system tracks streaks and reminder history.

## Tech Stack

- **Framework**: NestJS 8 with Fastify adapter
- **Database**: PostgreSQL with Prisma ORM (v3.7.0)
- **Auth**: Supabase authentication with Passport.js
- **SMS**: Twilio for sending/receiving text messages
- **Scheduling**: @nestjs/schedule for cron-based reminder delivery
- **Payments**: Apple In-App Purchase receipt verification

## Common Commands

```bash
# Development
yarn start:dev          # Start dev server with hot reload (TZ=UTC)
yarn start:prod         # Start production server

# Build
yarn build              # Build (runs prisma generate first)

# Testing
yarn test               # Run unit tests
yarn test:e2e           # Run e2e tests
yarn test:cov           # Run tests with coverage

# Code Quality
yarn lint               # ESLint with auto-fix
yarn format             # Prettier formatting
```

## Architecture

```
src/
├── auth/           # Supabase JWT auth, guards, decorators
├── database/       # Prisma database service
├── message/        # Message queue for scheduled reminders
├── reminders/      # Core reminder CRUD and scheduling logic
├── subscriptions/  # Apple IAP subscription verification
├── twilio/         # SMS send/receive via Twilio
└── users/          # User management
```

## Key Patterns

- **Global Auth Guard**: `PokeAuthGuard` applied to all routes by default
- **Public Routes**: Use `@Public()` decorator to bypass auth
- **Current User**: Use `@CurrentUser()` decorator to get authenticated user
- **API Prefix**: All routes prefixed with `/v1`
- **Timezone**: Server runs in UTC (`TZ=UTC`)

## Database Schema (Prisma)

- **User**: id, name, phone (unique), onboarded, activeSubscription
- **Reminder**: text, notificationTime, notificationDays[], emoji, color, timeZone
- **Message**: tracks pending SMS sends with tries counter and nextSend time

## Environment Variables

See `.env.example`:
- `DATABASE_URL` - PostgreSQL connection string
- `TWILIO_ACCOUNT_ID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` - Twilio credentials
- `APPLE_SHARED_SECRET` - Apple IAP verification
