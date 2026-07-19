import sampleSavedItems from "../../../../data/sampleSavedItems.json";
import { collectRedditSaved } from "@/collectors/openCliReddit";
import { collectTwitterBookmarks } from "@/collectors/openCliTwitter";
import { getAllSavedItems, upsertSavedItems } from "@/db/sqlite";
import { completeContent } from "@/pipeline/completeContent";
import { normalizeSavedItems } from "@/pipeline/normalize";
import type { SavedItem } from "@/types";

export const runtime = "nodejs";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST() {
  const [twitter, reddit] = await Promise.allSettled([
    collectTwitterBookmarks(),
    collectRedditSaved(),
  ]);

  const collectorErrors = [
    twitter.status === "rejected" ? `Twitter: ${errorMessage(twitter.reason)}` : null,
    reddit.status === "rejected" ? `Reddit: ${errorMessage(reddit.reason)}` : null,
  ].filter((error): error is string => Boolean(error));

  const collectedItems = [
    ...(twitter.status === "fulfilled" ? twitter.value : []),
    ...(reddit.status === "fulfilled" ? reddit.value : []),
  ];
  const usingFallback = collectedItems.length === 0;
  const itemsToProcess: SavedItem[] = usingFallback ? sampleSavedItems as SavedItem[] : collectedItems;
  const normalizedItems = normalizeSavedItems(itemsToProcess);
  const completion = await completeContent(normalizedItems);
  const completedItems = normalizeSavedItems(completion.items);
  const database = upsertSavedItems(completedItems);
  const storedItems = getAllSavedItems();

  return Response.json({
    source: usingFallback ? "sample-fallback" : "opencli",
    collected: completedItems.length,
    byPlatform: completedItems.reduce<Record<string, number>>((counts, item) => {
      counts[item.platform] = (counts[item.platform] ?? 0) + 1;
      return counts;
    }, {}),
    contentCompleted: completion.completed,
    inserted: database.inserted,
    updated: database.updated,
    errors: [...collectorErrors, ...completion.errors],
    fallbacks: completion.fallbacks,
    database: {
      total: storedItems.length,
      byPlatform: storedItems.reduce<Record<string, number>>((counts, item) => {
        counts[item.platform] = (counts[item.platform] ?? 0) + 1;
        return counts;
      }, {}),
      emptyRawContent: storedItems.filter((item) => !item.rawContent.trim()).length,
    },
    items: completedItems.map((item) => ({
      id: item.id,
      platform: item.platform,
      title: item.title,
      url: item.url,
      rawContentLength: item.rawContent.length,
    })),
  });
}
