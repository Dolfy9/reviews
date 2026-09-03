import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  images: z.array(z.string()),
  averageRating: z.number(),
  reviewCount: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  price: z.number().nonnegative().finite(),
  category: z.string().min(1).max(100),
  images: z.array(z.string().url()).max(10).default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  search: z.string().optional(),
  sort: z
    .enum(["newest", "rating", "reviews", "price_asc", "price_desc"])
    .optional()
    .default("newest"),
});

export type ProductDto = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
