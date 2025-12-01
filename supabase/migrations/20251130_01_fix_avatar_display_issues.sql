-- Migration: Fix Avatar Display Issues
-- Date: 2024-11-30
-- Description: 
--   1. Fix RLS policy to allow users to see own avatars even if unapproved
--   2. Add trigger to update profiles.updated_at when avatar_url changes (for cache-busting)
--   3. Add index on profiles.approval_status for faster directory queries
--   4. Strengthen avatar_url CHECK constraint to whitelist Supabase domain only

-- ============================================================================
-- 1. FIX RLS POLICY: Allow users to see own avatars + approved users' avatars
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "avatars_r_public_directory" ON storage.objects;

-- Create new combined policy: own avatar OR approved public avatar
CREATE POLICY "avatars_r_public_or_own" ON storage.objects
FOR SELECT TO authenticated, anon
USING (
  bucket_id = 'avatars' AND (
    -- Users can always see their own avatars
    (auth.uid() IS NOT NULL AND owner = auth.uid())
    OR
    -- Everyone can see approved users' avatars
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = objects.owner
        AND COALESCE(p.is_deleted, false) = false
        AND COALESCE(p.show_in_directory, true) = true
        AND COALESCE(p.approval_status::text, 'pending') = 'approved'
    )
  )
);

COMMENT ON POLICY "avatars_r_public_or_own" ON storage.objects IS 
'Allow users to see their own avatars regardless of approval status, and allow everyone to see approved users avatars';

-- ============================================================================
-- 2. ADD TRIGGER: Update profiles.updated_at when avatar_url changes
-- ============================================================================

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_profile_timestamp_on_avatar_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update timestamp if avatar_url actually changed
  IF (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS profiles_avatar_update_timestamp ON public.profiles;
CREATE TRIGGER profiles_avatar_update_timestamp
BEFORE UPDATE OF avatar_url ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_timestamp_on_avatar_change();

COMMENT ON FUNCTION public.update_profile_timestamp_on_avatar_change() IS 
'Updates profiles.updated_at timestamp when avatar_url changes to enable cache-busting';

-- ============================================================================
-- 3. ADD INDEX: Optimize directory queries by approval_status
-- ============================================================================

-- Create composite index for directory visibility queries
CREATE INDEX IF NOT EXISTS idx_profiles_directory_visibility 
ON public.profiles (approval_status, show_in_directory, is_deleted)
WHERE 
  approval_status = 'approved' 
  AND COALESCE(show_in_directory, true) = true 
  AND COALESCE(is_deleted, false) = false;

COMMENT ON INDEX idx_profiles_directory_visibility IS 
'Optimizes directory queries by indexing approved, visible, non-deleted profiles';

-- ============================================================================
-- 4. STRENGTHEN avatar_url CHECK CONSTRAINT (Optional - may break existing data)
-- ============================================================================

-- WARNING: This will fail if any existing profiles have external avatar URLs
-- Uncomment only after verifying no external URLs exist in production

-- First, check if any profiles have external URLs:
-- SELECT id, email, avatar_url 
-- FROM public.profiles 
-- WHERE avatar_url IS NOT NULL 
--   AND avatar_url !~ '^https://[^/]+\.supabase\.co/storage/v1/object/public/avatars/';

-- If safe, uncomment below to enforce Supabase-only URLs:
/*
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_avatar_url_format;
ALTER TABLE public.profiles ADD CONSTRAINT chk_avatar_url_format CHECK (
  (avatar_url IS NULL) OR 
  (
    avatar_url ~ '^https://[^/]+\.supabase\.co/storage/v1/object/public/avatars/' 
    AND length(avatar_url) <= 2048
  )
);

COMMENT ON CONSTRAINT chk_avatar_url_format ON public.profiles IS 
'Ensures avatar_url is either NULL or a valid Supabase storage public URL (security: prevents external tracking pixels)';
*/

-- NOTE: Section 5 (avatar_audit_log) intentionally removed.
-- Avatar audit logging is optional and not required for directory avatars to work,
-- so we keep this migration focused on:
--   * RLS policy for avatars bucket
--   * updated_at trigger for cache-busting
--   * directory visibility index
--   * optional avatar_url CHECK constraint hardening

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- Verify RLS policy exists
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname = 'avatars_r_public_or_own';

-- Verify trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'profiles_avatar_update_timestamp';

-- Verify index exists
-- SELECT * FROM pg_indexes WHERE indexname = 'idx_profiles_directory_visibility';

-- Test: Update avatar_url and verify updated_at changes
-- UPDATE profiles SET avatar_url = avatar_url WHERE id = auth.uid();
-- SELECT id, avatar_url, updated_at FROM profiles WHERE id = auth.uid();
