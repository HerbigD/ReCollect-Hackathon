import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { SavedItem } from "@/types";

const execFileAsync = promisify(execFile);

interface OpenCliTwitterBookmark {
  id: string;
  author?: string;
  text?: string;
  created_at?: string;
  url: string;
  media_urls?: string[];
}

function titleFromText(text: string) {
  const compactText = text.replace(/\s+/g, " ").trim();
  return compactText.length > 80 ? `${compactText.slice(0, 77)}...` : compactText || "Untitled X bookmark";
}

/** Collect the logged-in user's X bookmarks through OpenCLI. */
export async function collectTwitterBookmarks(limit = 200): Promise<SavedItem[]> {
  const { stdout } = await execFileAsync(
    "opencli",
    ["twitter", "bookmarks", "-f", "json", "--limit", String(limit)],
    { maxBuffer: 10 * 1024 * 1024 },
  );

  const bookmarks = JSON.parse(stdout) as OpenCliTwitterBookmark[];
  if (!Array.isArray(bookmarks)) throw new Error("OpenCLI Twitter output was not a JSON array.");

  return bookmarks.map((bookmark) => {
    const text = bookmark.text?.trim() ?? "";
    return {
      id: bookmark.id,
      platform: "twitter",
      title: titleFromText(text),
      url: bookmark.url,
      author: bookmark.author,
      thumbnail: bookmark.media_urls?.[0],
      savedAt: bookmark.created_at,
      rawContent: text,
      themeTags: [],
    };
  });
}
