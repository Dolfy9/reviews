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
import { ReviewsService } from "./reviews.service";
import {
  CreateReviewDto,
  UpdateReviewDto,
  CreateReviewVoteDto,
  ReviewListQueryDto,
} from "./dto";
import {
  ReviewListResponseDto,
  ReviewResponseDto,
  MineReviewResponseDto,
  MessageResponseDto,
} from "../../common/dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtUser } from "../../common/types";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("products/:productId/reviews")
  @ApiOperation({ summary: "List approved reviews for a product" })
  @ApiParam({ name: "productId", type: String, description: "Product ID" })
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
    description: "Paginated list of reviews.",
    type: ReviewListResponseDto,
  })
  @UseGuards(OptionalJwtAuthGuard)
  @ApiCookieAuth()
  findByProduct(
    @Param("productId") productId: string,
    @Query() query: ReviewListQueryDto,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.reviewsService.findByProduct(productId, query, user?.userId);
  }

  @Get("products/:productId/mine")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Check if current user already reviewed a product" })
  @ApiParam({ name: "productId", type: String, description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "User's existing review or null.",
    type: MineReviewResponseDto,
  })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  async checkMine(
    @Param("productId") productId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const review = await this.reviewsService.findByProductAndUser(
      productId,
      user.userId,
    );
    return { review: review ?? null };
  }

  @Post("products/:productId/reviews")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a review for a product" })
  @ApiParam({ name: "productId", type: String, description: "Product ID" })
  @ApiResponse({
    status: 201,
    description: "Review created.",
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Already reviewed this product or invalid input.",
  })
  @ApiResponse({ status: 404, description: "Product not found." })
  create(
    @Param("productId") productId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(productId, user.userId, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update a review (owner or admin)" })
  @ApiParam({ name: "id", type: String, description: "Review ID" })
  @ApiResponse({
    status: 200,
    description: "Review updated.",
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: "Review not found." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  async update(
    @Param("id") reviewId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(
      reviewId,
      user.userId,
      user.role === "ADMIN",
      dto,
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Delete a review (owner or admin)" })
  @ApiParam({ name: "id", type: String, description: "Review ID" })
  @ApiResponse({
    status: 200,
    description: "Review deleted.",
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Review not found." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  async remove(@Param("id") reviewId: string, @CurrentUser() user: JwtUser) {
    await this.reviewsService.delete(
      reviewId,
      user.userId,
      user.role === "ADMIN",
    );
    return { message: "Review deleted" };
  }

  @Post(":id/vote")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Vote on a review (helpful / not helpful). Toggles if same vote.",
  })
  @ApiParam({ name: "id", type: String, description: "Review ID" })
  @ApiResponse({
    status: 201,
    description: "Vote recorded.",
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid vote type." })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  @ApiResponse({ status: 404, description: "Review not found." })
  @ApiResponse({ status: 403, description: "Cannot vote on own review." })
  async vote(
    @Param("id") reviewId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateReviewVoteDto,
  ) {
    return this.reviewsService.vote(reviewId, user.userId, dto);
  }
}
