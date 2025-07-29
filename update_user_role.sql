-- Function to safely update a user's role without modifying generated columns
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET role = new_role
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;
