import type { SavedItem } from "@/types";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const MINIMUM_USABLE_CONTENT_LENGTH = 160;
const MAX_COMMENTS = 3;
const execFileAsync = promisify(execFile);

interface RedditThing {
  kind: string;
  data?: {
    selftext?: string;
    body?: string;
    score?: number;
  };
}

interface RedditListing {
  data?: { children?: RedditThing[] };
}

export interface ContentCompletionReport {
  items: SavedItem[];
  completed: number;
  errors: string[];
  fallbacks: string[];
}

function redditJsonUrl(url: string) {
  const parsed = new URL(url);
  parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}.json`;
  return parsed.toString();
}

function contentFromParts(postText: string, comments: Array<{ text: string; score: number }>) {
  const sections = [
    postText.trim() && `Post body:\n${postText.trim()}`,
    ...comments.map((comment) => `Comment (${comment.score} points):\n${comment.text.trim()}`),
  ].filter(Boolean);
  if (!sections.length) throw new Error("Reddit returned no post body or usable comments.");
  return sections.join("\n\n---\n\n");
}

async function completeRedditFromJson(item: SavedItem): Promise<SavedItem> {
  const response = await fetch(redditJsonUrl(item.url), {
    headers: { "User-Agent": "ReCollect/0.1 (local hackathon collector)" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Reddit returned HTTP ${response.status}`);

  const payload = (await response.json()) as [RedditListing, RedditListing];
  const selftext = payload?.[0]?.data?.children?.[0]?.data?.selftext?.trim() ?? "";
  const comments = (payload?.[1]?.data?.children ?? [])
    .filter((thing) => thing.kind === "t1" && thing.data?.body?.trim())
    .sort((a, b) => (b.data?.score ?? 0) - (a.data?.score ?? 0))
    .slice(0, MAX_COMMENTS)
    .map((thing) => ({ text: thing.data?.body?.trim() ?? "", score: thing.data?.score ?? 0 }));

  return {
    ...item,
    rawContent: contentFromParts(selftext, comments),
  };
}

interface OpenCliRedditReadEntry {
  text?: string;
  type?: string;
  score?: number | string;
}

function redditPostId(url: string) {
  const match = url.match(/\/comments\/([^/]+)/i);
  if (!match?.[1]) throw new Error("Could not extract a Reddit post ID from the URL.");
  return match[1];
}

async function completeRedditFromOpenCli(item: SavedItem): Promise<SavedItem> {
  const { stdout } = await execFileAsync(
    "opencli",
    ["reddit", "read", redditPostId(item.url), "-f", "json"],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  const entries = JSON.parse(stdout) as OpenCliRedditReadEntry[];
  if (!Array.isArray(entries)) throw new Error("OpenCLI Reddit read output was not a JSON array.");

  const post = entries.find((entry) => entry.type === "POST")?.text ?? "";
  const comments = entries
    .filter((entry) => entry.type !== "POST" && entry.text?.trim())
    .map((entry) => ({ text: entry.text ?? "", score: Number(entry.score) || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_COMMENTS);

  return { ...item, rawContent: contentFromParts(post, comments) };
}

async function completeRedditPost(item: SavedItem) {
  try {
    return { item: await completeRedditFromJson(item), usedOpenCliFallback: false };
  } catch (jsonError) {
    try {
      return { item: await completeRedditFromOpenCli(item), usedOpenCliFallback: true };
    } catch (openCliError) {
      const jsonMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
      const openCliMessage = openCliError instanceof Error ? openCliError.message : String(openCliError);
      throw new Error(`Reddit .json failed (${jsonMessage}); OpenCLI fallback failed (${openCliMessage})`);
    }
  }
}

/**
 * Enrich thin records before embedding or transformation. Twitter bookmarks
 * already carry their OpenCLI text; Reddit posts use the public .json endpoint.
 */
export async function completeContent(items: SavedItem[]): Promise<ContentCompletionReport> {
  const errors: string[] = [];
  const fallbacks: string[] = [];
  let completed = 0;

  const enrichedItems: SavedItem[] = [];
  for (const item of items) {
    if (item.rawContent.trim().length >= MINIMUM_USABLE_CONTENT_LENGTH || item.platform !== "reddit") {
      enrichedItems.push(item);
      continue;
    }

    try {
      const enriched = await completeRedditPost(item);
      completed += 1;
      if (enriched.usedOpenCliFallback) fallbacks.push(`${item.url}: OpenCLI fallback after Reddit .json was unavailable.`);
      enrichedItems.push(enriched.item);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${item.url}: ${message}`);
      enrichedItems.push(item);
    }
  }

  return { items: enrichedItems, completed, errors, fallbacks };
}
