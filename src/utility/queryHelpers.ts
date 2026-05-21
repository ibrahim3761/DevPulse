import { pool } from "../db";
import type { QueryResult } from "pg";

const dbQuery = async (query: string, values?: unknown[]): Promise<QueryResult> => {
  return await pool.query(query, values);
};

export default dbQuery;