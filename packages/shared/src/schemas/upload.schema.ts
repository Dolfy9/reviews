import { z } from "zod";

export const presignedUrlRequestSchema = z.object({
  filename: z.string().min(1).max(255),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;
