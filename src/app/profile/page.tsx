import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth/session";
import { saveProfile, uploadCv } from "./actions";

export const metadata: Metadata = { title: "Profile" };

const levels = [
  ["student", "Student"],
  ["intern", "Intern"],
  ["junior", "Junior"],
  ["mid", "Mid-level"],
  ["senior", "Senior"],
] as const;

const types = [
  ["full_time", "Full-time"],
  ["internship", "Internship"],
  ["contract", "Contract"],
  ["part_time", "Part-time"],
  ["freelance", "Freelance"],
] as const;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = user.profile;
  const saved =
    params.saved === "cv"
      ? "We read the CV and filled the fields we could. The file itself is not kept, only extracted text on your account."
      : params.saved
        ? "Profile saved. Matches were rescored."
        : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-4xl text-[#143226]">Profile</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        This is what matching uses. CV uploads stay in memory while we extract text, then the bytes
        are discarded.
      </p>
      {saved ? (
        <p role="status" className="mt-4 rounded-lg bg-[#e5f2ea] px-3 py-2 text-sm text-[#145c38]">
          {saved}
        </p>
      ) : null}
      {params.error ? (
        <p role="alert" className="mt-4 rounded-lg bg-[#f8e6e2] px-3 py-2 text-sm text-[#8d2f24]">
          {params.error}
        </p>
      ) : null}

      <form action={uploadCv} className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-medium">Upload a CV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF or DOCX, up to 4 MB, with selectable text.
        </p>
        {profile?.cvFileName ? (
          <p className="mt-2 text-sm">Last file read: {profile.cvFileName}</p>
        ) : null}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="cv">File</Label>
            <Input
              id="cv"
              name="cv"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              className="mt-1 h-10"
            />
          </div>
          <Button type="submit" className="h-10 px-4">
            Read CV
          </Button>
        </div>
      </form>

      <form
        action={saveProfile}
        className="mt-6 space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
      >
        <h2 className="font-medium">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile?.fullName ?? ""}
              className="mt-1 h-10"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="field">Field</Label>
            <Input
              id="field"
              name="field"
              required
              defaultValue={profile?.field ?? ""}
              placeholder="Software Engineering"
              className="mt-1 h-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="skills">Skills</Label>
          <Input
            id="skills"
            name="skills"
            required
            defaultValue={profile?.skills.join(", ") ?? ""}
            placeholder="React, Node.js, PostgreSQL"
            className="mt-1 h-10"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="experienceLevel">Experience</Label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              defaultValue={profile?.experienceLevel ?? "junior"}
              className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm"
            >
              {levels.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="yearsExperience">Years</Label>
            <Input
              id="yearsExperience"
              name="yearsExperience"
              inputMode="numeric"
              defaultValue={profile?.yearsExperience ?? ""}
              className="mt-1 h-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="preferredCities">Cities</Label>
          <Input
            id="preferredCities"
            name="preferredCities"
            defaultValue={profile?.preferredCities.join(", ") ?? ""}
            placeholder="Addis Ababa"
            className="mt-1 h-10"
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Job types</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {types.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="jobTypes"
                  value={value}
                  defaultChecked={
                    profile ? profile.jobTypes.includes(value) : value === "full_time"
                  }
                  className="size-4 accent-[#145c38]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="remoteOk"
            value="yes"
            defaultChecked={profile?.remoteOk ?? true}
            className="size-4 accent-[#145c38]"
          />
          Open to remote work
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="alertMode">Alerts</Label>
            <select
              id="alertMode"
              name="alertMode"
              defaultValue={user.alertMode}
              className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm"
            >
              <option value="both">Instant and daily digest</option>
              <option value="instant">Instant only</option>
              <option value="digest">Daily digest only</option>
              <option value="off">Off</option>
            </select>
          </div>
          <div>
            <Label htmlFor="locale">Bot language</Label>
            <select
              id="locale"
              name="locale"
              defaultValue={user.locale === "am" ? "am" : "en"}
              className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            defaultValue={profile?.summary ?? ""}
            rows={4}
            className="mt-1"
          />
        </div>
        {profile?.education ? (
          <p className="text-sm text-muted-foreground">
            Education noted from the CV: {profile.education}
          </p>
        ) : null}
        <Button type="submit" className="h-10 px-4">
          Save and rescore
        </Button>
      </form>
    </div>
  );
}
