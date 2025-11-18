# 🎭 Poke Demo Guide

Welcome to the Poke accountability system demo! This guide will walk you through exploring all the features of this personal goal-tracking platform.

## What is Poke?

Poke is a personal accountability system that helps you stay on track with your goals. Set up recurring reminders for habits you want to build, and Poke will text you to check in. Simply respond with the emoji to confirm completion, and Poke tracks your progress!

## Features

- 📱 **SMS-based reminders** - Get reminded via text message
- 🔔 **Customizable schedules** - Choose which days and times you get poked
- ✅ **Easy acknowledgment** - Reply with an emoji to confirm completion
- 🎨 **Personalized experience** - Custom emojis and colors for each reminder
- 🔄 **Smart retry** - Get follow-up reminders if you don't respond
- 🌍 **Timezone support** - Works with your local timezone

## Demo Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Setup Database

Make sure your `.env` file has the database URL configured:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Run migrations:

```bash
yarn prisma migrate dev
```

### 3. Seed Demo Data

```bash
yarn prisma db seed
```

Or run the demo seed directly:

```bash
ts-node prisma/demo-seed.ts
```

This creates 3 demo users with diverse reminder patterns:

| User | Phone | Profile | Reminders |
|------|-------|---------|-----------|
| **Alice Johnson** | +15555550101 | Fitness enthusiast | 3 reminders (workouts, hydration, yoga) |
| **Bob Smith** | +15555550102 | Professional development | 3 reminders (reading, coding, goal review) |
| **Charlie Davis** | +15555550103 | Mental health & creativity | 4 reminders (meditation, journaling, writing) |

### 4. Start the Server

```bash
yarn start:dev
```

The server will start on `http://localhost:3000`

## Demo API Endpoints

### 📊 Get Demo Information

```bash
GET http://localhost:3000/demo/info
```

Returns an overview of the demo system, available users, and endpoint documentation.

**Example Response:**
```json
{
  "title": "🎭 Poke Demo System",
  "description": "A personal accountability system that sends SMS reminders for your goals",
  "demoUsers": [...],
  "endpoints": {...},
  "quickStart": [...]
}
```

### 👥 List All Demo Users

```bash
GET http://localhost:3000/demo/users
```

See all demo users with their reminders and active message counts.

**Example Response:**
```json
[
  {
    "id": "uuid",
    "name": "Alice Johnson",
    "phone": "+15555550101",
    "reminderCount": 3,
    "activeMessages": 1,
    "reminders": [...]
  }
]
```

### 🔔 List All Reminders

```bash
GET http://localhost:3000/demo/reminders
```

View all reminders across all users with their schedules and status.

### 👤 Get User's Reminders

```bash
GET http://localhost:3000/demo/users/15555550101/reminders
```

Get reminders for a specific user (works with or without the + prefix).

**Example Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Alice Johnson",
    "phone": "+15555550101"
  },
  "reminders": [
    {
      "id": "uuid",
      "text": "Morning workout time! 💪",
      "emoji": "💪",
      "color": "red",
      "notificationTime": "06:00",
      "notificationDays": ["Mon", "Wed", "Fri"],
      "hasActiveMessage": false
    }
  ]
}
```

### 🚀 Trigger a Reminder

```bash
POST http://localhost:3000/demo/send-reminder/{reminderId}
```

Manually trigger a reminder to see how the system works. In production, this would send an SMS.

**Example:**
```bash
curl -X POST http://localhost:3000/demo/send-reminder/some-uuid-here
```

**Example Response:**
```json
{
  "success": true,
  "message": "Reminder triggered successfully",
  "reminder": {
    "text": "Morning workout time! 💪",
    "emoji": "💪",
    "user": "Alice Johnson",
    "phone": "+15555550101"
  },
  "note": "SMS would be sent to +15555550101 in production"
}
```

### ✅ Simulate User Response

```bash
POST http://localhost:3000/demo/simulate-response
Content-Type: application/json

