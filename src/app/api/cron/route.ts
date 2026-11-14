import { timingSafeEqual } from "node:crypto";
import { ingestAll } from "@/lib/ingest/run";
import { logError } from "@/lib/log";
import { deliverDigests, deliverInstantAlerts, matchAllUsers } from "@/lib/matching/run";

function same(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!same(provided, secret)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const ingested = await ingestAll();
    const matched = await matchAllUsers();
    const instant = await deliverInstantAlerts();
    const digest =
      new URL(request.url).searchParams.get("digest") === "1" ? await deliverDigests() : 0;
    return Response.json({ ingested, matched, instant, digest });
  } catch (error) {
    logError("cron", "run failed", error);
    return Response.json({ error: "Cron run failed." }, { status: 500 });
  }
}
