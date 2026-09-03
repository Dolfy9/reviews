import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  findMany(args: Prisma.UserFindManyArgs) {
    return this.prisma.user.findMany(args);
  }

  count(args?: Prisma.UserCountArgs) {
    return this.prisma.user.count(args);
  }
}
