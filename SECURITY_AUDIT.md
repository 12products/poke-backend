# Security Audit Report - Poke Backend

**Date:** 2026-01-28
**Auditor:** Claude Security Review
**Scope:** Full codebase security review

---

## Executive Summary

This security audit identified **3 high-severity**, **4 medium-severity**, and **4 low-severity** vulnerabilities in the Poke backend application. The most critical issues involve authorization bypass vulnerabilities and missing webhook validation.

---

## High Severity Issues

### 1. IDOR Vulnerability in User Update Endpoint

**Location:** `src/users/users.controller.ts:17-19`

**Description:** The `PATCH /v1/users/:id` endpoint allows any authenticated user to update ANY user's data by manipulating the `id` parameter.

**Vulnerable Code:**
```typescript
@Patch(':id')
update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
  return this.usersService.update({ where: { id }, data })
}
```

**Impact:** An attacker with a valid account can modify other users' data including:
- Changing their phone numbers (redirecting SMS notifications)
- Modifying subscription status
- Changing user names

**Recommendation:** Add `@CurrentUser()` decorator and verify ownership:
```typescript
@Patch(':id')
update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
  if (user.id !== id) throw new ForbiddenException();
  return this.usersService.update({ where: { id }, data })
}
```

---

### 2. Missing Twilio Webhook Signature Validation

**Location:** `src/message/message.controller.ts:15-20` and `src/message/message.service.ts:87-116`

**Description:** The SMS webhook endpoint at `POST /v1/message/sms` is publicly accessible and does not validate that requests originate from Twilio.

**Vulnerable Code:**
```typescript
@Public()
@Post('sms')
@Header('Content-Type', 'text/xml')
receiveMessage(@Req() req) {
  return this.messageService.receiveMessage(req)
}
```

**Impact:**
- Attackers can forge SMS responses to acknowledge reminders for any user
- Denial of service by flooding the endpoint
- Manipulation of user reminder state without actual SMS interaction

**Recommendation:** Implement Twilio request signature validation:
```typescript
import { validateRequest } from 'twilio';

// Validate Twilio signature before processing
const isValid = validateRequest(
  authToken,
  req.headers['x-twilio-signature'],
  webhookUrl,
  req.body
);
if (!isValid) throw new UnauthorizedException();
```

---

### 3. Missing Authorization on Message Send Endpoint

**Location:** `src/message/message.controller.ts:10-13`

**Description:** The `POST /v1/message` endpoint requires authentication but doesn't verify the user owns the reminder being triggered.

**Vulnerable Code:**
```typescript
@Post()
sendMessage(reminderId: string) {
  return this.messageService.sendMessage(reminderId)
}
```