{
  "phone": "+15555550101",
  "emoji": "💪"
}
```

Simulate a user responding to their reminder with the correct emoji.

**Example:**
```bash
curl -X POST http://localhost:3000/demo/simulate-response \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15555550101", "emoji": "💪"}'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Great work!",
  "reminder": {
    "text": "Morning workout time! 💪",
    "emoji": "💪"
  },
  "note": "Message deactivated - user acknowledged the poke!"
}
```

### 📈 Get System Stats

```bash
GET http://localhost:3000/demo/stats
```

View statistics about the demo system including user counts, reminder distribution, and system health.

**Example Response:**
```json
{
  "overview": {
    "totalUsers": 3,
    "totalReminders": 10,
    "activeMessages": 2
  },
  "demoUsers": [...],
  "reminderDistribution": [
    {"day": "Sunday", "count": 15},
    {"day": "Monday", "count": 18},
    ...
  ],
  "systemHealth": {
    "status": "operational",
    "cronJobRunning": true
  }
}
```

## Demo Scenarios

### Scenario 1: Complete Workflow

1. **Get Alice's reminders:**
   ```bash
   curl http://localhost:3000/demo/users/15555550101/reminders
   ```

2. **Copy a reminder ID from the response**

3. **Trigger the reminder:**
   ```bash
   curl -X POST http://localhost:3000/demo/send-reminder/{reminderId}
   ```

4. **Simulate Alice responding:**
   ```bash
   curl -X POST http://localhost:3000/demo/simulate-response \
     -H "Content-Type: application/json" \
     -d '{"phone": "+15555550101", "emoji": "💪"}'
   ```

5. **Check stats to see the change:**
   ```bash
   curl http://localhost:3000/demo/stats
   ```

### Scenario 2: Explore Different User Profiles

**Fitness Enthusiast (Alice):**
```bash
curl http://localhost:3000/demo/users/15555550101/reminders
```
See workout, hydration, and yoga reminders.

**Professional Development (Bob):**
```bash
curl http://localhost:3000/demo/users/15555550102/reminders
```
See reading, coding, and goal review reminders.

**Mental Health (Charlie):**
```bash
curl http://localhost:3000/demo/users/15555550103/reminders
```
See meditation, journaling, and creative writing reminders.

### Scenario 3: System Monitoring

1. **Check overall stats:**
   ```bash
   curl http://localhost:3000/demo/stats
   ```

2. **List all active reminders:**
   ```bash
   curl http://localhost:3000/demo/reminders
   ```

3. **Monitor which reminders are active and when they'll next send**

## How the Real System Works

### Scheduled Reminders

The system uses a cron job that runs every minute to:
1. Check for reminders scheduled for the current time
2. Send SMS messages via Twilio
3. Wait for user responses
4. Retry up to 4 times if no response

### User Interaction Flow

1. **User creates a reminder** with:
   - Text message
   - Emoji for acknowledgment
   - Days of the week
   - Time to be reminded
   - Timezone

2. **System sends reminder at scheduled time:**
   ```
   "Morning workout time! 💪

   Respond with 💪 to acknowledge this poke!"
   ```

3. **User responds with emoji:** System marks reminder as complete

4. **No response?** System sends follow-up reminders with exponential backoff

### Data Model

```
User
├── name
├── phone (unique)
├── onboarded
└── reminders[]

Reminder
├── text
├── emoji
├── color
├── notificationTime
├── notificationDays[]
├── timeZone
└── message (optional)

Message
├── nextSend
├── tries (max 4)
└── active
```

## Production Setup

To use this in production:

1. **Configure Twilio:**
   ```env
   TWILIO_ACCOUNT_ID=your_account_id
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE=your_twilio_phone_number
   ```

2. **Configure Supabase for Auth:**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

3. **Set up real phone numbers** and deploy!

## Architecture Highlights

- **NestJS** - Modern Node.js framework
- **Prisma** - Type-safe database ORM
- **Twilio** - SMS messaging
- **Supabase** - Authentication
- **Cron Jobs** - Scheduled task execution
- **PostgreSQL** - Data persistence

## Tips for Exploring

1. **Start with `/demo/info`** to get oriented
2. **Explore different user profiles** to see variety
3. **Trigger reminders manually** to test the flow
4. **Simulate responses** to see the completion workflow
5. **Check stats** to see system-wide metrics

## Need Help?

- Check the main README for setup instructions
- Explore the `/demo/info` endpoint for quick reference
- Review the code in `src/demo/` for implementation details

---

**Happy poking!** 🎉
