import { runStudyPath } from "@/transformers/studyPath";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { topic?: unknown; k?: unknown; outputLanguage?: unknown };
    if (typeof body.topic !== "string" || !body.topic.trim()) {
      return Response.json({ error: "topic must be a non-empty string" }, { status: 400 });
    }
    const k = typeof body.k === "number" ? body.k : 12;
    const outputLanguage = typeof body.outputLanguage === "string" && body.outputLanguage.trim()
      ? body.outputLanguage.trim()
      : "English";
    if (outputLanguage.length > 40 || /[\r\n]/.test(outputLanguage)) {
      return Response.json({ error: "outputLanguage must be a short language name" }, { status: 400 });
    }
    const studyPath = await runStudyPath(body.topic, k, outputLanguage);
    return Response.json({
      topic: studyPath.topic,
      outputLanguage: studyPath.outputLanguage,
      retrieved: studyPath.retrieved.map(({ item, similarity }) => ({
        title: item.title,
        platform: item.platform,
        url: item.url,
        similarity,
      })),
      result: studyPath.result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
