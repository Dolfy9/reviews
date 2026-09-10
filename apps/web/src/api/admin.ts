import { api } from "./client";
import { PaginatedResponse, ReviewDto } from "@product-reviews/shared";

export interface SourceResult {
  source: string;
  fetched: number;
  inserted: number;
  skipped: number;
}

export interface DbStats {
  products: number;
  reviews: number;
  users: number;
  pendingReviews: number;
  byCategory: Array<{ category: string; _count: number }>;
}

export interface MiningEvent {
  step:
    | "start"
    | "fetching"
    | "fetched"
    | "inserting"
    | "product_inserted"
    | "source_done"
    | "source_error"
    | "complete";
  source?: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export type SourceId =
  | "off"
  | "itunes_movies"
  | "itunes_podcasts"
  | "itunes_apps"
  | "openlibrary"
  | "all";

export const SOURCE_LABELS: Record<SourceId, string> = {
  off: "Open Food Facts",
  itunes_movies: "iTunes Movies",
  itunes_podcasts: "iTunes Podcasts",
  itunes_apps: "iTunes Apps",
  openlibrary: "Open Library",
  all: "All Sources",
};

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
  seedProducts: (source: SourceId = "all", count = 100) =>
    api
      .post<SourceResult[]>("/admin/seed", undefined, {
        params: { source, count },
      })
      .then((res) => res.data),
  getStats: () => api.get<DbStats>("/admin/stats").then((res) => res.data),
  seedStream: (source: SourceId = "all", count = 100): EventSource =>
    new EventSource(
      `${api.defaults.baseURL}/admin/seed-stream?source=${encodeURIComponent(source)}&count=${count}`,
      { withCredentials: true },
    ),
};
