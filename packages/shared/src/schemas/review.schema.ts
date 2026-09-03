import { z } from "zod";

export const reviewVoteTypeSchema = z.enum(["HELPFUL", "NOT_HELPFUL"]);

export const reviewVoteSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  userId: z.string(),
  type: reviewVoteTypeSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const reviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  authorName: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string(),
  content: z.string(),
  images: z.array(z.string()),
  helpfulCount: z.number().int(),
  notHelpfulCount: z.number().int(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  images: z.array(z.string().url()).max(5).default([]),
});

export const updateReviewSchema = createReviewSchema.partial();

export const createReviewVoteSchema = z.object({
  type: reviewVoteTypeSchema,
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ReviewDto = z.infer<typeof reviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewVoteDto = z.infer<typeof reviewVoteSchema>;
export type CreateReviewVoteInput = z.infer<typeof createReviewVoteSchema>;
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
export type VoteType = z.infer<typeof reviewVoteTypeSchema>;
