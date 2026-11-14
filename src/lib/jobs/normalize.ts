import { createHash } from "node:crypto";
import { detectCity } from "./cities";
import { parseDateInText, parseDeadlineFromText } from "./dates";
import { detectSkills } from "./skills";
import { cleanLine, detectLanguage, tokenize } from "./text";
import type { ExperienceLevel, JobType, NormalizedJob, RawPosting, RemoteMode } from "./types";

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  any: -1,
  student: 0,
  intern: 1,
  junior: 2,
  mid: 3,
  senior: 4,
};

function bump(current: ExperienceLevel, next: ExperienceLevel): ExperienceLevel {
  return EXPERIENCE_RANK[next] > EXPERIENCE_RANK[current] ? next : current;
}

export function detectExperience(text: string): ExperienceLevel {
  const normalized = text.normalize("NFC").toLowerCase();
  let level: ExperienceLevel = "any";
  if (/intern(ship)?|ኢንተርን/.test(normalized)) level = bump(level, "intern");
  if (/for students|student position|የተማሪ ሥራ/.test(normalized)) level = bump(level, "student");
  if (
    /fresh graduate|entry[- ]level|junior|ጀማሪ|ተመራቂ|0\s*[-–to]{1,3}\s*2\s*years/.test(normalized)
  ) {
    level = bump(level, "junior");
  }
  if (/mid[- ]level|3\s*[-–to]{1,3}\s*5\s*years|መካከለኛ/.test(normalized)) level = bump(level, "mid");
  if (/senior|principal|ሲኒየር|ከፍተኛ ልምድ/.test(normalized)) level = bump(level, "senior");

  const years = minimumYears(normalized);
  if (years != null) {
    if (years >= 6) level = bump(level, "senior");
    else if (years >= 3) level = bump(level, "mid");
    else if (years >= 1) level = bump(level, "junior");
  }
  return level;
}

function minimumYears(text: string): number | null {
  const patterns = [
    /(?:experience|required|minimum|at least|ልምድ)[^\n]{0,30}?(\d{1,2})\s*\+?\s*(?:years|yrs|ዓመት)/gi,
    /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:years|yrs|ዓመት)/gi,
    /(\d{1,2})\s*\+\s*(?:years|yrs|ዓመት)/gi,
  ];
  const found: number[] = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      found.push(Number(match[1]));
    }
  }
  if (found.length === 0) return null;
  return Math.min(...found.filter((value) => value >= 0 && value <= 40));
}

export function detectJobType(text: string): JobType {
  const normalized = text.normalize("NFC").toLowerCase();
  if (/intern(ship)?|ኢንተርን/.test(normalized)) return "internship";
  if (/part[- ]time|የትርፍ ጊዜ/.test(normalized)) return "part_time";
  if (/freelance|ፍሪላንስ/.test(normalized)) return "freelance";
  if (/contract|consultancy|invitation to bid|tender|ኮንትራት|ጊዜያዊ/.test(normalized))
    return "contract";
  if (/full[- ]time|permanent|ቋሚ/.test(normalized)) return "full_time";
  return "unknown";
}

export function detectRemote(text: string, city: string | null): RemoteMode {
  const normalized = text.normalize("NFC").toLowerCase();
  const remote = /remote|work from home|\bwfh\b|በርቀት|የርቀት|ሪሞት/.test(normalized);
  const hybrid = /hybrid|ቅይጥ/.test(normalized);
  const onsite = /on[- ]?site|in[- ]office|በቢሮ/.test(normalized);
  if (hybrid || (remote && (onsite || city))) return "hybrid";
  if (remote) return "remote";
  if (onsite || city) return "onsite";
  return "unknown";
}

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  if (!match?.[1]) return null;
  const line = cleanLine(match[1].split("\n")[0] ?? "");
  if (!line || line.length > 140) return null;
  return line;
}

export function extractCompany(text: string): string | null {
  return firstMatch(
    text,
    /(?:^|\n)\s*(?:company|organization|organisation|employer|ድርጅት|ተቋም)\s*[:：\-]\s*(.+)/i,
  );
}

