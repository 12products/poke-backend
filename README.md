# Poke Backend

A personal accountability system that helps you stay on track with your goals through SMS reminders.

## Features

- **Recurring Reminders**: Set up reminders for any day and time
- **SMS Notifications**: Get reminded via text message powered by Twilio
- **Completion Tracking**: Respond to texts to confirm goal completion
- **Streak Tracking**: Build and maintain streaks to stay motivated
- **Snooze Support**: Temporarily pause reminders when needed

## Tech Stack

- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **SMS**: Twilio
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Twilio account
- Supabase project

### Installation

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env

# Run database migrations
yarn prisma migrate dev

# Start development server
yarn start:dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/service key |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |

## API Endpoints

### Health

- `GET /v1` - Basic health check
- `GET /v1/health` - Detailed health status
- `GET /v1/ping` - Ping/pong endpoint

### Reminders

- `GET /v1/reminders` - List user reminders
- `POST /v1/reminders` - Create a reminder
- `PUT /v1/reminders/:id` - Update a reminder
- `DELETE /v1/reminders/:id` - Delete a reminder

### Users

- `GET /v1/users/me` - Get current user
- `PUT /v1/users/me` - Update current user

## Project Structure

```
src/
├── auth/           # Authentication guards and decorators
├── config/         # Application configuration
├── database/       # Database service and module
├── helpers/        # Utility helpers (validators, formatters)
├── message/        # Message handling
├── reminders/      # Reminders CRUD and scheduling
├── subscriptions/  # Subscription management
├── twilio/         # Twilio SMS integration
├── types/          # TypeScript type definitions
├── users/          # User management
├── constants.ts    # Application constants
├── utils.ts        # Utility functions
├── app.module.ts   # Root module
└── main.ts         # Application entry point
```

## Development

```bash
# Run in development mode
yarn start:dev

# Run tests
yarn test

# Run linting
yarn lint

# Build for production
yarn build
```

## License

MIT
