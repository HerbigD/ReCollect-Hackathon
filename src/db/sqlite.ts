import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const globalForDatabase = globalThis as unknown as { recollectDatabase?: Database.Database };

function databasePath() {
  const fileName = process.env.DATABASE_PATH || "recollect.db";
  if (path.basename(fileName) !== fileName) {
    throw new Error("DATABASE_PATH must be a filename inside the data directory.");
  }

  return path.join(process.cwd(), "data", fileName);
}

export function getDatabase() {
  if (globalForDatabase.recollectDatabase) return globalForDatabase.recollectDatabase;

  const filePath = databasePath();
  mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new Database(filePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(readFileSync(path.join(process.cwd(), "src", "db", "schema.sql"), "utf8"));

  globalForDatabase.recollectDatabase = database;
  return database;
}
