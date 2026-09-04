import { api } from "./client";
import {
  SearchQuery,
  ProductDto,
  ReviewDto,
  PaginatedResponse,
} from "@product-reviews/shared";

export interface SearchAllResult {
  products: PaginatedResponse<ProductDto>;
  reviews: PaginatedResponse<ReviewDto>;
}

export const searchApi = {
  searchProducts: (params: Omit<SearchQuery, "target">) =>
    api
      .get<PaginatedResponse<ProductDto>>("/search", {
        params: { ...params, target: "products" },
      })
      .then((res) => res.data),
  searchAll: (params: Omit<SearchQuery, "target">) =>
    api
      .get<SearchAllResult>("/search", {
        params: { ...params, target: "all" },
      })
      .then((res) => res.data),
};
