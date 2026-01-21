import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Set test-specific environment variables
process.env.NODE_ENV = 'test'
process.env.TZ = 'UTC'

// Increase timeout for slow tests
jest.setTimeout(30000)

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Clean up after all tests
afterAll(async () => {
  // Allow pending promises to settle
  await new Promise((resolve) => setTimeout(resolve, 100))
})

// Utility to create mock user
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id-123',
  phone: '+15555555555',
  email: 'test@example.com',
  name: 'Test User',
  onboarded: true,
  activeSubscription: null,
  ...overrides,
})

// Utility to create mock reminder
export const createMockReminder = (overrides = {}) => ({
  id: 'test-reminder-id-123',
  text: 'Test reminder',
  notificationTime: new Date('2001-02-01T09:00:00Z'),
  notificationDays: [1, 2, 3, 4, 5],
  userId: 'test-user-id-123',
  emoji: '🦄',
  color: 'blue',
  timeZone: 'America/New_York',
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  priority: 1,
  tags: [],
  ...overrides,
})

// Utility to create mock message
export const createMockMessage = (overrides = {}) => ({
  id: 'test-message-id-123',
  reminderId: 'test-reminder-id-123',
  createdAt: new Date(),
  nextSend: new Date(),
  tries: 1,
  active: true,
  status: 'PENDING',
  ...overrides,
})
