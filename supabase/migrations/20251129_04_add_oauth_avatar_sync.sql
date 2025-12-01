-- Migration: Add OAuth Avatar Sync to handle_new_user
-- Date: 2025-11-29
-- Purpose: Extract OAuth avatar URL from raw_user_meta_data and store in profiles.avatar_url
-- Impact: OAuth users will have avatar_url populated immediately (though URL may expire)

BEGIN;

-- Update handle_new_user function to extract OAuth avatar
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  oauth_avatar_url text;
BEGIN
  -- Extract OAuth avatar URL from Google/LinkedIn metadata
  -- Google uses 'picture', LinkedIn uses 'avatar_url'
  oauth_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  -- Insert new profile with OAuth data
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    approval_status, 
    show_in_directory, 
    is_deleted, 
    created_at,
    avatar_url  -- NEW: Add OAuth avatar URL
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(NULLIF(new.raw_user_meta_data->>'role', '')::app_role_enum, 'alumni'),
    'pending',
    true,
    false,
    NOW(),
    oauth_avatar_url  -- NEW: Store OAuth avatar URL (may be NULL for email signups)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Creates profile on user signup. Extracts OAuth avatar URL from raw_user_meta_data (Google picture, LinkedIn avatar_url). Note: OAuth URLs expire after 1 hour - frontend must download and re-upload to own storage.';

COMMIT;
