import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export type UserDto = z.infer<typeof userSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
