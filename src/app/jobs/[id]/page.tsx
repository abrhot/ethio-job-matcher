import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { dismissMatch } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { isPremium } from "@/lib/config";
import { formatWhen, jobTypeLabel, levelLabel, remoteLabel, scoreBand } from "@/lib/format";
import { draftCoverLetter } from "@/lib/matching/llm";
import { cvTips } from "@/lib/matching/tips";
import { prisma } from "@/lib/db";
import type { ExperienceLevel, JobType, RemoteMode, SeekerProfile } from "@/lib/jobs/types";
import { PolishLetter } from "./polish-letter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id }, select: { title: true } });
  return { title: job?.title ?? "Job" };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const match = await prisma.match.findUnique({
    where: { userId_jobId: { userId: user.id, jobId: id } },
    include: { job: { include: { source: true } } },
  });
  if (!match) notFound();
  const job = match.job;
  const band = scoreBand(match.score);
  const why = user.locale === "am" ? match.whyLineAm : match.whyLine;
  const profile: SeekerProfile | null = user.profile
    ? {
        fullName: user.profile.fullName,
        field: user.profile.field,
        skills: user.profile.skills,
        experienceLevel: user.profile.experienceLevel as ExperienceLevel,
        yearsExperience: user.profile.yearsExperience,
        preferredCities: user.profile.preferredCities,
        remoteOk: user.profile.remoteOk,
        jobTypes: user.profile.jobTypes as JobType[],
        summary: user.profile.summary,
        locale: user.locale === "am" ? "am" : "en",
      }
    : null;
  const premium = isPremium(user);
  const letter = profile
    ? draftCoverLetter(profile, {
        title: job.title,
        company: job.company,
        city: job.city,
        remote: job.remote as RemoteMode,
        jobType: job.jobType as JobType,
        experienceLevel: job.experienceLevel as ExperienceLevel,
        description: job.description,
        skills: job.skills,
        deadline: job.deadline?.toISOString() ?? null,
      })
    : "";
  const tips = profile
    ? cvTips(profile, {
        title: job.title,
        company: job.company,
        city: job.city,
        remote: job.remote as RemoteMode,
        jobType: job.jobType as JobType,
        experienceLevel: job.experienceLevel as ExperienceLevel,
        description: job.description,
        skills: job.skills,
        deadline: job.deadline?.toISOString() ?? null,
      })
    : [];
  const preview =
    letter.split("\n").find((line) => line.startsWith("I am")) ?? letter.slice(0, 140);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/jobs" className="underline-offset-4 hover:underline">
          Matches
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <h1
          className="font-display text-4xl leading-tight text-[#143226]"
          lang={job.language === "am" ? "am" : "en"}
        >
          {job.title}
        </h1>
        <p
          className={band.className}
          aria-label={`Match score ${Math.round(match.score)} out of 100, ${band.label}`}
        >
          <span className="font-display text-4xl tabular-nums">{Math.round(match.score)}</span>
          <span className="mt-1 block text-xs tracking-wide uppercase">{band.label}</span>
        </p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {[
          job.company,
          job.city ?? job.location,
          remoteLabel(job.remote),
          jobTypeLabel(job.jobType),
          levelLabel(job.experienceLevel),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="mt-4 text-base leading-7">{why}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {match.matchedSkills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
        {job.seenOn.length > 1 ? (
          <Badge variant="outline">Also seen on {job.seenOn.join(", ")}</Badge>
        ) : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
          href={job.applyUrl || job.sourceUrl}
        >
          Apply
        </a>
        <form action={dismissMatch}>
          <input type="hidden" name="jobId" value={job.id} />
          <Button type="submit" variant="outline" className="h-10 bg-card px-4">
            Hide this match
          </Button>
        </form>
      </div>
      <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Deadline</dt>
          <dd>{formatWhen(job.deadline)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Source</dt>
          <dd>{job.source.name}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">How to apply</dt>
          <dd>{job.howToApply || "Use the apply link."}</dd>
        </div>
      </dl>
      <h2 className="mt-10 font-display text-2xl">Posting</h2>
      <div
        className="mt-3 whitespace-pre-wrap text-sm leading-7"
        lang={job.language === "am" ? "am" : "en"}
      >
        {job.description}
      </div>

      <section
        className="mt-10 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
        aria-labelledby="letter-heading"
      >
        <h2 id="letter-heading" className="font-display text-2xl">
          Cover letter and CV notes
        </h2>
        {premium && profile ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              This draft uses only your profile and the posting.{" "}
              {process.env.LLM_API_KEY
                ? "You can ask the model to rewrite it."
                : "No LLM key is set, so the template is the draft."}
            </p>
            <PolishLetter jobId={job.id} initial={letter} />
            <h3 className="mt-6 font-medium">CV notes</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6">{preview}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              The rest of the letter, and three CV notes for this job, are part of Premium. The demo
              checkout does not charge you.
            </p>
            <Link href="/upgrade" className="mt-4 inline-block text-sm text-[#145c38] underline">
              See Premium
            </Link>
          </>
        )}
      </section>
    </article>
  );
}
