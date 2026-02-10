import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { normalizeEnv } from "./utils";

const dbPath = normalizeEnv(process.env.DATABASE_URL)?.replace('file:', '') || 'dev.db';
const sqlite = new Database(dbPath);

const globalForDrizzle = global as unknown as { db: BetterSQLite3Database<typeof schema> };

export const db = globalForDrizzle.db || drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") globalForDrizzle.db = db;
