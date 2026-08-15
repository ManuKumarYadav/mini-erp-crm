import dotenv from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

dotenv.config();

export interface ResolvedDbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  connectionLimit: number;
  connectTimeout: number;
  acquireTimeout: number;
  idleTimeout: number;
  allowPublicKeyRetrieval: boolean;
  ssl?: { rejectUnauthorized: boolean } | boolean;
  source: string;
  isRailwayInternal: boolean;
}

export function getResolvedDbConfig(): ResolvedDbConfig {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const isRailwayInternal = Boolean(databaseUrl?.includes(".railway.internal"));

  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      return {
        host: parsed.hostname || "localhost",
        port: Number(parsed.port || 3306),
        user: decodeURIComponent(parsed.username || "root"),
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "mini_erp_crm",
        connectionLimit: 5,
        connectTimeout: 8000,
        acquireTimeout: 8000,
        idleTimeout: 300,
        allowPublicKeyRetrieval: true,
        ssl: parsed.searchParams.get("ssl") === "true" || parsed.searchParams.get("sslmode") === "require"
          ? { rejectUnauthorized: false }
          : undefined,
        source: `DATABASE_URL (${parsed.hostname}:${parsed.port || 3306})`,
        isRailwayInternal,
      };
    } catch {
      // ignore parse error and fallback
    }
  }

  return {
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "mini_erp_crm",
    connectionLimit: 5,
    connectTimeout: 8000,
    acquireTimeout: 8000,
    idleTimeout: 300,
    allowPublicKeyRetrieval: true,
    source: `ENV (${process.env.DATABASE_HOST || "localhost"}:${process.env.DATABASE_PORT || 3306})`,
    isRailwayInternal: false,
  };
}

const config = getResolvedDbConfig();

const adapter = new PrismaMariaDb({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  connectionLimit: config.connectionLimit,
  connectTimeout: config.connectTimeout,
  acquireTimeout: config.acquireTimeout,
  idleTimeout: config.idleTimeout,
  allowPublicKeyRetrieval: config.allowPublicKeyRetrieval,
  ...(config.ssl ? { ssl: config.ssl } : {}),
});

const prisma = new PrismaClient({
  adapter,
});

export { adapter, prisma };
export default prisma;