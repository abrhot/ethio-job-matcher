import type { ScoreInputJob, SeekerProfile } from "../jobs/types";
import { skillLabel } from "../jobs/skills";

export async function rewriteWhyLine(input: {
  draft: string;
  title: string;
  skills: string[];
  summary?: string | null;
}): Promise<string> {
  const key = process.env.LLM_API_KEY;
  if (!key) return input.draft;
  try {
    const base = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.LLM_MODEL || "gpt-4o-mini";
    const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 90,
        messages: [
          {
            role: "system",
            content:
              "Write one short sentence on why this job fits the seeker. Plain language. Do not invent requirements. Keep Amharic words unchanged.",
          },
          {
            role: "user",
            content: `Draft: ${input.draft}\nJob: ${input.title}\nMatched skills: ${input.skills.join(", ")}\nSummary: ${input.summary ?? ""}`,
          },
        ],
      }),
    });
    if (!response.ok) return input.draft;
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text || text.length > 320) return input.draft;
    return text.replace(/^["']|["']$/g, "");
  } catch {
    return input.draft;
  }
}

export async function embedWithLlm(text: string): Promise<number[] | null> {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;
  try {
    const base = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    const response = await fetch(`${base.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: { embedding?: number[] }[] };
    const vector = payload.data?.[0]?.embedding;
    return Array.isArray(vector) ? vector : null;
  } catch {
    return null;
  }
}

export function draftCoverLetter(profile: SeekerProfile, job: ScoreInputJob): string {
  const name = profile.fullName?.trim() || "Applicant";
  const skills = profile.skills.slice(0, 5).map(skillLabel).join(", ");
  const company = job.company || "the hiring team";
  const years =
    profile.yearsExperience && profile.yearsExperience > 0
      ? ` with about ${profile.yearsExperience} year${profile.yearsExperience === 1 ? "" : "s"} of practice`
      : "";
  const place = job.city
    ? `I am interested in the ${job.city} opening.`
    : "I can start a conversation this week.";
  const remote =
    profile.remoteOk && job.remote !== "onsite" ? " Remote or hybrid work is fine for me." : "";

  return `Dear hiring team at ${company},

I am writing to apply for the ${job.title} role. I am a ${profile.experienceLevel} ${profile.field || "candidate"}${years}.

What I can bring is ${skills || "the experience in my CV"}. ${place}${remote}

I would be glad to walk through a recent project and how it maps to this vacancy.

Sincerely,
${name}`;
}

export async function tailorCoverLetter(
  profile: SeekerProfile,
  job: ScoreInputJob,
): Promise<{ text: string; generatedBy: "template" | "llm" }> {
  const template = draftCoverLetter(profile, job);
  const key = process.env.LLM_API_KEY;
  if (!key) return { text: template, generatedBy: "template" };
  try {
    const base = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.LLM_MODEL || "gpt-4o-mini";
    const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 420,
        messages: [
          {
            role: "system",
            content:
              "Draft a concise cover letter for a job in Ethiopia. Use only facts from the profile and job. About 160 words. No markdown.",
          },
          {
            role: "user",
            content: `Profile:\n${JSON.stringify(profile)}\n\nJob:\n${job.title}\n${job.company ?? ""}\n${job.description.slice(0, 1500)}\n\nFallback if unsure:\n${template}`,
          },
        ],
      }),
    });
    if (!response.ok) return { text: template, generatedBy: "template" };
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return { text: template, generatedBy: "template" };
    return { text, generatedBy: "llm" };
  } catch {
    return { text: template, generatedBy: "template" };
  }
}
