import { cityAmharic } from "../jobs/cities";
import { cosine, embedText } from "../jobs/embed";
import { canonicalizeSkills, skillLabel } from "../jobs/skills";
import type { ExperienceLevel, JobType, ScoreInputJob, SeekerProfile } from "../jobs/types";

export const INSTANT_THRESHOLD = 74;
export const DIGEST_THRESHOLD = 50;

export interface MatchScore {
  score: number;
  ruleScore: number;
  embedScore: number;
  reasons: string[];
  whyLine: string;
  whyLineAm: string;
  matchedSkills: string[];
  tier: "instant" | "digest" | "low";
  deadlinePassed: boolean;
}

const EXPERIENCE_FIT: Record<ExperienceLevel, Record<ExperienceLevel, number>> = {
  student: { student: 16, intern: 16, junior: 12, mid: 4, senior: 0, any: 10 },
  intern: { student: 14, intern: 16, junior: 14, mid: 6, senior: 1, any: 10 },
  junior: { student: 10, intern: 14, junior: 16, mid: 10, senior: 3, any: 12 },
  mid: { student: 4, intern: 6, junior: 10, mid: 16, senior: 12, any: 12 },
  senior: { student: 1, intern: 2, junior: 4, mid: 12, senior: 16, any: 12 },
  any: { student: 10, intern: 10, junior: 12, mid: 12, senior: 12, any: 12 },
};

const FIELD_GROUPS: { keys: string[]; skills: string[] }[] = [
  {
    keys: ["software", "computer", "developer", "programming", "ሶፍትዌር"],
    skills: [
      "javascript",
      "typescript",
      "react",
      "nextjs",
      "node",
      "python",
      "postgresql",
      "sql",
      "java",
      "git",
    ],
  },
  {
    keys: ["account", "finance", "ሂሳብ", "audit"],
    skills: ["accounting", "finance", "auditing", "excel", "banking"],
  },
  { keys: ["nurse", "health", "ነርስ", "ጤና"], skills: ["nursing", "public-health"] },
  { keys: ["market", "sales", "ሽያጭ"], skills: ["marketing", "sales", "customer-service"] },
  { keys: ["data", "analyst"], skills: ["data-analysis", "python", "sql", "excel", "power-bi"] },
  { keys: ["civil", "construction"], skills: ["civil-engineering"] },
  { keys: ["design", "graphic"], skills: ["graphic-design"] },
  { keys: ["law", "legal", "ህግ", "ሕግ"], skills: ["law"] },
  { keys: ["teach", "education", "መምህር"], skills: ["teaching"] },
  { keys: ["logistic", "procurement"], skills: ["logistics", "procurement"] },
  { keys: ["agricult", "ግብርና"], skills: ["agriculture"] },
  {
    keys: ["meal", "monitoring", "evaluation"],
    skills: ["monitoring-evaluation", "project-management"],
  },
];

const LEVEL_EN: Record<ExperienceLevel, string> = {
  student: "student",
  intern: "intern",
  junior: "junior",
  mid: "mid-level",
  senior: "senior",
  any: "",
};

const LEVEL_AM: Record<ExperienceLevel, string> = {
  student: "የተማሪ",
  intern: "ኢንተርን",
  junior: "ጀማሪ",
  mid: "መካከለኛ",
  senior: "ከፍተኛ",
  any: "",
};

const TYPE_EN: Record<JobType, string> = {
  full_time: "full-time",
  part_time: "part-time",
  contract: "contract",
  internship: "internship",
  freelance: "freelance",
  unknown: "",
};

