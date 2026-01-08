import { Test, TestingModule } from '@nestjs/testing'
import { MessageService } from './message.service'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'

// Mock utils
jest.mock('../utils', () => ({
  getNotificationTime: jest.fn((date) => date),
  getNextSendTime: jest.fn((date, tries) => {
    const newDate = new Date(date)
    newDate.setHours(newDate.getHours() + tries)
    return newDate
  }),
}))

describe('MessageService', () => {
  let service: MessageService
  let dbService: DatabaseService
  let twilioService: TwilioService

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    phone: '1234567890',
    onboarded: true,
    activeSubscription: null,
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
    user: mockUser,
  }

  const mockMessage = {
    id: 'message-123',
    reminderId: 'reminder-123',
    nextSend: new Date('2001-02-01T11:00:00.000Z'),
    tries: 1,
    active: true,
    createdAt: new Date(),
  }

  const mockDbService = {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reminder: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  }

  const mockTwilioService = {
    sendMessage: jest.fn(),
    respondToMessage: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
        {
          provide: TwilioService,
          useValue: mockTwilioService,
        },
      ],
    }).compile()

    service = module.get<MessageService>(MessageService)
    dbService = module.get<DatabaseService>(DatabaseService)
    twilioService = module.get<TwilioService>(TwilioService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new message and send SMS', async () => {
      mockDbService.message.findUnique.mockResolvedValue(null)
      mockDbService.message.create.mockResolvedValue(mockMessage)
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockTwilioService.sendMessage.mockResolvedValue('SMS_ID')

      const result = await service.create('reminder-123')

      expect(result).toEqual(mockMessage)
      expect(mockDbService.message.create).toHaveBeenCalled()
      expect(mockTwilioService.sendMessage).toHaveBeenCalled()
    })

    it('should remove existing message before creating new one', async () => {
      mockDbService.message.findUnique.mockResolvedValue(mockMessage)
      mockDbService.message.delete.mockResolvedValue(mockMessage)
      mockDbService.message.create.mockResolvedValue(mockMessage)
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockTwilioService.sendMessage.mockResolvedValue('SMS_ID')

      await service.create('reminder-123')

      expect(mockDbService.message.delete).toHaveBeenCalledWith({
        where: { reminderId: 'reminder-123' },
      })
    })
  })

  describe('update', () => {
    it('should update a message', async () => {
      const updatedMessage = { ...mockMessage, tries: 2 }
      mockDbService.message.update.mockResolvedValue(updatedMessage)

      const result = await service.update({
        where: { id: 'message-123' },
        data: { tries: 2 },
      })

      expect(result).toEqual(updatedMessage)
      expect(mockDbService.message.update).toHaveBeenCalledWith({
        where: { id: 'message-123' },
        data: { tries: 2 },
      })
    })
  })

  describe('remove', () => {
    it('should remove a message', async () => {
      mockDbService.message.delete.mockResolvedValue(mockMessage)

      const result = await service.remove({ id: 'message-123' })

      expect(result).toEqual(mockMessage)
      expect(mockDbService.message.delete).toHaveBeenCalledWith({
        where: { id: 'message-123' },
      })
    })
  })

  describe('findAll', () => {
    it('should return all messages', async () => {
      const messages = [mockMessage, { ...mockMessage, id: 'message-456' }]
      mockDbService.message.findMany.mockResolvedValue(messages)

      const result = await service.findAll()

      expect(result).toEqual(messages)
    })
  })

  describe('findOne', () => {
    it('should return a message by id', async () => {
      mockDbService.message.findUnique.mockResolvedValue(mockMessage)

      const result = await service.findOne({ id: 'message-123' })

      expect(result).toEqual(mockMessage)
    })

    it('should return null if message not found', async () => {
      mockDbService.message.findUnique.mockResolvedValue(null)

      const result = await service.findOne({ id: 'nonexistent' })

      expect(result).toBeNull()
    })
  })

  describe('sendMessage', () => {
    it('should send SMS via Twilio', async () => {
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockTwilioService.sendMessage.mockResolvedValue('SMS_ID')

      const result = await service.sendMessage('reminder-123')

      expect(result).toBe('SMS_ID')
      expect(mockTwilioService.sendMessage).toHaveBeenCalledWith(
        `${mockReminder.text}.\n\nRespond with ${mockReminder.emoji} to acknowledge this poke!`,
        mockReminder.user.phone
      )
    })
  })

  describe('receiveMessage', () => {
    const createMockRequest = (body: string, from: string) => ({
      body: {
        Body: body,
        From: from,
      },
    })

    it('should acknowledge message when emoji matches', async () => {
      const userWithReminders = {
        ...mockUser,
        reminders: [mockReminder],
      }
      mockDbService.user.findUnique.mockResolvedValue(userWithReminders)
      mockDbService.message.delete.mockResolvedValue(mockMessage)
      mockTwilioService.respondToMessage.mockResolvedValue('<Response></Response>')

      const req = createMockRequest('🦄', '+1234567890')
      const result = await service.receiveMessage(req)

      expect(mockDbService.message.delete).toHaveBeenCalledWith({
        where: { reminderId: 'reminder-123' },
      })
      expect(mockTwilioService.respondToMessage).toHaveBeenCalledWith('Great work!')
    })

    it('should respond with retry message when emoji does not match', async () => {
      const userWithReminders = {
        ...mockUser,
        reminders: [mockReminder],
      }
      mockDbService.user.findUnique.mockResolvedValue(userWithReminders)
      mockTwilioService.respondToMessage.mockResolvedValue('<Response></Response>')

      const req = createMockRequest('😀', '+1234567890')
      const result = await service.receiveMessage(req)

      expect(mockDbService.message.delete).not.toHaveBeenCalled()
      expect(mockTwilioService.respondToMessage).toHaveBeenCalledWith(
        `We'll give you another poke in a bit!`
      )
    })

    it('should return early if user not found', async () => {
      mockDbService.user.findUnique.mockResolvedValue(null)

      const req = createMockRequest('🦄', '+9999999999')
      const result = await service.receiveMessage(req)

      expect(result).toBeUndefined()
      expect(mockTwilioService.respondToMessage).not.toHaveBeenCalled()
    })

    it('should strip + from phone number when looking up user', async () => {
      mockDbService.user.findUnique.mockResolvedValue(null)

      const req = createMockRequest('🦄', '+1234567890')
      await service.receiveMessage(req)

      expect(mockDbService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '1234567890' },
        include: { reminders: true },
      })
    })

    it('should trim whitespace from user response', async () => {
      const userWithReminders = {
        ...mockUser,
        reminders: [mockReminder],
      }
      mockDbService.user.findUnique.mockResolvedValue(userWithReminders)
      mockDbService.message.delete.mockResolvedValue(mockMessage)
      mockTwilioService.respondToMessage.mockResolvedValue('<Response></Response>')

      const req = createMockRequest('  🦄  ', '+1234567890')
      await service.receiveMessage(req)

      expect(mockDbService.message.delete).toHaveBeenCalled()
    })
  })

  describe('resendMessage (cron job)', () => {
    it('should resend messages that are past their nextSend time', async () => {
      const messageWithReminder = {
        ...mockMessage,
        reminder: mockReminder,
      }
      mockDbService.message.findMany.mockResolvedValue([messageWithReminder])
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockTwilioService.sendMessage.mockResolvedValue('SMS_ID')
      mockDbService.message.update.mockResolvedValue(mockMessage)

      await service.resendMessage()

      expect(mockTwilioService.sendMessage).toHaveBeenCalled()
      expect(mockDbService.message.update).toHaveBeenCalledWith({
        where: { id: 'message-123' },
        data: expect.objectContaining({
          tries: 2,
          active: true,
        }),
      })
    })

    it('should mark message as inactive after 4 tries', async () => {
      const messageWithReminder = {
        ...mockMessage,
        tries: 4,
        reminder: mockReminder,
      }
      mockDbService.message.findMany.mockResolvedValue([messageWithReminder])
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockTwilioService.sendMessage.mockResolvedValue('SMS_ID')
      mockDbService.message.update.mockResolvedValue(mockMessage)

      await service.resendMessage()

      expect(mockDbService.message.update).toHaveBeenCalledWith({
        where: { id: 'message-123' },
        data: expect.objectContaining({
          tries: 5,
          active: false,
        }),
      })
    })

    it('should handle empty message list', async () => {
      mockDbService.message.findMany.mockResolvedValue([])

      await service.resendMessage()

      expect(mockTwilioService.sendMessage).not.toHaveBeenCalled()
    })

    it('should process messages sequentially (not in parallel)', async () => {
      const messages = [
        { ...mockMessage, id: 'msg-1', reminder: mockReminder },
        { ...mockMessage, id: 'msg-2', reminder: mockReminder },
      ]
      mockDbService.message.findMany.mockResolvedValue(messages)
      mockDbService.reminder.findUnique.mockResolvedValue(mockReminder)
      mockTwilioService.sendMessage.mockResolvedValue('SMS_ID')
      mockDbService.message.update.mockResolvedValue(mockMessage)

      const sendOrder: string[] = []
      mockTwilioService.sendMessage.mockImplementation(async () => {
        sendOrder.push('send')
        return 'SMS_ID'
      })
      mockDbService.message.update.mockImplementation(async ({ where }) => {
        sendOrder.push(`update-${where.id}`)
        return mockMessage
      })

      await service.resendMessage()

      // Verify sequential execution: send, update, send, update
      expect(sendOrder).toEqual(['send', 'update-msg-1', 'send', 'update-msg-2'])
    })
  })
})
