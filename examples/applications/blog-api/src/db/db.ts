import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { DrizzleAdapter } from "@rune/database";
import * as schema from "./schema.js";

export function createDb(dbPath = ":memory:") {
  const sqlite = new Database(dbPath);

  sqlite.run(
    `CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  );

  const db = drizzle(sqlite, { schema });
  return new DrizzleAdapter(db);
}
