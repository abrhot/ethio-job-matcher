import { describe, expect, it } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { readSession, signSession, verifyTelegramLogin } from "@/lib/auth/token";
import { parseEthioJobsHtml } from "@/lib/sources/ethiojobs";
import { parseTelegramChannelHtml } from "@/lib/sources/telegram";
import { assertSafeCv, CvRejectedError } from "@/lib/profile/cv-guard";
import { extractProfileFromText, parseProfileBlock } from "@/lib/profile/extract";
import { ChapaProvider, TelebirrProvider } from "@/lib/payments/providers";
import { getPaymentProvider } from "@/lib/payments";
import { StubProvider } from "@/lib/payments/stub";
import { PaymentNotConfiguredError } from "@/lib/payments/types";

describe("profile extraction", () => {
  it("pulls skills, field, and contact lines out of CV text", () => {
    const profile = extractProfileFromText(`Hana Tadesse
hana@university.example
+251911223344
Software Engineering, fifth-year student
BSc in Software Engineering, Addis Ababa University
Skills: React, Node.js, PostgreSQL, Python
Addis Ababa`);
    expect(profile.fullName).toBe("Hana Tadesse");
    expect(profile.email).toBe("hana@university.example");
    expect(profile.phone).toBe("+251911223344");
    expect(profile.field).toBe("Software Engineering");
    expect(profile.skills).toEqual(
      expect.arrayContaining(["react", "node", "postgresql", "python"]),
    );
    expect(profile.preferredCities).toContain("Addis Ababa");
    expect(profile.experienceLevel).toBe("student");
  });

  it("parses a one-message profile", () => {
    const parsed = parseProfileBlock(`Field: Accounting
Skills: Excel, Accounting
Level: junior
City: Addis Ababa
Remote: no
Types: full-time`);
    expect(parsed?.field).toBe("Accounting");
    expect(parsed?.skills).toEqual(expect.arrayContaining(["excel", "accounting"]));
    expect(parsed?.experienceLevel).toBe("junior");
    expect(parsed?.remoteOk).toBe(false);
    expect(parsed?.jobTypes).toEqual(["full_time"]);
  });
});

describe("CV guard", () => {
  it("accepts a PDF signature and rejects a renamed text file", () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(assertSafeCv("cv.pdf", pdf)).toBe("cv.pdf");
    const text = new TextEncoder().encode(
      "this is not a pdf but it is long enough to not be empty!!",
    );
    expect(() => assertSafeCv("resume.pdf", text)).toThrow(CvRejectedError);
    expect(() => assertSafeCv("../secret.pdf", pdf)).toThrow(CvRejectedError);
    expect(() => assertSafeCv("notes.txt", text)).toThrow(CvRejectedError);
  });
});

