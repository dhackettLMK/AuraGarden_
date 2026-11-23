import { json, gardenIdFrom } from "@/lib/server/auth";
import { getStore, type SyncChange } from "@/lib/server/store";
import { COLLECTIONS } from "@/lib/types";

export const runtime = "nodejs";
export const preferredRegion = "dub1";

const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const COLLECTION_SET = new Set<string>(COLLECTIONS);

/** Whether sync is configured on this deployment. */
export async function GET() {
  return json({ enabled: !!getStore() });
}

/**
 * Push changes and pull everything newer than the cursor (brief 12.2).
 * Body: { cursor, deviceId, changes: [{ collection, id, data, updated_at, deleted_at }] }.
 * The body is never logged.
 */
export async function POST(req: Request) {
  const store = getStore();
  if (!store) return json({ error: "Sync is off on this site." }, 503);
  const id = await gardenIdFrom(req);
  if (!id) return json({ error: "This garden link isn't valid." }, 401);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) return json({ error: "Too much at once." }, 413);
  const text = await req.text();
  if (text.length > MAX_REQUEST_BYTES) return json({ error: "Too much at once." }, 413);

  if (!(await store.rateLimit(`sync:${id}`, 120, 60))) return json({ error: "Slow down a little." }, 429);

  let body: { cursor?: unknown; deviceId?: unknown; changes?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const cursor = typeof body.cursor === "number" && Number.isFinite(body.cursor) ? Math.max(0, Math.floor(body.cursor)) : 0;
  const device = typeof body.deviceId === "string" ? body.deviceId.slice(0, 40) : "";
  const raw = Array.isArray(body.changes) ? body.changes : [];
  const changes: SyncChange[] = [];
  for (const c of raw as Record<string, unknown>[]) {
    if (!c || typeof c !== "object") continue;
    if (typeof c.collection !== "string" || !COLLECTION_SET.has(c.collection)) continue;
    if (typeof c.id !== "string" || !c.id || c.id.length > 200) continue;
    if (typeof c.updated_at !== "number" || !Number.isFinite(c.updated_at)) continue;
    changes.push({
      collection: c.collection,
      id: c.id,
      data: c.data ?? {},
      updated_at: c.updated_at,
      deleted_at: typeof c.deleted_at === "number" ? c.deleted_at : null,
    });
  }

  const result = await store.sync(id, changes, cursor, device);
  if (result.error === "unknown_garden") return json({ error: "This garden has a new link." }, 401);
  if (result.error === "garden_full") return json({ error: "Your garden is full (50 MB). Empty the Trash or remove some photos." }, 507);
  return json(result);
}
