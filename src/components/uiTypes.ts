import type { Platform, TransformResult } from "@/types";

export interface CollectionPreview {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  author?: string;
  thumbnail?: string;
}

export interface RetrievedPreview {
  title: string;
  platform: Platform;
  url: string;
  similarity: number;
}

export interface TransformResponse {
  topic: string;
  outputLanguage: string;
  retrieved: RetrievedPreview[];
  result: TransformResult;
}
