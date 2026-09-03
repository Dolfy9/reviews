import { createZodDto } from "nestjs-zod";
import { loginSchema } from "@product-reviews/shared";

export class LoginDto extends createZodDto(loginSchema) {}
