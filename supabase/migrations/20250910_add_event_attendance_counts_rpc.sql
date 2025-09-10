create or replace function public.get_event_attendance_counts(p_event_ids uuid[])
returns table(event_id uuid, total_attendees int)
language sql
security definer
set search_path = public
as $$
  select e.id as event_id,
         coalesce(count(r.*) filter (where lower(r.attendance_status) = 'going'), 0) as total_attendees
  from unnest(p_event_ids) as e(id)
  left join public.event_rsvps r on r.event_id = e.id
  group by e.id
$$;

grant execute on function public.get_event_attendance_counts(uuid[]) to authenticated;

