"use client";

/**
 * The SyncEngine (brief 12.2). Dexie is the source of truth on each device;
 * every local change also lands in the outbox. The engine posts
 * { cursor, changes } to /api/sync 2 s after edits settle, when the app
 * regains focus, when the network comes back, and on a short poll while
 * visible, then applies everything newer than its cursor.
 */
import { getDB } from "../db";
import { onLocalChange } from "../data/core";
import { deviceId, getGardenKey, getMeta, setMeta } from "../data/garden";
import { COLLECTIONS, type Collection } from "../types";
import { useSyncStore } from "./status";

interface WireChange {
  collection: Collection;
  id: string;
  data: Record<string, unknown>;
  updated_at: number;
  deleted_at: number | null;
}

const DEBOUNCE_MS = 2000;
const POLL_MS = 5000;
const BATCH = 400;

let started = false;
let enabled = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let poll: ReturnType<typeof setInterval> | null = null;
let running: Promise<void> | null = null;
let again = false;

const setStatus = (s: Parameters<ReturnType<typeof useSyncStore.getState>["set"]>[0]) => useSyncStore.getState().set(s);

export async function syncEnabled(): Promise<boolean> {
  try {
    const res = await fetch("/api/sync", { cache: "no-store" });
    return ((await res.json()) as { enabled?: boolean }).enabled === true;
  } catch {
    return false;
  }
}

/** Start once per page. Safe to call again. */
export async function startSync() {
  if (started) return;
  started = true;
  enabled = await syncEnabled();
  if (!enabled) {
    setStatus({ status: "off" });
    return;
  }
  setStatus({ status: navigator.onLine ? "syncing" : "offline", lastSyncAt: (await getMeta<number>("lastSyncAt")) ?? null });
  onLocalChange(() => schedule(DEBOUNCE_MS));
  window.addEventListener("online", () => schedule(0));
  window.addEventListener("offline", () => setStatus({ status: "offline" }));
  window.addEventListener("focus", () => schedule(0));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") schedule(0);
  });
  poll = setInterval(() => {
    if (document.visibilityState === "visible") schedule(0);
  }, POLL_MS);
  schedule(0);
}

export function stopSync() {
  if (poll) clearInterval(poll);
  poll = null;
  started = false;
}

export function schedule(ms: number) {
  if (!enabled) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), ms);
}

/** Run a sync now (coalesces overlapping calls). */
export async function syncNow(): Promise<void> {
  if (!enabled) return;
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await syncOnce();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function ensureRegistered(key: string) {
  if (await getMeta<boolean>("serverRegistered")) return true;
  const res = await fetch("/api/garden", { method: "POST", headers: { Authorization: `Garden ${key}` } });
  if (res.ok) {
    await setMeta("serverRegistered", true);
    return true;
  }
  return false;
}

async function syncOnce() {
  const key = await getGardenKey();
  if (!key) return;
  if (!navigator.onLine) {
    setStatus({ status: "offline" });
    return;
  }
  if (await getMeta<boolean>("needsRekey")) {
    setStatus({ status: "attention", message: "This garden has a new link. Scan it to keep syncing." });
    return;
  }
  setStatus({ status: "syncing" });
  try {
    if (!(await ensureRegistered(key))) throw new Error("register");
    const db = getDB();
    const device = await deviceId();
    let more = true;
    let rounds = 0;
    while (more && rounds++ < 20) {
      const outbox = await db.outbox.orderBy("queuedAt").limit(BATCH).toArray();
      const changes = await buildChanges(outbox);
      const cursor = (await getMeta<number>("cursor")) ?? 0;
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Garden ${key}` },
        body: JSON.stringify({ cursor, deviceId: device, changes }),
      });
      if (res.status === 401) {
        await setMeta("needsRekey", true);
        setStatus({ status: "attention", message: "This garden has a new link. Scan it to keep syncing." });
        return;
      }
      if (!res.ok) {
        const msg = ((await res.json().catch(() => ({}))) as { error?: string }).error;
        setStatus({ status: "attention", message: msg ?? "Sync is having a moment. It'll try again." });
        return;
      }
      const data = (await res.json()) as { changes: WireChange[]; cursor: number; more: boolean };
      // Clear what we sent, unless it changed again while in flight.
      await db.transaction("rw", db.outbox, async () => {
        for (const o of outbox) {
          const cur = await db.outbox.get(o.key);
          if (cur && cur.queuedAt === o.queuedAt) await db.outbox.delete(o.key);
        }
      });
      await applyRemote(data.changes);
      await setMeta("cursor", data.cursor);
      const pending = await db.outbox.count();
      more = data.more || (pending > 0 && outbox.length === BATCH);
    }
    const now = Date.now();
    await setMeta("lastSyncAt", now);
    setStatus({ status: "synced", lastSyncAt: now, message: null });
  } catch {
    setStatus({ status: navigator.onLine ? "attention" : "offline", message: navigator.onLine ? "Sync is having a moment. It'll try again." : null });
    schedule(15_000);
  }
}

async function buildChanges(outbox: { collection: Collection; id: string }[]): Promise<WireChange[]> {
  const db = getDB();
  const tombs = ((await getMeta<Record<string, Record<string, unknown>>>("tombstones")) ?? {}) as Record<string, Record<string, unknown>>;
  const out: WireChange[] = [];
  for (const o of outbox) {
    const rec = (await db[o.collection].get(o.id)) as unknown as Record<string, unknown> | undefined;
    const data = rec ?? tombs[`${o.collection}:${o.id}`];
    if (!data) continue;
    out.push({ collection: o.collection, id: o.id, data, updated_at: Number(data.updatedAt) || Date.now(), deleted_at: (data.deletedAt as number | null) ?? null });
  }
  return out;
}

/**
 * Apply server changes without queueing them again. Last write wins: a
 * local record that is newer and still waiting in the outbox is kept.
 */
export async function applyRemote(changes: WireChange[]) {
  if (!changes.length) return;
  const db = getDB();
  const known = new Set<string>(COLLECTIONS);
  await db.transaction("rw", [...COLLECTIONS.map((c) => db[c]), db.outbox], async () => {
    for (const c of changes) {
      if (!known.has(c.collection)) continue;
      const table = db[c.collection] as unknown as import("dexie").Table<Record<string, unknown>, string>;
      const local = await table.get(c.id);
      const pending = await db.outbox.get(`${c.collection}:${c.id}`);
      if (local && pending && Number(local.updatedAt) > c.updated_at) continue;
      if ((c.data as { purged?: boolean }).purged) {
        await table.delete(c.id);
        continue;
      }
      await table.put({ ...c.data, id: c.id, updatedAt: c.updated_at, deletedAt: c.deleted_at });
    }
  });
}
