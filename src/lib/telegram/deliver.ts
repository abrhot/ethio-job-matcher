import type { Locale } from "./messages";

export interface AlertPayload {
  telegramId: string;
  locale: Locale;
  score: number;
  why: string;
  title: string;
  company?: string | null;
  city?: string | null;
  url: string;
}

export function formatAlert(payload: AlertPayload): string {
  const place = [payload.company, payload.city].filter(Boolean).join(" · ");
  if (payload.locale === "am") {
    return [`ሥራ ${payload.score}/100 — ${payload.title}`, place, payload.why, payload.url]
      .filter(Boolean)
      .join("\n");
  }
  return [`${payload.title} · ${payload.score}/100`, place, payload.why, payload.url]
    .filter(Boolean)
    .join("\n");
}

export function formatDigest(
  locale: Locale,
  items: { title: string; score: number; why: string; url: string }[],
): string {
  const header = locale === "am" ? "የዕለቱ ሥራዎች" : "Today's Sera matches";
  const body = items
    .map((item, index) => `${index + 1}. ${item.title} (${item.score})\n${item.why}\n${item.url}`)
    .join("\n\n");
  return `${header}\n\n${body}`;
}

async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000),
      disable_web_page_preview: false,
    }),
  });
  return response.ok;
}

export async function sendMatchAlert(payload: AlertPayload): Promise<boolean> {
  return sendTelegram(payload.telegramId, formatAlert(payload));
}

export async function sendDigest(input: {
  telegramId: string;
  locale: Locale;
  items: { title: string; score: number; why: string; url: string }[];
}): Promise<boolean> {
  return sendTelegram(input.telegramId, formatDigest(input.locale, input.items));
}
