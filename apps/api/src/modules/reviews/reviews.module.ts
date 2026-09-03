import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { ProductsModule } from "../products/products.module";
import { SearchModule } from "../search/search.module";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";
import { ReviewsRepository } from "./reviews.repository";

@Module({
  imports: [PrismaModule, ProductsModule, SearchModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsService],
})
export class ReviewsModule {}
