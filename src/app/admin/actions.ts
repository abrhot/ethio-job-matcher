"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ingestSource } from "@/lib/ingest/run";
import { logError } from "@/lib/log";
import { deliverInstantAlerts, matchAllUsers } from "@/lib/matching/run";
import { sourceKeySchema } from "@/lib/validation";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/jobs");
  return user;
}

export async function runIngest(formData: FormData) {
  await requireAdmin();
  const parsed = sourceKeySchema.safeParse(formData.get("source"));
  if (!parsed.success) redirect("/admin?notice=Unknown%20source");
  let notice = "";
  try {
    const stats = await ingestSource(parsed.data);
    notice = stats.error
      ? `${parsed.data} failed: ${stats.error}`
      : `${parsed.data}: ${stats.created} new, ${stats.updated} updated, ${stats.duplicates} duplicates of ${stats.found} found`;
  } catch (error) {
    logError("admin", "ingest failed", error);
    notice = error instanceof Error ? error.message : "Ingest failed";
  }
  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin?notice=${encodeURIComponent(notice)}`);
}

export async function runMatch() {
  await requireAdmin();
  const matched = await matchAllUsers();
  const sent = await deliverInstantAlerts();
  revalidatePath("/admin");
  revalidatePath("/jobs");
  redirect(
    `/admin?notice=${encodeURIComponent(`Scored ${matched.written} pairs. Sent ${sent} Telegram alerts.`)}`,
  );
}
