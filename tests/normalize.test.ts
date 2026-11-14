import { describe, expect, it } from "vitest";
import { ethiopianToGregorian, parseDeadlineFromText, toIsoDate } from "@/lib/jobs/dates";
import { normalizePosting } from "@/lib/jobs/normalize";
import type { RawPosting } from "@/lib/jobs/types";

function posting(text: string, extra: Partial<RawPosting> = {}): RawPosting {
  return {
    externalId: "t",
    sourceKey: "sample",
    text,
    url: "https://example.com/job",
    ...extra,
  };
}

describe("Ethiopian calendar", () => {
  it("converts known new-year and Hidar dates", () => {
    const newYear = ethiopianToGregorian(2017, 1, 1);
    expect(toIsoDate(newYear.year, newYear.month, newYear.day)).toBe("2024-09-11");
    const ny2016 = ethiopianToGregorian(2016, 1, 1);
    expect(toIsoDate(ny2016.year, ny2016.month, ny2016.day)).toBe("2023-09-12");
    const hidar = ethiopianToGregorian(2019, 3, 5);
    expect(toIsoDate(hidar.year, hidar.month, hidar.day)).toBe("2026-11-14");
    const pagume = ethiopianToGregorian(2015, 13, 6);
    expect(toIsoDate(pagume.year, pagume.month, pagume.day)).toBe("2023-09-11");
  });

  it("rejects pagume 6 in a non-leap year", () => {
    expect(() => ethiopianToGregorian(2016, 13, 6)).toThrow(/Invalid Ethiopian date/);
  });
});

describe("normalizePosting", () => {
  it("reads an English vacancy", () => {
    const job = normalizePosting(
      posting(`Junior Full-Stack Developer
Company: Entoto Labs
Location: Addis Ababa
Job type: Full-time
Experience: Junior (0-2 years)
Deadline: 15 December 2026

We need React, Next.js, Node.js, and PostgreSQL.
How to apply: careers@entotolabs.example`),
    );
    expect(job.title).toBe("Junior Full-Stack Developer");
    expect(job.company).toBe("Entoto Labs");
    expect(job.city).toBe("Addis Ababa");
    expect(job.remote).toBe("onsite");
    expect(job.jobType).toBe("full_time");
    expect(job.experienceLevel).toBe("junior");
    expect(job.deadline).toBe("2026-12-15");
    expect(job.skills).toEqual(expect.arrayContaining(["react", "nextjs", "node", "postgresql"]));
    expect(job.applyUrl).toBe("mailto:careers@entotolabs.example");
    expect(job.language).toBe("en");
  });

  it("keeps Amharic text and maps city and job type", () => {
    const job = normalizePosting(
      posting(`የሶፍትዌር ገንቢ
ድርጅት: Abeba Software
ቦታ: አዲስ አበባ
ዓይነት: ቋሚ
ልምድ: 1 ዓመት
የመጨረሻ ቀን: 20/12/2026

React እና Node.js የሚያውቅ ጀማሪ ፕሮግራመር። PostgreSQL እውቀት ተጨማሪ ነው።
ያመልክቱ: jobs@abeba-software.example`),
    );
    expect(job.city).toBe("Addis Ababa");
    expect(job.company).toBe("Abeba Software");
    expect(job.jobType).toBe("full_time");
    expect(job.experienceLevel).toBe("junior");
    expect(job.deadline).toBe("2026-12-20");
    expect(job.description).toContain("አዲስ አበባ");
    expect(job.skills).toEqual(expect.arrayContaining(["react", "node", "postgresql"]));
    expect(job.language).not.toBe("en");
  });

  it("converts an Ethiopian-calendar deadline", () => {
    const deadline = parseDeadlineFromText("የመጨረሻ ቀን: 5/3/2019 ዓ.ም");
    expect(deadline).toBe("2026-11-14");
  });

  it("marks remote roles and does not treat java as javascript", () => {
    const job = normalizePosting(
      posting(`Senior Java Architect
Company: Selam Community Bank
Location: Remote
Job type: Full-time
Experience: minimum 7 years
Deadline: Nov 20, 2026

Java and banking systems only.`),
    );
    expect(job.remote).toBe("remote");
    expect(job.experienceLevel).toBe("senior");
    expect(job.deadline).toBe("2026-11-20");
    expect(job.skills).toContain("java");
    expect(job.skills).not.toContain("javascript");
  });

  it("uses the same fingerprint for Latin and Amharic city names", () => {
    const english = normalizePosting(
      posting("Accountant\nCompany: Blue Nile\nLocation: Addis Ababa\nFull-time", {
        title: "Junior Accountant",
        company: "Blue Nile",
      }),
    );
    const amharic = normalizePosting(
      posting("Accountant\nድርጅት: Blue Nile\nቦታ: አዲስ አበባ\nቋሚ", {
        title: "Junior Accountant",
        company: "Blue Nile",
        location: "አዲስ አበባ",
      }),
    );
    expect(english.fingerprint).toBe(amharic.fingerprint);
  });
});
