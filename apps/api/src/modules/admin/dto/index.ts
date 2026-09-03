import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import {
  updateReviewStatusSchema,
  reviewListQuerySchema,
} from "@product-reviews/shared";

export class UpdateReviewStatusDto extends createZodDto(
  updateReviewStatusSchema,
) {}

export class AdminReviewListQueryDto extends createZodDto(
  reviewListQuerySchema,
) {}

const updateRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export class UpdateRoleDto extends createZodDto(updateRoleSchema) {}
