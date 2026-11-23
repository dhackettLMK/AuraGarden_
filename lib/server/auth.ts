import "server-only";
import { isValidKeyShape, sha256Hex } from "@/lib/key";
import { getStore } from "./store";

/** Read the garden key from `Authorization: Garden <key>`, or null. Never log the header. */
export function gardenKeyFrom(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Garden\s+([A-Za-z0-9_-]+)$/);
  return m && isValidKeyShape(m[1]) ? m[1] : null;
}

/**
 * A valid key for a garden that exists (when sync is configured). Returns the
 * key and its SHA-256 (the garden id, safe to use in rate-limit buckets).
 */
export async function requireGarden(req: Request): Promise<{ key: string; id: string } | null> {
  const key = gardenKeyFrom(req);
  if (!key) return null;
  const store = getStore();
  if (store) {
    try {
      if (!(await store.checkGarden(key))) return null;
    } catch {
      return null;
    }
  }
  return { key, id: await sha256Hex(key) };
}

/**
 * The caller's IP hashed with CRON_SECRET as a salt, for the database's
 * per-client limit on new gardens. The raw IP never leaves this server.
 */
export async function clientHash(req: Request): Promise<string> {
  return sha256Hex(`${process.env.CRON_SECRET ?? "auragarden"}:${clientIp(req)}`);
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
