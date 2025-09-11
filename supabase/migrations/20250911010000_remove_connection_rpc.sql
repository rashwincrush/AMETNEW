-- RPC: remove_connection
-- Removes any accepted/connected edge between two users by marking it 'removed'.
-- SECURITY DEFINER so it can bypass RLS safely while still restricting input via parameters.

create or replace function public.remove_connection(p_user uuid, p_other uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  -- Delete any existing accepted/connected connections in either direction.
  delete from public.connections c
   where ((c.requester_id = p_user and c.recipient_id = p_other)
       or (c.requester_id = p_other and c.recipient_id = p_user))
     and c.status in ('accepted','connected');

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- Restrict who can execute
revoke all on function public.remove_connection(uuid, uuid) from public;
grant execute on function public.remove_connection(uuid, uuid) to authenticated;
-- (Optional) allow service role/cron
grant execute on function public.remove_connection(uuid, uuid) to service_role;
