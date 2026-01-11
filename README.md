# Poke

Poke is a personal accountability system. You setup recurring goals on the platform and get reminded about them via text message. For example, if you want to go to the gym three days a week, you can add a reminder in Poke to message you on your gym days. Poke will keep track of when you accomplish your goals or when you've slipped up.

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager
- PostgreSQL database
- Twilio account for SMS

### Installation

```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
yarn start:dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase API key | Yes |

## API Endpoints

### Health & Status

- `GET /v1/` - Health check
- `GET /v1/status` - Service status
- `GET /v1/ping` - Simple ping

### Reminders

- `GET /v1/reminders` - List user reminders
- `POST /v1/reminders` - Create a reminder
- `PATCH /v1/reminders/:id` - Update a reminder
- `DELETE /v1/reminders/:id` - Delete a reminder

### Users

- `GET /v1/users/me` - Get current user
- `PATCH /v1/users/me` - Update current user

## MVP Features

- User can create reminders that will be regularly sent as text
- User can set which days reminders are sent
- User can set which times reminders are sent
- User can respond to text to confirm completion
- User can respond to text to disable reminders ("snooze")
- User gets reminded if they do not respond to text
- User can manage their reminders

## Stretch Goals

- User can see dashboard summarizing their reminders
- User can see data visualization of their streaks
- Push notification support
- Calendar integration
- Team accountability groups

## Architecture

```
src/
  auth/          # Authentication guards and decorators
  database/      # Database service and Prisma client
  message/       # Message handling logic
  reminders/     # Reminder CRUD operations
  subscriptions/ # User subscription management
  twilio/        # Twilio SMS integration
  users/         # User management
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `yarn test`
5. Submit a pull request

## License

MIT