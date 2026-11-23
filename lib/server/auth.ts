import "server-only";
import { isValidKeyShape, sha256Hex } from "@/lib/key";
import { getStore } from "./store";

/**
 * Read the garden key from `Authorization: Garden <key>`. Returns the garden
 * id (the SHA-256 of the key) or null. Never log the header.
 */
export async function gardenIdFrom(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Garden\s+([A-Za-z0-9_-]+)$/);
  if (!m || !isValidKeyShape(m[1])) return null;
  return sha256Hex(m[1]);
}

/** A valid key for a garden that exists (when sync is configured). */
export async function requireGarden(req: Request): Promise<{ id: string } | null> {
  const id = await gardenIdFrom(req);
  if (!id) return null;
  const store = getStore();
  if (store && !(await store.gardenExists(id))) return null;
  return { id };
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
