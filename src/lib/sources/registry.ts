import { loadSamplePostings } from "./sample";
import { fetchEthioJobs } from "./ethiojobs";
import { fetchTelegramChannel } from "./telegram";
import type { RawPosting } from "../jobs/types";

export interface JobSource {
  key: string;
  name: string;
  kind: "sample" | "web" | "telegram";
  description: string;
  fetchRaw(): Promise<RawPosting[]>;
}

export function sampleSource(): JobSource {
  return {
    key: "sample",
    name: "Sample board",
    kind: "sample",
    description: "Fictional Ethiopian vacancies shipped with the app so the demo works offline.",
    async fetchRaw() {
      return loadSamplePostings();
    },
  };
}

export function ethioJobsSource(): JobSource {
  return {
    key: "ethiojobs",
    name: "EthioJobs",
    kind: "web",
    description: "Public listings embedded in the EthioJobs homepage. No API key.",
    fetchRaw: () => fetchEthioJobs(),
  };
}

export function telegramChannelSource(channel: string): JobSource {
  const name = channel.replace(/^@/, "").trim();
  return {
    key: `telegram:${name}`,
    name: `Telegram @${name}`,
    kind: "telegram",
    description: "Public channel preview at t.me/s/. The bot does not need to be a channel admin.",
    fetchRaw: () => fetchTelegramChannel(name),
  };
}

export function configuredSources(): JobSource[] {
  const channels = (process.env.TELEGRAM_CHANNELS || "ethiojobsofficial")
    .split(",")
    .map((channel) => channel.trim())
    .filter(Boolean);
  return [sampleSource(), ethioJobsSource(), ...channels.map(telegramChannelSource)];
}

export function sourceByKey(key: string): JobSource | undefined {
  return configuredSources().find((source) => source.key === key);
}
