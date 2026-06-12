import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { DDL } from "./ddl";

function createDb() {
  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "cdm.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(DDL);
  return drizzle(sqlite, { schema });
}

// Singleton survivant au hot-reload de Next en dev
const globalForDb = globalThis as unknown as { __cdmDb?: ReturnType<typeof createDb> };

export const db = globalForDb.__cdmDb ?? (globalForDb.__cdmDb = createDb());

export * from "./schema";
