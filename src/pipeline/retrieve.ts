import { embedTexts } from "@/ai/embeddings";
import { getAllSavedItems, updateSavedItemEmbeddings } from "@/db/sqlite";
import { embedMissingItems } from "@/pipeline/embed";
import type { SavedItem } from "@/types";

export interface RetrievedItem {
  item: SavedItem;
  similarity: number;
}

export function cosineSimilarity(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return -1;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? dot / denominator : -1;
}

/** Retrieve saved items for arbitrary free text; themeTags are intentionally ignored. */
export async function retrieve(topic: string, k = 12): Promise<RetrievedItem[]> {
  const query = topic.trim();
  if (!query) throw new Error("A non-empty topic is required.");
  if (!Number.isInteger(k) || k < 1 || k > 50) throw new Error("k must be an integer between 1 and 50.");

  const storedItems = getAllSavedItems().filter((item) => item.rawContent.trim());
  const embedded = await embedMissingItems(storedItems);
  if (embedded.embedded.length) updateSavedItemEmbeddings(embedded.embedded);

  const [queryEmbedding] = await embedTexts([query]);
  return embedded.items
    .filter((item) => item.embedding?.length)
    .map((item) => ({ item, similarity: cosineSimilarity(item.embedding ?? [], queryEmbedding) }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, k);
}
