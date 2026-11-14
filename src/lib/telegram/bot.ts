import { Bot, type Context } from "grammy";
import { prisma } from "../db";
import { parseProfileBlock } from "../profile/extract";
import { profileFromCv } from "../profile/cv";
import { saveUserProfile } from "../profile/save";
import { copy, localeOf, type Locale } from "./messages";

type Step = "field" | "skills" | "level" | "city" | "remote" | "types";

const STEPS: Step[] = ["field", "skills", "level", "city", "remote", "types"];
const wizard = new Map<string, { step: Step; draft: Record<string, string> }>();

const PROMPTS: Record<Locale, Record<Step, string>> = {
  en: {
    field: "What field are you in? Example: Software Engineering",
    skills: "List your skills, separated by commas.",
    level: "Experience level: student, intern, junior, mid, or senior.",
    city: "Preferred city? Example: Addis Ababa. Say 'any' if you have no preference.",
    remote: "Open to remote work? yes or no",
    types: "Job types, comma separated: full-time, internship, contract, part-time, freelance.",
  },
  am: {
    field: "የትምህርት ወይም የሥራ መስክዎ ምንድን ነው? ምሳሌ፦ Software Engineering",
    skills: "ክህሎቶችዎን በኮማ ይለዩ።",
    level: "የልምድ ደረጃ፦ student, intern, junior, mid, ወይም senior።",
    city: "የሚፈልጉት ከተማ? ምሳሌ፦ Addis Ababa። ምርጫ ከሌለ any ይበሉ።",
    remote: "በርቀት መሥራት ይፈልጋሉ? yes ወይም no",
    types: "የሥራ ዓይነት፦ full-time, internship, contract, part-time, freelance።",
  },
};

async function ensureUser(ctx: Context) {
  const from = ctx.from;
  if (!from) throw new Error("Missing Telegram user");
  return prisma.user.upsert({
    where: { telegramId: String(from.id) },
    create: {
      telegramId: String(from.id),
      telegramUsername: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      locale: from.language_code === "am" ? "am" : "en",
    },
    update: {
      telegramUsername: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
    },
  });
}

