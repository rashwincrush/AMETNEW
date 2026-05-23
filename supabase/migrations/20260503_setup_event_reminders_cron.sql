-- ============================================================================
-- EVENT REMINDERS CRON JOB SETUP
-- Description: Sets up cron job to send event reminders
-- Note: Requires pg_cron extension enabled. Run via Supabase dashboard.
-- ============================================================================

-- Check if pg_cron extension is available
do $$
begin
  if not exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    raise notice 'pg_cron extension is not installed. Event reminders must be triggered via Edge Function or external scheduler.';
    return;
  end if;
  
  -- Schedule event reminders to run every 15 minutes
  -- This will check for events starting in ~24 hours and ~1 hour
  perform cron.schedule(
    'event-reminders',
    '*/15 * * * *',
    'select public.process_event_reminders()'
  );
  
  raise notice 'Event reminders cron job scheduled to run every 15 minutes';
end;
$$;

-- Alternative: Create a function to manually trigger reminders (for testing)
create or replace function public.trigger_event_reminders_manually()
returns jsonb
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
begin
  perform public.send_event_reminders();
  return jsonb_build_object(
    'success', true,
    'message', 'Event reminders processed manually',
    'timestamp', now()
  );
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- VERIFICATION:
-- To check if the cron job is scheduled (if pg_cron is available):
--   select * from cron.job;
--
-- To manually trigger reminders for testing:
--   select public.trigger_event_reminders_manually();
--
-- To unschedule:
--   select cron.unschedule('event-reminders');
-- ============================================================================
