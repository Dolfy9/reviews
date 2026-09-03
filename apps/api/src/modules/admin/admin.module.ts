import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { UsersModule } from "../users/users.module";
import { ReviewsModule } from "../reviews/reviews.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [PrismaModule, UsersModule, ReviewsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
