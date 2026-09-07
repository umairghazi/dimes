import { Pool } from "pg";
import { env } from "../config/env";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

if (env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
