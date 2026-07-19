import { getOpenAI } from "@/ai/openai";

export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export async function embedTexts(inputs: string[]) {
  if (!inputs.length) return [];
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
    encoding_format: "float",
  });
  return response.data.sort((a, b) => a.index - b.index).map((entry) => entry.embedding);
}
