import { describe, expect, it } from "vitest";
import { normalizePosting } from "@/lib/jobs/normalize";
import { scoreMatch } from "@/lib/matching/score";
import type { RawPosting, SeekerProfile } from "@/lib/jobs/types";

const now = new Date("2026-11-14T12:00:00.000Z");

const hana: SeekerProfile = {
  fullName: "Hana Tadesse",
  field: "Software Engineering",
  skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Python"],
  experienceLevel: "student",
  yearsExperience: 0,
  preferredCities: ["Addis Ababa"],
  remoteOk: true,
  jobTypes: ["full_time", "internship"],
  summary: "Fifth-year software engineering student in Addis Ababa.",
};

const dawit: SeekerProfile = {
  fullName: "Dawit Bekele",
  field: "Accounting",
  skills: ["Accounting", "Excel", "Finance"],
  experienceLevel: "junior",
  yearsExperience: 1,
  preferredCities: ["Addis Ababa"],
  remoteOk: false,
  jobTypes: ["full_time"],
};

function scoreText(profile: SeekerProfile, text: string, extra: Partial<RawPosting> = {}) {
  const job = normalizePosting({
    externalId: "x",
    sourceKey: "sample",
    text,
    url: "https://example.com/x",
    postedAt: "2026-11-10T00:00:00.000Z",
    ...extra,
  });
  return scoreMatch(profile, job, { now });
}

const fullstack = `Junior Full-Stack Developer
Company: Entoto Labs
Location: Addis Ababa
Job type: Full-time
Experience: Junior (0-2 years)
Deadline: 15 December 2026
React, Next.js, Node.js, and PostgreSQL.`;

const accountant = `Junior Accountant
Company: Blue Nile Microfinance
Location: Addis Ababa
Job type: Full-time
Experience: 1 year
Deadline: 18 December 2026
Accounting, Excel, and finance for a microfinance institution.`;

const architect = `Senior Java Architect
Company: Selam Community Bank
Location: Addis Ababa
Job type: Full-time
Experience: minimum 7 years
Deadline: 10 January 2027
Lead Java banking systems.`;

describe("scoreMatch", () => {
  it("ranks a software student above an accountant for a React role", () => {
    const student = scoreText(hana, fullstack);
    const accounts = scoreText(dawit, fullstack);
    expect(student.score).toBeGreaterThan(74);
    expect(student.tier).toBe("instant");
    expect(student.score).toBeGreaterThan(accounts.score);
    expect(student.whyLine).toMatch(/React/);
    expect(student.whyLine).toMatch(/Addis Ababa/);
    expect(student.whyLineAm).toContain("አዲስ አበባ");
    expect(student.matchedSkills).toEqual(expect.arrayContaining(["react", "node", "postgresql"]));
  });

  it("ranks an accountant above a software student for a ledger role", () => {
    const accounts = scoreText(dawit, accountant);
    const student = scoreText(hana, accountant);
    expect(accounts.score).toBeGreaterThan(student.score);
    expect(accounts.score).toBeGreaterThan(60);
    expect(student.score).toBeLessThan(50);
  });

  it("keeps a senior architect off a student's instant list", () => {
    const result = scoreText(hana, architect);
    expect(result.score).toBeLessThan(50);
    expect(result.tier).toBe("low");
  });

  it("matches Amharic postings to English skill names", () => {
    const result = scoreText(
      hana,
      `የሶፍትዌር ገንቢ
ድርጅት: Abeba Software
ቦታ: አዲስ አበባ
ዓይነት: ቋሚ
ልምድ: 1 ዓመት
የመጨረሻ ቀን: 20/12/2026
React እና Node.js እና PostgreSQL`,
    );
    expect(result.score).toBeGreaterThan(65);
    expect(result.matchedSkills).toEqual(expect.arrayContaining(["react", "node"]));
  });

  it("drops a closed vacancy below the digest line", () => {
    const open = scoreText(hana, fullstack);
    const closed = scoreText(hana, fullstack.replace("15 December 2026", "1 November 2026"));
    expect(closed.deadlinePassed).toBe(true);
    expect(closed.score).toBeLessThan(open.score);
    expect(closed.score).toBeLessThan(50);
    expect(closed.tier).toBe("low");
  });

  it("is deterministic", () => {
    const left = scoreText(hana, fullstack);
    const right = scoreText(hana, fullstack);
    expect(left).toEqual(right);
  });

  it("prefers a city match over a remote-only role when remote is declined", () => {
    const onsite = scoreText(dawit, accountant);
    const remote = scoreText(
      dawit,
      accountant
        .replace("Location: Addis Ababa", "Location: Remote")
        .replace("Full-time", "Full-time\nRemote"),
    );
    expect(onsite.score).toBeGreaterThan(remote.score);
  });
});
