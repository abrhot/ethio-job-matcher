import { clearSessionCookie } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function POST() {
  await clearSessionCookie();
  redirect("/");
}
