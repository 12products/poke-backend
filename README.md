# Poke Backend

Poke is a personal accountability system. You set up recurring goals on the platform and get reminded about them via text message. For example, if you want to go to the gym three days a week, you can add a reminder in Poke to message you on your gym days. Poke will keep track of when you accomplish your goals or when you've slipped up.

## Features

### MVP
- User can create reminders that will be regularly sent as text
- User can set which days reminders are sent
- User can set which times reminders are sent
- User can respond to text to confirm completion
- User can respond to text to disable reminders ("snooze")
- User gets reminded if they do not respond to text
- User can manage their reminders

### Stretch Goals
- User can see dashboard summarizing their reminders
- User can see data visualization of their streaks

## Tech Stack

- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **SMS**: Twilio
- **Scheduling**: NestJS Schedule (cron jobs)

## Prerequisites

- Node.js 18+
- Yarn
- PostgreSQL database
- Twilio account
- Supabase project

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd poke-backend
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Set up environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

### 4. Set up the database

```bash
# Generate Prisma client
yarn prisma generate

# Run migrations
yarn prisma migrate deploy
```

### 5. Start the development server

```bash
yarn start:dev
```

The server will be running at `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start the production server |
| `yarn start:dev` | Start the development server with hot reload |
| `yarn start:debug` | Start in debug mode |
| `yarn build` | Build for production |
| `yarn lint` | Run ESLint |
| `yarn format` | Format code with Prettier |
| `yarn test` | Run unit tests |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:cov` | Run tests with coverage |
| `yarn test:e2e` | Run end-to-end tests |

## Docker

### Build and run with Docker Compose

```bash
docker-compose up --build
```

### Build the Docker image

```bash
docker build -t poke-backend .
```

## API Endpoints

All endpoints are prefixed with `/v1`.

### Health Check
- `GET /v1/health` - Check server health

### Users
- `POST /v1/users` - Create a new user
- `GET /v1/users/:id` - Get user by ID
- `PATCH /v1/users/:id` - Update user

### Reminders
- `GET /v1/reminders` - Get all reminders for authenticated user
- `POST /v1/reminders` - Create a new reminder
- `GET /v1/reminders/:id` - Get reminder by ID
- `PATCH /v1/reminders/:id` - Update reminder
- `DELETE /v1/reminders/:id` - Delete reminder

### Twilio Webhook
- `POST /v1/twilio/sms` - Webhook for incoming SMS messages

## Architecture

```
src/
├── auth/           # Authentication guards and strategies
├── database/       # Prisma database service
├── message/        # Message handling for SMS reminders
├── reminders/      # Reminder CRUD and scheduling
├── subscriptions/  # Subscription management
├── twilio/         # Twilio SMS integration
├── users/          # User management
├── constants.ts    # App constants (emojis)
├── utils.ts        # Utility functions
├── main.ts         # Application entry point
└── app.module.ts   # Root module
```

## License

UNLICENSED
