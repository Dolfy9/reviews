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
};
