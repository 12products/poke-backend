// Users Service
// Business logic for user management
// Handles CRUD operations for user records
import { Injectable } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

// Injectable service for dependency injection
@Injectable()
export class UsersService {
  // Database service injected via constructor
  constructor(private readonly db: DatabaseService) {}

  // Onboard a new user (idempotent operation)
  // If user already exists, just return them
  // If not, create a new user record
  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    // First check if user already exists
    const user = await this.findOne({ id: data.id })

    // If user exists, return the existing record
    // This makes the onboard call safe to repeat
    if (user) {
      return user
    }

    // User doesn't exist, create a new one
    return this.db.user.create({ data })
  }

  // Create a new user (will throw if user already exists)
  // Use onboard() for idempotent user creation
  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data })
  }

  // Get all users in the system
  // This is probably only used for admin purposes
  findAll(): Promise<User[]> {
    return this.db.user.findMany()
  }

  // Find a single user by unique field (usually ID)
  // Returns null if user not found
  findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where })
  }

  // Update an existing user's data
  // Used for profile updates and subscription changes
  update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    return this.db.user.update({ where, data })
  }

  // Delete a user from the system
  // Be careful - this will orphan their reminders!
  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.db.user.delete({ where })
  }
}
