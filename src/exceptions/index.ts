import { HttpException, HttpStatus } from '@nestjs/common';

export class ReminderNotFoundException extends HttpException {
  constructor(reminderId: string) {
    super(`Reminder with ID ${reminderId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UserNotFoundException extends HttpException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class SubscriptionRequiredException extends HttpException {
  constructor() {
    super(
      'An active subscription is required to perform this action',
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}

export class ReminderLimitExceededException extends HttpException {
  constructor(limit: number) {
    super(
      `Maximum number of reminders (${limit}) has been reached`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidScheduleException extends HttpException {
  constructor(message: string) {
    super(`Invalid schedule: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

export class TwilioException extends HttpException {
  constructor(message: string) {
    super(`SMS service error: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class UnauthorizedReminderAccessException extends HttpException {
  constructor() {
    super(
      'You do not have permission to access this reminder',
      HttpStatus.FORBIDDEN
    );
  }
}
