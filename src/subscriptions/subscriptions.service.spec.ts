import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { SubscriptionsService } from './subscriptions.service'
import { UsersService } from '../users/users.service'

// Mock node-apple-receipt-verify
jest.mock('node-apple-receipt-verify', () => ({
  config: jest.fn(),
  validate: jest.fn(),
}))

import * as appleReceiptVerify from 'node-apple-receipt-verify'

describe('SubscriptionsService', () => {
  let service: SubscriptionsService
  let usersService: UsersService
  let configService: ConfigService

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockUsersService = {
    update: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-apple-shared-secret'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<SubscriptionsService>(SubscriptionsService)
    usersService = module.get<UsersService>(UsersService)
    configService = module.get<ConfigService>(ConfigService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should validate receipt and update user subscription', async () => {
      const mockProducts = [
        { productId: 'premium_monthly' },
        { productId: 'premium_monthly' },
      ]
      ;(appleReceiptVerify.validate as jest.Mock).mockResolvedValue(mockProducts)
      mockUsersService.update.mockResolvedValue({})

      const result = await service.create(mockUser as any, 'mock-receipt')

      expect(appleReceiptVerify.config).toHaveBeenCalledWith({
        secret: 'mock-apple-shared-secret',
        environment: ['production', 'sandbox'],
      })
      expect(appleReceiptVerify.validate).toHaveBeenCalledWith({
        receipt: 'mock-receipt',
      })
      expect(mockUsersService.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { activeSubscription: 'premium_monthly' },
      })
      expect(result).toBe('ok')
    })

    it('should not update user if no products in receipt', async () => {
      ;(appleReceiptVerify.validate as jest.Mock).mockResolvedValue([])

      const result = await service.create(mockUser as any, 'mock-receipt')

      expect(mockUsersService.update).not.toHaveBeenCalled()
      expect(result).toBe('ok')
    })

    it('should handle multiple unique product IDs', async () => {
      const mockProducts = [
        { productId: 'premium_monthly' },
        { productId: 'premium_yearly' },
      ]
      ;(appleReceiptVerify.validate as jest.Mock).mockResolvedValue(mockProducts)
      mockUsersService.update.mockResolvedValue({})

      await service.create(mockUser as any, 'mock-receipt')

      // Should use the first unique product ID
      expect(mockUsersService.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { activeSubscription: 'premium_monthly' },
      })
    })

    it('should throw error if receipt validation fails', async () => {
      ;(appleReceiptVerify.validate as jest.Mock).mockRejectedValue(
        new Error('Invalid receipt')
      )

      await expect(service.create(mockUser as any, 'invalid-receipt')).rejects.toThrow(
        'Failed to verify Apple receipt: Error: Invalid receipt'
      )
    })
  })

  describe('delete', () => {
    it('should set activeSubscription to null', async () => {
      mockUsersService.update.mockResolvedValue({})

      const result = await service.delete(mockUser as any)

      expect(mockUsersService.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { activeSubscription: null },
      })
      expect(result).toBe('ok')
    })

    it('should throw error if cancellation fails', async () => {
      mockUsersService.update.mockRejectedValue(new Error('DB error'))

      await expect(service.delete(mockUser as any)).rejects.toThrow(
        'Failed to cancel the subscription: Error: DB error'
      )
    })
  })
})
