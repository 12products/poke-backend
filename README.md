# Poke

Poke is a personal accountability system that helps you build and maintain healthy habits. Set up recurring goals on the platform and get reminded about them via text message. For example, if you want to go to the gym three days a week, you can add a reminder in Poke to message you on your gym days. Poke will keep track of when you accomplish your goals and celebrate your streaks!

## Features

### Core Features
- Create reminders with custom text and emoji identifiers
- Set which days reminders are sent (any day of the week)
- Set notification times in your local timezone
- Respond to texts with your emoji to confirm completion
- Automatic follow-up reminders if you don't respond
- Streak tracking to monitor your consistency

### User Management
- Secure authentication via Supabase
- User profiles with phone number verification
- Subscription tiers (Free, Premium, Enterprise)

### API Endpoints

#### Health & Status
- `GET /v1` - Basic health check
- `GET /v1/health` - Detailed health check with service status
- `GET /v1/ping` - Ping endpoint
- `GET /v1/stats` - Database statistics
- `GET /v1/info` - System information
- `GET /v1/ready` - Kubernetes readiness probe
- `GET /v1/live` - Kubernetes liveness probe

#### Users
- `GET /v1/users/onboard` - Onboard a new user
- `GET /v1/users/me` - Get current user
- `GET /v1/users/me/stats` - Get user statistics
- `GET /v1/users/me/subscription` - Get subscription info
- `PATCH /v1/users/me` - Update current user
- `DELETE /v1/users/me` - Delete account

#### Reminders
- `GET /v1/reminders` - List all reminders
- `GET /v1/reminders/with-status` - List reminders with today's status
- `GET /v1/reminders/stats` - Get reminder statistics
- `GET /v1/reminders/:id` - Get a specific reminder
- `POST /v1/reminders` - Create a new reminder
- `POST /v1/reminders/:id/duplicate` - Duplicate a reminder
- `POST /v1/reminders/:id/pause` - Pause a reminder
- `PATCH /v1/reminders/:id` - Update a reminder
- `DELETE /v1/reminders/:id` - Delete a reminder

#### Messages
- `GET /v1/message/active` - Get active messages
- `GET /v1/message/stats` - Get message statistics
- `POST /v1/message` - Send a message
- `POST /v1/message/sms` - Webhook for incoming SMS

#### Subscriptions
- `GET /v1/subscriptions` - Get current subscription
- `GET /v1/subscriptions/status` - Check subscription status
- `GET /v1/subscriptions/tiers` - List available tiers
- `POST /v1/subscriptions` - Create/verify subscription
- `DELETE /v1/subscriptions` - Cancel subscription

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase
- **SMS**: Twilio
- **Payments**: Apple In-App Purchases

## Getting Started

### Prerequisites
- Node.js 16+
- Yarn
- PostgreSQL database
- Supabase project
- Twilio account

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://..."
SUPABASE_KEY="..."

# Twilio
TWILIO_ACCOUNT_ID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE="+1..."

# Apple
APPLE_SHARED_SECRET="..."

# Server
PORT=3000
NODE_ENV=development
```

### Installation

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma generate

# Run database migrations
yarn db:migrate

# Start development server
yarn start:dev
```

### Available Scripts

```bash
yarn start:dev     # Start in development mode with hot reload
yarn start:prod    # Start in production mode
yarn build         # Build for production
yarn test          # Run tests
yarn test:cov      # Run tests with coverage
yarn lint          # Lint and fix code
yarn format        # Format code with Prettier
yarn db:studio     # Open Prisma Studio
yarn typecheck     # Run TypeScript type checking
```

## Architecture

```
src/
├── auth/           # Authentication guards and decorators
├── database/       # Prisma database service
├── message/        # SMS message handling
├── reminders/      # Reminder CRUD and scheduling
├── subscriptions/  # Subscription management
├── twilio/         # Twilio SMS integration
├── users/          # User management
├── constants.ts    # Application constants
├── utils.ts        # Utility functions
├── app.module.ts   # Root module
├── app.controller.ts # Root controller
└── main.ts         # Application entry point
```

## Subscription Tiers

| Feature | Free | Premium | Enterprise |
|---------|------|---------|------------|
| Reminders | 1 | 50 | Unlimited |
| SMS Notifications | Basic | Priority | Priority |
| Custom Emojis | - | ✓ | ✓ |
| Analytics | - | ✓ | ✓ |
| Team Management | - | - | ✓ |
| API Access | - | - | ✓ |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT
