import "server-only";

const memory = new Map<string, { count: number; start: number }>();

/**
 * True if allowed. A best-effort in-memory limiter per server instance, for
 * routes the database doesn't limit itself (the calendar feed proxy). Garden
 * creation and sync are rate-limited inside the database functions.
 */
export async function allow(bucket: string, limit: number, windowSec: number) {
  const now = Date.now();
  if (memory.size > 5000) for (const [k, v] of memory) if (now - v.start > windowSec * 1000) memory.delete(k);
  const cur = memory.get(bucket);
  if (!cur || now - cur.start > windowSec * 1000) {
    memory.set(bucket, { count: 1, start: now });
    return true;
  }
  cur.count++;
  return cur.count <= limit;
}
