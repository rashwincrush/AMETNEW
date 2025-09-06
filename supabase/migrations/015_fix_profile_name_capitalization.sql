-- This migration fixes an issue where first and last names were being automatically converted to uppercase on profile updates.
-- It replaces the existing function and triggers with a corrected version that preserves the original case.

-- Drop the existing triggers that call the old function
DROP TRIGGER IF EXISTS update_full_name_trigger ON public.profiles;
DROP TRIGGER IF EXISTS update_profiles_full_name ON public.profiles;

-- Recreate the function to properly combine first and last names without forcing uppercase
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Combine first_name and last_name to create full_name, preserving original case
  NEW.full_name := TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to run the new function before insert or update
CREATE TRIGGER update_full_name_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_full_name();
