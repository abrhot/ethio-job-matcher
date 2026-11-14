import { describe, expect, it } from "vitest";
import { dedupePostings } from "@/lib/jobs/dedupe";
import { fingerprintFor, normalizePosting } from "@/lib/jobs/normalize";
import { loadSamplePostings } from "@/lib/sources/sample";
import type { RawPosting } from "@/lib/jobs/types";

describe("dedupe", () => {
  it("collapses the same role from two sources and keeps the richer text", () => {
    const first = normalizePosting({
      externalId: "a",
      sourceKey: "web",
      title: "Junior Accountant",
      company: "Blue Nile Microfinance",
      location: "Addis Ababa",
      url: "https://example.com/a",
      postedAt: "2026-11-02T00:00:00.000Z",
      text: "Junior Accountant at Blue Nile Microfinance in Addis Ababa. Full-time accounting role with Excel. Deadline: 1 December 2026. A short note.",
    });
    const second = normalizePosting({
      externalId: "b",
      sourceKey: "telegram:jobs",
      title: "junior   accountant",
      company: "Blue Nile Microfinance",
      location: "Addis Ababa",
      url: "https://t.me/jobs/2",
      postedAt: "2026-11-01T00:00:00.000Z",
      text: "Junior Accountant\nCompany: Blue Nile Microfinance\nLocation: Addis Ababa\nJob type: Full-time\nExcel and accounting. This description is intentionally much longer so it should win the richness check when the same vacancy is reposted. Deadline: 1 December 2026.",
    });
    expect(first.fingerprint).toBe(second.fingerprint);
    const { unique, duplicateCount } = dedupePostings([first, second]);
    expect(duplicateCount).toBe(1);
    expect(unique).toHaveLength(1);
    expect(unique[0]?.description.length).toBe(second.description.length);
    expect(unique[0]?.postedAt).toBe("2026-11-01T00:00:00.000Z");
  });

  it("does not merge different companies", () => {
    const left = fingerprintFor({
      title: "Accountant",
      company: "Blue Nile",
      city: "Addis Ababa",
      description: "accounting",
    });
    const right = fingerprintFor({
      title: "Accountant",
      company: "Awura",
      city: "Addis Ababa",
      description: "accounting",
    });
    expect(left).not.toBe(right);
  });

  it("folds Unicode compatibility so the same title is not stored twice", () => {
    const composed = "Café Developer";
    const decomposed = "Cafe\u0301 Developer";
    expect(decomposed).not.toBe(composed);
    expect(
      fingerprintFor({
        title: composed,
        company: "Abeba Software",
        city: "Addis Ababa",
        description: "",
      }),
    ).toBe(
      fingerprintFor({
        title: decomposed,
        company: "Abeba Software",
        city: "Addis Ababa",
        description: "",
      }),
    );
    const amharic = "የሶፍትዌር ገንቢ";
    expect(
      fingerprintFor({
        title: amharic,
        company: "Abeba Software",
        city: "Addis Ababa",
        description: "",
      }),
    ).toBe(
      fingerprintFor({
        title: amharic.normalize("NFC"),
        company: "Abeba Software",
        city: "Addis Ababa",
        description: "",
      }),
    );
  });

  it("dedupes the shipped sample board", () => {
    const raw: RawPosting[] = loadSamplePostings();
    const normalized = raw.map((posting) => normalizePosting(posting));
    const { unique, duplicateCount } = dedupePostings(normalized);
    expect(duplicateCount).toBeGreaterThan(0);
    expect(unique.length).toBe(normalized.length - duplicateCount);
    expect(unique.every((job) => job.title.length > 0 && job.fingerprint.length === 32)).toBe(true);
  });
});
