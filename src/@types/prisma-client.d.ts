declare module '@prisma/client' {
  export type User = {
    id: string
    name: string | null
    phone: string
    onboarded: boolean
    activeSubscription: string | null
    reminders?: Reminder[]
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
    user?: User
    message?: Message
  }

  export type Message = {
    id: string
    reminderId: string
    nextSend: Date
    tries: number
    active: boolean
    createdAt: Date
    reminder?: Reminder
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
    user: {
      create: (args: any) => Promise<User>
      findMany: (args?: any) => Promise<User[]>
      findUnique: (args: any) => Promise<User | null>
      update: (args: any) => Promise<User>
      delete: (args: any) => Promise<User>
    }

    reminder: {
      create: (args: any) => Promise<Reminder>
      findMany: (args?: any) => Promise<Reminder[]>
      findUnique: (args: any) => Promise<Reminder | null>
      update: (args: any) => Promise<Reminder>
      delete: (args: any) => Promise<Reminder>
    }

    message: {
      create: (args: any) => Promise<Message>
      findMany: (args?: any) => Promise<Message[]>
      findUnique: (args: any) => Promise<Message | null>
      update: (args: any) => Promise<Message>
      delete: (args: any) => Promise<Message>
      deleteMany: (args: any) => Promise<{ count: number }>
    }

    $connect: () => Promise<void>
    $disconnect: () => Promise<void>
    $on: (event: string, callback: () => Promise<void>) => void
  }
}
