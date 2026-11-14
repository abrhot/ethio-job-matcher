import { setSessionCookie } from "@/lib/auth/session";
import { verifyTelegramLogin } from "@/lib/auth/token";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/log";
import { telegramLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return Response.json({ error: "Telegram login is not configured." }, { status: 503 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = telegramLoginSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid Telegram login." }, { status: 400 });
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) fields[key] = String(value);
  }
  const verdict = verifyTelegramLogin(fields, token);
  if (!verdict.ok) return Response.json({ error: "Telegram login was rejected." }, { status: 401 });
  try {
    const user = await prisma.user.upsert({
      where: { telegramId: String(parsed.data.id) },
      create: {
        telegramId: String(parsed.data.id),
        telegramUsername: parsed.data.username,
        firstName: parsed.data.first_name,
        lastName: parsed.data.last_name,
        role: "seeker",
      },
      update: {
        telegramUsername: parsed.data.username,
        firstName: parsed.data.first_name,
        lastName: parsed.data.last_name,
      },
    });
    await setSessionCookie(user.id);
    return Response.json({ ok: true });
  } catch (error) {
    logError("auth", "telegram login failed", error);
    return Response.json({ error: "Could not sign you in." }, { status: 500 });
  }
}
