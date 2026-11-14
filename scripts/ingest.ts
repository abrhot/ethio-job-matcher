import { prisma } from "../src/lib/db";
import { ingestAll, ingestSource } from "../src/lib/ingest/run";

async function main() {
  const key = process.argv[2];
  const result = key ? await ingestSource(key) : await ingestAll();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
