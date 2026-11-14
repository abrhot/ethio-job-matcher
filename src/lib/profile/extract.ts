import { detectCity } from "../jobs/cities";
import { detectExperience } from "../jobs/normalize";
import { canonicalizeSkills, detectSkills } from "../jobs/skills";
import type { ExperienceLevel, JobType, SeekerProfile } from "../jobs/types";

export interface ExtractedProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  field: string | null;
  skills: string[];
  experienceLevel: ExperienceLevel;
  yearsExperience: number | null;
  education: string | null;
  summary: string | null;
  preferredCities: string[];
}

const FIELDS = [
  "software engineering",
  "computer science",
  "information technology",
  "accounting",
  "finance",
  "economics",
  "nursing",
  "public health",
  "civil engineering",
  "electrical engineering",
  "mechanical engineering",
  "marketing",
  "business administration",
  "law",
  "agriculture",
  "education",
  "graphic design",
  "data science",
];

export function extractProfileFromText(text: string): ExtractedProfile {
  const normalized = text.normalize("NFC").replace(/\r/g, "").trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const email = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = normalized.match(/(?:\+251|0)9\d{8}/)?.[0] ?? null;
  const lower = normalized.toLowerCase();
  const field = FIELDS.find((candidate) => lower.includes(candidate)) ?? null;
  const skills = detectSkills(normalized);
  const yearsMatch = [...normalized.matchAll(/(\d{1,2})\s*\+?\s*(?:years|yrs)/gi)].map((match) =>
    Number(match[1]),
  );
  const yearsExperience = yearsMatch.length
    ? Math.max(...yearsMatch.filter((year) => year <= 40))
    : null;
  const experienceLevel = inferLevel(normalized, yearsExperience);
  const educationLine =
    lines.find((line) => /b\.?sc|m\.?sc|bachelor|master|degree|ዲግሪ|የመጀመሪያ ዲግሪ/i.test(line)) ?? null;
  const summaryLine =
    lines.find((line, index) => index > 0 && line.length > 80 && !line.includes("@")) ?? null;
  const name = guessName(lines, email);
  const cities = uniqueCities(normalized);

  return {
    fullName: name,
    email,
    phone,
    field: titleCase(field),
    skills,
    experienceLevel,
    yearsExperience,
    education: educationLine,
    summary: summaryLine?.slice(0, 500) ?? null,
    preferredCities: cities,
  };
}

function inferLevel(text: string, years: number | null): ExperienceLevel {
  const detected = detectExperience(text);
  if (detected !== "any") return detected === "intern" ? "intern" : detected;
  if (/student|5th year|fourth year|undergraduate|የተማሪ/i.test(text)) return "student";
  if (years == null) return "junior";
  if (years >= 6) return "senior";
  if (years >= 3) return "mid";
  return "junior";
}

function guessName(lines: string[], email: string | null): string | null {
  for (const line of lines.slice(0, 6)) {
    if (/curriculum|resume|cv|vitae|profile|summary/i.test(line)) continue;
    if (email && line.includes(email)) continue;
    if (line.length > 60 || /[:|]/.test(line)) continue;
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      words.every((word) => /^[\p{L}'.-]+$/u.test(word))
    ) {
      return line;
    }
  }
  return null;
}

function uniqueCities(text: string): string[] {
  const found: string[] = [];
  const chunks = text.split(/\n|,\s*/);
  for (const chunk of chunks) {
    const city = detectCity(chunk);
    if (city && !found.includes(city)) found.push(city);
  }
  if (found.length === 0) {
    const city = detectCity(text);
    if (city) found.push(city);
  }
  return found;
}

function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

const LEVELS = new Set(["student", "intern", "junior", "mid", "senior", "any"]);
const TYPES = new Set(["full_time", "part_time", "contract", "internship", "freelance"]);

export function parseProfileBlock(text: string): Partial<SeekerProfile> | null {
  const values = new Map<string, string>();
  for (const line of text.split("\n")) {
    const match = line
      .trim()
      .match(
        /^(name|field|skills|level|city|cities|remote|types|type|years|summary)\s*[:：]\s*(.+)$/i,
      );
    if (match) values.set(match[1].toLowerCase(), match[2].trim());
  }
  if (!values.has("skills") && !values.has("field")) return null;

  const levelRaw = (values.get("level") ?? "").toLowerCase().replace("-", "_").replace(" ", "");
  const level = LEVELS.has(levelRaw) ? (levelRaw as SeekerProfile["experienceLevel"]) : undefined;
  const typeTokens = (values.get("types") ?? values.get("type") ?? "")
    .split(/[,/]| and /i)
    .map((token) =>
      token
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_"),
    )
    .map((token) =>
      token === "fulltime" ? "full_time" : token === "parttime" ? "part_time" : token,
    )
    .filter((token): token is JobType => TYPES.has(token));
  const years = values.get("years");
  const remoteRaw = (values.get("remote") ?? "").toLowerCase();

  return {
    fullName: values.get("name"),
    field: values.get("field"),
    skills: values.has("skills")
      ? canonicalizeSkills(values.get("skills")!.split(/[,;/]/))
      : undefined,
    experienceLevel: level,
    yearsExperience: years && /^\d+/.test(years) ? Number.parseInt(years, 10) : undefined,
    preferredCities: (values.get("cities") ?? values.get("city") ?? "")
      .split(/[,/]/)
      .map((city) => city.trim())
      .filter(Boolean),
    remoteOk: remoteRaw ? /yes|true|ok|open|በርቀት/.test(remoteRaw) : undefined,
    jobTypes: typeTokens.length ? typeTokens : undefined,
    summary: values.get("summary"),
  };
}
