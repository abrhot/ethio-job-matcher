import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { canonicalizeSkills } from "../jobs/skills";
import type { ExperienceLevel, JobType, SeekerProfile } from "../jobs/types";
import { matchUserToJobs } from "../matching/run";

export interface ProfileInput {
  fullName?: string | null;
  field?: string | null;
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  yearsExperience?: number | null;
  preferredCities?: string[];
  remoteOk?: boolean;
  jobTypes?: JobType[];
  summary?: string | null;
  education?: string | null;
  phone?: string | null;
  headline?: string | null;
  rawCvText?: string | null;
  cvFileName?: string | null;
  locale?: "en" | "am";
}

export async function saveUserProfile(userId: string, input: ProfileInput) {
  const skills = input.skills ? canonicalizeSkills(input.skills) : undefined;
  const rawCvText = input.rawCvText == null ? input.rawCvText : input.rawCvText.slice(0, 12_000);
  const create: Prisma.ProfileUncheckedCreateInput = {
    userId,
    fullName: input.fullName ?? null,
    field: input.field ?? null,
    skills: skills ?? [],
    experienceLevel: input.experienceLevel ?? "junior",
    yearsExperience: input.yearsExperience ?? null,
    preferredCities: input.preferredCities ?? [],
    remoteOk: input.remoteOk ?? true,
    jobTypes: input.jobTypes ?? [],
    summary: input.summary ?? null,
    education: input.education ?? null,
    phone: input.phone ?? null,
    headline: input.headline ?? null,
    rawCvText: rawCvText ?? null,
    cvFileName: input.cvFileName ?? null,
  };
  const update: Prisma.ProfileUpdateInput = {};
  if (input.fullName !== undefined) update.fullName = input.fullName;
  if (input.field !== undefined) update.field = input.field;
  if (skills !== undefined) update.skills = skills;
  if (input.experienceLevel !== undefined) update.experienceLevel = input.experienceLevel;
  if (input.yearsExperience !== undefined) update.yearsExperience = input.yearsExperience;
  if (input.preferredCities !== undefined) update.preferredCities = input.preferredCities;
  if (input.remoteOk !== undefined) update.remoteOk = input.remoteOk;
  if (input.jobTypes !== undefined) update.jobTypes = input.jobTypes;
  if (input.summary !== undefined) update.summary = input.summary;
  if (input.education !== undefined) update.education = input.education;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.headline !== undefined) update.headline = input.headline;
  if (rawCvText !== undefined) update.rawCvText = rawCvText;
  if (input.cvFileName !== undefined) update.cvFileName = input.cvFileName;
  const profile = await prisma.profile.upsert({
    where: { userId },
    create,
    update,
  });
  if (input.locale) {
    await prisma.user.update({ where: { id: userId }, data: { locale: input.locale } });
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true },
  });
  const jobs = await prisma.job.findMany();
  await matchUserToJobs(user, jobs);
  return profile;
}

export function seekerFromInput(input: ProfileInput): Partial<SeekerProfile> {
  return {
    fullName: input.fullName,
    field: input.field,
    skills: input.skills,
    experienceLevel: input.experienceLevel,
    yearsExperience: input.yearsExperience,
    preferredCities: input.preferredCities,
    remoteOk: input.remoteOk,
    jobTypes: input.jobTypes,
    summary: input.summary,
    locale: input.locale,
  };
}
