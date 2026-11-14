import { decodeEntities, stripHtml } from "../jobs/text";
import type { RawPosting } from "../jobs/types";

export function parseTelegramChannelHtml(html: string, channel: string): RawPosting[] {
  const chunks = html.split('class="tgme_widget_message_wrap').slice(1);
  const postings: RawPosting[] = [];
  for (const chunk of chunks) {
    const post = chunk.match(/data-post="([^"]+)"/)?.[1];
    if (!post) continue;
    const textHtml =
      chunk.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "";
    const text = stripHtml(textHtml);
    if (text.length < 40) continue;
    const datetime = chunk.match(/<time datetime="([^"]+)"/)?.[1];
    const buttons = [
      ...chunk.matchAll(/class="tgme_widget_message_inline_button url_button" href="([^"]+)"/g),
    ].map((match) => decodeEntities(match[1]));
    const [, messageId] = post.split("/");
    const channelName = post.split("/")[0] || channel.replace(/^@/, "");
    postings.push({
      externalId: messageId || post,
      sourceKey: `telegram:${channelName}`,
      text,
      url: `https://t.me/${post}`,
      postedAt: datetime,
      applyUrl: buttons[0],
    });
  }
  return postings;
}

export async function fetchTelegramChannel(
  channel: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RawPosting[]> {
  const name = channel.replace(/^@/, "").trim();
  const response = await fetchImpl(`https://t.me/s/${encodeURIComponent(name)}`, {
    headers: { "user-agent": "SeraJobMatcher/0.1 (student job matcher)", accept: "text/html" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok)
    throw new Error(`Telegram preview for ${name} returned HTTP ${response.status}`);
  return parseTelegramChannelHtml(await response.text(), name);
}
