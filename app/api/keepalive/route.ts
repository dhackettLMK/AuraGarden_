import { json } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";

/**
 * Daily cron (vercel.json): ag_heartbeat writes one row so Supabase never
 * pauses the project, and purges old tombstones. Vercel sends
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "Unauthorised" }, 401);
  const store = getStore();
  if (!store) return json({ ok: true, sync: false });
  try {
    await store.heartbeat();
    return json({ ok: true });
  } catch {
    return json({ error: "Heartbeat failed." }, 503);
  }
}
