import { z } from "zod";

export const searchModeSchema = z.enum(["fulltext", "semantic", "hybrid"]);
export const searchTargetSchema = z.enum(["products", "reviews", "all"]);

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  mode: searchModeSchema.default("fulltext"),
  target: searchTargetSchema.default("products"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type SearchMode = z.infer<typeof searchModeSchema>;
export type SearchTarget = z.infer<typeof searchTargetSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
