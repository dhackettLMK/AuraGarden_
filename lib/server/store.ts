import "server-only";

/** The sync store. Filled in with Supabase (and a local Postgres for dev) in phase 8. */
export interface GardenStore {
  gardenExists(id: string): Promise<boolean>;
  rateLimit(bucket: string, limit: number, windowSec: number): Promise<boolean>;
}

export function getStore(): GardenStore | null {
  return null;
}
