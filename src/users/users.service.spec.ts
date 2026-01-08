import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { DatabaseService } from '../database/database.service'

describe('UsersService', () => {
  let service: UsersService
  let dbService: DatabaseService

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    phone: '1234567890',
    onboarded: true,
    activeSubscription: null,
  }

  const mockDbService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    dbService = module.get<DatabaseService>(DatabaseService)

    // Reset mocks before each test
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onboard', () => {
    it('should return existing user if found', async () => {
      mockDbService.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.onboard({
        id: 'user-123',
        phone: '1234567890',
      })

      expect(result).toEqual(mockUser)
      expect(mockDbService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
      expect(mockDbService.user.create).not.toHaveBeenCalled()
    })

    it('should create new user if not found', async () => {
      mockDbService.user.findUnique.mockResolvedValue(null)
      mockDbService.user.create.mockResolvedValue(mockUser)

      const userData = { id: 'user-123', phone: '1234567890' }
      const result = await service.onboard(userData)

      expect(result).toEqual(mockUser)
      expect(mockDbService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
      expect(mockDbService.user.create).toHaveBeenCalledWith({ data: userData })
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      mockDbService.user.create.mockResolvedValue(mockUser)

      const userData = { id: 'user-123', phone: '1234567890' }
      const result = await service.create(userData)

      expect(result).toEqual(mockUser)
      expect(mockDbService.user.create).toHaveBeenCalledWith({ data: userData })
    })
  })

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456' }]
      mockDbService.user.findMany.mockResolvedValue(users)

      const result = await service.findAll()

      expect(result).toEqual(users)
      expect(mockDbService.user.findMany).toHaveBeenCalled()
    })

    it('should return empty array when no users exist', async () => {
      mockDbService.user.findMany.mockResolvedValue([])

      const result = await service.findAll()

      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockDbService.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findOne({ id: 'user-123' })

      expect(result).toEqual(mockUser)
      expect(mockDbService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
    })

    it('should return null if user not found', async () => {
      mockDbService.user.findUnique.mockResolvedValue(null)

      const result = await service.findOne({ id: 'nonexistent' })

      expect(result).toBeNull()
    })

    it('should find user by phone', async () => {
      mockDbService.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findOne({ phone: '1234567890' })

      expect(result).toEqual(mockUser)
      expect(mockDbService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '1234567890' },
      })
    })
  })

  describe('update', () => {
    it('should update a user', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' }
      mockDbService.user.update.mockResolvedValue(updatedUser)

      const result = await service.update({
        where: { id: 'user-123' },
        data: { name: 'Updated Name' },
      })

      expect(result).toEqual(updatedUser)
      expect(mockDbService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'Updated Name' },
      })
    })

    it('should update user subscription', async () => {
      const updatedUser = { ...mockUser, activeSubscription: 'premium' }
      mockDbService.user.update.mockResolvedValue(updatedUser)

      const result = await service.update({
        where: { id: 'user-123' },
        data: { activeSubscription: 'premium' },
      })

      expect(result).toEqual(updatedUser)
      expect(mockDbService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { activeSubscription: 'premium' },
      })
    })
  })

  describe('remove', () => {
    it('should remove a user', async () => {
      mockDbService.user.delete.mockResolvedValue(mockUser)

      const result = await service.remove({ id: 'user-123' })

      expect(result).toEqual(mockUser)
      expect(mockDbService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
    })
  })
})
