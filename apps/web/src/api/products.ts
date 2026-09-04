import { api } from "./client";
import {
  ProductDto,
  ProductListQuery,
  PaginatedResponse,
} from "@product-reviews/shared";

export const productsApi = {
  list: (params: ProductListQuery) =>
    api
      .get<PaginatedResponse<ProductDto>>("/products", { params })
      .then((res) => res.data),
  get: (id: string) =>
    api.get<ProductDto>(`/products/${id}`).then((res) => res.data),
  categories: () =>
    api.get<string[]>("/products/categories").then((res) => res.data),
  subcategories: (category: string) =>
    api
      .get<string[]>("/products/subcategories", { params: { category } })
      .then((res) => res.data),
  similar: (id: string, limit = 6) =>
    api
      .get<ProductDto[]>(`/products/${id}/similar`, { params: { limit } })
      .then((res) => res.data),
};
