-- Function to handle user RSVPs to events. 
-- It creates or updates an entry in the event_attendees table.

CREATE OR REPLACE FUNCTION rsvp_to_event(p_event_id UUID, p_attendee_id UUID, p_attendance_status rsvp_status)
RETURNS void AS $$
BEGIN
  INSERT INTO public.event_attendees (event_id, attendee_id, attendance_status)
  VALUES (p_event_id, p_attendee_id, p_attendance_status)
  ON CONFLICT (event_id, attendee_id)
  DO UPDATE SET
    attendance_status = EXCLUDED.attendance_status,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
