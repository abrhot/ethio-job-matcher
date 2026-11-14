import type { NormalizedJob } from "./types";

export interface DedupeResult<T> {
  unique: T[];
  duplicateCount: number;
}

function richness(job: Pick<NormalizedJob, "description" | "howToApply" | "applyUrl">): number {
  return job.description.length + (job.howToApply ? 80 : 0) + (job.applyUrl ? 40 : 0);
}

export function dedupePostings<
  T extends Pick<
    NormalizedJob,
    "fingerprint" | "description" | "postedAt" | "howToApply" | "applyUrl"
  >,
>(items: T[]): DedupeResult<T> {
  const uniqueByFingerprint = new Map<string, T>();
  let duplicateCount = 0;

  for (const item of items) {
    const existing = uniqueByFingerprint.get(item.fingerprint);
    if (!existing) {
      uniqueByFingerprint.set(item.fingerprint, item);
      continue;
    }
    duplicateCount += 1;
    const winner = richness(item) >= richness(existing) ? item : existing;
    const dates = [existing.postedAt, item.postedAt]
      .filter((value): value is string => Boolean(value))
      .sort();
    uniqueByFingerprint.set(item.fingerprint, {
      ...winner,
      postedAt: dates[0] ?? winner.postedAt,
    });
  }

  return { unique: [...uniqueByFingerprint.values()], duplicateCount };
}
