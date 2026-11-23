import { clientIp, json, requireGarden } from "@/lib/server/auth";
import { FetchRefused, safeFetchText } from "@/lib/server/net";
import { allow } from "@/lib/server/ratelimit";
import { ICalError, feedWindow, parseICS, type ParsedEvent } from "@/lib/ical";
import { sha256Hex } from "@/lib/key";

export const runtime = "nodejs";
export const preferredRegion = "dub1";

const CACHE_MS = 15 * 60_000;
const cache = new Map<string, { at: number; events: ParsedEvent[] }>();

/**
 * Fetch, parse and cache a calendar feed (brief 6.7, 12.5). The feed URL is
 * sent in the POST body (it often contains a private token) and is never logged.
 */
export async function POST(req: Request) {
  const garden = await requireGarden(req);
  if (!garden) return json({ error: "This garden link isn't valid." }, 401);
  if (!(await allow(`feed:${garden.id}`, 40, 600)) || !(await allow(`feed-ip:${clientIp(req)}`, 120, 600)))
    return json({ error: "Lots of calendar refreshes. Try again in a few minutes." }, 429);

  let url: string;
  try {
    const body = (await req.json()) as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 2048) throw new Error();
    url = body.url;
  } catch {
    return json({ error: "Send a calendar link." }, 400);
  }

  const key = await sha256Hex(url.trim());
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return json({ events: hit.events, fetchedAt: hit.at, cached: true });

  try {
    const text = await safeFetchText(url);
    const { from, to } = feedWindow();
    const events = parseICS(text, from, to);
    const entry = { at: Date.now(), events };
    cache.set(key, entry);
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    return json({ events, fetchedAt: entry.at });
  } catch (e) {
    if (e instanceof FetchRefused || e instanceof ICalError) return json({ error: e.message }, 422);
    return json({ error: "Couldn't load that calendar." }, 502);
  }
}