const TYPE_AM: Record<JobType, string> = {
  full_time: "ቋሚ",
  part_time: "የትርፍ ጊዜ",
  contract: "ኮንትራት",
  internship: "ኢንተርንሺፕ",
  freelance: "ፍሪላንስ",
  unknown: "",
};

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function deadlineHasPassed(deadline: string | null | undefined, now: Date): boolean {
  if (!deadline) return false;
  const parsed = new Date(`${deadline.slice(0, 10)}T23:59:59Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < now.getTime();
}

function fieldPoints(profile: SeekerProfile, job: ScoreInputJob, experiencePoints: number): number {
  const field = (profile.field ?? "").normalize("NFC").toLowerCase();
  if (!field) return 6;
  const groups = FIELD_GROUPS.filter((group) => group.keys.some((key) => field.includes(key)));
  const blob = `${job.title} ${job.description} ${job.skills.join(" ")}`.toLowerCase();
  let points = 3;
  if (groups.length === 0) {
    const tokens = field.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 3);
    points = tokens.some((token) => blob.includes(token)) ? 10 : 3;
  } else {
    const skillHit = groups.some((group) =>
      group.skills.some((skill) => job.skills.includes(skill)),
    );
    const textHit = groups.some((group) => group.keys.some((key) => blob.includes(key)));
    points = skillHit ? 14 : textHit ? 9 : 3;
  }
  if (experiencePoints <= 2) return Math.min(points, 4);
  return points;
}

export function scoreMatch(
  profile: SeekerProfile,
  job: ScoreInputJob,
  options?: { now?: Date; profileVector?: number[]; jobVector?: number[] },
): MatchScore {
  const now = options?.now ?? new Date();
  const profileSkills = canonicalizeSkills(profile.skills);
  const jobSkills =
    job.skills.length > 0 ? job.skills : canonicalizeSkills([`${job.title}\n${job.description}`]);
  const matchedSkills = profileSkills.filter((skill) => jobSkills.includes(skill));
  const reasons: string[] = [];

  let skillPoints = 8;
  if (profileSkills.length > 0 && jobSkills.length > 0) {
    const recall = matchedSkills.length / Math.min(profileSkills.length, 5);
    const coverage = matchedSkills.length / Math.min(jobSkills.length, 6);
    skillPoints = Math.round((0.55 * recall + 0.45 * coverage) * 38);
  } else if (profileSkills.length > 0) {
    const blob = `${job.title} ${job.description}`.toLowerCase();
    const hits = profileSkills.filter(
      (skill) => blob.includes(skill.replaceAll("-", " ")) || blob.includes(skill),
    );
    skillPoints = Math.min(22, hits.length * 8);
  }
  if (matchedSkills.length > 0) {
    reasons.push(`Matched skills: ${matchedSkills.slice(0, 4).map(skillLabel).join(", ")}`);
  }

  const experiencePoints = EXPERIENCE_FIT[profile.experienceLevel][job.experienceLevel];
  if (experiencePoints >= 12 && job.experienceLevel !== "any") {
    reasons.push(`Experience fits a ${LEVEL_EN[job.experienceLevel]} role`);
  }

  const cities = profile.preferredCities.map((city) => city.toLowerCase());
  const cityMatch = Boolean(job.city && cities.includes(job.city.toLowerCase()));
  let locationPoints = 9;
  if (job.remote === "remote" && profile.remoteOk) {
    locationPoints = 16;
    reasons.push("Remote, and you are open to remote work");
  } else if (job.remote === "hybrid" && (profile.remoteOk || cityMatch)) {
    locationPoints = 14;
    reasons.push(cityMatch ? `Hybrid role in ${job.city}` : "Hybrid role");
  } else if (cityMatch) {
    locationPoints = 16;
    reasons.push(`Based in ${job.city}`);
  } else if (cities.length === 0 && job.remote !== "remote") {
    locationPoints = 11;
  } else if (job.remote === "remote" && !profile.remoteOk) {
    locationPoints = 4;
  } else if (job.city && cities.length > 0) {
    locationPoints = 2;
  }

  const preferredTypes = profile.jobTypes.filter((type) => type !== "unknown");
  let typePoints = 8;
  if (preferredTypes.length === 0) typePoints = 8;
  else if (job.jobType === "unknown") typePoints = 6;
  else if (preferredTypes.includes(job.jobType)) {
    typePoints = 10;
    reasons.push(`${TYPE_EN[job.jobType]} matches your preference`);
  } else typePoints = 1;

  let freshPoints = 3;
  if (job.postedAt) {
    const days = (now.getTime() - new Date(job.postedAt).getTime()) / 86_400_000;
    if (!Number.isNaN(days)) {
      if (days <= 7) freshPoints = 6;
      else if (days <= 21) freshPoints = 4;
      else if (days <= 45) freshPoints = 2;
      else freshPoints = 1;
    }
  }

  const field = fieldPoints(profile, job, experiencePoints);
  const ruleScore = Math.max(
    0,
    Math.min(
      100,
      skillPoints + field + experiencePoints + locationPoints + typePoints + freshPoints,
    ),
  );

  const profileText = [
    profile.field,
    profile.summary,
    profileSkills.join(" "),
    profile.experienceLevel,
    profile.preferredCities.join(" "),
  ]
    .filter(Boolean)
    .join("\n");
  const jobText = [
    job.title,
    job.company,
    job.city,
    jobSkills.join(" "),
    job.description.slice(0, 2000),
  ]
    .filter(Boolean)
    .join("\n");
  const useProvided =
    options?.profileVector &&
    options.jobVector &&
    options.profileVector.length > 0 &&
    options.profileVector.length === options.jobVector.length;
  const similarity = cosine(
    useProvided ? options!.profileVector! : embedText(profileText),
    useProvided ? options!.jobVector! : embedText(jobText),
  );
  const embedScore = Math.round(Math.max(0, similarity) * 100);
  let score = Math.round(0.75 * ruleScore + 0.25 * embedScore);
  const passed = deadlineHasPassed(job.deadline, now);
  if (passed) {
    score = Math.round(score * 0.4);
    reasons.push("Deadline has passed");
  }
  score = Math.max(0, Math.min(100, score));

  const shownSkills = matchedSkills.slice(0, 3).map(skillLabel);
  const level = LEVEL_EN[job.experienceLevel];
  const type = TYPE_EN[job.jobType];
  const roleWords = [level, type].filter(Boolean).join(" ");
  const place =
    job.remote === "remote"
      ? " It can be done remotely."
      : job.city
        ? ` It is based in ${job.city}.`
        : "";
  const whyLine = shownSkills.length
    ? `Your ${joinAnd(shownSkills)} skills line up with this ${roleWords || "open"} role.${place}`
    : `This ${job.title} role overlaps your ${profile.field || "profile"}${job.city ? ` and is based in ${job.city}` : ""}.`;

  const amPlace =
    job.remote === "remote" ? " ሥራው በርቀት ነው።" : job.city ? ` ቦታው ${cityAmharic(job.city)} ነው።` : "";
  const amRole = [LEVEL_AM[job.experienceLevel], TYPE_AM[job.jobType]].filter(Boolean).join(" ");
  const whyLineAm = shownSkills.length
    ? `የእርስዎ ${joinAnd(shownSkills)} ክህሎት ከዚህ ${amRole || "ክፍት"} ሥራ ጋር ይጣጣማል።${amPlace}`
    : `ይህ ሥራ ከእርስዎ ${profile.field || "መገለጫ"} ጋር በከፊል ይጣጣማል።${amPlace}`;

  const tier = passed
    ? "low"
    : score >= INSTANT_THRESHOLD
      ? "instant"
      : score >= DIGEST_THRESHOLD
        ? "digest"
        : "low";

  return {
    score,
    ruleScore,
    embedScore,
    reasons,
    whyLine: whyLine.replace(/\s+/g, " ").trim(),
    whyLineAm: whyLineAm.replace(/[ \t]+/g, " ").trim(),
    matchedSkills,
    tier,
    deadlinePassed: passed,
  };
}
