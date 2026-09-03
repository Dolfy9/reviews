import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { SearchModule } from "../search/search.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductsRepository } from "./products.repository";

@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
