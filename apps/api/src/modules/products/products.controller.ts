import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { ProductsService } from "./products.service";
import { CreateProductDto, UpdateProductDto, ProductListQueryDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "List products with optional search, filter, and pagination" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number (default 1)" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page (default 20, max 100)" })
  @ApiQuery({ name: "sort", required: false, enum: ["newest", "rating", "reviews", "price_asc", "price_desc"], description: "Sort order (default newest)" })
  @ApiQuery({ name: "category", required: false, type: String, description: "Filter by single category" })
  @ApiQuery({ name: "categories", required: false, type: [String], description: "Filter by multiple categories (repeatable)" })
  @ApiQuery({ name: "subcategory", required: false, type: String, description: "Filter by subcategory" })
  @ApiQuery({ name: "minRating", required: false, type: Number, description: "Minimum average rating (0-5)" })
  @ApiQuery({ name: "search", required: false, type: String, description: "Search term for name and description" })
  @ApiResponse({ status: 200, description: "Paginated list of products." })
  findAll(@Query() query: ProductListQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get("categories")
  @ApiOperation({ summary: "Get all distinct product categories" })
  @ApiResponse({ status: 200, description: "List of categories." })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get("subcategories")
  @ApiOperation({ summary: "Get distinct subcategories for a given parent category" })
  @ApiQuery({ name: "category", required: true, type: String, description: "Parent category" })
  @ApiResponse({ status: 200, description: "List of subcategories." })
  getSubcategories(@Query("category") category: string) {
    return this.productsService.getSubcategories(category);
  }

  @Get(":id/similar")
  @ApiOperation({ summary: "Get similar products by category" })
  @ApiParam({ name: "id", type: String, description: "Product ID" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Max results (default 6)" })
  @ApiResponse({ status: 200, description: "List of similar products." })
  findSimilar(@Param("id") id: string, @Query("limit") limit?: string) {
    return this.productsService.findSimilar(id, limit ? parseInt(limit, 10) : 6);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single product by ID" })
  @ApiParam({ name: "id", type: String, description: "Product ID" })
  @ApiResponse({ status: 200, description: "Product details." })
  @ApiResponse({ status: 404, description: "Product not found." })
  findById(@Param("id") id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a new product (admin only)" })
  @ApiResponse({ status: 201, description: "Product created." })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  @ApiResponse({ status: 403, description: "Not authorized (admin role required)." })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update a product (admin only)" })
  @ApiParam({ name: "id", type: String, description: "Product ID" })
  @ApiResponse({ status: 200, description: "Product updated." })
  @ApiResponse({ status: 404, description: "Product not found." })
  @ApiResponse({ status: 403, description: "Not authorized (admin role required)." })
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Delete a product (admin only)" })
  @ApiParam({ name: "id", type: String, description: "Product ID" })
  @ApiResponse({ status: 200, description: "Product deleted." })
  @ApiResponse({ status: 404, description: "Product not found." })
  @ApiResponse({ status: 403, description: "Not authorized (admin role required)." })
  remove(@Param("id") id: string) {
    return this.productsService.delete(id);
  }
}
