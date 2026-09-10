import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import {
  productSchema,
  reviewSchema,
  userSchema,
  paginationMetaSchema,
} from "@product-reviews/shared";

/* ---------- Single resource DTOs ---------- */

export class ProductResponseDto extends createZodDto(productSchema) {}
export class ReviewResponseDto extends createZodDto(reviewSchema) {}
export class UserResponseDto extends createZodDto(userSchema) {}

/* ---------- Paginated list DTOs ---------- */

const paginatedProductSchema = z.object({
  data: z.array(productSchema),
  meta: paginationMetaSchema,
});

const paginatedReviewSchema = z.object({
  data: z.array(reviewSchema),
  meta: paginationMetaSchema,
});

const paginatedUserSchema = z.object({
  data: z.array(userSchema),
  meta: paginationMetaSchema,
});

export class ProductListResponseDto extends createZodDto(
  paginatedProductSchema,
) {}
export class ReviewListResponseDto extends createZodDto(
  paginatedReviewSchema,
) {}
export class UserListResponseDto extends createZodDto(paginatedUserSchema) {}

/* ---------- Search DTOs ---------- */

export class SearchProductsResponseDto extends createZodDto(
  paginatedProductSchema,
) {}

export class SearchReviewsResponseDto extends createZodDto(
  paginatedReviewSchema,
) {}

const searchAllResponseSchema = z.object({
  products: paginatedProductSchema,
  reviews: paginatedReviewSchema,
});

export class SearchAllResponseDto extends createZodDto(
  searchAllResponseSchema,
) {}

/* ---------- Other response DTOs ---------- */

const mineReviewResponseSchema = z.object({
  review: reviewSchema.nullable(),
});

export class MineReviewResponseDto extends createZodDto(
  mineReviewResponseSchema,
) {}

const messageResponseSchema = z.object({
  message: z.string(),
});

export class MessageResponseDto extends createZodDto(messageResponseSchema) {}

const presignedUrlResponseSchema = z.object({
  uploadUrl: z.string(),
  publicUrl: z.string(),
  objectName: z.string(),
});

export class PresignedUrlResponseDto extends createZodDto(
  presignedUrlResponseSchema,
) {}

const statsResponseSchema = z.object({
  products: z.number().int(),
  reviews: z.number().int(),
  users: z.number().int(),
  pendingReviews: z.number().int(),
  byCategory: z.array(
    z.object({
      category: z.string(),
      _count: z.number().int(),
    }),
  ),
});

export class StatsResponseDto extends createZodDto(statsResponseSchema) {}

const seedResultSchema = z.object({
  source: z.string(),
  fetched: z.number().int(),
  inserted: z.number().int(),
  skipped: z.number().int(),
});

export class SeedResultDto extends createZodDto(seedResultSchema) {}

const healthCheckStatusSchema = z.object({
  status: z.enum(["ok", "error", "shutting_down"]),
  info: z.record(z.string(), z.object({ status: z.enum(["up", "down"]) })),
  error: z.record(z.string(), z.object({ status: z.enum(["up", "down"]) })),
  details: z.record(z.string(), z.object({ status: z.enum(["up", "down"]) })),
});

export class HealthCheckResponseDto extends createZodDto(
  healthCheckStatusSchema,
) {}
