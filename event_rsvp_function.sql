CREATE OR REPLACE FUNCTION rsvp_to_event(p_event_id uuid, p_attendee_id uuid, p_attendance_status text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.event_attendees (event_id, attendee_id, attendance_status)
  VALUES (p_event_id, p_attendee_id, p_attendance_status)
  ON CONFLICT (event_id, attendee_id)
  DO UPDATE SET
    attendance_status = EXCLUDED.attendance_status,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
