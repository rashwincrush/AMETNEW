-- 016_profile_server_validations.sql
-- Enforce server-side validation and normalization for profiles
-- - Lowercase and validate email, disallow .co TLD
-- - Validate first_name and last_name to contain only letters and spaces
-- - Validate phone number format: optional leading + and digits only

BEGIN;

-- Create or replace validation function
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger AS $$
BEGIN
  -- Normalize and validate email
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));

    -- Basic email format validation
    IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format'
        USING ERRCODE = '22000';
    END IF;

    -- Disallow .co TLD (e.g., example@domain.co)
    IF NEW.email ~* '@[^@]+\.co$' THEN
      RAISE EXCEPTION 'Email addresses ending with .co are not allowed'
        USING ERRCODE = '22000';
    END IF;
  END IF;

  -- Validate first_name: allow only letters and spaces when provided
  IF NEW.first_name IS NOT NULL AND btrim(NEW.first_name) <> '' THEN
    IF NEW.first_name !~ '^[A-Za-z ]+$' THEN
      RAISE EXCEPTION 'First name can only contain letters and spaces'
        USING ERRCODE = '22000';
    END IF;
  END IF;

  -- Validate last_name: allow only letters and spaces when provided
  IF NEW.last_name IS NOT NULL AND btrim(NEW.last_name) <> '' THEN
    IF NEW.last_name !~ '^[A-Za-z ]+$' THEN
      RAISE EXCEPTION 'Last name can only contain letters and spaces'
        USING ERRCODE = '22000';
    END IF;
  END IF;

  -- Validate phone number: optional leading + and 7-15 digits when provided
  IF NEW.phone IS NOT NULL AND btrim(NEW.phone) <> '' THEN
    IF NEW.phone !~ '^\+?\d{7,15}$' THEN
      RAISE EXCEPTION 'Phone number must be 7-15 digits with optional leading +'
        USING ERRCODE = '22000';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce validation on insert and update
DROP TRIGGER IF EXISTS validate_profile_fields_trigger ON public.profiles;
CREATE TRIGGER validate_profile_fields_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_fields();

-- Fix infinite recursion in RLS by adding SECURITY DEFINER helpers

-- 1. Get user role: SECURITY DEFINER to bypass RLS when reading profiles
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_is_admin boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 'anon';
  END IF;

  SELECT role, is_admin INTO v_role, v_is_admin
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'anon';
  END IF;

  IF v_is_admin THEN
    RETURN 'admin';
  END IF;

  IF v_role IS NULL OR TRIM(v_role) = '' OR v_role = 'user' THEN
    RETURN 'alumni';
  END IF;

  RETURN v_role;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon, authenticated;

-- 2. is_admin: SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.is_admin, false) OR (p.role IN ('admin','super_admin'))
  FROM public.profiles p
  WHERE p.id = p_user_id
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;

-- 3. Fix group_members policies to avoid recursion
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_members_select ON public.group_members;
CREATE POLICY group_members_select ON public.group_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS group_members_insert ON public.group_members;
CREATE POLICY group_members_insert ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS group_members_delete ON public.group_members;
CREATE POLICY group_members_delete ON public.group_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

COMMIT;
