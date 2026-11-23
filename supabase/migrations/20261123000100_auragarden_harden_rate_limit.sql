-- Rate limiting is internal only; ag_check_garden limits itself per garden.
create or replace function public.ag_check_garden(p_key text)
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

revoke execute on function public.ag_rate_limit(text, int, int) from anon;
