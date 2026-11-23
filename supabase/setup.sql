-- AuraGarden database: no accounts, gardens keyed by the SHA-256 hash of a secret garden key.
-- Tables are locked (RLS on, no policies, no table grants). The app's server routes reach the data
-- only through the ag_* functions below, using the project's publishable key (server-side env var).
-- This exact file is already applied to the live project. See AURAGARDEN_BRIEF.md section 12.

-- ---------- tables ----------

create table public.gardens (
  id text primary key,                                   -- sha256(garden key), hex
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  bytes_used bigint not null default 0
);

create sequence public.records_seq;

create table public.records (
  garden_id text not null references public.gardens(id) on delete cascade on update cascade,
  collection text not null check (collection ~ '^[a-z][a-z0-9_]{0,39}$'),
  id text not null check (char_length(id) between 1 and 200),
  data jsonb not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_seq bigint not null default nextval('public.records_seq'),
  primary key (garden_id, collection, id)
);
create index records_pull on public.records (garden_id, server_seq);

create table public.rate_limits (
  bucket text primary key,
  count int not null,
  window_start timestamptz not null
);

create table public.heartbeat (
  id int primary key,
  beat_at timestamptz not null
);

alter table public.gardens enable row level security;
alter table public.records enable row level security;
alter table public.rate_limits enable row level security;
alter table public.heartbeat enable row level security;

revoke all on public.gardens, public.records, public.rate_limits, public.heartbeat from anon, authenticated;
revoke all on sequence public.records_seq from anon, authenticated;

-- ---------- internal helpers (not callable by clients) ----------

create function public.ag_garden_id(p_key text)
returns text
language plpgsql immutable
set search_path = ''
as $$
begin
  if p_key is null or p_key !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid_key';
  end if;
  return encode(sha256(convert_to(p_key, 'UTF8')), 'hex');
end $$;

