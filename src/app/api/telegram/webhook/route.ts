import { timingSafeEqual } from "node:crypto";
import { webhookCallback } from "grammy";
import { getBot } from "@/lib/telegram/bot";

function same(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const bot = getBot();
  if (!bot) return new Response("Bot token is not configured", { status: 503 });
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (!same(header, secret)) return new Response("unauthorized", { status: 401 });
  }
  return webhookCallback(bot, "std/http")(request);
}
