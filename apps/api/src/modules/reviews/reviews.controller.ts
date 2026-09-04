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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtUser } from "../../common/types";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("products/:productId/reviews")
  @ApiOperation({ summary: "List approved reviews for a product" })
  @ApiParam({ name: "productId", type: String, description: "Product ID" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number (default 1)" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page (default 20, max 50)" })
  @ApiResponse({ status: 200, description: "Paginated list of approved reviews." })
  findByProduct(
    @Param("productId") productId: string,
    @Query() query: ReviewListQueryDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  @Post("products/:productId/reviews")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a review for a product" })
  @ApiParam({ name: "productId", type: String, description: "Product ID" })
  @ApiResponse({ status: 201, description: "Review created." })
  @ApiResponse({ status: 400, description: "Already reviewed this product or invalid input." })
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
  @ApiResponse({ status: 200, description: "Review updated." })
  @ApiResponse({ status: 403, description: "Can only edit your own review." })
  @ApiResponse({ status: 404, description: "Review not found." })
  update(
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
  @ApiResponse({ status: 200, description: "Review deleted." })
  @ApiResponse({ status: 403, description: "Can only delete your own review." })
  @ApiResponse({ status: 404, description: "Review not found." })
  remove(@Param("id") reviewId: string, @CurrentUser() user: JwtUser) {
    return this.reviewsService.delete(
      reviewId,
      user.userId,
      user.role === "ADMIN",
    );
  }

  @Post(":id/vote")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Vote on a review (helpful / not helpful). Toggles if same vote." })
  @ApiParam({ name: "id", type: String, description: "Review ID" })
  @ApiResponse({ status: 200, description: "Vote recorded, updated review returned." })
  @ApiResponse({ status: 404, description: "Review not found." })
  vote(
    @Param("id") reviewId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateReviewVoteDto,
  ) {
    return this.reviewsService.vote(reviewId, user.userId, dto);
  }
}
