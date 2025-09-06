-- 003_event_rsvp_unification.sql
-- Purpose: Unify RSVP handling on event_attendees with user_id and update RPC to use auth.uid()

-- 1) Ensure a unique index exists on (event_id, user_id)
CREATE UNIQUE INDEX IF NOT EXISTS event_attendees_event_user_uidx
ON public.event_attendees (event_id, user_id);

-- 2) Replace RSVP RPC to use auth.uid() and user_id
CREATE OR REPLACE FUNCTION public.rsvp_to_event(p_event_id uuid, p_attendance_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.event_attendees (event_id, user_id, attendance_status, registration_date, updated_at)
  VALUES (p_event_id, v_user_id, p_attendance_status, now(), now())
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    attendance_status = EXCLUDED.attendance_status,
    updated_at = now();
END;
$$;

-- 3) RLS policies are expected to enforce user_id ownership checks already.
--    If there are legacy attendee_id-based policies, they should be removed separately if present.
