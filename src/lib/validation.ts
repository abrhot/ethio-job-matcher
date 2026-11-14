import { z } from "zod";

export const experienceLevelSchema = z.enum([
  "student",
  "intern",
  "junior",
  "mid",
  "senior",
  "any",
]);
export const jobTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
  "unknown",
]);
export const remoteModeSchema = z.enum(["remote", "onsite", "hybrid", "unknown"]);
export const alertModeSchema = z.enum(["instant", "digest", "both", "off"]);
export const localeSchema = z.enum(["en", "am"]);

const selectableJobType = z.enum(["full_time", "part_time", "contract", "internship", "freelance"]);

export const profileFormSchema = z.object({
  fullName: z.string().trim().max(80),
  field: z.string().trim().min(2, "Add your field of study or profession.").max(80),
  skills: z.string().trim().min(2, "Add at least one skill.").max(400),
  experienceLevel: z.enum(["student", "intern", "junior", "mid", "senior"]),
  yearsExperience: z
    .string()
    .trim()
    .regex(/^\d{0,2}$/, "Years must be a number from 0 to 40."),
  preferredCities: z.string().trim().max(120),
  remoteOk: z.boolean(),
  jobTypes: z.array(selectableJobType).min(1, "Pick at least one job type.").max(5),
  summary: z.string().trim().max(800),
  alertMode: alertModeSchema,
  locale: localeSchema,
});

export type ProfileForm = z.infer<typeof profileFormSchema>;

export function profileFormFromRequest(formData: FormData) {
  const years = formData.get("yearsExperience");
  const parsed = profileFormSchema.safeParse({
    fullName: formValue(formData, "fullName"),
    field: formValue(formData, "field"),
    skills: formValue(formData, "skills"),
    experienceLevel: formValue(formData, "experienceLevel"),
    yearsExperience: typeof years === "string" ? years.trim() : "",
    preferredCities: formValue(formData, "preferredCities"),
    remoteOk: formData.get("remoteOk") === "yes",
    jobTypes: formData
      .getAll("jobTypes")
      .filter((value): value is string => typeof value === "string"),
    summary: formValue(formData, "summary"),
    alertMode: formValue(formData, "alertMode"),
    locale: formValue(formData, "locale"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }
  const yearsNumber =
    parsed.data.yearsExperience === "" ? null : Number(parsed.data.yearsExperience);
  if (yearsNumber != null && yearsNumber > 40) {
    return { ok: false as const, error: "Years must be a number from 0 to 40." };
  }
  return { ok: true as const, data: { ...parsed.data, yearsNumber } };
}

export const matchFilterSchema = z.object({
  q: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(40).optional().or(z.literal("")),
  remote: remoteModeSchema.optional().or(z.literal("")),
  type: jobTypeSchema.optional().or(z.literal("")),
  min: z.coerce.number().int().min(0).max(100).optional(),
});

export function parseMatchFilters(params: {
  q?: string;
  city?: string;
  remote?: string;
  type?: string;
  min?: string;
}) {
  const parsed = matchFilterSchema.safeParse({
    q: params.q ?? "",
    city: params.city ?? "",
    remote: params.remote || undefined,
    type: params.type || undefined,
    min: params.min === undefined || params.min === "" ? 40 : params.min,
  });
  if (!parsed.success) {
    return { q: "", city: "", remote: "", type: "", min: 40 };
  }
  return {
    q: parsed.data.q ?? "",
    city: parsed.data.city ?? "",
    remote: parsed.data.remote && parsed.data.remote !== "unknown" ? parsed.data.remote : "",
    type: parsed.data.type ?? "",
    min: parsed.data.min ?? 40,
  };
}

export const telegramLoginSchema = z.object({
  id: z.union([z.number(), z.string()]),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().max(80).optional(),
  username: z.string().trim().max(64).optional(),
  photo_url: z.string().trim().max(500).optional(),
  auth_date: z.union([z.number(), z.string()]),
  hash: z.string().regex(/^[a-f0-9]{64}$/i),
});

export const paymentReferenceSchema = z.string().regex(/^(stub|chapa)_[a-zA-Z0-9]{8,32}$/);

export const sourceKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9:_-]+$/i);

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
