-- Function to create a profile for a new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    created_at,
    role,
    is_verified,
    first_name,
    last_name,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', NEW.raw_user_meta_data ->> 'role', 'alumni'),
    false,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function after a new user is created.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
