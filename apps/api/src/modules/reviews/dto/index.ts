import { createZodDto } from "nestjs-zod";
import {
  createReviewSchema,
  updateReviewSchema,
  createReviewVoteSchema,
  reviewListQuerySchema,
} from "@product-reviews/shared";

export class CreateReviewDto extends createZodDto(createReviewSchema) {}
export class UpdateReviewDto extends createZodDto(updateReviewSchema) {}
export class CreateReviewVoteDto extends createZodDto(createReviewVoteSchema) {}
export class ReviewListQueryDto extends createZodDto(reviewListQuerySchema) {}
