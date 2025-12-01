-- Migration: Fix Avatar Read Policies
-- Date: 2025-11-29
-- Purpose: Allow users to see their own avatar immediately, while keeping public directory restricted
-- Impact: Improves UX - users see their avatar even if pending approval

BEGIN;

-- Drop old restrictive policy if it exists
DROP POLICY IF EXISTS "avatars_r_own" ON storage.objects;

-- Policy 1: Users can ALWAYS read their own avatars (regardless of approval status)
CREATE POLICY "avatars_r_own_always" 
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

-- Policy 2: Update public directory policy to be less restrictive
-- Drop old policy
DROP POLICY IF EXISTS "avatars_r_public_directory" ON storage.objects;

-- Recreate with improved logic
CREATE POLICY "avatars_r_public_approved" 
ON storage.objects 
FOR SELECT 
TO authenticated, anon
USING (
  bucket_id = 'avatars' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = objects.owner 
      AND COALESCE(p.is_deleted, false) = false 
      -- Avatar visible even if user hidden from directory (show_in_directory check removed)
      AND COALESCE(p.approval_status::text, 'pending') = 'approved'
  )
);

-- Add comments for documentation
COMMENT ON POLICY "avatars_r_own_always" ON storage.objects IS 
  'Users can always read their own avatars, regardless of approval status';

COMMENT ON POLICY "avatars_r_public_approved" ON storage.objects IS 
  'Public can read avatars of approved users only (privacy protection for pending/rejected users)';

COMMIT;
