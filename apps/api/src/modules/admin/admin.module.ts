import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { UsersModule } from "../users/users.module";
import { ReviewsModule } from "../reviews/reviews.module";
import { AuthModule } from "../auth/auth.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [PrismaModule, UsersModule, ReviewsModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
