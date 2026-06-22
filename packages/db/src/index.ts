import path from "node:path";
import dotenv from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// Keep @xo/db self-contained: it can be imported from the server, seed scripts,
// or one-off scripts and still find the monorepo root .env.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

function mysqlAdapterConfigFromEnv() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Copy .env.example to .env and set your MySQL connection string.");
  }

  const url = new URL(databaseUrl);
  if (url.protocol !== "mysql:" && url.protocol !== "mariadb:") {
    throw new Error('DATABASE_URL must start with "mysql://" or "mariadb://".');
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) {
    throw new Error("DATABASE_URL must include a database name, e.g. mysql://root:password@localhost:3306/xo_arena");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || "root"),
    password: decodeURIComponent(url.password || ""),
    database,
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT ?? 10),
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 5000),
    acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT_MS ?? 10000)
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaMariaDb(mysqlAdapterConfigFromEnv());

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
