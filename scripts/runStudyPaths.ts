import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

async function main() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) loadEnvFile(file);
  }
  const { runStudyPath } = await import("@/transformers/studyPath");

  for (const topic of ["AI agents", "酒", "网球"]) {
    const output = await runStudyPath(topic, 12);
    console.log(JSON.stringify({
      topic,
      retrieved: output.retrieved.map(({ item, similarity }) => ({ title: item.title, url: item.url, similarity })),
      result: output.result,
    }, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
