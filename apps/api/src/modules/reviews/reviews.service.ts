import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, Review } from "@prisma/client";
import { PrismaService } from "../../config/prisma.service";
import { ProductsRepository } from "../products/products.repository";
import { EmbeddingService } from "../search/embedding.service";
import { ReviewsRepository } from "./reviews.repository";
import {
  CreateReviewInput,
  UpdateReviewInput,
  CreateReviewVoteInput,
  ReviewListQuery,
  ReviewDto,
  UpdateReviewStatusInput,
  PaginatedResponse,
} from "@product-reviews/shared";
import { toReviewDto } from "../../common/mappers";
import { buildPaginatedResponse } from "../../common/pagination";

const APPROVED_STATUS = "APPROVED" as const;

type TransactionClient = {
  review: PrismaService["review"];
  product: PrismaService["product"];
};

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsRepository: ReviewsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async findByProduct(
    productId: string,
    query: ReviewListQuery,
    userId?: string,
  ): Promise<PaginatedResponse<ReviewDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findByProduct(productId, skip, limit, userId),
      this.reviewsRepository.countByProduct(productId),
    ]);
    return buildPaginatedResponse(
      reviews.map((review) => toReviewDto(review, userId)),
      page,
      limit,
      total,
    );
  }

  async create(
    productId: string,
    userId: string,
    dto: CreateReviewInput,
  ): Promise<ReviewDto> {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const existing = await this.reviewsRepository.findByProductAndUser(
      productId,
      userId,
    );
    if (existing) {
      throw new BadRequestException("You have already reviewed this product");
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          ...dto,
          productId,
          userId,
          status: APPROVED_STATUS,
        },
      });
      await this.recalculateProductRating(tx, productId);
      return review;
    });

    await this.setReviewEmbedding(created, dto.title, dto.content);
    return this.findById(created.id);
  }

  async update(
    reviewId: string,
    userId: string,
    isAdmin: boolean,
    dto: UpdateReviewInput,
  ): Promise<ReviewDto> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException("You can only edit your own review");
    }

    const data: Prisma.ReviewUpdateInput = {};
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.pros !== undefined) data.pros = dto.pros;
    if (dto.cons !== undefined) data.cons = dto.cons;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.review.update({ where: { id: reviewId }, data });
      if (review.status === APPROVED_STATUS) {
        await this.recalculateProductRating(tx, review.productId);
      }
      return result;
    });

    if (dto.title !== undefined || dto.content !== undefined) {
      await this.setReviewEmbedding(
        updated,
        dto.title ?? updated.title,
        dto.content ?? updated.content,
      );
    }

    return this.findById(updated.id);
  }

  async delete(
    reviewId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException("You can only delete your own review");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await this.recalculateProductRating(tx, review.productId);
    });
  }

  async vote(
    reviewId: string,
    userId: string,
    dto: CreateReviewVoteInput,
  ): Promise<ReviewDto> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    const existing = await this.reviewsRepository.findVote(reviewId, userId);
    let helpfulDelta = 0;
    let notHelpfulDelta = 0;

    if (existing && existing.type === dto.type) {
      // Toggle off: remove the user's vote and decrement the counter they voted on
      await this.reviewsRepository.deleteVote(existing.id);
      if (dto.type === "HELPFUL") {
        helpfulDelta = -1;
      } else {
        notHelpfulDelta = -1;
      }
    } else if (existing) {
      // Switch vote: delete old, create new, and adjust both counters
      await this.reviewsRepository.deleteVote(existing.id);
      await this.reviewsRepository.createVote({
        review: { connect: { id: reviewId } },
        user: { connect: { id: userId } },
        type: dto.type as "HELPFUL" | "NOT_HELPFUL",
      });
      if (existing.type === "HELPFUL") {
        helpfulDelta = -1;
        notHelpfulDelta = 1;
      } else {
        notHelpfulDelta = -1;
        helpfulDelta = 1;
      }
    } else {
      // New vote: create and increment the chosen counter
      await this.reviewsRepository.createVote({
        review: { connect: { id: reviewId } },
        user: { connect: { id: userId } },
        type: dto.type as "HELPFUL" | "NOT_HELPFUL",
      });
      if (dto.type === "HELPFUL") {
        helpfulDelta = 1;
      } else {
        notHelpfulDelta = 1;
      }
    }

    // Update counters in place, never dropping below 0 and preserving preseeded counts
    const newHelpfulCount = Math.max(0, review.helpfulCount + helpfulDelta);
    const newNotHelpfulCount = Math.max(
      0,
      review.notHelpfulCount + notHelpfulDelta,
    );
    await this.reviewsRepository.update(reviewId, {
      helpfulCount: newHelpfulCount,
      notHelpfulCount: newNotHelpfulCount,
    });

    return this.findById(reviewId, userId);
  }

  async updateStatus(
    reviewId: string,
    dto: UpdateReviewStatusInput,
  ): Promise<ReviewDto> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.review.update({
        where: { id: reviewId },
        data: { status: dto.status },
      });
      await this.recalculateProductRating(tx, review.productId);
      return result;
    });

    return this.findById(updated.id);
  }

  async findPending(
    status: string | undefined,
    query: ReviewListQuery,
  ): Promise<PaginatedResponse<ReviewDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = status
      ? { status: status as "PENDING" | "APPROVED" | "REJECTED" }
      : { status: { not: "APPROVED" as const } };

    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findPending(where, skip, limit),
      this.reviewsRepository.countPending(where),
    ]);

    return buildPaginatedResponse(
      reviews.map((review) => toReviewDto(review)),
      page,
      limit,
      total,
    );
  }

  async findById(reviewId: string, userId?: string): Promise<ReviewDto> {
    const review = await this.reviewsRepository.findByIdWithUser(
      reviewId,
      userId,
    );
    if (!review) {
      throw new NotFoundException("Review not found");
    }
    return toReviewDto(review, userId);
  }

  async findByProductAndUser(productId: string, userId: string) {
    return this.reviewsRepository.findByProductAndUser(productId, userId);
  }

  private async recalculateProductRating(
    tx: TransactionClient,
    productId: string,
  ): Promise<void> {
    const aggregation = await tx.review.aggregate({
      where: { productId, status: APPROVED_STATUS },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = aggregation._avg.rating ?? 0;
    const reviewCount = aggregation._count.id;

    await tx.product.update({
      where: { id: productId },
      data: { averageRating, reviewCount },
    });
  }

  private async setReviewEmbedding(
    review: Review,
    title: string,
    content: string,
  ): Promise<void> {
    const embedding = await this.embeddingService.embedPassage(
      `${title}. ${content}`,
    );
    if (embedding) {
      await this.reviewsRepository.setEmbedding(review.id, embedding);
    }
  }
}
