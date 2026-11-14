import { stripHtml } from "../jobs/text";
import type { RawPosting } from "../jobs/types";

interface EthioJob {
  slug?: string;
  title?: string;
  description?: string;
  date_published?: string;
  date_expiry?: string;
  location_type?: string;
  state?: string;
  application_method?: string;
  application_email?: string | null;
  career_page_link?: string | null;
  company?: { name?: string };
  catalogs?: { name?: string }[];
}

export function parseEthioJobsHtml(html: string): RawPosting[] {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) return [];
  let payload: {
    props?: {
      pageProps?: {
        initialState?: { api?: { queries?: Record<string, { data?: { data?: EthioJob[] } }> } };
      };
    };
  };
  try {
    payload = JSON.parse(match[1]) as typeof payload;
  } catch {
    return [];
  }
  const queries = payload.props?.pageProps?.initialState?.api?.queries ?? {};
  const bySlug = new Map<string, EthioJob>();
  for (const [key, value] of Object.entries(queries)) {
    if (!key.startsWith("getPaginatedJob") && !key.startsWith("getLatestJobs")) continue;
    for (const job of value?.data?.data ?? []) {
      if (job.slug && job.title && job.description) bySlug.set(job.slug, job);
    }
  }
  return [...bySlug.values()].map(toRawPosting);
}

function toRawPosting(job: EthioJob): RawPosting {
  const catalogs = (job.catalogs ?? [])
    .map((catalog) => catalog.name)
    .filter(Boolean)
    .join(", ");
  const description = stripHtml(job.description ?? "");
  const text = [job.title, catalogs ? `Fields: ${catalogs}` : "", description]
    .filter(Boolean)
    .join("\n\n");
  const state = job.state && job.state !== "Not Specified" ? job.state : undefined;
  const email = job.application_email || undefined;
  const applyUrl = job.career_page_link || (email ? `mailto:${email}` : undefined);
  return {
    externalId: job.slug!,
    sourceKey: "ethiojobs",
    title: job.title,
    company: job.company?.name,
    location: state,
    text,
    url: `https://ethiojobs.net/job/${job.slug}`,
    applyUrl,
    howToApply: job.application_method
      ? `Apply via ${job.application_method.replaceAll("_", " ").toLowerCase()}`
      : undefined,
    postedAt: job.date_published,
    deadline: job.date_expiry,
    remoteHint: job.location_type,
  };
}

export async function fetchEthioJobs(fetchImpl: typeof fetch = fetch): Promise<RawPosting[]> {
  const response = await fetchImpl("https://ethiojobs.net/", {
    headers: {
      "user-agent": "SeraJobMatcher/0.1 (student job matcher)",
      accept: "text/html",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`EthioJobs returned HTTP ${response.status}`);
  return parseEthioJobsHtml(await response.text());
}
