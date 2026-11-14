import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export interface SessionPayload {
  uid: string;
  exp: number;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be at least 32 characters in production.");
  }
  return "dev-only-sera-session-secret-not-for-production";
}

export function signSession(userId: string, now = Date.now()): string {
  const body = Buffer.from(
    JSON.stringify({ uid: userId, exp: now + 1000 * 60 * 60 * 24 * 30 } satisfies SessionPayload),
  ).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readSession(token: string | undefined | null, now = Date.now()): string | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < now) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export function verifyTelegramLogin(
  data: Record<string, string>,
  botToken: string,
  now = Date.now(),
): { ok: true } | { ok: false; reason: string } {
  const hash = data.hash;
  if (!hash) return { ok: false, reason: "missing hash" };
  const authDate = Number(data.auth_date);
  if (!authDate || Math.abs(now / 1000 - authDate) > 86_400)
    return { ok: false, reason: "expired" };
  const check = Object.entries(data)
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const digest = createHash("sha256").update(botToken).digest();
  const hmac = createHmac("sha256", digest).update(check).digest("hex");
  const left = Buffer.from(hmac);
  const right = Buffer.from(hash);
  if (left.length !== right.length || !timingSafeEqual(left, right))
    return { ok: false, reason: "bad hash" };
  return { ok: true };
}
