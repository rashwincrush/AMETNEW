-- ROLLBACK SCRIPT: Avatar Backend Migrations
-- Date: 2025-11-29
-- Purpose: Rollback all avatar-related migrations if needed
-- ⚠️ USE WITH CAUTION - Only run if migrations cause issues

BEGIN;

-- ============================================
-- ROLLBACK Migration 05: Avatar URL Constraints
-- ============================================

-- Drop index
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_avatar_url_not_null;

-- Drop constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS chk_avatar_url_format;

-- ============================================
-- ROLLBACK Migration 04: OAuth Avatar Sync
-- ============================================

-- Restore original handle_new_user function (without avatar_url)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    approval_status, 
    show_in_directory, 
    is_deleted, 
    created_at
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
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- ============================================
-- ROLLBACK Migration 03: Avatar Read Policies
-- ============================================

-- Drop new policies
DROP POLICY IF EXISTS "avatars_r_own_always" ON storage.objects;
DROP POLICY IF EXISTS "avatars_r_public_approved" ON storage.objects;

-- Restore original policies
CREATE POLICY "avatars_r_own" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (
    name ~~ (auth.uid() || '/%') 
    OR owner = auth.uid()
  )
);

CREATE POLICY "avatars_r_public_directory" 
ON storage.objects 
FOR SELECT 
TO authenticated, anon
USING (
  bucket_id = 'avatars' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = objects.owner 
      AND COALESCE(p.is_deleted, false) = false 
      AND COALESCE(p.show_in_directory, true) = true 
      AND COALESCE(p.approval_status::text, 'pending') = 'approved'
  )
);

-- ============================================
-- ROLLBACK Migration 02: Admin Moderation Policy
-- ============================================

-- Drop admin moderation policy
DROP POLICY IF EXISTS "avatars_d_admin_moderation" ON storage.objects;

-- ============================================
-- ROLLBACK Migration 01: Cleanup Duplicates
-- ============================================

-- Restore duplicate policies (if needed for some reason)
CREATE POLICY "avatars_r_owner" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (
    name ~~ (auth.uid() || '/%') 
    OR owner = auth.uid()
  )
);

CREATE POLICY "avatars_d_owner" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (
    name ~~ (auth.uid() || '/%') 
    OR owner = auth.uid()
  )
);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Rollback complete. System restored to pre-migration state.';
  RAISE NOTICE '⚠️  OAuth avatar sync disabled - users will need to manually upload avatars.';
  RAISE NOTICE '⚠️  Admin moderation disabled - admins cannot delete inappropriate avatars.';
END $$;
