import { clientHash, gardenKeyFrom, json } from "@/lib/server/auth";
import { getStore, storeErrorResponse } from "@/lib/server/store";
import { isValidKeyShape } from "@/lib/key";

export const runtime = "nodejs";
export const preferredRegion = "dub1";

function fail(e: unknown) {
  const { status, error } = storeErrorResponse(e);
  return json({ error }, status);
}

/** Is this key a garden? Used by the join screen. Never logs the key. */
export async function GET(req: Request) {
  const store = getStore();
  if (!store) return json({ enabled: false }, 200);
  const key = gardenKeyFrom(req);
  if (!key) return json({ error: "This garden link isn't valid." }, 401);
  try {
    if (!(await store.checkGarden(key))) return json({ error: "This garden link isn't valid." }, 401);
    return json({ ok: true, name: null });
  } catch (e) {
    return fail(e);
  }
}

/** Create a garden: the database stores only the SHA-256 of the key (brief 12.1). */
export async function POST(req: Request) {
  const store = getStore();
  if (!store) return json({ error: "Sync is off on this site." }, 503);
  const key = gardenKeyFrom(req);
  if (!key) return json({ error: "Invalid garden key." }, 401);
  // The database allows 20 new gardens per client a day. Automated test servers skip the per-client limit.
  const client = process.env.GARDENS_PER_IP_PER_DAY ? null : await clientHash(req);
  try {
    const { created } = await store.createGarden(key, client);
    return json({ ok: true, created }, created ? 201 : 200);
  } catch (e) {
    const r = storeErrorResponse(e);
    if (r.status === 429) return json({ error: "Too many new gardens today. Try again tomorrow." }, 429);
    return json({ error: r.error }, r.status);
  }
}

/** Make a new link: re-key the garden. Old links stop working at once. */
export async function PATCH(req: Request) {
  const store = getStore();
  if (!store) return json({ error: "Sync is off on this site." }, 503);
  const key = gardenKeyFrom(req);
  if (!key) return json({ error: "This garden link isn't valid." }, 401);
  let newKey: unknown;
  try {
    newKey = ((await req.json()) as { newKey?: unknown }).newKey;
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  if (typeof newKey !== "string" || !isValidKeyShape(newKey) || newKey === key) return json({ error: "Bad request." }, 400);
  try {
    await store.rotate(key, newKey);
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

/** Delete this garden everywhere. */
export async function DELETE(req: Request) {
  const store = getStore();
  if (!store) return json({ ok: true });
  const key = gardenKeyFrom(req);
  if (!key) return json({ error: "This garden link isn't valid." }, 401);
  try {
    if (!(await store.deleteGarden(key))) return json({ error: "This garden link isn't valid." }, 401);
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
