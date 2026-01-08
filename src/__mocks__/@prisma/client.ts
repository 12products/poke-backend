// Mock types for Prisma Client

export type User = {
  id: string
  name: string | null
  phone: string
  onboarded: boolean
  activeSubscription: string | null
}

export type Reminder = {
  id: string
  text: string
  notificationTime: Date
  notificationDays: number[]
  emoji: string
  color: string
  timeZone: string
  userId: string
}

export type Message = {
  id: string
  reminderId: string
  nextSend: Date
  tries: number
  active: boolean
  createdAt: Date
}

export namespace Prisma {
  export type UserCreateInput = {
    id: string
    name?: string | null
    phone: string
    onboarded?: boolean
    activeSubscription?: string | null
  }

  export type UserUpdateInput = {
    name?: string | null
    phone?: string
    onboarded?: boolean
    activeSubscription?: string | null
  }

  export type UserWhereUniqueInput = {
    id?: string
    phone?: string
  }

  export type ReminderCreateInput = {
    text: string
    notificationTime: Date | string
    notificationDays: number[]
    emoji?: string
    color: string
    timeZone: string
    user?: {
      connect: { id: string }
    }
  }

  export type ReminderUpdateInput = {
    text?: string
    notificationTime?: Date | string
    notificationDays?: number[]
    emoji?: string
    color?: string
    timeZone?: string
  }

  export type ReminderWhereUniqueInput = {
    id?: string
  }

  export type MessageCreateInput = {
    reminder: {
      connect: { id: string }
    }
    nextSend: Date
    active: boolean
  }

  export type MessageUpdateInput = {
    nextSend?: Date
    tries?: number
    active?: boolean
  }

  export type MessageWhereUniqueInput = {
    id?: string
    reminderId?: string
  }
}

export class PrismaClient {
  user = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  reminder = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  message = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  }

  $connect = jest.fn()
  $disconnect = jest.fn()
}
