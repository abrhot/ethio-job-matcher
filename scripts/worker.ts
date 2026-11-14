import { prisma } from "../src/lib/db";
import { ingestAll } from "../src/lib/ingest/run";
import { logError, logInfo } from "../src/lib/log";
import { deliverDigests, deliverInstantAlerts, matchAllUsers } from "../src/lib/matching/run";

const interval = Number(process.env.WORKER_INTERVAL_MS || 15 * 60 * 1000);
const digestHour = Number(process.env.DIGEST_UTC_HOUR || 5);
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const ingested = await ingestAll();
    const matched = await matchAllUsers();
    const instant = await deliverInstantAlerts();
    const digest = new Date().getUTCHours() === digestHour ? await deliverDigests() : 0;
    logInfo("worker", "tick complete", {
      sources: ingested.length,
      written: matched.written,
      instant,
      digest,
    });
  } catch (error) {
    logError("worker", "tick failed", error);
  } finally {
    running = false;
  }
}

void tick();
setInterval(() => {
  void tick();
}, interval);

process.on("SIGINT", () => {
  void prisma.$disconnect().finally(() => process.exit(0));
});
