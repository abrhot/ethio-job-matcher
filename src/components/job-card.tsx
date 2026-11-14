import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatWhen, jobTypeLabel, remoteLabel, scoreBand } from "@/lib/format";

export function JobCard({
  jobId,
  score,
  why,
  title,
  company,
  city,
  remote,
  jobType,
  deadline,
  sourceName,
  language,
}: {
  jobId: string;
  score: number;
  why: string;
  title: string;
  company: string | null;
  city: string | null;
  remote: string;
  jobType: string;
  deadline: Date | null;
  sourceName: string;
  language: string;
}) {
  const band = scoreBand(score);
  return (
    <article className="grid gap-4 rounded-2xl bg-card p-4 shadow-[0_1px_0_rgba(28,25,20,0.04)] ring-1 ring-foreground/10 sm:grid-cols-[auto_1fr] sm:p-5">
      <p
        className={`min-w-16 ${band.className}`}
        aria-label={`Match score ${Math.round(score)} out of 100, ${band.label}`}
      >
        <span className="block font-display text-4xl leading-none tabular-nums">
          {Math.round(score)}
        </span>
        <span className="mt-1 block text-[0.7rem] font-medium tracking-wide uppercase">
          {band.label}
        </span>
      </p>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className="font-display text-xl leading-snug text-foreground"
            lang={language === "am" ? "am" : "en"}
          >
            <Link href={`/jobs/${jobId}`} className="hover:underline">
              {title}
            </Link>
          </h2>
          {language !== "en" ? (
            <Badge variant="outline">{language === "am" ? "አማርኛ" : "Mixed"}</Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[company, city, remoteLabel(remote), jobTypeLabel(jobType)].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-3 text-sm leading-6">{why}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Deadline {formatWhen(deadline)} · via {sourceName}
        </p>
      </div>
    </article>
  );
}
