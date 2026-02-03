// Users service - handles all user-related business logic
// This service interacts with the database to manage user records
import { Injectable } from '@nestjs/common'

// Prisma types for type-safe database operations
import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

// Injectable decorator makes this service available for dependency injection
@Injectable()
export class UsersService {
  // Inject the database service for data access
  constructor(private readonly db: DatabaseService) {}

  // Onboard a new user - creates if doesn't exist, returns existing if found
  // This is called when a user first logs in to the application
  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    // Check if user already exists in the database
    const user = await this.findOne({ id: data.id })

    // Return existing user to avoid duplicates
    if (user) {
      return user
    }

    // Create new user record if not found
    return this.db.user.create({ data })
  }

  // Create a new user directly - no existence check
  // Used for internal user creation scenarios
  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data })
  }

  // Retrieve all users from the database
  // Warning: This could be expensive with many users
  findAll(): Promise<User[]> {
    return this.db.user.findMany()
  }

  // Find a single user by unique identifier
  // Returns null if user is not found
  findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where })
  }

  // Update an existing user record
  // Takes where clause and update data as parameters
  update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    return this.db.user.update({ where, data })
  }

  // Delete a user from the database
  // Returns the deleted user object
  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.db.user.delete({ where })
  }
}
