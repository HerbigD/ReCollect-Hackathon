import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { SavedItem } from "@/types";

const globalForDatabase = globalThis as unknown as { recollectDatabase?: Database.Database };

interface SavedItemRow {
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
  removed_at: string | null;
}

function databasePath() {
  const fileName = process.env.DATABASE_PATH || "recollect.db";
  if (path.basename(fileName) !== fileName) {
    throw new Error("DATABASE_PATH must be a filename inside the data directory.");
  }

  return path.join(process.cwd(), "data", fileName);
}

function ensureSchema(database: Database.Database) {
  database.exec(readFileSync(path.join(process.cwd(), "src", "db", "schema.sql"), "utf8"));

  const columns = database.pragma("table_info(saved_items)") as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "removed_at")) {
    database.exec("ALTER TABLE saved_items ADD COLUMN removed_at TEXT");
  }
  database.exec("CREATE INDEX IF NOT EXISTS idx_saved_items_active_platform ON saved_items(removed_at, platform)");
}

export function getDatabase() {
  if (globalForDatabase.recollectDatabase) {
    ensureSchema(globalForDatabase.recollectDatabase);
    return globalForDatabase.recollectDatabase;
  }

  const filePath = databasePath();
  mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new Database(filePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  ensureSchema(database);

  globalForDatabase.recollectDatabase = database;
  return database;
}

function writeSavedItems(database: Database.Database, items: SavedItem[], reactivate: boolean) {
  const existingUrl = database.prepare("SELECT id FROM saved_items WHERE url = ?");
  const existingId = database.prepare("SELECT url FROM saved_items WHERE id = ?");
  const upsert = database.prepare(`
    INSERT INTO saved_items (
      id, platform, title, url, author, thumbnail, saved_at, raw_content, theme_tags, embedding, removed_at
    ) VALUES (
      @id, @platform, @title, @url, @author, @thumbnail, @savedAt, @rawContent, @themeTags, @embedding, NULL
    ) ON CONFLICT(url) DO UPDATE SET
      platform = excluded.platform,
      title = excluded.title,
      author = excluded.author,
      thumbnail = excluded.thumbnail,
      saved_at = excluded.saved_at,
      raw_content = CASE
        WHEN length(excluded.raw_content) > 0 THEN excluded.raw_content
        ELSE saved_items.raw_content
      END,
      theme_tags = CASE
        WHEN excluded.theme_tags <> '[]' THEN excluded.theme_tags
        ELSE saved_items.theme_tags
      END,
      embedding = CASE
        WHEN saved_items.title IS NOT excluded.title
          OR saved_items.author IS NOT excluded.author
          OR (length(excluded.raw_content) > 0 AND saved_items.raw_content IS NOT excluded.raw_content)
          THEN excluded.embedding
        ELSE COALESCE(excluded.embedding, saved_items.embedding)
      END,
      removed_at = CASE WHEN @reactivate = 1 THEN NULL ELSE saved_items.removed_at END,
      updated_at = CURRENT_TIMESTAMP
  `);

  let inserted = 0;
  let updated = 0;
  for (const item of items) {
    const urlMatch = existingUrl.get(item.url) as { id: string } | undefined;
    let storageId = urlMatch?.id ?? item.id;

    if (urlMatch) {
      updated += 1;
    } else {
      inserted += 1;
      let collisionIndex = 0;
      let idMatch = existingId.get(storageId) as { url: string } | undefined;

      // URL is the sync identity. Source IDs can collide across platforms or
      // after a provider changes a canonical URL, so never overwrite the row
      // that already owns an ID. Use a deterministic URL-based storage ID for
      // the new row instead; subsequent syncs find it by URL and preserve it.
      while (idMatch && idMatch.url !== item.url) {
        collisionIndex += 1;
        storageId = `${item.platform}:${item.url}${collisionIndex > 1 ? `:${collisionIndex}` : ""}`;
        idMatch = existingId.get(storageId) as { url: string } | undefined;
      }
    }

    upsert.run({
      ...item,
      id: storageId,
      author: item.author ?? null,
      thumbnail: item.thumbnail ?? null,
      savedAt: item.savedAt ?? null,
      themeTags: JSON.stringify(item.themeTags),
      embedding: item.embedding ? JSON.stringify(item.embedding) : null,
      reactivate: reactivate ? 1 : 0,
    });
  }

  return { inserted, updated };
}

export function upsertSavedItems(items: SavedItem[]) {
  const database = getDatabase();
  const saveAll = database.transaction((savedItems: SavedItem[]) => writeSavedItems(database, savedItems, false));

  return saveAll(items);
}

export function syncSavedItemsForPlatform(platform: SavedItem["platform"], items: SavedItem[]) {
  if (items.some((item) => item.platform !== platform)) {
    throw new Error(`Cannot reconcile ${platform} with items from another platform.`);
  }
  if (!items.length) return { inserted: 0, updated: 0, removed: 0 };

  const database = getDatabase();
  return database.transaction(() => {
    const upserted = writeSavedItems(database, items, true);
    const placeholders = items.map(() => "?").join(", ");

    // Reconciliation assumes `--limit 200` covers the platform's complete saved set.
    // This function must never be called for an empty or failed pull, or it could
    // incorrectly soft-delete every saved item for that platform.
    const removal = database.prepare(`
      UPDATE saved_items
      SET removed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE platform = ?
        AND removed_at IS NULL
        AND url NOT IN (${placeholders})
    `).run(platform, ...items.map((item) => item.url));

    return { ...upserted, removed: removal.changes };
  })();
}

export function updateSavedItemEmbeddings(items: SavedItem[]) {
  const database = getDatabase();
  const update = database.prepare(`
    UPDATE saved_items
    SET embedding = ?, updated_at = CURRENT_TIMESTAMP
    WHERE url = ?
  `);
  const updateAll = database.transaction((savedItems: SavedItem[]) => {
    let updated = 0;
    for (const item of savedItems) {
      if (!item.embedding?.length) continue;
      updated += update.run(JSON.stringify(item.embedding), item.url).changes;
    }
    return updated;
  });

  return updateAll(items);
}

export function getAllSavedItems(options: { includeRemoved?: boolean } = {}): SavedItem[] {
  const activeFilter = options.includeRemoved ? "" : "WHERE removed_at IS NULL";
  const rows = getDatabase().prepare(`
    SELECT id, platform, title, url, author, thumbnail, saved_at, raw_content, theme_tags, embedding, removed_at
    FROM saved_items
    ${activeFilter}
    ORDER BY created_at DESC
  `).all() as SavedItemRow[];

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
    removedAt: row.removed_at ?? undefined,
  }));
}
