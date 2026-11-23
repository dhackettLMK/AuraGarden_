"use client";

import { generateGardenKey } from "../key";
import { getGardenKey, getMeta, setMeta, wipeLocal, adoptGardenKey } from "../data/garden";
import { startSync, syncEnabled, syncNow } from "./engine";
import { updateSettings } from "../data/settings";

/** "Make a new link": re-keys the garden on the server, then here. */
export async function rotateGardenKey(): Promise<string> {
  const old = await getGardenKey();
  const fresh = generateGardenKey();
  if (old && (await syncEnabled())) {
    await syncNow();
    const res = await fetch("/api/garden", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Garden ${old}` },
      body: JSON.stringify({ newKey: fresh }),
    });
    if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't make a new link right now.");
  }
  await setMeta("gardenKey", fresh);
  // The new link hasn't been saved anywhere yet.
  await updateSettings({ linkSavedAt: null });
  return fresh;
}

/** "Delete this garden": wipes it on the server and on this device. */
export async function deleteGardenEverywhere() {
  const key = await getGardenKey();
  if (key && (await syncEnabled())) {
    const res = await fetch("/api/garden", { method: "DELETE", headers: { Authorization: `Garden ${key}` } });
    if (!res.ok && res.status !== 401) throw new Error("Couldn't delete the garden right now. Try again when you're online.");
  }
  await wipeLocal();
}

/** Check a key against the server. Returns the garden's name, or null if invalid. */
export async function checkKey(key: string): Promise<{ ok: boolean; name: string | null; syncOff?: boolean }> {
  const res = await fetch("/api/garden", { headers: { Authorization: `Garden ${key}` }, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; name?: string | null; enabled?: boolean };
  if (data.enabled === false) return { ok: false, name: null, syncOff: true };
  return { ok: res.ok, name: data.name ?? null };
}

/**
 * Open a garden on this device from its key. If this device was waiting for a
 * re-key (the link was rotated elsewhere), keep local data and re-sync.
 */
export async function joinGarden(key: string) {
  const current = await getGardenKey();
  if (current && (await getMeta<boolean>("needsRekey"))) {
    await setMeta("gardenKey", key);
    await setMeta("needsRekey", false);
    await setMeta("cursor", 0);
  } else if (current !== key) {
    await adoptGardenKey(key);
  }
  await startSync();
  await syncNow();
}
