import { Pool } from "pg";
import { env } from "../config/env";

// Create a singleton Pool to reuse connections
export const pool = new Pool({
  connectionString: env.DATABASE_URL, // e.g. postgres://user:pass@host:5432/db
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
});
