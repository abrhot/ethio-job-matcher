"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function dismissMatch(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;
  await prisma.match.updateMany({
    where: { userId: user.id, jobId },
    data: { dismissed: true },
  });
  revalidatePath("/jobs");
  redirect("/jobs");
}
