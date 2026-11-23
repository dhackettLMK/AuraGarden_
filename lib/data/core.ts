import { getDB } from "../db";
import type { AnyRecord, Collection, CollectionMap } from "../types";

export const TRASH_DAYS = 30;
const DAY_MS = 86_400_000;

export function now() {
  return Date.now();
}

/** Short random ids: 16 url-safe characters. */
export function uid(prefix = ""): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36];
  return prefix + s;
}

type Listener = () => void;
const changeListeners = new Set<Listener>();

/** The SyncEngine subscribes here to learn about local edits. */
export function onLocalChange(fn: Listener) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

function emitChange() {
  for (const fn of changeListeners) fn();
}

function table<C extends Collection>(collection: C) {
  // Dexie tables are typed per collection on GardenDB.
  return getDB()[collection] as unknown as import("dexie").Table<CollectionMap[C], string>;
}

async function enqueue(collection: Collection, ids: string[]) {
  const db = getDB();
  const queuedAt = now();
  await db.outbox.bulkPut(ids.map((id) => ({ key: `${collection}:${id}`, collection, id, queuedAt })));
}

/** Insert or replace records. Stamps updatedAt and queues them for sync. */
export async function putMany<C extends Collection>(
  collection: C,
  records: CollectionMap[C][],
  opts: { keepTimestamps?: boolean } = {},
) {
  if (!records.length) return;
  const db = getDB();
  const t = now();
  const stamped = records.map((r) => (opts.keepTimestamps ? r : { ...r, updatedAt: Math.max(t, r.updatedAt + 1) }));
  await db.transaction("rw", [db[collection], db.outbox], async () => {
    await table(collection).bulkPut(stamped);
    await enqueue(
      collection,
      stamped.map((r) => r.id),
    );
  });
  emitChange();
  return stamped;
}

export async function put<C extends Collection>(collection: C, record: CollectionMap[C]) {
  const [saved] = (await putMany(collection, [record]))!;
  return saved;
}

export async function get<C extends Collection>(collection: C, id: string) {
  return (await table(collection).get(id)) as CollectionMap[C] | undefined;
}

/** Shallow-merge changes into a record. */
export async function patch<C extends Collection>(
  collection: C,
  id: string,
  changes: Partial<CollectionMap[C]>,
) {
  const db = getDB();
  let saved: CollectionMap[C] | undefined;
  await db.transaction("rw", [db[collection], db.outbox], async () => {
    const current = await table(collection).get(id);
    if (!current) return;
    saved = { ...current, ...changes, updatedAt: Math.max(now(), current.updatedAt + 1) } as CollectionMap[C];
    await table(collection).put(saved);
    await enqueue(collection, [id]);
  });
  if (saved) emitChange();
  return saved;
}

/** Soft delete into Trash. Returns a function that undoes it. */
export async function softDelete(collection: Collection, ids: string | string[]) {
  const list = Array.isArray(ids) ? ids : [ids];
  const t = now();
  for (const id of list) await patch(collection, id, { deletedAt: t } as Partial<AnyRecord>);
  return () => restore(collection, list);
}

export async function restore(collection: Collection, ids: string | string[]) {
  const list = Array.isArray(ids) ? ids : [ids];
  for (const id of list) await patch(collection, id, { deletedAt: null } as Partial<AnyRecord>);
}

/**
 * Delete forever. The record travels to other devices as a purged tombstone
 * (deletedAt set, purged flag) and is then removed locally.
 */
export async function purge(collection: Collection, ids: string | string[]) {
  const list = Array.isArray(ids) ? ids : [ids];
  const db = getDB();
  await db.transaction("rw", [db[collection], db.outbox, db.meta], async () => {
    const tombstones: Record<string, unknown> = {};
    for (const id of list) {
      const rec = await table(collection).get(id);
      if (!rec) continue;
      tombstones[`${collection}:${id}`] = {
        ...rec,
        deletedAt: rec.deletedAt ?? now(),
        updatedAt: now(),
        purged: true,
      };
      await table(collection).delete(id);
    }
    const existing = ((await db.meta.get("tombstones"))?.value ?? {}) as Record<string, unknown>;
    await db.meta.put({ key: "tombstones", value: { ...existing, ...tombstones } });
    await enqueue(collection, list);
  });
  emitChange();
}

/** Remove trash older than 30 days. */
export async function emptyOldTrash() {
  const cutoff = now() - TRASH_DAYS * DAY_MS;
  for (const c of ["projects", "sections", "tasks", "thoughts", "contacts", "catchups", "events", "calendar_subscriptions"] as const) {
    const old = (await table(c).toArray()).filter((r) => r.deletedAt && r.deletedAt < cutoff);
    if (old.length) await purge(c, old.map((r) => r.id));
  }
}

export function alive<T extends { deletedAt: number | null }>(rows: T[] | undefined): T[] {
  return (rows ?? []).filter((r) => !r.deletedAt);
}

export function byOrder<T extends { order: number }>(a: T, b: T) {
  return a.order - b.order;
}

/** An order value that sorts after every row. */
export function nextOrder(rows: { order: number }[]) {
  return rows.length ? Math.max(...rows.map((r) => r.order)) + 1 : 0;
}

/** Re-number orders after a drag. */
export async function reorder(collection: Collection, idsInOrder: string[]) {
  const rows = await table(collection).bulkGet(idsInOrder);
  const changed = rows
    .map((r, i) => (r && (r as { order?: number }).order !== i ? { ...r, order: i } : null))
    .filter(Boolean) as CollectionMap[Collection][];
  if (changed.length) await putMany(collection, changed as never);
}

export function baseRecord(id = uid()) {
  const t = now();
  return { id, createdAt: t, updatedAt: t, deletedAt: null };
}
