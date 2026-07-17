import { getDatabase } from "@/db/sqlite";

export const runtime = "nodejs";

export function GET() {
  const database = getDatabase();
  const databaseCheck = database.prepare("SELECT 1 AS ok").get() as { ok: number };

  return Response.json({
    status: "ok",
    database: databaseCheck.ok === 1 ? "connected" : "unavailable",
    timestamp: new Date().toISOString(),
  });
}
