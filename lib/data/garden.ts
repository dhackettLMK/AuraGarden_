import { getGift } from "@/config/gifts";
import { getDB } from "../db";
import { generateGardenKey } from "../key";
import { COLLECTIONS } from "../types";
import type { Project, Section } from "../types";
import { baseRecord, putMany, uid } from "./core";
import { defaultSettings } from "./settings";

/** Local-only meta keys. */
export type MetaKey =
  | "gardenKey"
  | "deviceId"
  | "cursor"
  | "garden"
  | "lastSyncAt"
  | "syncState"
  | "needsRekey"
  | "tombstones"
  | "serverRegistered";

export async function getMeta<T = unknown>(key: MetaKey): Promise<T | undefined> {
  return (await getDB().meta.get(key))?.value as T | undefined;
}

export async function setMeta(key: MetaKey, value: unknown) {
  await getDB().meta.put({ key, value });
}

export async function deviceId() {
  let id = await getMeta<string>("deviceId");
  if (!id) {
    id = uid("dev_");
    await setMeta("deviceId", id);
  }
  return id;
}

export interface GardenInfo {
  createdAt: number;
  giftSlug: string | null;
}

export async function hasGarden() {
  return !!(await getMeta<string>("gardenKey"));
}

export async function getGardenKey() {
  return getMeta<string>("gardenKey");
}

/**
 * Create a new garden on this device. Gift gardens (e.g. /laura) are seeded
 * with the gift's starter projects; blank gardens start empty.
 */
export async function createGarden(opts: { name: string; giftSlug?: string | null }) {
  const gift = opts.giftSlug ? getGift(opts.giftSlug) : null;
  const key = generateGardenKey();
  await setMeta("gardenKey", key);
  await setMeta("garden", { createdAt: Date.now(), giftSlug: gift?.slug ?? null } satisfies GardenInfo);
  await setMeta("cursor", 0);
  await deviceId();

  const settings = defaultSettings(opts.name.trim() || "Friend", gift?.slug ?? null);
  await putMany("settings", [settings]);

  // My List starts with two sections: Today and Someday (brief 6.4).
  const myList: Section[] = ["Today", "Someday"].map((name, i) => ({
    ...baseRecord(name === "Today" ? "sec_mylist_today" : "sec_mylist_someday"),
    projectId: null,
    name,
    order: i,
  }));
  await putMany("sections", myList);

  if (gift) await seedStarterProjects(gift.slug);
  return key;
}

export async function seedStarterProjects(slug: string) {
  const gift = getGift(slug);
  if (!gift) return;
  const projects: Project[] = [];
  const sections: Section[] = [];
  gift.starterProjects.forEach((p, i) => {
    const id = `prj_${p.kind}`;
    projects.push({
      ...baseRecord(id),
      name: p.name,
      description: p.description,
      color: p.color,
      icon: p.icon,
      kind: p.kind,
      order: i,
      archived: false,
    });
    p.sections.forEach((name, j) =>
      sections.push({ ...baseRecord(`sec_${p.kind}_${j}`), projectId: id, name, order: j }),
    );
  });
  await putMany("projects", projects);
  await putMany("sections", sections);
}

/** Save a key from a join link. Data arrives on the first sync pull. */
export async function adoptGardenKey(key: string) {
  await wipeLocal();
  await setMeta("gardenKey", key);
  await setMeta("cursor", 0);
  await setMeta("serverRegistered", true);
  await deviceId();
}

/** Clear every collection and meta (keeps the device id). */
export async function wipeLocal() {
  const db = getDB();
  const dev = await getMeta<string>("deviceId");
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
  if (dev) await setMeta("deviceId", dev);
}

/** Export everything as a JSON-able object. */
export async function exportAll() {
  const db = getDB();
  const out: Record<string, unknown[]> = {};
  for (const c of COLLECTIONS) out[c] = await db[c].toArray();
  return { app: "AuraGarden", version: 1, exportedAt: new Date().toISOString(), data: out };
}

export async function importAll(json: unknown) {
  const parsed = json as { app?: string; data?: Record<string, unknown[]> };
  if (parsed?.app !== "AuraGarden" || !parsed.data) throw new Error("That file isn't an AuraGarden export.");
  for (const c of COLLECTIONS) {
    const rows = parsed.data[c];
    if (Array.isArray(rows) && rows.length) await putMany(c, rows as never);
  }
}
