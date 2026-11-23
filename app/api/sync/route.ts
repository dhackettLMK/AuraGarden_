import { gardenKeyFrom, json } from "@/lib/server/auth";
import { getStore, storeErrorResponse, type DbChange } from "@/lib/server/store";
import { COLLECTIONS } from "@/lib/types";

export const runtime = "nodejs";
export const preferredRegion = "dub1";

const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const COLLECTION_SET = new Set<string>(COLLECTIONS);

/** A change as the app sends and receives it: timestamps in epoch milliseconds. */
interface WireChange {
  collection: string;
  id: string;
  data: unknown;
  updated_at: number;
  deleted_at: number | null;
}

const iso = (ms: number) => new Date(ms).toISOString();
const ms = (t: string | null | undefined) => (t ? Date.parse(t) : NaN);

/** Whether sync is configured on this deployment. */
export async function GET() {
  return json({ enabled: !!getStore() });
}

/**
 * Push changes and pull everything newer than the cursor (brief 12.2) through ag_sync.
 * Body: { cursor, changes: [{ collection, id, data, updated_at, deleted_at }] }.
 * The body is never logged.
 */
export async function POST(req: Request) {
  const store = getStore();
  if (!store) return json({ error: "Sync is off on this site." }, 503);
  const key = gardenKeyFrom(req);
  if (!key) return json({ error: "This garden link isn't valid." }, 401);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) return json({ error: "Too much at once." }, 413);
  const text = await req.text();
  if (text.length > MAX_REQUEST_BYTES) return json({ error: "Too much at once." }, 413);

  let body: { cursor?: unknown; changes?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const cursor = typeof body.cursor === "number" && Number.isFinite(body.cursor) ? Math.max(0, Math.floor(body.cursor)) : 0;
  const raw = Array.isArray(body.changes) ? body.changes : [];
  const changes: DbChange[] = [];
  for (const c of raw as Record<string, unknown>[]) {
    if (!c || typeof c !== "object") continue;
    if (typeof c.collection !== "string" || !COLLECTION_SET.has(c.collection)) continue;
    if (typeof c.id !== "string" || !c.id || c.id.length > 200) continue;
    if (typeof c.updated_at !== "number" || !Number.isFinite(c.updated_at) || c.updated_at <= 0) continue;
    changes.push({
      collection: c.collection,
      id: c.id,
      data: c.data ?? {},
      updated_at: iso(c.updated_at),
      deleted_at: typeof c.deleted_at === "number" && Number.isFinite(c.deleted_at) ? iso(c.deleted_at) : null,
    });
  }

  try {
    const result = await store.sync(key, cursor, changes);
    const out: WireChange[] = [];
    for (const c of result.changes ?? []) {
      const updated = ms(c.updated_at);
      if (!Number.isFinite(updated)) continue;
      const deleted = ms(c.deleted_at);
      out.push({ collection: c.collection, id: c.id, data: c.data, updated_at: updated, deleted_at: Number.isFinite(deleted) ? deleted : null });
    }
    return json({ cursor: Number(result.cursor) || cursor, more: !!result.more, changes: out });
  } catch (e) {
    const { status, error } = storeErrorResponse(e);
    if (status === 401) return json({ error: "This garden has a new link." }, 401);
    return json({ error }, status);
  }
}
