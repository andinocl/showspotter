import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import { env } from "@/lib/env";
import * as schema from "./schema";

let pool: Pool | undefined;

export function getPool(): Pool {
  pool ??= createPool({ uri: env().DATABASE_URL, connectionLimit: 10 });
  return pool;
}

export function db() {
  return drizzle(getPool(), { schema, mode: "default" });
}
