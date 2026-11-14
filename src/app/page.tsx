import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { recentJobs } from "@/lib/queries";
import { formatWhen, jobTypeLabel } from "@/lib/format";

const steps = [
  {
    n: "01",
    title: "Tell Sera who you are",
    body: "Send a PDF or DOCX on Telegram, or fill skills, field, city, and the kinds of work you will take.",
  },
  {
    n: "02",
    title: "We read the boards",
    body: "Postings from EthioJobs and public Telegram channels are normalized, translated into the same fields, and deduped.",
  },
  {
    n: "03",
    title: "You get the why, and the link",
    body: "A strong match arrives immediately. The rest wait for the morning digest. Each alert says why it fits.",
  },
];

const faqs = [
  {
    q: "Where do the jobs come from?",
    a: "A sample board ships with the app so you can try it offline. The EthioJobs homepage and public Telegram previews at t.me/s/<channel> are real sources. Private channels need a different setup, described in the README.",
  },
  {
    q: "Does it understand Amharic?",
    a: "The web app is English first. Bot messages are English or Amharic. Postings in Amharic keep their script, and cities such as አዲስ አበባ map to Addis Ababa before matching.",
  },
  {
    q: "Do I need an API key to try it?",
    a: "No. Without an LLM key, matching is a deterministic blend of rules and hashed text embeddings. The same profile and job always produce the same score.",
  },
  {
    q: "Is this only for software jobs?",
    a: "No. Accounting, health, NGO, and trades postings score against the skills on the profile. A software student should not be pinged about a senior banking architect.",
  },
];

export default async function HomePage() {
  const jobs = await recentJobs(3).catch(() => []);
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <p className="text-sm font-medium tracking-wide text-[#6a4510]" lang="am">
            ሥራ · Addis Ababa
          </p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[1.1] text-[#143226] sm:text-6xl">
            Ethiopian jobs, matched to the person you actually are.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#3f3a32]">
            Most vacancies still land in Telegram channels and on boards like EthioJobs. Sera
            normalizes them, scores them against your CV, and sends a one-line reason with the apply
            link.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}>
              Try the demo
            </Link>
            <Link
              href="/jobs"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 bg-card px-5",
              )}
            >
              See matched jobs
            </Link>
          </div>
        </div>
        <aside
          aria-label="Example Telegram alert"
          className="mx-auto w-full max-w-md rounded-[2rem] bg-[#1c2b24] p-3 text-[#f4efe4] shadow-xl"
        >
          <div className="rounded-[1.4rem] bg-[#24362d] p-4">
            <p className="text-xs tracking-wide text-[#c4a15a]">Sera · now</p>
            <p className="mt-3 font-display text-2xl leading-snug">
              Junior Full-Stack Developer · 86/100
            </p>
            <p className="mt-1 text-sm text-[#d5d0c4]">Entoto Labs · Addis Ababa · Full-time</p>
            <p className="mt-4 text-sm leading-6">
              Your React, Node.js, and PostgreSQL skills line up with this junior full-time role. It
              is based in Addis Ababa.
            </p>
            <p className="mt-4 text-sm text-[#9dceb4]">careers@entotolabs.example</p>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-3xl text-[#143226]">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <p className="font-display text-sm text-[#6a4510]">{step.n}</p>
              <h3 className="mt-2 font-display text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="recent-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-heading" className="font-display text-3xl text-[#143226]">
            Recently normalized
          </h2>
          <Link href="/jobs" className="text-sm text-[#145c38] underline-offset-4 hover:underline">
            Open your matches
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No jobs yet. Start Postgres and run{" "}
            <code className="rounded bg-secondary px-1">npm run db:seed</code>.
          </p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {jobs.map((job) => (
              <li key={job.id} className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {[job.company, job.city, jobTypeLabel(job.jobType), job.source.name]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  · {formatWhen(job.postedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-2"
        aria-labelledby="price-heading"
      >
        <h2 id="price-heading" className="sr-only">
          Pricing
        </h2>
        <article className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
          <h3 className="font-display text-2xl">Free</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Profile, CV reading, match scores, filters, and Telegram alerts. Instant for strong
            fits, digest for the rest.
          </p>
          <p className="mt-6 font-display text-4xl">0 ETB</p>
        </article>
        <article className="rounded-2xl bg-[#143226] p-6 text-[#f7f3e8]">
          <h3 className="font-display text-2xl">Premium</h3>
          <p className="mt-2 text-sm leading-6 text-[#d7d2c6]">
            A cover-letter draft and three CV notes for each job. Chapa and Telebirr plug into the
            payment interface later. The demo uses a local stub and moves no money.
          </p>
          <p className="mt-6 font-display text-4xl">
            299 ETB <span className="text-base">/ 30 days</span>
          </p>
          <Link
            href="/upgrade"
            className={cn(buttonVariants({ variant: "secondary" }), "mt-6 h-10 px-4")}
          >
            See the stub checkout
          </Link>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display text-3xl text-[#143226]">
          Questions
        </h2>
        <div className="mt-4 divide-y divide-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                {item.q}
              </summary>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
