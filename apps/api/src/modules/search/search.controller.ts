import { Controller, Get, Query } from "@nestjs/common";
import { createZodDto } from "nestjs-zod";
import { searchQuerySchema } from "@product-reviews/shared";
import { SearchService } from "./search.service";

class SearchQueryDto extends createZodDto(searchQuerySchema) {}

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
