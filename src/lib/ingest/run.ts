import type { Prisma, SourceKind } from "@prisma/client";
import { prisma } from "../db";
import { logError, logInfo } from "../log";
import { dedupePostings } from "../jobs/dedupe";
import { normalizePosting } from "../jobs/normalize";
import type { NormalizedJob } from "../jobs/types";
import { configuredSources, sourceByKey, type JobSource } from "../sources/registry";
import { experienceLevelSchema, jobTypeSchema, remoteModeSchema } from "../validation";

export interface IngestStats {
  sourceKey: string;
  found: number;
  created: number;
  updated: number;
  duplicates: number;
  error?: string;
}

export async function ingestSource(key: string): Promise<IngestStats> {
  const adapter = sourceByKey(key);
  if (!adapter) throw new Error(`Unknown source: ${key}`);
  return ingestAdapter(adapter);
}

export async function ingestAll(): Promise<IngestStats[]> {
  const results: IngestStats[] = [];
  for (const source of configuredSources()) {
    results.push(await ingestAdapter(source));
  }
  return results;
}

async function ingestAdapter(adapter: JobSource): Promise<IngestStats> {
  const source = await prisma.source.upsert({
    where: { key: adapter.key },
    create: {
      key: adapter.key,
      name: adapter.name,
      kind: adapter.kind as SourceKind,
      config: { description: adapter.description },
      enabled: true,
    },
    update: { name: adapter.name, kind: adapter.kind as SourceKind },
  });
  const run = await prisma.ingestRun.create({ data: { sourceId: source.id } });
  try {
    const raw = await adapter.fetchRaw();
    const normalized = raw.map((posting) =>
      normalizePosting({ ...posting, sourceKey: adapter.key }),
    );
    const { unique, duplicateCount } = dedupePostings(normalized);
    let created = 0;
    let updated = 0;
    let duplicates = duplicateCount;
    for (const job of unique) {
      const outcome = await upsertJob(source.id, adapter.key, job);
      if (outcome === "created") created += 1;
      else if (outcome === "updated") updated += 1;
      else duplicates += 1;
    }
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), found: raw.length, created, updated, duplicates },
    });
    await prisma.source.update({
      where: { id: source.id },
      data: { lastRunAt: new Date(), lastStatus: "ok", lastError: null },
    });
    logInfo("ingest", "source finished", {
      source: adapter.key,
      found: raw.length,
      created,
      updated,
      duplicates,
    });
    return { sourceKey: adapter.key, found: raw.length, created, updated, duplicates };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    logError("ingest", "source failed", error, { source: adapter.key });
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), error: message },
    });
    await prisma.source.update({
      where: { id: source.id },
      data: { lastRunAt: new Date(), lastStatus: "error", lastError: message },
    });
    return {
      sourceKey: adapter.key,
      found: 0,
      created: 0,
      updated: 0,
      duplicates: 0,
      error: message,
    };
  }
}

async function upsertJob(
  sourceId: string,
  sourceKey: string,
  job: NormalizedJob,
): Promise<"created" | "updated" | "duplicate"> {
  const existingByExternal = await prisma.job.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: job.externalId } },
  });
  const data = jobData(job);
  if (existingByExternal) {
    const seen = new Set(existingByExternal.seenOn);
    seen.add(sourceKey);
    await prisma.job.update({
      where: { id: existingByExternal.id },
      data: { ...data, seenOn: [...seen] },
    });
    return "updated";
  }

  const existingByFingerprint = await prisma.job.findFirst({
    where: { fingerprint: job.fingerprint },
  });
  if (existingByFingerprint) {
    const seen = new Set(existingByFingerprint.seenOn);
    seen.add(sourceKey);
    const richer = job.description.length > existingByFingerprint.description.length;
    await prisma.job.update({
      where: { id: existingByFingerprint.id },
      data: {
        seenOn: [...seen],
        ...(richer
          ? {
              description: job.description,
              rawText: job.rawText,
              howToApply: job.howToApply,
              applyUrl: job.applyUrl ?? existingByFingerprint.applyUrl,
              skills: job.skills,
            }
          : {}),
      },
    });
    return "duplicate";
  }

  await prisma.job.create({
    data: {
      sourceId,
      externalId: job.externalId,
      ...data,
      seenOn: [sourceKey],
    },
  });
  return "created";
}

function jobData(
  job: NormalizedJob,
): Omit<Prisma.JobUncheckedCreateInput, "sourceId" | "externalId" | "seenOn" | "id"> {
  const deadline = job.deadline ? new Date(`${job.deadline}T23:59:59Z`) : null;
  const postedAt = job.postedAt ? new Date(job.postedAt) : null;
  const closed = deadline != null && deadline.getTime() < Date.now();
  return {
    fingerprint: job.fingerprint,
    title: job.title,
    company: job.company,
    location: job.location,
    city: job.city,
    remote: remoteModeSchema.parse(job.remote),
    jobType: jobTypeSchema.parse(job.jobType),
    experienceLevel: experienceLevelSchema.parse(job.experienceLevel),
    deadline,
    description: job.description,
    howToApply: job.howToApply,
    applyUrl: job.applyUrl,
    sourceUrl: job.sourceUrl,
    postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    rawText: job.rawText,
    language: job.language,
    skills: job.skills,
    isActive: !closed,
  };
}
