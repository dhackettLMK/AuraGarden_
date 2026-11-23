-- AuraGarden sync store (brief 12.3).
-- Reached only by the app's server routes with the secret key. Row-level
-- security is on for every table with no policies, so the publishable key can
-- read nothing, and every function can be executed by the service role only.

create table if not exists gardens (
  id text primary key,                 -- sha256(garden key), hex
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  bytes_used bigint not null default 0
);

create sequence if not exists records_seq;

create table if not exists records (
  garden_id text not null references gardens(id) on delete cascade on update cascade,
  collection text not null,            -- projects, sections, tasks, thoughts, contacts, catchups,
                                       -- events, calendar_subscriptions, aura_ledger, garden_items,
                                       -- achievements, settings
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  device_id text not null default '',  -- breaks last-write-wins ties
  server_seq bigint not null default nextval('records_seq'),  -- set to nextval() again on every update
  primary key (garden_id, collection, id)
);
create index if not exists records_pull on records (garden_id, server_seq);

create table if not exists rate_limits (bucket text primary key, count int not null, window_start timestamptz not null);
create table if not exists heartbeat (id int primary key, beat_at timestamptz not null);

alter table gardens enable row level security;
alter table records enable row level security;
alter table rate_limits enable row level security;
alter table heartbeat enable row level security;

-- Create a garden. Returns false if it already exists.
create or replace function ag_create_garden(p_id text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into gardens (id) values (p_id);
  return true;
exception when unique_violation then
  return false;
end $$;

create or replace function ag_garden_exists(p_id text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from gardens where id = p_id);
$$;

-- Push changes and pull everything newer than the cursor, in one call.
-- Last write wins per record by updated_at (future timestamps are clamped),
-- ties broken by device id. Deletes travel as tombstones (deleted_at).
create or replace function ag_sync(p_garden text, p_changes jsonb, p_cursor bigint, p_device text, p_max_garden_bytes bigint default 52428800, p_limit int default 2000)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c jsonb;
  v_updated timestamptz;
  v_now timestamptz := now();
  v_bytes bigint;
  v_rows jsonb;
  v_cursor bigint;
  v_more boolean;
begin
  if not exists (select 1 from gardens where id = p_garden) then
    return jsonb_build_object('error', 'unknown_garden');
  end if;

  select coalesce(sum(octet_length(data::text)), 0) into v_bytes from records where garden_id = p_garden;
  if v_bytes + octet_length(coalesce(p_changes, '[]'::jsonb)::text) > p_max_garden_bytes then
    return jsonb_build_object('error', 'garden_full');
  end if;

  for c in select * from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb)) loop
    v_updated := least(to_timestamp((c->>'updated_at')::double precision / 1000.0), v_now + interval '1 minute');
    insert into records as r (garden_id, collection, id, data, updated_at, deleted_at, device_id)
    values (
      p_garden,
      c->>'collection',
      c->>'id',
      c->'data',
      v_updated,
      case when c->>'deleted_at' is null then null else to_timestamp((c->>'deleted_at')::double precision / 1000.0) end,
      p_device
    )
    on conflict (garden_id, collection, id) do update
      set data = excluded.data,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          device_id = excluded.device_id,
          server_seq = nextval('records_seq')
      where excluded.updated_at > r.updated_at
         or (excluded.updated_at = r.updated_at and excluded.device_id > r.device_id);
  end loop;

  select coalesce(sum(octet_length(data::text)), 0) into v_bytes from records where garden_id = p_garden;
  update gardens set last_seen_at = v_now, bytes_used = v_bytes where id = p_garden;

  select coalesce(jsonb_agg(jsonb_build_object(
           'collection', collection, 'id', id, 'data', data,
           'updated_at', (extract(epoch from updated_at) * 1000)::bigint,
           'deleted_at', case when deleted_at is null then null else (extract(epoch from deleted_at) * 1000)::bigint end,
           'seq', server_seq) order by server_seq), '[]'::jsonb),
         max(server_seq)
    into v_rows, v_cursor
    from (select * from records where garden_id = p_garden and server_seq > coalesce(p_cursor, 0) order by server_seq limit p_limit) s;

  select exists (select 1 from records where garden_id = p_garden and server_seq > coalesce(v_cursor, p_cursor, 0)) into v_more;
  return jsonb_build_object('changes', v_rows, 'cursor', coalesce(v_cursor, p_cursor, 0), 'more', v_more);
end $$;

-- Rotate a garden's key: re-key in one transaction (records follow by cascade).
create or replace function ag_rotate_garden(p_old text, p_new text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update gardens set id = p_new where id = p_old;
  return found;
end $$;

create or replace function ag_delete_garden(p_id text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from gardens where id = p_id;
  return found;
end $$;

-- A display name for the join screen ("Open Laura's garden on this device?").
create or replace function ag_garden_name(p_id text) returns text
language sql security definer set search_path = public as $$
  select data->>'displayName' from records where garden_id = p_id and collection = 'settings' and id = 'main' and deleted_at is null;
$$;

-- Fixed-window rate limiting. Returns true if the call is allowed.
create or replace function ag_rate_limit(p_bucket text, p_limit int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  insert into rate_limits as r (bucket, count, window_start) values (p_bucket, 1, now())
  on conflict (bucket) do update
    set count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end $$;

-- Daily keep-alive (brief 14): one write, plus housekeeping.
create or replace function ag_keepalive() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into heartbeat (id, beat_at) values (1, now()) on conflict (id) do update set beat_at = now();
  delete from records where deleted_at is not null and deleted_at < now() - interval '30 days';
  delete from rate_limits where window_start < now() - interval '2 days';
end $$;

-- Only the service role (the app's server) may call these.
revoke all on function ag_create_garden(text), ag_garden_exists(text), ag_sync(text, jsonb, bigint, text, bigint, int), ag_rotate_garden(text, text), ag_delete_garden(text), ag_garden_name(text), ag_rate_limit(text, int, int), ag_keepalive() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function ag_create_garden(text), ag_garden_exists(text), ag_sync(text, jsonb, bigint, text, bigint, int), ag_rotate_garden(text, text), ag_delete_garden(text), ag_garden_name(text), ag_rate_limit(text, int, int), ag_keepalive() from anon, authenticated';
    execute 'revoke all on all tables in schema public from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function ag_create_garden(text), ag_garden_exists(text), ag_sync(text, jsonb, bigint, text, bigint, int), ag_rotate_garden(text, text), ag_delete_garden(text), ag_garden_name(text), ag_rate_limit(text, int, int), ag_keepalive() to service_role';
  end if;
end $$;
