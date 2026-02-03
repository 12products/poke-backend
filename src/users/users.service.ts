// User service - where users get treated like royalty
// (or at least like database entries)
import { Injectable } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  // Welcome aboard! Get it? Onboard? I'll see myself out.
  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.findOne({ id: data.id })

    if (user) {
      return user
    }

    return this.db.user.create({ data })
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data })
  }

  // Find them all! Gotta catch 'em all! Wait, wrong franchise.
  findAll(): Promise<User[]> {
    return this.db.user.findMany() // Returns all the users, even the shy ones
  }

  findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where })
  }

  update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    return this.db.user.update({ where, data })
  }

  // Goodbye, farewell, auf wiedersehen, adieu
  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.db.user.delete({ where }) // Gone but not forgotten
  }
}