function linesOf(profile: {
  fullName: string | null;
  field: string | null;
  skills: string[];
  experienceLevel: string;
  preferredCities: string[];
  remoteOk: boolean;
  jobTypes: string[];
}) {
  return [
    profile.fullName,
    profile.field ? `Field: ${profile.field}` : null,
    profile.skills.length ? `Skills: ${profile.skills.join(", ")}` : null,
    `Level: ${profile.experienceLevel}`,
    profile.preferredCities.length ? `City: ${profile.preferredCities.join(", ")}` : null,
    `Remote: ${profile.remoteOk ? "yes" : "no"}`,
    profile.jobTypes.length ? `Types: ${profile.jobTypes.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function createBot(token: string) {
  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const user = await ensureUser(ctx);
    await ctx.reply(copy[localeOf(user.locale)].welcome);
  });

  bot.command("help", async (ctx) => {
    const user = await ensureUser(ctx);
    await ctx.reply(copy[localeOf(user.locale)].help);
  });

  bot.command("language", async (ctx) => {
    const user = await ensureUser(ctx);
    const argument = ctx.match?.toString().trim().toLowerCase();
    const locale: Locale =
      argument === "am" ? "am" : argument === "en" ? "en" : user.locale === "am" ? "en" : "am";
    await prisma.user.update({ where: { id: user.id }, data: { locale } });
    await ctx.reply(copy[locale].languageSet);
  });

  bot.command("alerts", async (ctx) => {
    const user = await ensureUser(ctx);
    const locale = localeOf(user.locale);
    const mode = ctx.match?.toString().trim().toLowerCase();
    if (mode !== "instant" && mode !== "digest" && mode !== "both" && mode !== "off") {
      await ctx.reply(
        locale === "am"
          ? "ይጠቀሙ፦ /alerts instant, digest, both, ወይም off"
          : "Use /alerts instant, digest, both, or off.",
      );
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { alertMode: mode } });
    await ctx.reply(copy[locale].alertsSet(mode));
  });

  bot.command("upgrade", async (ctx) => {
    const user = await ensureUser(ctx);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3847";
    await ctx.reply(`${copy[localeOf(user.locale)].upgrade}\n${appUrl}/upgrade`);
  });

  bot.command("cancel", async (ctx) => {
    if (ctx.from) wizard.delete(String(ctx.from.id));
    await ctx.reply("Cancelled.");
  });

  bot.command("profile", async (ctx) => {
    const user = await ensureUser(ctx);
    const locale = localeOf(user.locale);
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    wizard.set(String(ctx.from!.id), { step: "field", draft: {} });
    const current = profile ? `${linesOf(profile)}\n\n` : "";
    await ctx.reply(`${current}${PROMPTS[locale].field}`);
  });

  bot.command("matches", async (ctx) => {
    const user = await ensureUser(ctx);
    const locale = localeOf(user.locale);
    const matches = await prisma.match.findMany({
      where: { userId: user.id, dismissed: false, score: { gte: 48 }, job: { isActive: true } },
      include: { job: true },
      orderBy: { score: "desc" },
      take: 5,
    });
    if (matches.length === 0) {
      await ctx.reply(copy[locale].noMatches);
      return;
    }
    const text = matches
      .map((match, index) => {
        const why = locale === "am" ? match.whyLineAm : match.whyLine;
        const link = match.job.applyUrl || match.job.sourceUrl;
        return `${index + 1}. ${match.job.title} (${Math.round(match.score)})\n${why}\n${link}`;
      })
      .join("\n\n");
    await ctx.reply(text.slice(0, 4000));
  });

  bot.on("message:document", async (ctx) => {
    const user = await ensureUser(ctx);
    const locale = localeOf(user.locale);
    const document = ctx.message.document;
    const name = document.file_name || "cv.pdf";
    try {
      const file = await ctx.api.getFile(document.file_id);
      if (!file.file_path) throw new Error("Telegram did not return a file path");
      const response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`);
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const extracted = await profileFromCv(name, bytes);
      await saveUserProfile(user.id, {
        fullName: extracted.profile.fullName ?? undefined,
        field: extracted.profile.field,
        skills: extracted.profile.skills,
        experienceLevel: extracted.profile.experienceLevel,
        yearsExperience: extracted.profile.yearsExperience,
        preferredCities: extracted.profile.preferredCities,
        education: extracted.profile.education,
        summary: extracted.profile.summary,
        phone: extracted.profile.phone,
        rawCvText: extracted.text.slice(0, 20_000),
        cvFileName: name,
      });
      wizard.delete(String(ctx.from.id));
      const saved = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
      await ctx.reply(`${copy[locale].saved}\n\n${linesOf(saved)}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : copy[locale].cvFail;
      await ctx.reply(`${copy[locale].cvFail}\n${detail}`);
    }
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    const user = await ensureUser(ctx);
    const locale = localeOf(user.locale);
    const block = parseProfileBlock(ctx.message.text);
    if (block) {
      await saveUserProfile(user.id, {
        fullName: block.fullName,
        field: block.field,
        skills: block.skills,
        experienceLevel: block.experienceLevel,
        yearsExperience: block.yearsExperience,
        preferredCities: block.preferredCities,
        remoteOk: block.remoteOk,
        jobTypes: block.jobTypes,
        summary: block.summary,
      });
      wizard.delete(String(ctx.from.id));
      await ctx.reply(copy[locale].saved);
      return;
    }

    const state = wizard.get(String(ctx.from.id));
    if (!state) {
      await ctx.reply(copy[locale].unknown);
      return;
    }
    state.draft[state.step] = ctx.message.text.trim();
    const index = STEPS.indexOf(state.step);
    const next = STEPS[index + 1];
    if (next) {
      state.step = next;
      wizard.set(String(ctx.from.id), state);
      await ctx.reply(PROMPTS[locale][next]);
      return;
    }
    const draft = state.draft;
    wizard.delete(String(ctx.from.id));
    const parsed = parseProfileBlock(
      [
        `Field: ${draft.field ?? ""}`,
        `Skills: ${draft.skills ?? ""}`,
        `Level: ${draft.level ?? "junior"}`,
        `City: ${draft.city ?? ""}`,
        `Remote: ${draft.remote ?? "yes"}`,
        `Types: ${draft.types ?? "full-time"}`,
      ].join("\n"),
    );
    await saveUserProfile(user.id, {
      field: parsed?.field,
      skills: parsed?.skills,
      experienceLevel: parsed?.experienceLevel ?? "junior",
      preferredCities: parsed?.preferredCities?.filter((city) => city.toLowerCase() !== "any"),
      remoteOk: parsed?.remoteOk ?? true,
      jobTypes: parsed?.jobTypes,
    });
    await ctx.reply(copy[locale].saved);
  });

  bot.catch((error) => {
    console.error("[sera:bot]", error);
  });

  return bot;
}

let singleton: Bot | null = null;

export function getBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  if (!singleton) singleton = createBot(token);
  return singleton;
}
