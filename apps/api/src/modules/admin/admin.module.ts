import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { UsersModule } from "../users/users.module";
import { ReviewsModule } from "../reviews/reviews.module";
import { AuthModule } from "../auth/auth.module";
import { SearchModule } from "../search/search.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { DataFeedService } from "./data-feed.service";

@Module({
  imports: [PrismaModule, UsersModule, ReviewsModule, AuthModule, SearchModule],
  controllers: [AdminController],
  providers: [AdminService, DataFeedService],
})
export class AdminModule {}
