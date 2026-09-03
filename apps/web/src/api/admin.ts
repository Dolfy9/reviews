import { api } from "./client";
import { PaginatedResponse, ReviewDto } from "@product-reviews/shared";

export const adminApi = {
  getReviews: (params: { status?: string; page: number; limit: number }) =>
    api
      .get<PaginatedResponse<ReviewDto>>("/admin/reviews", { params })
      .then((res) => res.data),
  updateReviewStatus: (id: string, status: "APPROVED" | "REJECTED") =>
    api
      .patch<ReviewDto>(`/admin/reviews/${id}/status`, { status })
      .then((res) => res.data),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
};
