import { collectRedditSaved } from "@/collectors/openCliReddit";
import { collectTwitterBookmarks } from "@/collectors/openCliTwitter";
import {
  getAllSavedItems,
  syncSavedItemsForPlatform,
  updateSavedItemEmbeddings,
} from "@/db/sqlite";
import { completeContent } from "@/pipeline/completeContent";
import { embedMissingItems } from "@/pipeline/embed";
import { normalizeSavedItems } from "@/pipeline/normalize";
import type { Platform, SavedItem } from "@/types";

const SYNC_LIMIT = 200;
const SYNC_PLATFORMS = ["twitter", "reddit"] as const;
type SyncPlatform = (typeof SYNC_PLATFORMS)[number];

interface PlatformSyncReport {
  status: "synced" | "skipped-empty" | "failed";
  received: number;
  added: number;
  updated: number;
  removed: number;
  contentCompleted: number;
  error?: string;
}

export interface SyncSummary {
  added: number;
  updated: number;
  removed: number;
  total: number;
  embedded: number;
  platforms: Record<SyncPlatform, PlatformSyncReport>;
  errors: string[];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function emptyReport(status: PlatformSyncReport["status"], error?: string): PlatformSyncReport {
  return {
    status,
    received: 0,
    added: 0,
    updated: 0,
    removed: 0,
    contentCompleted: 0,
    ...(error ? { error } : {}),
  };
}

async function prepareItems(items: SavedItem[]) {
  const normalized = normalizeSavedItems(items);
  const completion = await completeContent(normalized);
  return {
    items: normalizeSavedItems(completion.items),
    completion,
  };
}

/** Pull both platforms independently so one failure can never erase the other's state. */
export async function syncSavedItems(): Promise<SyncSummary> {
  const pulls = await Promise.allSettled([
    collectTwitterBookmarks(SYNC_LIMIT),
    collectRedditSaved(SYNC_LIMIT),
  ]);

  const platforms = {} as Record<SyncPlatform, PlatformSyncReport>;
  const errors: string[] = [];
  let added = 0;
  let updated = 0;
  let removed = 0;

  for (let index = 0; index < SYNC_PLATFORMS.length; index += 1) {
    const platform = SYNC_PLATFORMS[index];
    const pull = pulls[index];

    if (pull.status === "rejected") {
      const message = `${platform}: ${errorMessage(pull.reason)}`;
      errors.push(message);
      platforms[platform] = emptyReport("failed", message);
      continue;
    }

    if (pull.value.length === 0) {
      const message = `${platform}: OpenCLI returned no saved items; deletion reconciliation was skipped.`;
      errors.push(message);
      platforms[platform] = emptyReport("skipped-empty", message);
      continue;
    }

    const prepared = await prepareItems(pull.value);
    const database = syncSavedItemsForPlatform(platform as Platform, prepared.items);
    const platformErrors = prepared.completion.errors.map((error) => `${platform}: ${error}`);
    errors.push(...platformErrors);

    platforms[platform] = {
      status: "synced",
      received: prepared.items.length,
      added: database.inserted,
      updated: database.updated,
      removed: database.removed,
      contentCompleted: prepared.completion.completed,
      ...(platformErrors.length ? { error: platformErrors.join(" | ") } : {}),
    };
    added += database.inserted;
    updated += database.updated;
    removed += database.removed;
  }

  const activeItems = getAllSavedItems();
  const embedding = await embedMissingItems(activeItems);
  const embedded = updateSavedItemEmbeddings(embedding.embedded);

  return {
    added,
    updated,
    removed,
    total: getAllSavedItems().length,
    embedded,
    platforms,
    errors,
  };
}
