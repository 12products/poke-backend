# Poke

Poke is a personal accountability system. You setup recurring goals on the platform and get reminded about them via text message. For example, if you want to go to the gym three days a week, you can add a reminder in Poke to message you on your gym days. Poke will keep track of when you accomplish your goals or when you've slipped up.

## Getting Started

### Prerequisites

- Node.js 16+
- Yarn
- PostgreSQL database
- Twilio account for SMS

### Installation

```bash
yarn install
cp .env.example .env
# Configure your environment variables
yarn prisma generate
yarn prisma migrate dev
```

### Running the Application

```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health/detailed` | GET | Detailed health status |
| `/reminders` | GET | List all reminders |
| `/reminders` | POST | Create a reminder |
| `/reminders/:id` | PATCH | Update a reminder |
| `/reminders/:id` | DELETE | Delete a reminder |

## MVP

- User can create reminders that will be regularly sent as text
- User can set which days reminders are sent
- User can set which times reminders are sent
- User can respond to text to confirm completion
- User can response to text to disable reminders ("snooze")
- User gets reminded if they do not respond to text
- User can manage their reminders

## Stretch

- User can see dashboard summarizing their reminders
- User can see data visualization of their streaks

## Architecture

The application is built with:
- **NestJS** - Backend framework
- **Prisma** - Database ORM
- **Twilio** - SMS messaging
- **Supabase** - Authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request