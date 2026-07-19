import { embedTexts } from "@/ai/embeddings";
import type { SavedItem } from "@/types";

function embeddingInput(item: SavedItem) {
  return [item.title, item.author, item.rawContent].filter(Boolean).join("\n").slice(0, 24_000);
}

export async function embedMissingItems(items: SavedItem[]) {
  const missing = items.filter((item) => !item.embedding?.length && embeddingInput(item).trim());
  if (!missing.length) return { items, embedded: [] as SavedItem[] };

  const vectors = await embedTexts(missing.map(embeddingInput));
  const byUrl = new Map(missing.map((item, index) => [item.url, { ...item, embedding: vectors[index] }]));
  const embedded = [...byUrl.values()];
  return {
    items: items.map((item) => byUrl.get(item.url) ?? item),
    embedded,
  };
}
