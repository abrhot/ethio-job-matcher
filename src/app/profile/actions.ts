"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { CvRejectedError } from "@/lib/profile/cv-guard";
import { profileFromCv } from "@/lib/profile/cv";
import { saveUserProfile } from "@/lib/profile/save";
import { allow } from "@/lib/rate-limit";
import { logError } from "@/lib/log";
import { profileFormFromRequest } from "@/lib/validation";

export async function saveProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = profileFormFromRequest(formData);
  if (!parsed.ok) redirect(`/profile?error=${encodeURIComponent(parsed.error)}`);
  const cities = parsed.data.preferredCities
    .split(/[,/]/)
    .map((city) => city.trim())
    .filter(Boolean);
  await saveUserProfile(user.id, {
    fullName: parsed.data.fullName || null,
    field: parsed.data.field,
    skills: parsed.data.skills.split(/[,;/]/),
    experienceLevel: parsed.data.experienceLevel,
    yearsExperience: parsed.data.yearsNumber,
    preferredCities: cities,
    remoteOk: parsed.data.remoteOk,
    jobTypes: parsed.data.jobTypes,
    summary: parsed.data.summary || null,
    locale: parsed.data.locale,
  });
  const { prisma } = await import("@/lib/db");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      alertMode: parsed.data.alertMode,
      locale: parsed.data.locale,
      firstName: parsed.data.fullName.split(" ")[0] || user.firstName,
    },
  });
  revalidatePath("/profile");
  revalidatePath("/jobs");
  redirect("/profile?saved=1");
}

export async function uploadCv(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allow(`cv:${user.id}`, 5, 60_000)) {
    redirect("/profile?error=Too%20many%20uploads.%20Wait%20a%20minute%20and%20try%20again.");
  }
  const file = formData.get("cv");
  if (!(file instanceof File)) redirect("/profile?error=Choose%20a%20PDF%20or%20DOCX.");
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extracted = await profileFromCv(file.name, bytes);
    await saveUserProfile(user.id, {
      fullName: extracted.profile.fullName,
      field: extracted.profile.field,
      skills: extracted.profile.skills,
      experienceLevel: extracted.profile.experienceLevel,
      yearsExperience: extracted.profile.yearsExperience,
      preferredCities: extracted.profile.preferredCities,
      education: extracted.profile.education,
      summary: extracted.profile.summary,
      phone: extracted.profile.phone,
      rawCvText: extracted.text,
      cvFileName: extracted.filename,
    });
  } catch (error) {
    const message =
      error instanceof CvRejectedError || error instanceof Error
        ? error.message
        : "Could not read that CV.";
    logError("cv", "upload failed", error);
    redirect(`/profile?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/profile");
  revalidatePath("/jobs");
  redirect("/profile?saved=cv");
}
