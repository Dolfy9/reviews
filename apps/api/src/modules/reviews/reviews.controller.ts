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

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("products/:productId/reviews")
  findByProduct(
    @Param("productId") productId: string,
    @Query() query: ReviewListQueryDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  @Post("products/:productId/reviews")
  @UseGuards(JwtAuthGuard)
  create(
    @Param("productId") productId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(productId, user.userId, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
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
  remove(@Param("id") reviewId: string, @CurrentUser() user: JwtUser) {
    return this.reviewsService.delete(
      reviewId,
      user.userId,
      user.role === "ADMIN",
    );
  }

  @Post(":id/vote")
  @UseGuards(JwtAuthGuard)
  vote(
    @Param("id") reviewId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateReviewVoteDto,
  ) {
    return this.reviewsService.vote(reviewId, user.userId, dto);
  }
}
