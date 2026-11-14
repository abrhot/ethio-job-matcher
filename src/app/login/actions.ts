import { redirect } from "next/navigation";
import { demoMode } from "@/lib/config";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth/session";

export async function demoLogin(formData: FormData) {
  "use server";
  if (!demoMode()) redirect("/login?error=disabled");
  const persona = formData.get("persona") === "dawit" ? "dawit" : "hana";
  const email = persona === "dawit" ? "dawit.bekele@sera.local" : "hana.tadesse@sera.local";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login?error=seed");
  await setSessionCookie(user.id);
  redirect("/jobs");
}
