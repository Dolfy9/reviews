import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
