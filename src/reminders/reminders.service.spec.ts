import { Test, TestingModule } from '@nestjs/testing'
import { RemindersService } from './reminders.service'
import { DatabaseService } from '../database/database.service'
import { MessageService } from '../message/message.service'
import { emojis } from '../constants'

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  utcToZonedTime: jest.fn((date) => date),
}))

describe('RemindersService', () => {
  let service: RemindersService
  let dbService: DatabaseService
  let messageService: MessageService

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    phone: '1234567890',
    onboarded: true,
    activeSubscription: 'premium',
  }

  const mockReminder = {
    id: 'reminder-123',
    text: 'Test reminder',
    notificationTime: new Date('2001-02-01T10:00:00.000Z'),
    notificationDays: [1, 2, 3, 4, 5],
    emoji: '🦄',
    color: '#FF0000',
    timeZone: 'America/New_York',
    userId: 'user-123',
  }

  const mockDbService = {
    user: {
      findUnique: jest.fn(),
    },
    reminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      deleteMany: jest.fn(),
    },
  }

  const mockMessageService = {
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
        {
          provide: MessageService,
          useValue: mockMessageService,
        },
      ],
    }).compile()

    service = module.get<RemindersService>(RemindersService)
    dbService = module.get<DatabaseService>(DatabaseService)
    messageService = module.get<MessageService>(MessageService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a reminder for user with active subscription', async () => {
      mockDbService.reminder.findMany.mockResolvedValue([])
      mockDbService.user.findUnique.mockResolvedValue(mockUser)
      mockDbService.reminder.create.mockResolvedValue(mockReminder)

      const reminderData = {
        text: 'Test reminder',
        notificationTime: new Date('2024-06-15T10:00:00.000Z'),
        notificationDays: [1, 2, 3, 4, 5],
        color: '#FF0000',
        timeZone: 'America/New_York',
      }

      const result = await service.create({ id: 'user-123' }, reminderData as any)

      expect(result).toEqual(mockReminder)
      expect(mockDbService.reminder.create).toHaveBeenCalled()
    })

    it('should throw error for user without subscription trying to create second reminder', async () => {
      const userWithoutSub = { ...mockUser, activeSubscription: null }
      mockDbService.reminder.findMany.mockResolvedValue([mockReminder])
      mockDbService.user.findUnique.mockResolvedValue(userWithoutSub)

      const reminderData = {
        text: 'Second reminder',
        notificationTime: new Date('2024-06-15T10:00:00.000Z'),
        notificationDays: [1, 2, 3, 4, 5],
        color: '#00FF00',
        timeZone: 'America/New_York',
      }

      await expect(
        service.create({ id: 'user-123' }, reminderData as any)
      ).rejects.toThrow('Need an active subscription for more reminders')
    })

    it('should allow first reminder for user without subscription', async () => {
      const userWithoutSub = { ...mockUser, activeSubscription: null }
      mockDbService.reminder.findMany.mockResolvedValue([])
      mockDbService.user.findUnique.mockResolvedValue(userWithoutSub)
      mockDbService.reminder.create.mockResolvedValue(mockReminder)

      const reminderData = {
        text: 'First reminder',
        notificationTime: new Date('2024-06-15T10:00:00.000Z'),
        notificationDays: [1, 2, 3, 4, 5],
        color: '#FF0000',
        timeZone: 'America/New_York',
      }

      const result = await service.create({ id: 'user-123' }, reminderData as any)

      expect(result).toEqual(mockReminder)
    })

    it('should assign sequential emoji when user has existing reminders', async () => {
      const existingReminder = { ...mockReminder, emoji: emojis[0] }
      mockDbService.reminder.findMany.mockResolvedValue([existingReminder])
      mockDbService.user.findUnique.mockResolvedValue(mockUser)
      mockDbService.reminder.create.mockResolvedValue({
        ...mockReminder,
        emoji: emojis[1],
      })

      const reminderData = {
        text: 'Test reminder',
        notificationTime: new Date('2024-06-15T10:00:00.000Z'),
        notificationDays: [1, 2, 3, 4, 5],
        color: '#FF0000',
        timeZone: 'America/New_York',
      }

      await service.create({ id: 'user-123' }, reminderData as any)

      // Verify create was called with next emoji in sequence
      expect(mockDbService.reminder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emoji: emojis[1],
          }),
        })
      )
    })
  })

  describe('findAll', () => {
    it('should return all reminders for a user', async () => {
      const reminders = [mockReminder, { ...mockReminder, id: 'reminder-456' }]
      mockDbService.reminder.findMany.mockResolvedValue(reminders)

      const result = await service.findAll('user-123')

      expect(result).toEqual(reminders)
      expect(mockDbService.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      })
    })

    it('should return empty array when no reminders exist', async () => {
      mockDbService.reminder.findMany.mockResolvedValue([])

      const result = await service.findAll('user-123')

      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should return reminder if user owns it', async () => {
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)

      const result = await service.findOne({ id: 'reminder-123' }, 'user-123')

      expect(result).toEqual(mockReminder)
    })

    it('should return null if user does not own reminder', async () => {
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)

      const result = await service.findOne({ id: 'reminder-123' }, 'other-user')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update reminder if user owns it', async () => {
      const updatedReminder = { ...mockReminder, text: 'Updated text' }
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockDbService.reminder.update.mockResolvedValue(updatedReminder)

      const result = await service.update({
        where: { id: 'reminder-123' },
        data: { text: 'Updated text' },
        userId: 'user-123',
      })

      expect(result).toEqual(updatedReminder)
      expect(mockDbService.reminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder-123' },
        data: { text: 'Updated text' },
      })
    })

    it('should return undefined if user does not own reminder', async () => {
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)

      const result = await service.update({
        where: { id: 'reminder-123' },
        data: { text: 'Updated text' },
        userId: 'other-user',
      })

      expect(result).toBeUndefined()
      expect(mockDbService.reminder.update).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should remove reminder and associated messages if user owns it', async () => {
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockDbService.message.deleteMany.mockResolvedValue({ count: 1 })
      mockDbService.reminder.delete.mockResolvedValue(mockReminder)

      const result = await service.remove({ id: 'reminder-123' }, 'user-123')

      expect(result).toEqual(mockReminder)
      expect(mockDbService.message.deleteMany).toHaveBeenCalledWith({
        where: { reminderId: 'reminder-123' },
      })
      expect(mockDbService.reminder.delete).toHaveBeenCalledWith({
        where: { id: 'reminder-123' },
      })
    })

    it('should return undefined if user does not own reminder', async () => {
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)

      const result = await service.remove({ id: 'reminder-123' }, 'other-user')

      expect(result).toBeUndefined()
      expect(mockDbService.message.deleteMany).not.toHaveBeenCalled()
      expect(mockDbService.reminder.delete).not.toHaveBeenCalled()
    })

    it('should continue deletion even if message deletion fails', async () => {
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockDbService.message.deleteMany.mockRejectedValue(new Error('DB error'))
      mockDbService.reminder.delete.mockResolvedValue(mockReminder)

      const result = await service.remove({ id: 'reminder-123' }, 'user-123')

      expect(result).toEqual(mockReminder)
      expect(mockDbService.reminder.delete).toHaveBeenCalled()
    })
  })

  describe('sendReminders (cron job)', () => {
    it('should send reminders matching current time and day', async () => {
      const { utcToZonedTime } = require('date-fns-tz')
      const today = new Date()
      const dayOfWeek = today.getDay()

      // Mock utcToZonedTime to return a date with current day of week
      utcToZonedTime.mockReturnValue(today)

      const reminderToSend = {
        ...mockReminder,
        notificationDays: [dayOfWeek],
      }

      mockDbService.reminder.findMany.mockResolvedValue([reminderToSend])

      await service.sendReminders()

      expect(mockMessageService.create).toHaveBeenCalledWith('reminder-123')
    })

    it('should not send reminders on wrong day', async () => {
      const { utcToZonedTime } = require('date-fns-tz')
      const today = new Date()
      const wrongDay = (today.getDay() + 1) % 7

      utcToZonedTime.mockReturnValue(today)

      const reminderWrongDay = {
        ...mockReminder,
        notificationDays: [wrongDay],
      }

      mockDbService.reminder.findMany.mockResolvedValue([reminderWrongDay])

      await service.sendReminders()

      expect(mockMessageService.create).not.toHaveBeenCalled()
    })

    it('should handle empty reminders list', async () => {
      mockDbService.reminder.findMany.mockResolvedValue([])

      await service.sendReminders()

      expect(mockMessageService.create).not.toHaveBeenCalled()
    })
  })
})
