-- Create a function to check if an event has completed before allowing feedback submission
CREATE OR REPLACE FUNCTION check_event_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the event has an end_date and if the end_date has passed
  IF NOT EXISTS (
    SELECT 1 FROM events 
    WHERE id = NEW.event_id 
      AND end_date IS NOT NULL 
      AND end_date < NOW()
  ) THEN
    RAISE EXCEPTION 'Feedback can only be submitted after an event has completed.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on the event_feedback table
DROP TRIGGER IF EXISTS validate_event_feedback_submission ON event_feedback;
CREATE TRIGGER validate_event_feedback_submission
  BEFORE INSERT ON event_feedback
  FOR EACH ROW
  EXECUTE FUNCTION check_event_completed();