export function extractTitle(text: string, fallback?: string): string {
  if (fallback && cleanLine(fallback)) return cleanLine(fallback).slice(0, 160);
  const lines = text
    .split(/\n+/)
    .map((line) => cleanLine(line.replace(/^[\s\-*•]+/, "")))
    .filter((line) => line.length > 3);
  const skipped = /^(vacancy announcement|job vacancy|we are hiring|internal vacancy)$/i;
  const line = lines.find((candidate) => !skipped.test(candidate)) ?? "Untitled role";
  return line.replace(/^(vacancy|position|role)\s*[:：\-]\s*/i, "").slice(0, 160);
}

function extractApply(text: string): { howToApply: string | null; applyUrl: string | null } {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const url =
    text.match(/https?:\/\/[^\s)]+/i)?.[0]?.replace(/[.,;]+$/, "") ??
    (email ? `mailto:${email}` : null);
  const instruction = firstMatch(
    text,
    /(?:^|\n)\s*(?:how to apply|to apply|ያመልክቱ|አመልክት)\s*[:：\-]\s*(.+)/i,
  );
  const howToApply = instruction || (email ? `Email ${email}` : null);
  return { howToApply, applyUrl: url };
}

export function fingerprintFor(input: {
  title: string;
  company: string | null;
  city: string | null;
  description: string;
}): string {
  const norm = (value: string) =>
    value
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
  let key = `${norm(input.title)}|${norm(input.company ?? "")}|${norm(input.city ?? "")}`;
  if (!input.company) {
    key += `|${tokenize(input.description).slice(0, 8).join(" ")}`;
  }
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

function asRemoteHint(value: string | undefined): RemoteMode | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("remote")) return "remote";
  if (
    normalized.includes("office") ||
    normalized.includes("onsite") ||
    normalized.includes("on-site")
  ) {
    return "onsite";
  }
  return null;
}

function asJobTypeHint(value: string | undefined): JobType | null {
  if (!value) return null;
  const detected = detectJobType(value);
  return detected === "unknown" ? null : detected;
}

function asExperienceHint(value: string | undefined): ExperienceLevel | null {
  if (!value) return null;
  const detected = detectExperience(value);
  return detected === "any" ? null : detected;
}

export function normalizePosting(raw: RawPosting): NormalizedJob {
  const rawText = raw.text.normalize("NFC").trim();
  const title = extractTitle(rawText, raw.title);
  const company = raw.company ? cleanLine(raw.company) : extractCompany(rawText);
  const location = raw.location ? cleanLine(raw.location) : null;
  const city = detectCity(location) ?? detectCity(rawText);
  const remote =
    asRemoteHint(raw.remoteHint) ?? detectRemote(`${location ?? ""}\n${rawText}`, city);
  const jobType = asJobTypeHint(raw.jobTypeHint) ?? detectJobType(`${title}\n${rawText}`);
  const experienceLevel =
    asExperienceHint(raw.experienceHint) ?? detectExperience(`${title}\n${rawText}`);
  const deadline =
    (raw.deadline ? (parseDateInText(raw.deadline) ?? raw.deadline.slice(0, 10)) : null) ??
    parseDeadlineFromText(rawText);
  const apply = extractApply(rawText);
  const description = rawText.replace(/\n{3,}/g, "\n\n").slice(0, 8000);
  const skills = detectSkills(`${title}\n${company ?? ""}\n${description}`);
  const language = detectLanguage(description);

  const normalized: NormalizedJob = {
    externalId: raw.externalId,
    sourceKey: raw.sourceKey,
    title,
    company,
    location: location ?? city,
    city,
    remote,
    jobType,
    experienceLevel,
    deadline: deadline && /^\d{4}-\d{2}-\d{2}/.test(deadline) ? deadline.slice(0, 10) : null,
    description,
    howToApply: raw.howToApply ?? apply.howToApply,
    applyUrl: raw.applyUrl ?? apply.applyUrl,
    sourceUrl: raw.url,
    postedAt: raw.postedAt ?? null,
    rawText,
    language,
    skills,
    fingerprint: "",
  };
  normalized.fingerprint = fingerprintFor(normalized);
  return normalized;
}
