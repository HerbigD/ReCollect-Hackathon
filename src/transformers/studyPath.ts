import { generateAdaptiveArtifact } from "@/ai/gpt";
import { retrieve } from "@/pipeline/retrieve";
import type { Transformer } from "@/transformers/base";

export const studyPathTransformer: Transformer = {
  key: "studyPath",
  run: (topic, items, options) => generateAdaptiveArtifact(topic, items, options?.outputLanguage),
};

export async function runStudyPath(topic: string, k = 12, outputLanguage = "English") {
  const retrieved = await retrieve(topic, k);
  const result = await studyPathTransformer.run(
    topic,
    retrieved.map(({ item }) => item),
    { outputLanguage },
  );
  return { topic, outputLanguage, retrieved, result };
}
