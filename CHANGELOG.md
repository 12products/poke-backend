# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2024-01-15

### Added
- New `/v1/health` endpoint with detailed status information
- New `/v1/motivation` endpoint for random motivational messages
- New `/v1/ping` endpoint for simple connectivity check
- Configuration module (`src/config/`) for centralized app configuration
- Type definitions module (`src/types/`) for shared TypeScript types
- Helper utilities module (`src/helpers/`) with validators and formatters
- Custom exception classes (`src/exceptions/`) for better error handling
- Streak calculation utility
- Phone number sanitization utility
- Email validation utility
- Retry with exponential backoff utility
- New motivational messages array
- Additional emojis for reminders
- Comprehensive test suite for utilities and helpers

### Changed
- Updated `constants.ts` with app version, HTTP status codes, and days of week
- Expanded `utils.ts` with many new utility functions
- Enhanced `app.controller.ts` with new endpoints
- Improved `main.ts` with validation pipe and better logging
- Refactored `reminders.service.ts` with better error handling and logging
- Refactored `users.service.ts` with logging and new methods
- Updated `package.json` with new scripts and metadata
- Completely rewrote `README.md` with comprehensive documentation

### Removed
- Removed `ping.sh` script (replaced with API endpoint)
- Removed `insomnia.json` API collection file
- Removed `twilio-cli` from dependencies

### Fixed
- Better null checks in reminder service
- Improved authorization checks for reminder operations
- Added proper type annotations throughout

## [1.0.0] - 2023-12-01

### Added
- Initial release
- User authentication with Supabase
- Reminder CRUD operations
- SMS notifications via Twilio
- Subscription management
- Basic health check endpoint
