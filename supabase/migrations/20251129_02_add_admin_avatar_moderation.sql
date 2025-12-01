-- Migration: Add Admin Avatar Moderation Policy
-- Date: 2025-11-29
-- Purpose: Allow admins/super_admins to delete any avatar for moderation
-- Impact: Enables content moderation capability

BEGIN;

-- Admin can delete any avatar for moderation purposes
CREATE POLICY "avatars_d_admin_moderation" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
  )
);

-- Add comment for documentation
COMMENT ON POLICY "avatars_d_admin_moderation" ON storage.objects IS 
  'Allows admins and super_admins to delete any avatar for content moderation';

COMMIT;
