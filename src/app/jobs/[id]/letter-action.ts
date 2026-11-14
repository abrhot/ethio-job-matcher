"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { isPremium } from "@/lib/config";
import { prisma } from "@/lib/db";
import type { ExperienceLevel, JobType, RemoteMode, SeekerProfile } from "@/lib/jobs/types";
import { tailorCoverLetter } from "@/lib/matching/llm";

export interface LetterState {
  text: string;
  via: "template" | "llm";
  error?: string;
}

export async function polishLetter(
  _previous: LetterState,
  formData: FormData,
): Promise<LetterState> {
  const user = await getCurrentUser();
  if (!user?.profile || !isPremium(user)) {
    return { text: _previous.text, via: "template", error: "Premium is required for a rewrite." };
  }
  const jobId = String(formData.get("jobId") ?? "");
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { text: _previous.text, via: "template", error: "That job is gone." };
  const profile: SeekerProfile = {
    fullName: user.profile.fullName,
    field: user.profile.field,
    skills: user.profile.skills,
    experienceLevel: user.profile.experienceLevel as ExperienceLevel,
    yearsExperience: user.profile.yearsExperience,
    preferredCities: user.profile.preferredCities,
    remoteOk: user.profile.remoteOk,
    jobTypes: user.profile.jobTypes as JobType[],
    summary: user.profile.summary,
  };
  const result = await tailorCoverLetter(profile, {
    title: job.title,
    company: job.company,
    city: job.city,
    remote: job.remote as RemoteMode,
    jobType: job.jobType as JobType,
    experienceLevel: job.experienceLevel as ExperienceLevel,
    description: job.description,
    skills: job.skills,
    deadline: job.deadline?.toISOString() ?? null,
  });
  return { text: result.text, via: result.generatedBy };
}
