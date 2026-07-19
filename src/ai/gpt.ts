import { getOpenAI } from "@/ai/openai";
import type { SavedItem, TransformResult } from "@/types";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

function studyPathSchema(sourceUrls: [string, ...string[]]) {
  return z.object({
    title: z.string(),
    summary: z.string(),
    sections: z.array(z.object({
      heading: z.string(),
      items: z.array(z.object({
        title: z.string(),
        why: z.string(),
        priority: z.enum(["high", "medium", "low"]),
        sourceUrl: z.enum(sourceUrls),
      })).min(1),
    })).min(1),
  });
}

function sourceBlock(items: SavedItem[]) {
  return items.map((item, index) => [
    `SOURCE ${index + 1}`,
    `Title: ${item.title}`,
    `Platform: ${item.platform}`,
    `URL: ${item.url}`,
    `Content:\n${item.rawContent}`,
  ].join("\n")).join("\n\n---\n\n");
}

export async function generateStudyPath(
  topic: string,
  items: SavedItem[],
  outputLanguage = "English",
): Promise<TransformResult> {
  if (!items.length) throw new Error(`No saved items were retrieved for topic: ${topic}`);
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-5.6";
  const language = outputLanguage.trim() || "English";
  const sourceUrls = items.map((item) => item.url) as [string, ...string[]];
  const schema = studyPathSchema(sourceUrls);

  const response = await getOpenAI().responses.parse({
    model,
    reasoning: { effort: "low" },
    input: [
      {
        role: "developer",
        content: [
          "You transform a user's saved items into a concise, useful study path.",
          "Ground every output item in exactly one supplied source. Never add facts, resources, URLs, or recommendations not present in the sources.",
          "Group sources into meaningful subtopics, order them for learning, explain why each item belongs, and assign a practical priority.",
          "Every sourceUrl must be copied verbatim from a supplied URL. Do not fabricate or edit URLs.",
          "Use only relevant sources; omit irrelevant saves.",
          `Write every human-facing output field entirely in ${language}, regardless of the languages used by the sources.`,
        ].join(" "),
      },
      {
        role: "user",
        content: `Topic: ${topic}\nOutput language: ${language}\n\nSaved sources:\n\n${sourceBlock(items)}`,
      },
    ],
    text: { format: zodTextFormat(schema, "study_path") },
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error(`${model} returned no structured Study Path.`);

  const allowedUrls = new Set(items.map((item) => item.url));
  const seenUrls = new Set<string>();
  const sections = parsed.sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!allowedUrls.has(item.sourceUrl)) {
        throw new Error(`${model} returned an unknown sourceUrl: ${item.sourceUrl}`);
      }
      if (seenUrls.has(item.sourceUrl)) return false;
      seenUrls.add(item.sourceUrl);
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  if (!sections.length) throw new Error(`${model} did not use any grounded sources.`);
  return { title: parsed.title, summary: parsed.summary, sections };
}
