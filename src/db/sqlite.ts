import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { SavedItem } from "@/types";

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

export function upsertSavedItems(items: SavedItem[]) {
  const database = getDatabase();
  const existingUrl = database.prepare("SELECT 1 FROM saved_items WHERE url = ?");
  const upsert = database.prepare(`
    INSERT INTO saved_items (
      id, platform, title, url, author, thumbnail, saved_at, raw_content, theme_tags, embedding
    ) VALUES (
      @id, @platform, @title, @url, @author, @thumbnail, @savedAt, @rawContent, @themeTags, @embedding
    ) ON CONFLICT(url) DO UPDATE SET
      id = excluded.id,
      platform = excluded.platform,
      title = excluded.title,
      author = excluded.author,
      thumbnail = excluded.thumbnail,
      saved_at = excluded.saved_at,
      raw_content = excluded.raw_content,
      theme_tags = excluded.theme_tags,
      embedding = excluded.embedding,
      updated_at = CURRENT_TIMESTAMP
  `);

  let inserted = 0;
  let updated = 0;
  const saveAll = database.transaction((savedItems: SavedItem[]) => {
    for (const item of savedItems) {
      if (existingUrl.get(item.url)) updated += 1;
      else inserted += 1;
      upsert.run({
        ...item,
        author: item.author ?? null,
        thumbnail: item.thumbnail ?? null,
        savedAt: item.savedAt ?? null,
        themeTags: JSON.stringify(item.themeTags),
        embedding: item.embedding ? JSON.stringify(item.embedding) : null,
      });
    }
  });

  saveAll(items);
  return { inserted, updated };
}

export function getAllSavedItems(): SavedItem[] {
  const rows = getDatabase().prepare(`
    SELECT id, platform, title, url, author, thumbnail, saved_at, raw_content, theme_tags, embedding
    FROM saved_items
    ORDER BY created_at DESC
  `).all() as Array<{
    id: string;
    platform: SavedItem["platform"];
    title: string;
    url: string;
    author: string | null;
    thumbnail: string | null;
    saved_at: string | null;
    raw_content: string;
    theme_tags: string;
    embedding: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    platform: row.platform,
    title: row.title,
    url: row.url,
    author: row.author ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    savedAt: row.saved_at ?? undefined,
    rawContent: row.raw_content,
    themeTags: JSON.parse(row.theme_tags) as string[],
    embedding: row.embedding ? JSON.parse(row.embedding) as number[] : undefined,
  }));
}
