import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [PrismaModule],
  providers: [UsersRepository, UsersService],
  controllers: [UsersController],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
