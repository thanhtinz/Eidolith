import pg from "pg";
import { config } from "./config.js";
export const pool = new pg.Pool({ connectionString: config.databaseUrl });
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params?: unknown[]) {
  return pool.query<T>(sql, params as never[]);
}
