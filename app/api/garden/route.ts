import { clientIp, gardenIdFrom, json } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";
import { isValidKeyShape, sha256Hex } from "@/lib/key";

export const runtime = "nodejs";
export const preferredRegion = "dub1";

/** Is this key a garden? Returns its display name for the join screen. Never logs the key. */
export async function GET(req: Request) {
  const store = getStore();
  if (!store) return json({ enabled: false }, 200);
  const id = await gardenIdFrom(req);
  if (!id || !(await store.gardenExists(id))) return json({ error: "This garden link isn't valid." }, 401);
  return json({ ok: true, name: await store.gardenName(id) });
}

/** Create a garden: the server stores only the SHA-256 of the key (brief 12.1). */
export async function POST(req: Request) {
  const store = getStore();
  if (!store) return json({ error: "Sync is off on this site." }, 503);
  const id = await gardenIdFrom(req);
  if (!id) return json({ error: "Invalid garden key." }, 401);
  // 20 new gardens per IP per day (brief 12.3); raised only for automated test servers.
  const perDay = Number(process.env.GARDENS_PER_IP_PER_DAY) || 20;
  if (!(await store.rateLimit(`create:${clientIp(req)}`, perDay, 86_400))) return json({ error: "Too many new gardens today. Try again tomorrow." }, 429);
  const created = await store.createGarden(id);
  return json({ ok: true, created }, created ? 201 : 200);
}

/** Make a new link: re-key the garden in one transaction. Old links stop working. */
export async function PATCH(req: Request) {
  const store = getStore();
  if (!store) return json({ error: "Sync is off on this site." }, 503);
  const id = await gardenIdFrom(req);
  if (!id || !(await store.gardenExists(id))) return json({ error: "This garden link isn't valid." }, 401);
  let newKey: unknown;
  try {
    newKey = ((await req.json()) as { newKey?: unknown }).newKey;
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  if (typeof newKey !== "string" || !isValidKeyShape(newKey)) return json({ error: "Bad request." }, 400);
  const ok = await store.rotate(id, await sha256Hex(newKey));
  return ok ? json({ ok: true }) : json({ error: "Couldn't make a new link." }, 409);
}

/** Delete this garden everywhere. */
export async function DELETE(req: Request) {
  const store = getStore();
  if (!store) return json({ ok: true });
  const id = await gardenIdFrom(req);
  if (!id || !(await store.gardenExists(id))) return json({ error: "This garden link isn't valid." }, 401);
  await store.deleteGarden(id);
  return json({ ok: true });
}
