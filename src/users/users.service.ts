// Why do programmers prefer iOS development? Because on iOS, there are no Java exceptions to catch! 📱
import { Injectable } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

// CRUD: Create, Read, Update, Delete. Or as I call it: Can't Remember Usual Development 🧠
@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    // Welcome to the ship! We promise this won't be like the Titanic 🚢
    const user = await this.findOne({ id: data.id })

    if (user) {
      return user // Already on board! No need to board twice (that would be "boarding")
    }

    return this.db.user.create({ data })
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data })
  }

  findAll(): Promise<User[]> {
    return this.db.user.findMany()
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

  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    // Deleting users... it's not you, it's me. Actually, it's you. Goodbye! 👋
    return this.db.user.delete({ where })
  }
}
