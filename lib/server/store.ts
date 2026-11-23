import "server-only";

/**
 * The sync store: the live Supabase database's ag_* functions (supabase/setup.sql,
 * brief 12.3), called from our server routes only. Every function takes the raw
 * garden key and hashes it in SQL; the key is never stored or logged.
 */

/** A change on the wire between the app and the database. Timestamps are ISO strings. */
export interface DbChange {
  collection: string;
  id: string;
  data: unknown;
  updated_at: string;
  deleted_at: string | null;
}

export interface DbSyncResult {
  cursor: number;
  more: boolean;
  changes: DbChange[];
}

/** The error codes the ag_* functions raise. */
export type StoreErrorCode =
  | "invalid_key"
  | "garden_not_found"
  | "bad_request"
  | "payload_too_large"
  | "too_many_changes"
  | "rate_limited"
  | "garden_full";

const CODES: StoreErrorCode[] = ["invalid_key", "garden_not_found", "bad_request", "payload_too_large", "too_many_changes", "rate_limited", "garden_full"];

export class StoreError extends Error {
  constructor(public code: StoreErrorCode | "unavailable") {
    super(`store: ${code}`);
  }
}

/** Turn a database error into a StoreError without ever echoing its details. */
function toStoreError(message: string | undefined): StoreError {
  const code = CODES.find((c) => message?.includes(c));
  return new StoreError(code ?? "unavailable");
}

export interface GardenStore {
  createGarden(key: string, client: string | null): Promise<{ created: boolean }>;
  checkGarden(key: string): Promise<boolean>;
  sync(key: string, cursor: number, changes: DbChange[]): Promise<DbSyncResult>;
  rotate(oldKey: string, newKey: string): Promise<boolean>;
  deleteGarden(key: string): Promise<boolean>;
  heartbeat(): Promise<void>;
}

let cached: GardenStore | null | undefined;

/**
 * Supabase when SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set (production);
 * a direct Postgres connection running the same setup.sql when DATABASE_URL is
 * set (local dev and tests); otherwise null, and sync is off.
 */
export function getStore(): GardenStore | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (url && key) cached = supabaseStore(url, key);
  else if (process.env.DATABASE_URL) cached = postgresStore(process.env.DATABASE_URL);
  else cached = null;
  return cached;
}

type Call = <T>(fn: string, args: [string, unknown, string?][]) => Promise<T>;

function storeFrom(call: Call): GardenStore {
  return {
    createGarden: (key, client) => call("ag_create_garden", [["p_key", key], ["p_client", client]]),
    checkGarden: (key) => call("ag_check_garden", [["p_key", key]]),
    sync: (key, cursor, changes) => call("ag_sync", [["p_key", key], ["p_cursor", cursor, "bigint"], ["p_changes", changes, "jsonb"]]),
    rotate: (oldKey, newKey) => call("ag_rotate_garden", [["p_old_key", oldKey], ["p_new_key", newKey]]),
    deleteGarden: (key) => call("ag_delete_garden", [["p_key", key]]),
    heartbeat: async () => {
      await call("ag_heartbeat", []);
    },
  };
}

function supabaseStore(url: string, apiKey: string): GardenStore {
  // Lazy import keeps supabase-js out of routes that never touch the store.
  const client = import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, apiKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { "x-client-info": "auragarden" } } }),
  );
  return storeFrom(async (fn, args) => {
    const { data, error } = await (await client).rpc(fn, Object.fromEntries(args.map(([name, value]) => [name, value])));
    if (error) throw toStoreError(error.message);
    return data;
  });
}

function postgresStore(url: string): GardenStore {
  const sql = import("postgres").then(({ default: postgres }) => postgres(url, { max: 4, onnotice: () => {} }));
  return storeFrom(async (fn, args) => {
    const s = await sql;
    const params = args.map(([name, , cast], i) => `${name} => $${i + 1}${cast ? `::${cast}` : ""}`).join(", ");
    try {
      const rows = await s.unsafe(`select public.${fn}(${params}) as v`, args.map(([, value]) => value) as never[]);
      return rows[0].v;
    } catch (e) {
      throw toStoreError((e as Error).message);
    }
  });
}

/** HTTP status and a friendly message for each store error (brief 12.3). */
export function storeErrorResponse(e: unknown): { status: number; error: string } {
  const code = e instanceof StoreError ? e.code : "unavailable";
  switch (code) {
    case "invalid_key":
    case "garden_not_found":
      return { status: 401, error: "This garden link isn't valid." };
    case "bad_request":
    case "too_many_changes":
      return { status: 400, error: "Bad request." };
    case "payload_too_large":
      return { status: 413, error: "Too much at once." };
    case "rate_limited":
      return { status: 429, error: "Slow down a little." };
    case "garden_full":
      return { status: 507, error: "Your garden is full (50 MB). Empty the Trash or remove some photos." };
    default:
      return { status: 503, error: "Sync is having a moment. It'll try again." };
  }
}
