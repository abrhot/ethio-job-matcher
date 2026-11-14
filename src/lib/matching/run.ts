import type { Job, Profile, User } from "@prisma/client";
import { prisma } from "../db";
import type { ExperienceLevel, JobType, RemoteMode, SeekerProfile } from "../jobs/types";
import { INSTANT_THRESHOLD } from "../matching/score";
import { rewriteWhyLine } from "../matching/llm";
import { scoreMatch } from "../matching/score";
import { sendMatchAlert, sendDigest } from "../telegram/deliver";

type UserWithProfile = User & { profile: Profile | null };

export async function matchAllUsers(): Promise<{ users: number; written: number }> {
  const users = await prisma.user.findMany({ include: { profile: true } });
  const jobs = await prisma.job.findMany();
  let written = 0;
  for (const user of users) {
    if (!user.profile) continue;
    written += await matchUserToJobs(user, jobs);
  }
  return { users: users.length, written };
}

export async function matchUserToJobs(user: UserWithProfile, jobs: Job[]): Promise<number> {
  if (!user.profile) return 0;
  const profile = toSeeker(user, user.profile);
  let written = 0;
  for (const job of jobs) {
    const existing = await prisma.match.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: job.id } },
    });
    const result = scoreMatch(profile, {
      title: job.title,
      company: job.company,
      city: job.city,
      location: job.location,
      remote: job.remote as RemoteMode,
      jobType: job.jobType as JobType,
      experienceLevel: job.experienceLevel as ExperienceLevel,
      deadline: job.deadline ? job.deadline.toISOString() : null,
      description: job.description,
      skills: job.skills,
      postedAt: job.postedAt ? job.postedAt.toISOString() : null,
    });
    let whyLine = result.whyLine;
    if (process.env.LLM_API_KEY && result.tier === "instant" && !existing?.alertedAt) {
      whyLine = await rewriteWhyLine({
        draft: result.whyLine,
        title: job.title,
        skills: result.matchedSkills,
        summary: profile.summary,
      });
    }
    await prisma.match.upsert({
      where: { userId_jobId: { userId: user.id, jobId: job.id } },
      create: {
        userId: user.id,
        jobId: job.id,
        score: result.score,
        ruleScore: result.ruleScore,
        embedScore: result.embedScore,
        reasons: result.reasons,
        whyLine,
        whyLineAm: result.whyLineAm,
        matchedSkills: result.matchedSkills,
      },
      update: {
        score: result.score,
        ruleScore: result.ruleScore,
        embedScore: result.embedScore,
        reasons: result.reasons,
        whyLine,
        whyLineAm: result.whyLineAm,
        matchedSkills: result.matchedSkills,
      },
    });
    written += 1;
  }
  return written;
}

function toSeeker(user: User, profile: Profile): SeekerProfile {
  return {
    fullName: profile.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "),
    field: profile.field,
    skills: profile.skills,
    experienceLevel: profile.experienceLevel as ExperienceLevel,
    yearsExperience: profile.yearsExperience,
    preferredCities: profile.preferredCities,
    remoteOk: profile.remoteOk,
    jobTypes: profile.jobTypes as JobType[],
    summary: profile.summary,
    locale: user.locale === "am" ? "am" : "en",
  };
}

export async function deliverInstantAlerts(): Promise<number> {
  const pending = await prisma.match.findMany({
    where: {
      alertedAt: null,
      dismissed: false,
      score: { gte: INSTANT_THRESHOLD },
      job: { isActive: true },
      user: { telegramId: { not: null }, alertMode: { in: ["instant", "both"] } },
    },
    include: { user: true, job: true },
    orderBy: { score: "desc" },
    take: 30,
  });
  let sent = 0;
  for (const match of pending) {
    if (!match.user.telegramId) continue;
    const ok = await sendMatchAlert({
      telegramId: match.user.telegramId,
      locale: match.user.locale === "am" ? "am" : "en",
      score: Math.round(match.score),
      why: match.user.locale === "am" ? match.whyLineAm : match.whyLine,
      title: match.job.title,
      company: match.job.company,
      city: match.job.city,
      url: match.job.applyUrl || match.job.sourceUrl,
    });
    if (ok) {
      await prisma.match.update({ where: { id: match.id }, data: { alertedAt: new Date() } });
      sent += 1;
    }
  }
  return sent;
}

export async function deliverDigests(): Promise<number> {
  const users = await prisma.user.findMany({
    where: { telegramId: { not: null }, alertMode: { in: ["digest", "both"] } },
  });
  let sent = 0;
  for (const user of users) {
    const matches = await prisma.match.findMany({
      where: {
        userId: user.id,
        dismissed: false,
        digestSentAt: null,
        alertedAt: null,
        score: { gte: 50 },
        job: { isActive: true },
      },
      include: { job: true },
      orderBy: { score: "desc" },
      take: 5,
    });
    if (matches.length === 0 || !user.telegramId) continue;
    const ok = await sendDigest({
      telegramId: user.telegramId,
      locale: user.locale === "am" ? "am" : "en",
      items: matches.map((match) => ({
        title: match.job.title,
        score: Math.round(match.score),
        why: user.locale === "am" ? match.whyLineAm : match.whyLine,
        url: match.job.applyUrl || match.job.sourceUrl,
      })),
    });
    if (ok) {
      await prisma.match.updateMany({
        where: { id: { in: matches.map((match) => match.id) } },
        data: { digestSentAt: new Date() },
      });
      sent += 1;
    }
  }
  return sent;
}
