# Poke Backend API Documentation

## Overview

The Poke Backend API provides endpoints for managing personal accountability reminders via SMS. Users can create recurring reminders, track completion, and view statistics about their accountability goals.

**Base URL:** `/v1` (all endpoints are prefixed with this)

**Authentication:** Most endpoints require Supabase JWT authentication via Bearer token in the Authorization header.

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Reminders](#reminders)
- [Messages](#messages)
- [Subscriptions](#subscriptions)

---

## Authentication

All protected endpoints require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Public endpoints:
- `POST /v1/message/sms` - Twilio webhook (no auth required)

---

## Users

### Get Current User

Get the currently authenticated user's profile.

**Endpoint:** `GET /v1/users/me`

**Auth Required:** Yes

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "phone": "15555551234",
  "onboarded": true,
  "activeSubscription": "com.example.premium"
}
```

---

### Onboard User

Create or retrieve user from Supabase authentication.

**Endpoint:** `GET /v1/users/onboard`

**Auth Required:** Yes

**Response:**
```json
{
  "id": "uuid",
  "phone": "15555551234",
  "onboarded": true
}
```

---

### Update User

Update user profile information.

**Endpoint:** `PATCH /v1/users/:id`

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "John Doe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "phone": "15555551234",
  "onboarded": true,
  "activeSubscription": null
}
```

---

### Get User Statistics

Get comprehensive statistics for the authenticated user.

**Endpoint:** `GET /v1/users/statistics`

**Auth Required:** Yes

**Response:**
```json
{
  "totalReminders": 5,
  "activeReminders": 2,
  "totalMessages": 25,
  "activeMessages": 2,
  "completionRate": 88.5,
  "mostActiveDay": "Monday",
  "averageResponseTime": null
}
```

---

### Get Activity by Day

Get reminder activity breakdown by day of week.

**Endpoint:** `GET /v1/users/activity`

**Auth Required:** Yes

**Response:**
```json
[
  { "day": "Sunday", "count": 0 },
  { "day": "Monday", "count": 3 },
  { "day": "Tuesday", "count": 2 },
  { "day": "Wednesday", "count": 3 },
  { "day": "Thursday", "count": 2 },
  { "day": "Friday", "count": 3 },
  { "day": "Saturday", "count": 1 }
]
```

---

## Reminders

### Get All Reminders

Get all reminders for the authenticated user.

**Endpoint:** `GET /v1/reminders`

**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "uuid",
    "text": "Go to the gym",
    "notificationTime": "2001-02-01T07:00:00.000Z",
    "notificationDays": [1, 3, 5],
    "emoji": "🦄",
    "color": "blue",
    "timeZone": "America/New_York",
    "userId": "uuid",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

---

### Get Single Reminder

Get a specific reminder by ID.

**Endpoint:** `GET /v1/reminders/:id`

**Auth Required:** Yes

**Response:** Same as single reminder object above

---

### Create Reminder

Create a new reminder.

**Endpoint:** `POST /v1/reminders`

**Auth Required:** Yes

**Request Body:**
```json
{
  "text": "Go to the gym",
  "notificationTime": "2024-01-01T07:00:00.000Z",
  "notificationDays": [1, 3, 5],
  "timeZone": "America/New_York",
  "color": "blue"
}
```

**Notes:**
- `notificationDays`: Array of day indices (0=Sunday, 6=Saturday)
- `notificationTime`: ISO date string (date is ignored, only time is used)
- `timeZone`: IANA timezone string (e.g., "America/New_York")
- Free users can only create 1 reminder (requires subscription for more)
- System automatically assigns a unique emoji to each reminder

**Response:**
```json
{
  "id": "uuid",
  "text": "Go to the gym",
  "notificationTime": "2001-02-01T07:00:00.000Z",
  "notificationDays": [1, 3, 5],
  "emoji": "🦄",
  "color": "blue",
  "timeZone": "America/New_York",
  "userId": "uuid",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

---

### Update Reminder

Update an existing reminder.

**Endpoint:** `PATCH /v1/reminders/:id`

**Auth Required:** Yes

**Request Body:** (all fields optional)
```json
{
  "text": "Updated reminder text",
  "notificationTime": "2024-01-01T08:00:00.000Z",
  "notificationDays": [1, 2, 3],
  "timeZone": "America/Los_Angeles",
  "color": "red"
}
```

**Response:** Updated reminder object

---

### Delete Reminder

Delete a reminder.

**Endpoint:** `DELETE /v1/reminders/:id`

**Auth Required:** Yes

**Response:** Deleted reminder object

---

### Bulk Delete Reminders

Delete multiple reminders at once.

**Endpoint:** `POST /v1/reminders/bulk-delete`

**Auth Required:** Yes

**Request Body:**
```json
{
  "reminderIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    { "id": "uuid1", "success": true, "reminder": {...} },
    { "id": "uuid2", "success": true, "reminder": {...} },
    { "id": "uuid3", "success": false, "error": "Not found" }
  ]
}
```

---

### Mark Reminder Complete

Manually mark a reminder as complete (deletes associated message).

**Endpoint:** `POST /v1/reminders/:id/complete`

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Reminder marked as complete"
}
```

---

### Get Reminder Statistics

Get statistics for a specific reminder.

**Endpoint:** `GET /v1/reminders/:id/statistics`

**Auth Required:** Yes

**Response:**
```json
{
  "reminderId": "uuid",
  "reminderText": "Go to the gym",
  "totalMessages": 5,
  "completedMessages": 4,
  "averageCompletionTime": null,
  "lastSent": "2023-01-15T07:00:00.000Z"
}
```

---

## Messages

### Get All Messages

Get all messages for the authenticated user's reminders.

**Endpoint:** `GET /v1/message`

**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "uuid",
    "reminderId": "uuid",
    "createdAt": "2023-01-15T07:00:00.000Z",
    "nextSend": "2023-01-15T08:00:00.000Z",
    "tries": 1,
    "active": true,
    "reminder": {
      "id": "uuid",
      "text": "Go to the gym",
      "emoji": "🦄"
    }
  }
]
```

---

### Get Active Messages

Get only active (pending) messages.

**Endpoint:** `GET /v1/message/active`

**Auth Required:** Yes

**Response:** Array of message objects (same structure as above), sorted by nextSend time

---

### Get Message for Reminder

Get the message for a specific reminder.

**Endpoint:** `GET /v1/message/reminder/:reminderId`

**Auth Required:** Yes

**Response:** Single message object or null if no message exists

---

### Send Message (Internal)

Manually trigger sending a message for a reminder.

**Endpoint:** `POST /v1/message`

**Auth Required:** Yes

**Request Body:**
```json
{
  "reminderId": "uuid"
}
```

**Response:** Twilio API response

---

### Receive SMS (Webhook)

Twilio webhook for receiving SMS responses from users.

**Endpoint:** `POST /v1/message/sms`

**Auth Required:** No (Public)

**Content-Type:** application/x-www-form-urlencoded (Twilio format)

**Response:** TwiML XML response

---

## Subscriptions

### Create Subscription

Verify Apple receipt and activate subscription.

**Endpoint:** `POST /v1/subscriptions`

**Auth Required:** Yes

**Request Body:**
```json
{
  "receipt": "base64-encoded-receipt-data",
  "productId": "com.example.premium"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "productId": "com.example.premium",
    "expiresDate": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Cancel Subscription

Cancel the user's active subscription.

**Endpoint:** `DELETE /v1/subscriptions`

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "statusCode": 400,
  "message": "Error message description",
  "error": "Bad Request"
}
```

Common HTTP status codes:
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Scheduled Jobs

The system runs background jobs:

1. **Send Reminders** (every 5 minutes)
   - Finds reminders matching current time and day
   - Creates messages for matched reminders
   - Respects user timezone settings

2. **Resend Messages** (every minute)
   - Resends pending messages
   - Retries up to 4 times with increasing intervals (1 hour between retries)
   - Deactivates messages after 4 attempts

---

## Webhook Configuration

Configure Twilio webhook to point to:
```
POST https://your-domain.com/v1/message/sms
```

---

## Available Emojis

The system uses the following emojis for reminders (assigned automatically):

🦄 🥰 🍔 🙉 🍎 😇 🦊 🍉 🤩 🦁 😜

Each reminder gets a unique emoji that users respond with to confirm completion.
