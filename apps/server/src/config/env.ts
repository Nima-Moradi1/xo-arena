import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Supports running from apps/server as well as from the repo root.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  SESSION_COOKIE_NAME: z.string().min(1).default("xo_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  UPLOAD_DIR: z.string().default("uploads"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("XO Arena <no-reply@xo-arena.local>")
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
export const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
