import type { SavedItem } from "@/types";

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || key === "ref" || key === "source") url.searchParams.delete(key);
  }
  return url.toString();
}

function normalizeSavedAt(value?: string) {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : new Date(timestamp).toISOString();
}

export function normalizeSavedItems(items: SavedItem[]) {
  const byUrl = new Map<string, SavedItem>();

  for (const item of items) {
    const normalized: SavedItem = {
      ...item,
      title: normalizeWhitespace(item.title) || "Untitled save",
      url: normalizeUrl(item.url),
      author: item.author ? normalizeWhitespace(item.author) : undefined,
      rawContent: normalizeWhitespace(item.rawContent),
      savedAt: normalizeSavedAt(item.savedAt),
      themeTags: [...new Set(item.themeTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
    };

    const existing = byUrl.get(normalized.url);
    if (!existing || normalized.rawContent.length > existing.rawContent.length) byUrl.set(normalized.url, normalized);
  }

  return [...byUrl.values()];
}
