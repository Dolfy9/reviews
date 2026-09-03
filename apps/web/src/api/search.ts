import { api } from "./client";
import { SearchQuery } from "@product-reviews/shared";

export const searchApi = {
  search: (params: SearchQuery) =>
    api.get("/search", { params }).then((res) => res.data),
};
