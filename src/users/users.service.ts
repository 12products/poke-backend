import { Injectable } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from 'src/database/database.service'

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

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
    return this.db.user.delete({ where })
  }
}