-- Fixed-window rate limiter (internal). Returns true while the bucket is within p_max calls per window.
create function public.ag_rate_limit(p_bucket text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  insert into public.rate_limits as rl (bucket, count, window_start)
  values (left(p_bucket, 200), 1, now())
  on conflict (bucket) do update set
    count = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rl.count + 1 end,
    window_start = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then now() else rl.window_start end
  returning count into v_count;
  return v_count <= p_max;
end $$;

-- ---------- public API (called by the app's server routes) ----------

-- Create a garden. p_client is a hash of the caller's IP made by the server (never the raw IP).
-- Returns {"created": true} for a new garden, {"created": false} if the key already exists.
create function public.ag_create_garden(p_key text, p_client text default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id text := public.ag_garden_id(p_key);
  v_rows int;
begin
  if not public.ag_rate_limit('create:all', 500, 86400) then
    raise exception 'rate_limited';
  end if;
  if p_client is not null and not public.ag_rate_limit('create:' || p_client, 20, 86400) then
    raise exception 'rate_limited';
  end if;
  insert into public.gardens (id) values (v_id) on conflict (id) do nothing;
  get diagnostics v_rows = row_count;
  return jsonb_build_object('created', v_rows = 1);
end $$;

-- True if the garden exists (and touches last_seen_at). Rate-limited to 120 calls a minute per garden.
-- Use before serving calendar feeds and other key-gated server work.
create function public.ag_check_garden(p_key text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id text := public.ag_garden_id(p_key);
begin
  update public.gardens set last_seen_at = now() where id = v_id;
  if not found then
    return false;
  end if;
  if not public.ag_rate_limit('check:' || v_id, 120, 60) then
    raise exception 'rate_limited';
  end if;
  return true;
end $$;

-- Push local changes and pull everything newer than p_cursor.
-- p_changes: [{"collection","id","data","updated_at","deleted_at"}], at most 1,000 items and 2 MB.
-- Last write wins per record by updated_at (clamped to now() + 5 min); ties keep the server copy.
-- Returns {"cursor": <bigint>, "more": <bool>, "changes": [same shape as above]} (up to 2,000 rows).
create function public.ag_sync(p_key text, p_cursor bigint, p_changes jsonb default '[]'::jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id text := public.ag_garden_id(p_key);
  v_changes jsonb := coalesce(p_changes, '[]'::jsonb);
  v_bytes bigint;
  v_rows jsonb;
  v_last bigint;
  v_more boolean;
begin
  select bytes_used into v_bytes from public.gardens where id = v_id;
  if not found then
    raise exception 'garden_not_found';
  end if;
  if jsonb_typeof(v_changes) <> 'array' then
    raise exception 'bad_request';
  end if;
  if octet_length(v_changes::text) > 2097152 then
    raise exception 'payload_too_large';
  end if;
  if jsonb_array_length(v_changes) > 1000 then
    raise exception 'too_many_changes';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_changes) as c
    where jsonb_typeof(c) <> 'object'
       or c->>'collection' is null or c->>'id' is null or c->>'updated_at' is null
  ) then
    raise exception 'bad_request';
  end if;
  if not public.ag_rate_limit('sync:' || v_id, 120, 60) then
    raise exception 'rate_limited';
  end if;

  if jsonb_array_length(v_changes) > 0 then
    if v_bytes > 52428800 then
      raise exception 'garden_full';
    end if;

    insert into public.records as r (garden_id, collection, id, data, updated_at, deleted_at)
    select distinct on (c->>'collection', c->>'id')
           v_id,
           c->>'collection',
           c->>'id',
           coalesce(c->'data', '{}'::jsonb),
           least((c->>'updated_at')::timestamptz, now() + interval '5 minutes'),
           (c->>'deleted_at')::timestamptz
    from jsonb_array_elements(v_changes) as c
    order by c->>'collection', c->>'id', (c->>'updated_at')::timestamptz desc
    on conflict (garden_id, collection, id) do update set
      data = excluded.data,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      server_seq = nextval('public.records_seq')
    where excluded.updated_at > r.updated_at;

    update public.gardens
    set bytes_used = (select coalesce(sum(pg_column_size(data)), 0) from public.records where garden_id = v_id),
        last_seen_at = now()
    where id = v_id;
  else
    update public.gardens set last_seen_at = now() where id = v_id;
  end if;

  with page as (
    select collection, id, data, updated_at, deleted_at, server_seq
    from public.records
    where garden_id = v_id and server_seq > coalesce(p_cursor, 0)
    order by server_seq
    limit 2001
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'collection', collection, 'id', id, 'data', data,
      'updated_at', updated_at, 'deleted_at', deleted_at
    ) order by server_seq) filter (where rn <= 2000), '[]'::jsonb),
    max(server_seq) filter (where rn <= 2000),
    count(*) > 2000
  into v_rows, v_last, v_more
  from (select page.*, row_number() over (order by server_seq) as rn from page) as numbered;

  return jsonb_build_object(
    'cursor', coalesce(v_last, coalesce(p_cursor, 0)),
    'more', coalesce(v_more, false),
    'changes', v_rows
  );
end $$;

-- Re-key a garden ("Make a new link"). Old key stops working immediately.
create function public.ag_rotate_garden(p_old_key text, p_new_key text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old text := public.ag_garden_id(p_old_key);
  v_new text := public.ag_garden_id(p_new_key);
begin
  update public.gardens set id = v_new, last_seen_at = now() where id = v_old;
  if not found then
    raise exception 'garden_not_found';
  end if;
  return true;
end $$;

-- Delete a garden and all its records.
create function public.ag_delete_garden(p_key text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id text := public.ag_garden_id(p_key);
begin
  delete from public.gardens where id = v_id;
  return found;
end $$;

-- Daily cron: keeps the free project awake and tidies up.
-- Purges tombstones older than 30 days and stale rate-limit buckets.
create function public.ag_heartbeat()
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_purged int;
begin
  insert into public.heartbeat (id, beat_at) values (1, now())
  on conflict (id) do update set beat_at = excluded.beat_at;
  delete from public.records where deleted_at is not null and deleted_at < now() - interval '30 days';
  get diagnostics v_purged = row_count;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return jsonb_build_object('ok', true, 'purged', v_purged);
end $$;

-- ---------- grants ----------

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.ag_create_garden(text, text),
  public.ag_check_garden(text),
  public.ag_sync(text, bigint, jsonb),
  public.ag_rotate_garden(text, text),
  public.ag_delete_garden(text),
  public.ag_heartbeat()
to anon;
