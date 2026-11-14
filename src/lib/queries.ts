import type { JobType, Prisma, RemoteMode } from "@prisma/client";
import { prisma } from "./db";
import { jobTypeSchema, parseMatchFilters, remoteModeSchema } from "./validation";

export function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export async function listMatches(
  userId: string,
  raw: {
    q?: string;
    city?: string;
    remote?: string;
    type?: string;
    min?: string;
  },
) {
  const filters = parseMatchFilters(raw);
  const remote = filters.remote ? remoteModeSchema.safeParse(filters.remote) : null;
  const type = filters.type ? jobTypeSchema.safeParse(filters.type) : null;
  const job: Prisma.JobWhereInput = { isActive: true };
  if (filters.city) job.city = filters.city;
  if (remote?.success) job.remote = remote.data as RemoteMode;
  if (type?.success && type.data !== "unknown") job.jobType = type.data as JobType;
  if (filters.q) {
    job.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  const matches = await prisma.match.findMany({
    where: { userId, dismissed: false, score: { gte: filters.min }, job },
    include: { job: { include: { source: true } } },
    orderBy: [{ score: "desc" }, { job: { postedAt: "desc" } }],
    take: 40,
  });
  return { filters, matches };
}

export async function listCities() {
  const rows = await prisma.job.findMany({
    where: { city: { not: null }, isActive: true },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.flatMap((row) => (row.city ? [row.city] : []));
}

export async function recentJobs(take = 4) {
  return prisma.job.findMany({
    where: { isActive: true },
    include: { source: true },
    orderBy: { postedAt: "desc" },
    take,
  });
}
