import { cookies } from "next/headers";
import { prisma } from "../db";
import { readSession, signSession } from "./token";

const COOKIE = "sera_session";

export async function getCurrentUser() {
  const jar = await cookies();
  const userId = readSession(jar.get(COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
