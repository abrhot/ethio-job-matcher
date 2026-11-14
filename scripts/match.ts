import { prisma } from "../src/lib/db";
import { deliverInstantAlerts, matchAllUsers } from "../src/lib/matching/run";

async function main() {
  const matched = await matchAllUsers();
  const sent = await deliverInstantAlerts();
  console.log(JSON.stringify({ matched, sent }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
