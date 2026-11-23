import "server-only";

export interface SyncChange {
  collection: string;
  id: string;
  data: unknown;
  updated_at: number;
  deleted_at: number | null;
}

export interface SyncResult {
  changes?: (SyncChange & { seq: number })[];
  cursor?: number;
  more?: boolean;
  error?: "unknown_garden" | "garden_full";
}

/** The sync store: the SQL functions in supabase/migrations, called by our server routes only. */
export interface GardenStore {
  gardenExists(id: string): Promise<boolean>;
  createGarden(id: string): Promise<boolean>;
  sync(garden: string, changes: SyncChange[], cursor: number, device: string): Promise<SyncResult>;
  rotate(oldId: string, newId: string): Promise<boolean>;
  deleteGarden(id: string): Promise<boolean>;
  gardenName(id: string): Promise<string | null>;
  rateLimit(bucket: string, limit: number, windowSec: number): Promise<boolean>;
  keepalive(): Promise<void>;
}

let cached: GardenStore | null | undefined;

/**
 * Supabase when SUPABASE_URL and SUPABASE_SECRET_KEY are set (production);
 * a direct Postgres connection when DATABASE_URL is set (local dev and tests);
 * otherwise null, and sync is off.
 */
export function getStore(): GardenStore | null {
  if (cached !== undefined) return cached;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) cached = supabaseStore(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  else if (process.env.DATABASE_URL) cached = postgresStore(process.env.DATABASE_URL);
  else cached = null;
  return cached;
}

function supabaseStore(url: string, key: string): GardenStore {
  // Lazy import keeps supabase-js out of routes that never touch the store.
  const client = import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { "x-client-info": "auragarden" } } }),
  );
  const rpc = async <T,>(fn: string, args: Record<string, unknown>): Promise<T> => {
    const { data, error } = await (await client).rpc(fn, args);
    if (error) throw new Error(`store: ${fn} failed`);
    return data as T;
  };
  return {
    gardenExists: (id) => rpc("ag_garden_exists", { p_id: id }),
    createGarden: (id) => rpc("ag_create_garden", { p_id: id }),
    sync: (garden, changes, cursor, device) => rpc("ag_sync", { p_garden: garden, p_changes: changes, p_cursor: cursor, p_device: device }),
    rotate: (o, n) => rpc("ag_rotate_garden", { p_old: o, p_new: n }),
    deleteGarden: (id) => rpc("ag_delete_garden", { p_id: id }),
    gardenName: (id) => rpc("ag_garden_name", { p_id: id }),
    rateLimit: (b, l, w) => rpc("ag_rate_limit", { p_bucket: b, p_limit: l, p_window_seconds: w }),
    keepalive: () => rpc("ag_keepalive", {}),
  };
}

function postgresStore(url: string): GardenStore {
  const sql = import("postgres").then(({ default: postgres }) => postgres(url, { max: 4, onnotice: () => {} }));
  const one = async <T,>(fn: string, args: unknown[], casts: string[] = []): Promise<T> => {
    const s = await sql;
    const placeholders = args.map((_, i) => `$${i + 1}${casts[i] ? `::${casts[i]}` : ""}`).join(", ");
    const rows = await s.unsafe(`select ${fn}(${placeholders}) as v`, args as never[]);
    return rows[0].v as T;
  };
  return {
    gardenExists: (id) => one("ag_garden_exists", [id]),
    createGarden: (id) => one("ag_create_garden", [id]),
    sync: (garden, changes, cursor, device) => one("ag_sync", [garden, changes, cursor, device], ["", "jsonb", "bigint", ""]),
    rotate: (o, n) => one("ag_rotate_garden", [o, n]),
    deleteGarden: (id) => one("ag_delete_garden", [id]),
    gardenName: (id) => one("ag_garden_name", [id]),
    rateLimit: (b, l, w) => one("ag_rate_limit", [b, l, w], ["", "int", "int"]),
    keepalive: () => one("ag_keepalive", []),
  };
}
