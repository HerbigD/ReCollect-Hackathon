import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { SavedItem } from "@/types";

const execFileAsync = promisify(execFile);

interface OpenCliRedditSavedPost {
  title: string;
  subreddit?: string;
  url: string;
}

function idFromRedditUrl(url: string) {
  const match = url.match(/\/comments\/([^/]+)/i);
  return match?.[1] ? `reddit:${match[1]}` : `reddit:${url}`;
}

/** Collect the logged-in user's saved Reddit posts through OpenCLI. */
export async function collectRedditSaved(limit = 100): Promise<SavedItem[]> {
  const { stdout } = await execFileAsync(
    "opencli",
    ["reddit", "saved", "-f", "json", "--limit", String(limit)],
    { maxBuffer: 10 * 1024 * 1024 },
  );

  const posts = JSON.parse(stdout) as OpenCliRedditSavedPost[];
  if (!Array.isArray(posts)) throw new Error("OpenCLI Reddit output was not a JSON array.");

  return posts.map((post) => ({
    id: idFromRedditUrl(post.url),
    platform: "reddit",
    title: post.title,
    url: post.url,
    author: post.subreddit,
    rawContent: "",
    themeTags: [],
  }));
}
