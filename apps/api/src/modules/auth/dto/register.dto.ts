import { createZodDto } from "nestjs-zod";
import { registerSchema } from "@product-reviews/shared";

export class RegisterDto extends createZodDto(registerSchema) {}
