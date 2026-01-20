# Poke

Poke is a personal accountability system. You setup recurring goals on the platform and get reminded about them via text message. For example, if you want to go to the gym three days a week, you can add a reminder in Poke to message you on your gym days. Poke will keep track of when you accomplish your goals or when you've slipped up.

## Features

### MVP

- User can create reminders that will be regularly sent as text
- User can set which days reminders are sent
- User can set which times reminders are sent
- User can respond to text to confirm completion
- User can response to text to disable reminders ("snooze")
- User gets reminded if they do not respond to text
- User can manage their reminders

### Stretch Goals

- User can see dashboard summarizing their reminders
- User can see data visualization of their streaks

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **SMS**: Twilio
- **Scheduling**: @nestjs/schedule (cron jobs)

## Getting Started

### Prerequisites

- Node.js 16 or higher
- Yarn package manager
- PostgreSQL database
- Twilio account (for SMS)
- Supabase project (for auth)

### Installation

```bash
# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env

# Run database migrations
yarn db:migrate

# Start development server
yarn start:dev
```

### Environment Variables

See `.env.example` for required environment variables.

## API Endpoints

### Health

- `GET /` - Basic health check
- `GET /v1/health` - Detailed health status
- `GET /v1/stats` - System statistics
- `GET /v1/ping` - Ping/pong endpoint

### Users

- `GET /v1/users/onboard` - Onboard a new user
- `GET /v1/users/me` - Get current user
- `GET /v1/users/me/stats` - Get user statistics
- `PATCH /v1/users/:id` - Update user
- `DELETE /v1/users/me` - Delete account

### Reminders

- `GET /v1/reminders` - List all reminders
- `GET /v1/reminders/:id` - Get a reminder
- `POST /v1/reminders` - Create a reminder
- `PATCH /v1/reminders/:id` - Update a reminder
- `DELETE /v1/reminders/:id` - Delete a reminder

### Subscriptions

- `POST /v1/subscriptions` - Create subscription (Apple IAP)
- `DELETE /v1/subscriptions` - Cancel subscription
- `GET /v1/subscriptions/status` - Get subscription status

## Development

```bash
# Run linter
yarn lint

# Run tests
yarn test

# Run e2e tests
yarn test:e2e

# Check types
yarn typecheck

# Format code
yarn format
```

## License

UNLICENSED - Private project