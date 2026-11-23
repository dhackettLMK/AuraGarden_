"use client";

import { generateGardenKey } from "../key";
import { getGardenKey, setMeta, wipeLocal } from "../data/garden";

/**
 * Garden-level server calls. Phase 8 fills these in against /api/garden;
 * with sync off they act on this device only.
 */
export async function rotateGardenKey(): Promise<string> {
  const fresh = generateGardenKey();
  await setMeta("gardenKey", fresh);
  return fresh;
}

export async function deleteGardenEverywhere() {
  void (await getGardenKey());
  await wipeLocal();
}
