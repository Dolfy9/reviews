import { z } from "zod";

const booleanFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://redis:6379"),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  MINIO_USE_SSL: booleanFromEnv,
  MINIO_PUBLIC_URL: z.string().url().default("http://localhost:9000"),
  JWT_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRATION: z.string().default("15m"),
  JWT_REFRESH_EXPIRATION: z.string().default("7d"),
  SEMANTIC_SEARCH_ENABLED: booleanFromEnv.default("true"),
  EMBEDDING_MODEL: z.string().default("fast-bge-small-en-v1.5"),
  EMBEDDING_DIMENSION: z.coerce.number().int().positive().default(384),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
