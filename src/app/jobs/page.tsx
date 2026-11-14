import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/session";
import { listCities, listMatches, readParam, recentJobs } from "@/lib/queries";
import { formatWhen, jobTypeLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Matches" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = {
    q: readParam(params.q),
    city: readParam(params.city),
    remote: readParam(params.remote),
    type: readParam(params.type),
    min: readParam(params.min),
  };
  const user = await getCurrentUser();
  const cities = await listCities().catch(() => []);

  if (!user) {
    const jobs = await recentJobs(8).catch(() => []);
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl text-[#143226]">Matches</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign in to score these postings against a profile. Below are recent jobs already in the
          database, unscored.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm text-[#145c38] underline">
          Sign in
        </Link>
        <ul className="mt-8 space-y-3">
          {jobs.length === 0 ? <li>No jobs ingested yet.</li> : null}
          {jobs.map((job) => (
            <li key={job.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <p className="font-medium">{job.title}</p>
              <p className="text-sm text-muted-foreground">
                {[job.company, job.city, jobTypeLabel(job.jobType)].filter(Boolean).join(" · ")} ·{" "}
                {formatWhen(job.postedAt)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!user.profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-display text-4xl">Add a profile first</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Matching needs skills, a field, and where you can work.
        </p>
        <Link href="/profile" className="mt-4 inline-block text-[#145c38] underline">
          Open your profile
        </Link>
      </div>
    );
  }

  const notice = readParam(params.notice);
  const { filters, matches } = await listMatches(user.id, raw);
  const why = (match: (typeof matches)[number]) =>
    user.locale === "am" ? match.whyLineAm : match.whyLine;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-[#143226]">Your matches</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.profile.fullName || user.firstName || "You"} · {matches.length} shown at score{" "}
            {filters.min} or higher
          </p>
        </div>
        <Link href="/profile" className="text-sm text-[#145c38] underline-offset-4 hover:underline">
          Edit profile
        </Link>
      </div>
      {notice === "premium" ? (
        <p role="status" className="mt-4 rounded-lg bg-[#e5f2ea] px-3 py-2 text-sm text-[#145c38]">
          Premium is on. Open a match to read the cover-letter draft.
        </p>
      ) : null}

      <form
        action="/jobs"
        className="mt-6 grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            defaultValue={filters.q}
            placeholder="Title or company"
            className="mt-1 h-10"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <select
            id="city"
            name="city"
            defaultValue={filters.city}
            className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm"
          >
            <option value="">Any</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="remote">Place</Label>
          <select
            id="remote"
            name="remote"
            defaultValue={filters.remote}
            className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm"
          >
            <option value="">Any</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue={filters.type}
            className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm"
          >
            <option value="">Any</option>
            <option value="full_time">Full-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
            <option value="part_time">Part-time</option>
          </select>
        </div>
        <div>
          <Label htmlFor="min">Minimum score</Label>
          <select
            id="min"
            name="min"
            defaultValue={String(filters.min)}
            className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm"
          >
            <option value="40">40</option>
            <option value="50">50</option>
            <option value="74">74 strong only</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit" className="h-10 px-4">
            Apply filters
          </Button>
          <Link href="/jobs" className="text-sm underline-offset-4 hover:underline">
            Clear
          </Link>
        </div>
      </form>

      {matches.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-card p-6 text-sm leading-6 ring-1 ring-foreground/10">
          Nothing cleared this filter. Lower the minimum score, clear the city, or add skills on
          your profile.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {matches.map((match) => (
            <JobCard
              key={match.id}
              jobId={match.jobId}
              score={match.score}
              why={why(match)}
              title={match.job.title}
              company={match.job.company}
              city={match.job.city}
              remote={match.job.remote}
              jobType={match.job.jobType}
              deadline={match.job.deadline}
              sourceName={match.job.source.name}
              language={match.job.language}
            />
          ))}
        </div>
      )}
    </div>
  );
}
