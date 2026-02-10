import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL?.replace('file:', '').replace(/^['"](.*)['"]$/, '$1') || 'dev.db';
const sqlite = new Database(dbPath);

const globalForDrizzle = global as unknown as { db: BetterSQLite3Database<typeof schema> };

export const db = globalForDrizzle.db || drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") globalForDrizzle.db = db;
