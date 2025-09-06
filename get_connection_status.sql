CREATE OR REPLACE FUNCTION get_connection_status(user_1_id uuid, user_2_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_status text;
BEGIN
  SELECT status INTO connection_status
  FROM connections
  WHERE (requester_id = user_1_id AND recipient_id = user_2_id)
     OR (requester_id = user_2_id AND recipient_id = user_1_id)
  LIMIT 1;

  IF connection_status IS NULL THEN
    RETURN 'idle';
  ELSE
    RETURN connection_status;
  END IF;
END;
$$;