describe("sources", () => {
  it("reads jobs embedded in an EthioJobs homepage", () => {
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          initialState: {
            api: {
              queries: {
                "getPaginatedJob(1)": {
                  data: {
                    data: [
                      {
                        slug: "demo-role",
                        title: "Program Officer",
                        description: "<p>Addis Ababa. Full-time monitoring and evaluation.</p>",
                        date_published: "2026-11-01T00:00:00.000Z",
                        date_expiry: "2026-12-01T00:00:00.000Z",
                        location_type: "Office",
                        state: "Addis Ababa",
                        company: { name: "Timket Development" },
                        catalogs: [{ name: "NGO" }],
                        application_email: "jobs@timket.example",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    })}</script></html>`;
    const jobs = parseEthioJobsHtml(html);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.company).toBe("Timket Development");
    expect(jobs[0]?.url).toBe("https://ethiojobs.net/job/demo-role");
    expect(jobs[0]?.text).toContain("monitoring and evaluation");
    expect(jobs[0]?.applyUrl).toBe("mailto:jobs@timket.example");
    expect(jobs[0]?.remoteHint).toBe("Office");
  });

  it("reads a public Telegram channel preview", () => {
    const html = `
      <div class="tgme_widget_message_wrap">
        <div class="tgme_widget_message" data-post="ethiojobsofficial/16419">
          <div class="tgme_widget_message_text js-message_text" dir="auto"><b>Product Designer</b><br/>Location: Addis Ababa<br/>Deadline: Nov 20, 2026<br/>React is not required. Four years of UI experience.</div>
          <a class="tgme_widget_message_date" href="https://t.me/ethiojobsofficial/16419"><time datetime="2026-11-14T06:10:29+00:00"></time></a>
          <a class="tgme_widget_message_inline_button url_button" href="https://example.com/apply"><span>Apply Now</span></a>
        </div>
      </div>`;
    const jobs = parseTelegramChannelHtml(html, "ethiojobsofficial");
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.externalId).toBe("16419");
    expect(jobs[0]?.sourceKey).toBe("telegram:ethiojobsofficial");
    expect(jobs[0]?.text).toContain("Product Designer");
    expect(jobs[0]?.text).toContain("Addis Ababa");
    expect(jobs[0]?.applyUrl).toBe("https://example.com/apply");
    expect(jobs[0]?.postedAt).toBe("2026-11-14T06:10:29+00:00");
  });
});

describe("payments", () => {
  it("defaults to the stub and never calls a payment network", async () => {
    const previous = process.env.PAYMENT_PROVIDER;
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.CHAPA_SECRET_KEY;
    const provider = getPaymentProvider();
    expect(provider).toBeInstanceOf(StubProvider);
    const checkout = await provider.createCheckout({
      userId: "user",
      plan: "premium_monthly",
      amountEtb: 299,
      appUrl: "http://127.0.0.1:3847",
    });
    expect(checkout.reference).toMatch(/^stub_[a-z0-9]+$/);
    expect(checkout.checkoutUrl).toContain("/upgrade/confirm?ref=");
    expect(await provider.verify(checkout.reference)).toBe("pending");
    const fetchCalls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      fetchCalls.push(String(input));
      throw new Error("network should not be used");
    }) as typeof fetch;
    await expect(
      new ChapaProvider().createCheckout({
        userId: "user",
        plan: "premium_monthly",
        amountEtb: 299,
        appUrl: "http://127.0.0.1:3847",
      }),
    ).rejects.toBeInstanceOf(PaymentNotConfiguredError);
    await expect(
      new TelebirrProvider().createCheckout({
        userId: "user",
        plan: "premium_monthly",
        amountEtb: 299,
        appUrl: "http://127.0.0.1:3847",
      }),
    ).rejects.toBeInstanceOf(PaymentNotConfiguredError);
    expect(fetchCalls).toEqual([]);
    globalThis.fetch = original;
    if (previous) process.env.PAYMENT_PROVIDER = previous;
  });
});

describe("session and Telegram login", () => {
  it("round-trips a session and rejects tampering", () => {
    process.env.SESSION_SECRET = "test-session-secret-must-be-32-characters";
    const token = signSession("user_123", 1_700_000_000_000);
    expect(readSession(token, 1_700_000_000_000)).toBe("user_123");
    expect(readSession(`${token}x`, 1_700_000_000_000)).toBeNull();
    expect(readSession(token, 1_700_000_000_000 + 40 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("checks the Telegram login hash the way the widget spec describes", () => {
    const botToken = "123456:telegram-test-token";
    const fields: Record<string, string> = {
      id: "42",
      first_name: "Hana",
      username: "hana",
      auth_date: "1700000000",
    };
    const check = Object.entries(fields)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    const secret = createHash("sha256").update(botToken).digest();
    fields.hash = createHmac("sha256", secret).update(check).digest("hex");
    expect(verifyTelegramLogin(fields, botToken, 1_700_000_000_000)).toEqual({ ok: true });
    expect(
      verifyTelegramLogin({ ...fields, hash: "0".repeat(64) }, botToken, 1_700_000_000_000).ok,
    ).toBe(false);
    expect(verifyTelegramLogin(fields, botToken, 1_700_000_000_000 + 2 * 86_400 * 1000).ok).toBe(
      false,
    );
  });
});
