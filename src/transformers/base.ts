import type { SavedItem, TransformResult } from "@/types";

export interface TransformOptions {
  outputLanguage?: string;
}

export interface Transformer {
  key: "studyPath" | "weeklyMenu" | "tripItinerary";
  run(topic: string, items: SavedItem[], options?: TransformOptions): Promise<TransformResult>;
}
