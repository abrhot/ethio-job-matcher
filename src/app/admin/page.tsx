import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { configuredSources } from "@/lib/sources/registry";
import { runIngest, runMatch } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/jobs");
  const params = await searchParams;
  const [users, jobs, matches, sources, runs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { matches: true } },
        profile: { select: { field: true, cvFileName: true } },
      },
    }),
    prisma.job.count(),
    prisma.match.count(),
    prisma.source.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { jobs: true } } },
    }),
    prisma.ingestRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
      include: { source: true },
    }),
  ]);
  const dbByKey = new Map(sources.map((source) => [source.key, source]));
  const sourceRows = configuredSources().map((source) => {
    const saved = dbByKey.get(source.key);
    return {
      key: source.key,
      name: source.name,
      kind: source.kind,
      description: source.description,
      jobs: saved?._count.jobs ?? 0,
      lastRunAt: saved?.lastRunAt ?? null,
      lastStatus: saved?.lastStatus ?? null,
      lastError: saved?.lastError ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl text-[#143226]">Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sources, ingested jobs, and seekers. CV text is not shown here.
      </p>
      {params.notice ? (
        <p role="status" className="mt-4 rounded-lg bg-secondary px-3 py-2 text-sm">
          {params.notice}
        </p>
      ) : null}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Seekers", users.length],
          ["Jobs", jobs],
          ["Matches", matches],
          ["Sources", sourceRows.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
            <dd className="mt-1 font-display text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8" aria-labelledby="sources-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="sources-heading" className="font-display text-2xl">
            Sources
          </h2>
          <form action={runMatch}>
            <Button type="submit" variant="outline" className="h-9 bg-card px-3">
              Rescore everyone
            </Button>
          </form>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Ingestion sources</caption>
            <thead className="border-b text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Source
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Kind
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Jobs
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Last run
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sourceRows.map((source) => (
                <tr key={source.key} className="border-b border-border/70 align-top">
                  <th scope="row" className="px-3 py-3 font-medium">
                    {source.name}
                    <span className="mt-1 block font-normal text-muted-foreground">
                      {source.description}
                    </span>
                    {source.lastError ? (
                      <span className="mt-1 block text-[#8d2f24]">{source.lastError}</span>
                    ) : null}
                  </th>
                  <td className="px-3 py-3">{source.kind}</td>
                  <td className="px-3 py-3">{source.jobs}</td>
                  <td className="px-3 py-3">
                    {source.lastRunAt
                      ? `${formatWhen(source.lastRunAt)} · ${source.lastStatus}`
                      : "Not run"}
                  </td>
                  <td className="px-3 py-3">
                    <form action={runIngest}>
                      <input type="hidden" name="source" value={source.key} />
                      <Button type="submit" size="sm" className="h-8 px-3">
                        Ingest
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="runs-heading">
        <h2 id="runs-heading" className="font-display text-2xl">
          Recent ingest runs
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {runs.length === 0 ? <li className="text-muted-foreground">No runs yet.</li> : null}
          {runs.map((run) => (
            <li key={run.id} className="rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
              {run.source.name}: {run.created} new, {run.updated} updated, {run.duplicates}{" "}
              duplicates
              {run.error ? ` — ${run.error}` : ""} · {formatWhen(run.startedAt)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="users-heading">
        <h2 id="users-heading" className="font-display text-2xl">
          Seekers
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Registered seekers</caption>
            <thead className="border-b text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Person
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Field
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Alerts
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Tier
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Matches
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((seeker) => (
                <tr key={seeker.id} className="border-b border-border/70">
                  <th scope="row" className="px-3 py-3 font-medium">
                    {[seeker.firstName, seeker.lastName].filter(Boolean).join(" ") ||
                      seeker.email ||
                      seeker.telegramUsername ||
                      "Unnamed"}
                    <span className="mt-1 block font-normal text-muted-foreground">
                      {seeker.role}
                      {seeker.profile?.cvFileName ? ` · CV read: ${seeker.profile.cvFileName}` : ""}
                    </span>
                  </th>
                  <td className="px-3 py-3">{seeker.profile?.field ?? "—"}</td>
                  <td className="px-3 py-3">{seeker.alertMode}</td>
                  <td className="px-3 py-3">{seeker.tier}</td>
                  <td className="px-3 py-3">{seeker._count.matches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
