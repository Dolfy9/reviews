import { api } from "./client";
import {
  CreateReviewInput,
  CreateReviewVoteInput,
  ReviewDto,
  ReviewListQuery,
  PaginatedResponse,
} from "@product-reviews/shared";

export const reviewsApi = {
  list: (productId: string, params: ReviewListQuery) =>
    api
      .get<PaginatedResponse<ReviewDto>>(
        `/reviews/products/${productId}/reviews`,
        { params },
      )
      .then((res) => res.data),
  create: (productId: string, data: CreateReviewInput) =>
    api
      .post<ReviewDto>(`/reviews/products/${productId}/reviews`, data)
      .then((res) => res.data),
  vote: (reviewId: string, data: CreateReviewVoteInput) =>
    api
      .post<ReviewDto>(`/reviews/${reviewId}/vote`, data)
      .then((res) => res.data),
};