**Impact:** Any authenticated user can trigger SMS messages for other users' reminders, potentially causing:
- SMS cost abuse
- Harassment via repeated notifications
- Information disclosure (reminder content sent to victim's phone)

**Recommendation:** Add user verification and proper parameter binding:
```typescript
@Post()
sendMessage(@Body('reminderId') reminderId: string, @CurrentUser() user: AuthUser) {
  // Verify ownership before sending
  const reminder = await this.reminderService.findOne({ id: reminderId }, user.id);
  if (!reminder) throw new ForbiddenException();
  return this.messageService.sendMessage(reminderId);
}
```

---

## Medium Severity Issues

### 4. Overly Permissive CORS Configuration

**Location:** `src/main.ts:15-18`

**Description:** CORS is configured to allow requests from any origin (`origin: '*'`).

**Vulnerable Code:**
```typescript
app.enableCors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
})
```

**Impact:** Enables cross-origin attacks where malicious websites can make authenticated API requests on behalf of logged-in users.

**Recommendation:** Restrict to specific allowed origins:
```typescript
app.enableCors({
  origin: ['https://your-app-domain.com'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
})
```

---

### 5. No Input Validation or Sanitization

**Location:** Multiple controllers

**Description:** Controllers accept raw Prisma types without DTO validation, length limits, or sanitization.

**Affected Files:**
- `src/reminders/reminders.controller.ts:31-35` - accepts `Prisma.ReminderCreateInput`
- `src/users/users.controller.ts:18` - accepts `Prisma.UserUpdateInput`
- `src/subscriptions/subscriptions.controller.ts:12` - accepts raw string for receipt

**Impact:**
- Potential for injection attacks
- Storage of oversized data (DoS via database bloat)
- Malformed data causing application errors

**Recommendation:** Use NestJS validation pipes with class-validator DTOs:
```typescript
import { IsString, MaxLength, IsArray } from 'class-validator';

class CreateReminderDto {
  @IsString()
  @MaxLength(500)
  text: string;

  @IsArray()
  notificationDays: number[];
  // ... other validated fields
}
```

---

### 6. Missing Rate Limiting

**Location:** Application-wide

**Description:** No rate limiting is implemented on any endpoint.

**Impact:**
- Brute force attacks on authentication
- SMS flooding via webhook abuse
- API abuse and potential DoS

**Recommendation:** Implement rate limiting using `@nestjs/throttler`:
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

---

### 7. Outdated Dependencies with Known Vulnerabilities

**Location:** `package.json`

**Description:** Several dependencies are significantly outdated:

| Package | Current Version | Recommended |
|---------|-----------------|-------------|
| @nestjs/* | 8.x | 10.x |
| @prisma/client | 3.7.0 | 5.x |
| @supabase/supabase-js | 1.29.3 | 2.x |
| passport | 0.5.2 | 0.7.x |
| twilio | 3.73.0 | 4.x |

**Impact:** Known security vulnerabilities in outdated packages.

**Recommendation:** Update dependencies and run `npm audit` regularly.

---

## Low Severity Issues

### 8. Verbose Error Messages Leak Internal Details

**Location:** `src/subscriptions/subscriptions.service.ts:40`, `src/subscriptions/subscriptions.service.ts:53`

**Description:** Error messages include internal exception details.

**Vulnerable Code:**
```typescript
throw new Error(`Failed to verify Apple receipt: ${e}`)
```

**Impact:** Stack traces and internal errors could reveal implementation details to attackers.

**Recommendation:** Log detailed errors internally, return generic messages to clients:
```typescript
this.logger.error('Apple receipt verification failed', e);
throw new BadRequestException('Receipt verification failed');
```

---

### 9. Silent Authorization Failures

**Location:** `src/reminders/reminders.service.ts:87`, `src/reminders/reminders.service.ts:99`

**Description:** When authorization fails (userId mismatch), the service returns `undefined` instead of an error.

**Vulnerable Code:**
```typescript
if (reminder.userId !== userId) return  // Silent failure
```

**Impact:**
- Difficult to detect authorization bypass attempts
- Poor audit trail
- Confusing API behavior

**Recommendation:** Throw explicit authorization exceptions:
```typescript
if (reminder.userId !== userId) {
  throw new ForbiddenException('Access denied');
}
```

---

### 10. Potential Phone Number Enumeration

**Location:** `src/message/message.service.ts:100-102`

**Description:** Different responses for valid vs invalid phone numbers could enable enumeration.

**Recommendation:** Return consistent responses regardless of user existence.

---

### 11. Null Pointer Potential in findOne

**Location:** `src/reminders/reminders.service.ts:73-74`

**Description:** No null check before accessing `reminder.userId`.

**Vulnerable Code:**
```typescript
const reminder = await this.db.reminder.findUnique({ where })
return reminder.userId === userId ? reminder : null  // reminder could be null
```

**Recommendation:** Add null check:
```typescript
const reminder = await this.db.reminder.findUnique({ where })
return reminder?.userId === userId ? reminder : null
```

---

## Summary Table

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | HIGH | IDOR in User Update | users.controller.ts:17-19 |
| 2 | HIGH | Missing Twilio Webhook Validation | message.controller.ts:15-20 |
| 3 | HIGH | Missing Auth on Message Send | message.controller.ts:10-13 |
| 4 | MEDIUM | Overly Permissive CORS | main.ts:15-18 |
| 5 | MEDIUM | No Input Validation | Multiple controllers |
| 6 | MEDIUM | Missing Rate Limiting | Application-wide |
| 7 | MEDIUM | Outdated Dependencies | package.json |
| 8 | LOW | Verbose Error Messages | subscriptions.service.ts |
| 9 | LOW | Silent Auth Failures | reminders.service.ts |
| 10 | LOW | Phone Number Enumeration | message.service.ts |
| 11 | LOW | Null Pointer Potential | reminders.service.ts:73-74 |

---

## Recommendations Priority

1. **Immediate (High Severity):** Fix IDOR, add Twilio webhook validation, add authorization to message endpoint
2. **Short-term (Medium Severity):** Restrict CORS, add input validation, implement rate limiting
3. **Ongoing:** Update dependencies, improve error handling, add comprehensive logging
