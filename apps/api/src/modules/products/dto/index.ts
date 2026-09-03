import { createZodDto } from "nestjs-zod";
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
} from "@product-reviews/shared";

export class CreateProductDto extends createZodDto(createProductSchema) {}
export class UpdateProductDto extends createZodDto(updateProductSchema) {}
export class ProductListQueryDto extends createZodDto(productListQuerySchema) {}
