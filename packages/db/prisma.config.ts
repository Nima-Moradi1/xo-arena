import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// The Prisma CLI runs from packages/db when using pnpm --filter.
// Load the monorepo root .env first, then allow a local packages/db/.env override.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
