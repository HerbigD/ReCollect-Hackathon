export type Platform = "twitter" | "reddit" | "youtube";

export interface SavedItem {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  author?: string;
  thumbnail?: string;
  savedAt?: string;
  rawContent: string;
  themeTags: string[];
  embedding?: number[];
}

export interface TransformResult {
  title: string;
  sections: Array<{
    heading: string;
    items: Array<{
      title: string;
      why: string;
      priority: "high" | "medium" | "low";
      sourceUrl: string;
    }>;
  }>;
  summary?: string;
}
