-- Migration: Cleanup Duplicate Avatar RLS Policies
-- Date: 2025-11-29
-- Purpose: Remove duplicate RLS policies on storage.objects for avatars bucket
-- Impact: No breaking changes, removes confusion

BEGIN;

-- Drop duplicate SELECT policy (keep avatars_r_own)
DROP POLICY IF EXISTS "avatars_r_owner" ON storage.objects;

-- Drop duplicate DELETE policy (keep avatars_d_own)
DROP POLICY IF EXISTS "avatars_d_owner" ON storage.objects;

-- Verify remaining policies
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname LIKE 'avatars_%';
  
  RAISE NOTICE 'Remaining avatar policies: %', policy_count;
END $$;

COMMIT;
