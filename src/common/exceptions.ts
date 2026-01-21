import { HttpException, HttpStatus } from '@nestjs/common'

export class ReminderNotFoundException extends HttpException {
  constructor(reminderId: string) {
    super(`Reminder with ID ${reminderId} not found`, HttpStatus.NOT_FOUND)
  }
}

export class ReminderAccessDeniedException extends HttpException {
  constructor(reminderId: string) {
    super(
      `Access denied to reminder ${reminderId}`,
      HttpStatus.FORBIDDEN
    )
  }
}

export class SubscriptionRequiredException extends HttpException {
  constructor() {
    super(
      'An active subscription is required for this action',
      HttpStatus.PAYMENT_REQUIRED
    )
  }
}

export class ReminderLimitExceededException extends HttpException {
  constructor(limit: number) {
    super(
      `Maximum reminder limit of ${limit} reached`,
      HttpStatus.BAD_REQUEST
    )
  }
}

export class InvalidPhoneNumberException extends HttpException {
  constructor(phone: string) {
    super(
      `Invalid phone number format: ${phone}`,
      HttpStatus.BAD_REQUEST
    )
  }
}

export class TwilioException extends HttpException {
  constructor(message: string) {
    super(
      `Twilio error: ${message}`,
      HttpStatus.SERVICE_UNAVAILABLE
    )
  }
}

export class DatabaseConnectionException extends HttpException {
  constructor() {
    super(
      'Database connection failed',
      HttpStatus.SERVICE_UNAVAILABLE
    )
  }
}

export class InvalidReceiptException extends HttpException {
  constructor() {
    super(
      'Invalid or expired receipt',
      HttpStatus.BAD_REQUEST
    )
  }
}

export class UserAlreadyExistsException extends HttpException {
  constructor(identifier: string) {
    super(
      `User already exists: ${identifier}`,
      HttpStatus.CONFLICT
    )
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(retryAfter: number) {
    super(
      {
        message: 'Rate limit exceeded',
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS
    )
  }
}
