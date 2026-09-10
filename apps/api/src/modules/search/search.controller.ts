import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { searchQuerySchema } from "@product-reviews/shared";
import { SearchService } from "./search.service";

class SearchQueryDto extends createZodDto(searchQuerySchema) {}

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary:
      "Search products and/or reviews using fulltext, semantic, or hybrid mode",
  })
  @ApiQuery({
    name: "q",
    required: true,
    type: String,
    description: "Search query (1-200 chars)",
  })
  @ApiQuery({
    name: "mode",
    required: false,
    enum: ["fulltext", "semantic", "hybrid"],
    description: "Search mode (default fulltext)",
  })
  @ApiQuery({
    name: "target",
    required: false,
    enum: ["products", "reviews", "all"],
    description: "Search target (default products)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default 20, max 50)",
  })
  @ApiResponse({
    status: 200,
    description:
      "Search results (products, reviews, or both depending on target).",
  })
  @ApiResponse({
    status: 400,
    description: "Semantic search requested but disabled, or invalid input.",
  })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
