import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { EmbeddingService } from "./embedding.service";

@Module({
  imports: [PrismaModule],
  providers: [SearchService, EmbeddingService],
  controllers: [SearchController],
  exports: [SearchService, EmbeddingService],
})
export class SearchModule {}
