export const EXPERIENCE_LEVELS = ["student", "intern", "junior", "mid", "senior", "any"] as const;

export const JOB_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
  "unknown",
] as const;

export const REMOTE_MODES = ["remote", "onsite", "hybrid", "unknown"] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type RemoteMode = (typeof REMOTE_MODES)[number];
export type PostingLanguage = "en" | "am" | "mixed";

export interface RawPosting {
  externalId: string;
  sourceKey: string;
  title?: string;
  company?: string;
  location?: string;
  text: string;
  url: string;
  applyUrl?: string;
  howToApply?: string;
  postedAt?: string;
  deadline?: string;
  remoteHint?: string;
  jobTypeHint?: string;
  experienceHint?: string;
}

export interface NormalizedJob {
  externalId: string;
  sourceKey: string;
  title: string;
  company: string | null;
  location: string | null;
  city: string | null;
  remote: RemoteMode;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  deadline: string | null;
  description: string;
  howToApply: string | null;
  applyUrl: string | null;
  sourceUrl: string;
  postedAt: string | null;
  rawText: string;
  language: PostingLanguage;
  skills: string[];
  fingerprint: string;
}

export interface SeekerProfile {
  fullName?: string | null;
  field?: string | null;
  skills: string[];
  experienceLevel: ExperienceLevel;
  yearsExperience?: number | null;
  preferredCities: string[];
  remoteOk: boolean;
  jobTypes: JobType[];
  summary?: string | null;
  locale?: "en" | "am";
}

export interface ScoreInputJob {
  title: string;
  company?: string | null;
  city?: string | null;
  location?: string | null;
  remote: RemoteMode;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  deadline?: string | null;
  description: string;
  skills: string[];
  postedAt?: string | null;
}
