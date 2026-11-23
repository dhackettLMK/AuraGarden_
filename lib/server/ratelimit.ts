import "server-only";
import { getStore } from "./store";

const memory = new Map<string, { count: number; start: number }>();

/** True if allowed. Uses the database when configured, memory otherwise. */
export async function allow(bucket: string, limit: number, windowSec: number) {
  const store = getStore();
  if (store) return store.rateLimit(bucket, limit, windowSec);
  const now = Date.now();
  const cur = memory.get(bucket);
  if (!cur || now - cur.start > windowSec * 1000) {
    memory.set(bucket, { count: 1, start: now });
    return true;
  }
  cur.count++;
  return cur.count <= limit;
}
