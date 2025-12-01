# 🚀 COMPREHENSIVE AVATAR SYSTEM OVERHAUL
## Plan D (Deepseek Version) – The Ultimate Combined Approach

**Document Version:** 1.0  
**Last Updated:** 2025-11-29  
**Status:** Ready for Implementation  

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Critical Backend Fixes (TODAY)](#phase-1-critical-backend-fixes)
4. [Phase 2: Enhanced Security & RPC Foundation (WEEK 1)](#phase-2-enhanced-security--rpc-foundation)
5. [Phase 3: Frontend Migration (WEEK 2)](#phase-3-frontend-migration)
6. [Phase 4: Advanced Features & Cleanup (FUTURE)](#phase-4-advanced-features--cleanup)
7. [Rollback Strategy](#rollback-strategy)
8. [Verification & Testing](#verification--testing)
9. [Success Metrics](#success-metrics)
10. [Implementation Checklist](#implementation-checklist)

---

## 🎯 EXECUTIVE SUMMARY

### What This Plan Does

This plan combines the best elements from three avatar backend designs:

- **Option 3 (Claude)** → Foundation for P0 backend fixes (RLS, OAuth, moderation)
- **Option B (ChatGPT)** → RPC + signed URL architecture for security
- **Option A (ChatGPT)** → Metadata columns for observability

### Timeline

| Phase | Duration | Focus | Risk Level |
|-------|----------|-------|------------|
| **Phase 1** | Today (2 hours) | Critical backend fixes | ✅ Very Low |
| **Phase 2** | Week 1 (1 day) | RPC foundation + metadata | ✅ Low |
| **Phase 3** | Week 2 (3-5 days) | Frontend migration | ⚠️ Medium |
| **Phase 4** | Future (ongoing) | Advanced automation | ⚠️ Medium |

### Key Benefits

✅ **Immediate security fixes** (duplicate RLS policies, admin moderation)  
✅ **Better UX** (pending users see own avatars)  
✅ **OAuth integration** (avatars sync to profiles automatically)  
✅ **Future-proof architecture** (RPC-first, signed URLs)  
✅ **Zero breaking changes** in Phase 1-2  
✅ **Complete rollback safety** at every phase  

---

## 🏗️ ARCHITECTURE OVERVIEW

### Current State (Before)

```
┌─────────────────────────────────────────────────────────────┐
│ PROBLEMS:                                                    │
│ • Duplicate RLS policies (avatars_r_owner, avatars_d_owner) │
│ • No admin moderation capability                            │
│ • Pending users can't see own avatars                       │
│ • OAuth avatars not synced to profiles                      │
│ • profile-images bucket has wild-west RLS                   │
│ • No metadata tracking (source, bucket)                     │
└─────────────────────────────────────────────────────────────┘

Frontend ──────► profiles.avatar_url (full URL)
                      │
                      ├─► Supabase storage (avatars bucket)
                      ├─► Supabase storage (profile-images bucket) ⚠️
                      └─► OAuth URLs (Google, LinkedIn)
```

### Target State (After Phase 4)

```
┌─────────────────────────────────────────────────────────────┐
│ FIXED:                                                       │
│ ✅ Clean RLS (5 policies, no duplicates)                    │
│ ✅ Admin moderation enabled                                 │
│ ✅ Users always see own avatars                             │
│ ✅ OAuth avatars auto-sync                                  │
│ ✅ Metadata tracking (source, bucket)                       │
│ ✅ RPC-first architecture                                   │
│ ✅ Signed URLs for security                                 │
└─────────────────────────────────────────────────────────────┘

Frontend ──────► AvatarService (RPC layer)
                      │
                      ├─► get_signed_avatar_url(user_id)
                      ├─► update_user_avatar(file_path)
                      └─► delete_user_avatar()
                            │
                            └─► profiles.avatar_url (metadata)
                                  │
                                  └─► avatars bucket (canonical)
```

### Final Schema

```sql
-- profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  avatar_url text,                    -- Full URL or path (depending on phase)
  avatar_source text,                 -- 'supabase' | 'oauth' | 'custom_url'
  avatar_storage_bucket text,         -- 'avatars' | 'profile-images' | NULL
  -- ... other columns
);

-- Storage buckets
avatars              -- Canonical bucket for all profile DPs
profile-images       -- Legacy bucket (locked down, owner-only)
```

---

## 🔧 PHASE 1: CRITICAL BACKEND FIXES

**Goal:** Fix immediate security and UX issues with **zero frontend changes**.

**Duration:** 2 hours  
**Risk:** Very Low  
**Breaking Changes:** None  

### 1.1 Migration SQL

Create file: `supabase/migrations/20251129_phase1_avatar_critical_fixes.sql`

```sql
-- ============================================
-- PHASE 1: CRITICAL AVATAR BACKEND FIXES
-- Date: 2025-11-29
-- Purpose: Fix RLS duplicates, add admin moderation, improve UX
-- Risk: Very Low (no breaking changes)
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Cleanup Duplicate RLS Policies
-- ============================================

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

  RAISE NOTICE 'Avatar policies after cleanup: %', policy_count;
END $$;

-- ============================================
-- STEP 2: Add Admin Moderation Capability
-- ============================================

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

COMMENT ON POLICY "avatars_d_admin_moderation" ON storage.objects IS
'Allows admins and super_admins to delete any avatar for content moderation';

-- ============================================
-- STEP 3: Fix Avatar Read Policies
-- ============================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "avatars_r_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_r_public_directory" ON storage.objects;

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

COMMENT ON POLICY "avatars_r_own_always" ON storage.objects IS
'Users can always read their own avatars, regardless of approval status';

-- Policy 2: Public directory - approved users only
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
      AND COALESCE(p.approval_status::text, 'pending') = 'approved'
  )
);

COMMENT ON POLICY "avatars_r_public_approved" ON storage.objects IS
'Public can read avatars of approved users only (privacy protection for pending/rejected users)';

-- ============================================
-- STEP 4: Lock Down profile-images Bucket
-- ============================================

-- Tighten SELECT: only owner can read their own images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Profile vejz8c_0'
  ) THEN
    ALTER POLICY "Profile vejz8c_0"
    ON storage.objects
    USING (
      bucket_id = 'profile-images'
      AND owner = auth.uid()
    );
  END IF;
END $$;

-- Tighten INSERT: you can only insert your own images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Profile vejz8c_1'
  ) THEN
    ALTER POLICY "Profile vejz8c_1"
    ON storage.objects
    WITH CHECK (
      bucket_id = 'profile-images'
      AND owner = auth.uid()
    );
  END IF;
END $$;

-- Tighten UPDATE: only owner can update their images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Profile vejz8c_2'
  ) THEN
    ALTER POLICY "Profile vejz8c_2"
    ON storage.objects
    USING (
      bucket_id = 'profile-images'
      AND owner = auth.uid()
    )
    WITH CHECK (
      bucket_id = 'profile-images'
      AND owner = auth.uid()
    );
  END IF;
END $$;

-- Tighten DELETE: only owner can delete their images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Profile vejz8c_3'
  ) THEN
    ALTER POLICY "Profile vejz8c_3"
    ON storage.objects
    USING (
      bucket_id = 'profile-images'
      AND owner = auth.uid()
    );
  END IF;
END $$;

-- ============================================
-- STEP 5: OAuth Avatar Sync to Profiles
-- ============================================

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
    avatar_url -- NEW: Add OAuth avatar URL
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
    oauth_avatar_url -- NEW: Store OAuth avatar URL (may be NULL for email signups)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates profile on user signup. Extracts OAuth avatar URL from raw_user_meta_data (Google picture, LinkedIn avatar_url). Note: OAuth URLs expire after 1 hour - frontend must download and re-upload to own storage.';

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'avatars_%';

  IF policy_count = 5 THEN
    RAISE NOTICE '✅ Phase 1 complete. Avatar policies: % (expected: 5)', policy_count;
  ELSE
    RAISE WARNING '⚠️ Unexpected policy count: % (expected: 5)', policy_count;
  END IF;
END $$;
```

### 1.2 Verification Steps

After running Phase 1 migration:

```sql
-- 1. Check RLS policies (should be exactly 5)
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'avatars_%'
ORDER BY policyname;

-- Expected output:
-- avatars_d_admin_moderation | DELETE
-- avatars_d_own              | DELETE
-- avatars_i_own_folder       | INSERT
-- avatars_r_own_always       | SELECT
-- avatars_r_public_approved  | SELECT

-- 2. Verify handle_new_user function updated
SELECT prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';
-- Should contain: oauth_avatar_url := COALESCE(...)

-- 3. Test admin can delete avatars (as admin user)
-- DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND name = '<test_file>';
-- Should succeed

-- 4. Test pending user can see own avatar
-- (Upload avatar as pending user, verify visible to self)
```

### 1.3 Expected Results

✅ **Security:**
- No more duplicate RLS policies
- Admin moderation enabled
- profile-images bucket locked down

✅ **UX:**
- Pending users see their own avatars immediately
- Public only sees approved users' avatars

✅ **OAuth:**
- New OAuth signups have avatar_url populated in profiles

✅ **Frontend:**
- Zero changes required
- All existing flows continue working

---

## 🔐 PHASE 2: ENHANCED SECURITY & RPC FOUNDATION

**Goal:** Add metadata tracking and RPC layer while maintaining backward compatibility.

**Duration:** 1 day  
**Risk:** Low  
**Breaking Changes:** None (RPCs are additive)  

### 2.1 Migration SQL

Create file: `supabase/migrations/20251129_phase2_avatar_rpc_foundation.sql`

```sql
-- ============================================
-- PHASE 2: AVATAR RPC FOUNDATION & METADATA
-- Date: 2025-11-29
-- Purpose: Add metadata columns, RPC layer, constraints
-- Risk: Low (backward compatible)
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Add Avatar Metadata Columns
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_source text CHECK (avatar_source IN ('supabase', 'oauth', 'custom_url')),
ADD COLUMN IF NOT EXISTS avatar_storage_bucket text;

COMMENT ON COLUMN public.profiles.avatar_source IS
'Source of avatar: supabase (uploaded to our storage), oauth (Google/LinkedIn), custom_url (external)';

COMMENT ON COLUMN public.profiles.avatar_storage_bucket IS
'Storage bucket name if avatar_source = supabase (avatars, profile-images, etc.)';

-- ============================================
-- STEP 2: Backfill Metadata from Existing URLs
-- ============================================

-- Backfill avatar_source
UPDATE public.profiles
SET avatar_source = CASE
  WHEN avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN 'supabase'
  WHEN avatar_url LIKE '%/storage/v1/object/public/profile-images/%' THEN 'supabase'
  WHEN avatar_url LIKE 'https://lh3.googleusercontent.com/%' THEN 'oauth'
  WHEN avatar_url LIKE 'https://media.licdn.com/%' THEN 'oauth'
  WHEN avatar_url IS NOT NULL THEN 'custom_url'
  ELSE NULL
END
WHERE avatar_source IS NULL;

-- Backfill avatar_storage_bucket
UPDATE public.profiles
SET avatar_storage_bucket = CASE
  WHEN avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN 'avatars'
  WHEN avatar_url LIKE '%/storage/v1/object/public/profile-images/%' THEN 'profile-images'
  ELSE NULL
END
WHERE avatar_storage_bucket IS NULL
  AND avatar_source = 'supabase';

-- ============================================
-- STEP 3: Add URL Format Constraint & Index
-- ============================================

ALTER TABLE public.profiles
ADD CONSTRAINT chk_avatar_url_format
CHECK (
  avatar_url IS NULL
  OR (
    avatar_url ~ '^https?://.+'
    AND length(avatar_url) <= 2048
  )
);

COMMENT ON CONSTRAINT chk_avatar_url_format ON public.profiles IS
'Ensures avatar_url is a valid HTTP/HTTPS URL with max length 2048 characters';

-- Add index for analytics/search queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_avatar_url_not_null
ON public.profiles(avatar_url)
WHERE avatar_url IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_avatar_source
ON public.profiles(avatar_source)
WHERE avatar_source IS NOT NULL;

-- ============================================
-- STEP 4: RPC for Getting Signed Avatar URLs
-- ============================================

-- Single user version
CREATE OR REPLACE FUNCTION public.get_signed_avatar_url(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_avatar_url text;
  v_avatar_source text;
  v_path text;
  v_signed_url text;
BEGIN
  -- Get avatar info
  SELECT avatar_url, avatar_source
  INTO v_avatar_url, v_avatar_source
  FROM public.profiles
  WHERE id = p_user_id;

  -- If no avatar, return NULL
  IF v_avatar_url IS NULL THEN
    RETURN NULL;
  END IF;

  -- If OAuth or custom URL, return as-is
  IF v_avatar_source IN ('oauth', 'custom_url') THEN
    RETURN v_avatar_url;
  END IF;

  -- If Supabase storage, generate signed URL
  IF v_avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN
    -- Extract path from URL
    v_path := regexp_replace(
      v_avatar_url,
      '^.+/storage/v1/object/public/avatars/',
      ''
    );

    -- Generate signed URL (1 hour expiry)
    SELECT signed_url INTO v_signed_url
    FROM storage.generate_signed_url('avatars', v_path, 3600);

    RETURN v_signed_url;
  END IF;

  -- Fallback: return original URL
  RETURN v_avatar_url;
END;
$$;

COMMENT ON FUNCTION public.get_signed_avatar_url(uuid) IS
'Returns signed URL for avatar (1 hour expiry). For OAuth/custom URLs, returns as-is.';

-- Batch version for directories/lists
CREATE OR REPLACE FUNCTION public.get_signed_avatar_urls(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  rec RECORD;
  v_path text;
  v_signed_url text;
BEGIN
  FOR rec IN
    SELECT id, p.avatar_url, p.avatar_source
    FROM public.profiles p
    WHERE id = ANY (p_user_ids)
  LOOP
    user_id := rec.id;

    -- No avatar
    IF rec.avatar_url IS NULL THEN
      avatar_url := NULL;

    -- OAuth or custom URL
    ELSIF rec.avatar_source IN ('oauth', 'custom_url') THEN
      avatar_url := rec.avatar_url;

    -- Supabase storage
    ELSIF rec.avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN
      v_path := regexp_replace(
        rec.avatar_url,
        '^.+/storage/v1/object/public/avatars/',
        ''
      );

      SELECT signed_url INTO v_signed_url
      FROM storage.generate_signed_url('avatars', v_path, 3600);

      avatar_url := v_signed_url;

    -- Fallback
    ELSE
      avatar_url := rec.avatar_url;
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.get_signed_avatar_urls(uuid[]) IS
'Batch version of get_signed_avatar_url for directory/list views';

-- ============================================
-- STEP 5: RPC for Updating Avatar
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_avatar(p_file_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_full_url text;
  v_project_url text;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '28000';
  END IF;

  -- Get project URL from settings (or hardcode if needed)
  -- For now, construct full public URL
  -- TODO: Replace with actual project URL from config
  v_full_url := 'https://your-project.supabase.co/storage/v1/object/public/avatars/' || p_file_path;

  -- Update profile
  UPDATE public.profiles
  SET
    avatar_url = v_full_url,
    avatar_source = 'supabase',
    avatar_storage_bucket = 'avatars'
  WHERE id = v_user_id;

  -- TODO: Add to audit log if needed
END;
$$;

COMMENT ON FUNCTION public.update_user_avatar(text) IS
'Updates user avatar. Accepts storage path (e.g., user_id/timestamp.jpg), constructs full URL.';

-- ============================================
-- STEP 6: RPC for Deleting Avatar
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_user_avatar()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '28000';
  END IF;

  -- Clear avatar (does NOT delete storage file)
  UPDATE public.profiles
  SET
    avatar_url = NULL,
    avatar_source = NULL,
    avatar_storage_bucket = NULL
  WHERE id = v_user_id;

  -- TODO: Add to audit log if needed
END;
$$;

COMMENT ON FUNCTION public.delete_user_avatar() IS
'Clears user avatar from profile. Does NOT delete storage file (manual cleanup required).';

-- ============================================
-- STEP 7: Admin RPC for Getting Any Avatar
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_get_avatar(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can access this function' USING ERRCODE = '42501';
  END IF;

  -- Use existing get_signed_avatar_url
  RETURN public.get_signed_avatar_url(p_user_id);
END;
$$;

COMMENT ON FUNCTION public.admin_get_avatar(uuid) IS
'Admin-only function to get any user avatar (signed URL)';

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2 complete. Metadata columns added, RPCs deployed.';
  RAISE NOTICE 'Available RPCs:';
  RAISE NOTICE '  - get_signed_avatar_url(user_id)';
  RAISE NOTICE '  - get_signed_avatar_urls(user_ids[])';
  RAISE NOTICE '  - update_user_avatar(file_path)';
  RAISE NOTICE '  - delete_user_avatar()';
  RAISE NOTICE '  - admin_get_avatar(user_id)';
END $$;
```

### 2.2 Update `update_user_avatar` with Actual Project URL

After running the migration, update the function with your actual Supabase project URL:

```sql
-- Get your project URL from Supabase dashboard
-- Replace 'your-project' with actual project reference

CREATE OR REPLACE FUNCTION public.update_user_avatar(p_file_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_full_url text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '28000';
  END IF;

  -- Construct full public URL with actual project URL
  v_full_url := 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/avatars/' || p_file_path;

  UPDATE public.profiles
  SET
    avatar_url = v_full_url,
    avatar_source = 'supabase',
    avatar_storage_bucket = 'avatars'
  WHERE id = v_user_id;
END;
$$;
```

### 2.3 Verification Steps

```sql
-- 1. Check metadata columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('avatar_source', 'avatar_storage_bucket');

-- 2. Check metadata backfill
SELECT
  avatar_source,
  COUNT(*) as count
FROM public.profiles
WHERE avatar_url IS NOT NULL
GROUP BY avatar_source;

-- 3. Test RPC functions
SELECT public.get_signed_avatar_url('<your_user_id>');

-- 4. Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname LIKE '%avatar%';
```

### 2.4 Expected Results

✅ **Metadata:**
- `avatar_source` and `avatar_storage_bucket` columns added
- Existing data backfilled correctly

✅ **RPCs:**
- 5 new RPC functions available
- Backward compatible (frontend can still read `avatar_url` directly)

✅ **Performance:**
- Indexes added for faster queries

---

## 🎨 PHASE 3: FRONTEND MIGRATION

**Goal:** Migrate frontend to use RPC pattern with centralized avatar service.

**Duration:** 3-5 days  
**Risk:** Medium (requires testing across all components)  
**Breaking Changes:** None (gradual migration)  

### 3.1 Create Avatar Service

Create file: `frontend/src/services/avatar.js`

```javascript
import { supabase } from '../utils/supabase';

/**
 * Centralized Avatar Service
 * Handles all avatar-related operations (upload, fetch, delete)
 */
class AvatarService {
  /**
   * Get avatar URL for a single user
   * @param {string} userId - User UUID
   * @param {boolean} useSignedUrl - Whether to use signed URLs (default: false for backward compatibility)
   * @returns {Promise<string|null>} Avatar URL or null
   */
  static async getAvatarUrl(userId, useSignedUrl = false) {
    if (!userId) return null;

    try {
      if (useSignedUrl) {
        // Use new RPC for signed URLs
        const { data, error } = await supabase.rpc('get_signed_avatar_url', {
          p_user_id: userId
        });

        if (error) {
          console.error('Error getting signed avatar URL:', error);
          return null;
        }

        return data;
      }

      // Fallback: direct profile query (backward compatible)
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting avatar URL:', error);
        return null;
      }

      return data?.avatar_url || null;
    } catch (err) {
      console.error('Avatar service error:', err);
      return null;
    }
  }

  /**
   * Get avatar URLs for multiple users (batch)
   * @param {string[]} userIds - Array of user UUIDs
   * @param {boolean} useSignedUrls - Whether to use signed URLs
   * @returns {Promise<Object>} Map of userId -> avatarUrl
   */
  static async getAvatarUrls(userIds, useSignedUrls = false) {
    if (!userIds || userIds.length === 0) return {};

    try {
      if (useSignedUrls) {
        // Use batch RPC
        const { data, error } = await supabase.rpc('get_signed_avatar_urls', {
          p_user_ids: userIds
        });

        if (error) {
          console.error('Error getting signed avatar URLs:', error);
          return {};
        }

        // Convert array to map
        return Object.fromEntries(
          (data || []).map(item => [item.user_id, item.avatar_url])
        );
      }

      // Fallback: direct query
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);

      if (error) {
        console.error('Error getting avatar URLs:', error);
        return {};
      }

      return Object.fromEntries(
        (data || []).map(item => [item.id, item.avatar_url])
      );
    } catch (err) {
      console.error('Avatar service error:', err);
      return {};
    }
  }

  /**
   * Upload new avatar
   * @param {File} file - Image file
   * @param {Object} options - Upload options
   * @returns {Promise<string>} File path
   */
  static async uploadAvatar(file, options = {}) {
    const {
      maxSizeMB = 2,
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    } = options;

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        throw new Error(`File too large. Max size: ${maxSizeMB}MB`);
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update profile via RPC
      const { error: updateError } = await supabase.rpc('update_user_avatar', {
        p_file_path: fileName
      });

      if (updateError) {
        // Rollback: delete uploaded file
        await supabase.storage.from('avatars').remove([fileName]);
        throw updateError;
      }

      return fileName;
    } catch (err) {
      console.error('Avatar upload error:', err);
      throw err;
    }
  }

  /**
   * Delete current user's avatar
   * @returns {Promise<void>}
   */
  static async deleteAvatar() {
    try {
      const { error } = await supabase.rpc('delete_user_avatar');

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Avatar delete error:', err);
      throw err;
    }
  }

  /**
   * Admin: Get any user's avatar
   * @param {string} userId - Target user UUID
   * @returns {Promise<string|null>}
   */
  static async adminGetAvatar(userId) {
    try {
      const { data, error } = await supabase.rpc('admin_get_avatar', {
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Admin get avatar error:', err);
      throw err;
    }
  }
}

export default AvatarService;
```

### 3.2 Create React Hook

Create file: `frontend/src/hooks/useAvatar.js`

```javascript
import { useState, useEffect } from 'react';
import AvatarService from '../services/avatar';

/**
 * React hook for avatar management
 * @param {string} userId - User UUID
 * @param {Object} options - Hook options
 * @returns {Object} { avatarUrl, loading, error, refetch }
 */
export const useAvatar = (userId, options = {}) => {
  const { useSignedUrl = false, autoFetch = true } = options;

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchAvatar = async () => {
    if (!userId) {
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = await AvatarService.getAvatarUrl(userId, useSignedUrl);
      setAvatarUrl(url);
    } catch (err) {
      setError(err.message);
      setAvatarUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAvatar();
    }
  }, [userId, useSignedUrl, autoFetch]);

  return {
    avatarUrl,
    loading,
    error,
    refetch: fetchAvatar
  };
};

/**
 * Hook for batch avatar fetching (directories, lists)
 * @param {string[]} userIds - Array of user UUIDs
 * @param {Object} options - Hook options
 * @returns {Object} { avatarUrls, loading, error, refetch }
 */
export const useAvatars = (userIds, options = {}) => {
  const { useSignedUrls = false, autoFetch = true } = options;

  const [avatarUrls, setAvatarUrls] = useState({});
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchAvatars = async () => {
    if (!userIds || userIds.length === 0) {
      setAvatarUrls({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const urls = await AvatarService.getAvatarUrls(userIds, useSignedUrls);
      setAvatarUrls(urls);
    } catch (err) {
      setError(err.message);
      setAvatarUrls({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAvatars();
    }
  }, [JSON.stringify(userIds), useSignedUrls, autoFetch]);

  return {
    avatarUrls,
    loading,
    error,
    refetch: fetchAvatars
  };
};
```

### 3.3 Example Component Refactors

#### Before (Direct Storage Access)

```javascript
// ❌ OLD WAY - Direct storage/profile access
const ProfileAvatar = ({ userId }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();
      
      setAvatarUrl(data?.avatar_url);
    };
    fetchAvatar();
  }, [userId]);

  return <img src={avatarUrl || '/default-avatar.svg'} alt="Avatar" />;
};
```

#### After (Using Service + Hook)

```javascript
// ✅ NEW WAY - Using AvatarService + useAvatar hook
import { useAvatar } from '../hooks/useAvatar';

const ProfileAvatar = ({ userId }) => {
  const { avatarUrl, loading } = useAvatar(userId);

  if (loading) return <div className="avatar-skeleton" />;

  return <img src={avatarUrl || '/default-avatar.svg'} alt="Avatar" />;
};
```

#### Directory/List Example

```javascript
// ✅ Batch avatar fetching for directory
import { useAvatars } from '../hooks/useAvatar';

const AlumniDirectory = ({ alumni }) => {
  const userIds = alumni.map(a => a.id);
  const { avatarUrls, loading } = useAvatars(userIds);

  return (
    <div className="directory-grid">
      {alumni.map(person => (
        <div key={person.id} className="directory-card">
          <img
            src={avatarUrls[person.id] || '/default-avatar.svg'}
            alt={person.name}
          />
          <h3>{person.name}</h3>
        </div>
      ))}
    </div>
  );
};
```

### 3.4 Migration Checklist

Gradually refactor these components to use `AvatarService` + hooks:

- [ ] **Header** (`frontend/src/components/Header.js`)
- [ ] **Profile Settings** (`frontend/src/components/Profile/ProfileSettings.js`)
- [ ] **Registration** (`frontend/src/components/Auth/EnhancedRegister.js`)
- [ ] **Alumni Directory** (`frontend/src/components/Directory/AlumniDirectory.js`)
- [ ] **Messaging** (`frontend/src/components/Messaging/ChatWindow.js`)
- [ ] **Mentorship Cards** (`frontend/src/components/Mentorship/Mentorship.js`)
- [ ] **Groups** (`frontend/src/components/Groups/GroupsList.js`)
- [ ] **Events** (`frontend/src/components/Events/EventCard.js`)
- [ ] **Jobs** (`frontend/src/components/Jobs/JobCard.js`)
- [ ] **Admin Dashboard** (`frontend/src/components/Admin/UserManagement.js`)

### 3.5 Testing Strategy

```javascript
// Example test for AvatarService
describe('AvatarService', () => {
  it('should get avatar URL for user', async () => {
    const url = await AvatarService.getAvatarUrl('user-123');
    expect(url).toBeTruthy();
  });

  it('should handle missing user gracefully', async () => {
    const url = await AvatarService.getAvatarUrl(null);
    expect(url).toBeNull();
  });

  it('should upload avatar successfully', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const path = await AvatarService.uploadAvatar(file);
    expect(path).toContain('.jpg');
  });

  it('should reject oversized files', async () => {
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });
    await expect(AvatarService.uploadAvatar(largeFile)).rejects.toThrow();
  });
});
```

---

## 🚀 PHASE 4: ADVANCED FEATURES & CLEANUP

**Goal:** Implement advanced automation and monitoring.

**Duration:** Ongoing  
**Risk:** Medium  
**Breaking Changes:** None  

### 4.1 OAuth Avatar Download Automation

Create Supabase Edge Function: `supabase/functions/download-oauth-avatar/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get OAuth avatar URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, avatar_source')
      .eq('id', userId)
      .single();

    if (!profile || profile.avatar_source !== 'oauth') {
      return new Response(JSON.stringify({ error: 'No OAuth avatar' }), {
        status: 400
      });
    }

    // Download OAuth avatar
    const response = await fetch(profile.avatar_url);
    const blob = await response.blob();

    // Upload to Supabase storage
    const fileName = `${userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    // Update profile
    const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/avatars/${fileName}`;
    
    await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        avatar_source: 'supabase',
        avatar_storage_bucket: 'avatars'
      })
      .eq('id', userId);

    return new Response(JSON.stringify({ success: true, fileName }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### 4.2 Storage Cleanup Function

Create Supabase Edge Function: `supabase/functions/cleanup-orphaned-avatars/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // List all files in avatars bucket
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list();

    if (listError) throw listError;

    // Get all avatar URLs from profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('avatar_url')
      .not('avatar_url', 'is', null);

    // Extract paths from URLs
    const referencedPaths = new Set(
      profiles
        ?.map(p => p.avatar_url.split('/avatars/')[1])
        .filter(Boolean) || []
    );

    // Find orphaned files (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orphanedFiles = files?.filter(file => {
      const isOrphaned = !referencedPaths.has(file.name);
      const isOld = new Date(file.created_at) < thirtyDaysAgo;
      return isOrphaned && isOld;
    }) || [];

    // Delete orphaned files
    if (orphanedFiles.length > 0) {
      const filePaths = orphanedFiles.map(f => f.name);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filePaths);

      if (deleteError) throw deleteError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: orphanedFiles.length,
        deletedFiles: orphanedFiles.map(f => f.name)
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### 4.3 Monitoring & Analytics

Add to `frontend/src/utils/analytics.js`:

```javascript
// Avatar analytics tracking
export const trackAvatarEvent = (eventName, metadata = {}) => {
  // Send to your analytics service (e.g., PostHog, Mixpanel)
  console.log('Avatar Event:', eventName, metadata);
  
  // Example: PostHog
  // posthog.capture(eventName, metadata);
};

// Usage examples:
// trackAvatarEvent('avatar_uploaded', { fileSize: 1024, fileType: 'image/jpeg' });
// trackAvatarEvent('avatar_load_failed', { userId, error: 'timeout' });
// trackAvatarEvent('avatar_deleted', { userId });
```

---

## 🔄 ROLLBACK STRATEGY

### Emergency Rollback for Phase 1

```sql
-- EMERGENCY ROLLBACK: Phase 1
BEGIN;

-- Restore duplicate policies (if needed)
CREATE POLICY "avatars_r_owner" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid()));

CREATE POLICY "avatars_d_owner" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid()));

-- Drop new policies
DROP POLICY IF EXISTS "avatars_d_admin_moderation" ON storage.objects;
DROP POLICY IF EXISTS "avatars_r_own_always" ON storage.objects;
DROP POLICY IF EXISTS "avatars_r_public_approved" ON storage.objects;

-- Restore original policies
CREATE POLICY "avatars_r_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid()));

CREATE POLICY "avatars_r_public_directory" ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id = 'avatars' AND EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = objects.owner
    AND COALESCE(p.is_deleted, false) = false
    AND COALESCE(p.show_in_directory, true) = true
    AND COALESCE(p.approval_status::text, 'pending') = 'approved'
));

-- Revert handle_new_user (remove OAuth avatar sync)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, approval_status, show_in_directory, is_deleted, created_at)
  VALUES (
    new.id, new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(NULLIF(new.raw_user_meta_data->>'role', '')::app_role_enum, 'alumni'),
    'pending', true, false, NOW()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

COMMIT;
```

### Rollback for Phase 2

```sql
-- ROLLBACK: Phase 2
BEGIN;

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.get_signed_avatar_url(uuid);
DROP FUNCTION IF EXISTS public.get_signed_avatar_urls(uuid[]);
DROP FUNCTION IF EXISTS public.update_user_avatar(text);
DROP FUNCTION IF EXISTS public.delete_user_avatar();
DROP FUNCTION IF EXISTS public.admin_get_avatar(uuid);

-- Drop constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_avatar_url_format;

-- Drop indexes
DROP INDEX IF EXISTS idx_profiles_avatar_url_not_null;
DROP INDEX IF EXISTS idx_profiles_avatar_source;

-- Optional: Drop metadata columns (only if safe)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_source;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_storage_bucket;

COMMIT;
```

---

## ✅ VERIFICATION & TESTING

### Phase 1 Verification

```bash
# 1. Check RLS policies
psql $DATABASE_URL -c "
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'avatars_%'
ORDER BY policyname;
"

# Expected: Exactly 5 policies

# 2. Test admin moderation (as admin user)
# Should succeed: DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND name = '<test_file>';

# 3. Test pending user visibility
# Upload avatar as pending user, verify visible to self

# 4. Test OAuth sync
# Sign up with Google, check profiles.avatar_url populated
```

### Phase 2 Verification

```bash
# 1. Check metadata columns
psql $DATABASE_URL -c "
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('avatar_source', 'avatar_storage_bucket');
"

# 2. Test RPC functions
psql $DATABASE_URL -c "
SELECT public.get_signed_avatar_url('<user_id>');
"

# 3. Check backfill
psql $DATABASE_URL -c "
SELECT avatar_source, COUNT(*)
FROM public.profiles
WHERE avatar_url IS NOT NULL
GROUP BY avatar_source;
"
```

### Phase 3 Testing

```javascript
// Frontend integration tests
describe('Avatar Integration', () => {
  it('should display avatar in header', () => {
    cy.login();
    cy.get('[data-testid="header-avatar"]').should('be.visible');
  });

  it('should upload new avatar', () => {
    cy.login();
    cy.visit('/profile/settings');
    cy.get('input[type="file"]').attachFile('test-avatar.jpg');
    cy.get('[data-testid="avatar-preview"]').should('have.attr', 'src');
  });

  it('should show avatars in directory', () => {
    cy.visit('/directory');
    cy.get('[data-testid="directory-card"]').first().find('img').should('be.visible');
  });
});
```

---

## 📊 SUCCESS METRICS

### Immediate (Phase 1)

- ✅ RLS policy count = 5 (no duplicates)
- ✅ Admin can delete inappropriate avatars
- ✅ Pending users see own avatars within 1 second of upload
- ✅ OAuth avatars appear in profiles table

### Short-term (Phase 2-3)

- ✅ All avatar reads/writes go through AvatarService
- ✅ Signed URL generation < 100ms
- ✅ Avatar metadata tracking > 95% coverage
- ✅ Zero avatar-related errors in production logs

### Long-term (Phase 4)

- ✅ OAuth avatars auto-downloaded within 5 minutes
- ✅ Storage cleanup runs weekly, removes orphans
- ✅ Avatar load time < 500ms (p95)
- ✅ Admin moderation dashboard functional

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1 (Today) - Backend P0

- [ ] Backup current database schema
- [ ] Run Phase 1 migration SQL
- [ ] Verify RLS policies (should be 5)
- [ ] Test admin avatar deletion
- [ ] Test pending user avatar visibility
- [ ] Test OAuth avatar sync
- [ ] Monitor for errors (24 hours)

### Phase 2 (Week 1) - RPC Foundation

- [ ] Run Phase 2 migration SQL
- [ ] Update `update_user_avatar` with project URL
- [ ] Verify metadata columns backfilled
- [ ] Test all 5 RPC functions
- [ ] Check indexes created
- [ ] Update API documentation

### Phase 3 (Week 2) - Frontend Migration

- [ ] Create `services/avatar.js`
- [ ] Create `hooks/useAvatar.js`
- [ ] Refactor Header component
- [ ] Refactor Profile Settings
- [ ] Refactor Registration
- [ ] Refactor Directory
- [ ] Refactor Messaging
- [ ] Refactor Mentorship
- [ ] Refactor Groups
- [ ] Refactor Events
- [ ] Refactor Jobs
- [ ] Refactor Admin Dashboard
- [ ] Add integration tests
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production

### Phase 4 (Future) - Advanced Features

- [ ] Deploy OAuth download Edge Function
- [ ] Deploy cleanup Edge Function
- [ ] Set up cron jobs
- [ ] Add analytics tracking
- [ ] Create admin moderation dashboard
- [ ] Implement avatar compression
- [ ] Add EXIF stripping
- [ ] Generate thumbnails
- [ ] Performance monitoring

---

## 🎯 FINAL NOTES

### What Makes This Plan "D Version"?

1. **Comprehensive:** Covers backend + RPC + frontend + monitoring
2. **Phased:** Safe, incremental rollout with rollback at each step
3. **Practical:** Ready-to-run SQL + actual JS/React code
4. **Production-ready:** Includes testing, verification, metrics

### Key Principles

- ✅ **No breaking changes** in Phase 1-2
- ✅ **Backward compatible** RPCs in Phase 2
- ✅ **Gradual frontend migration** in Phase 3
- ✅ **Complete rollback safety** at every phase
- ✅ **Clear success metrics** for each phase

### Next Steps

1. **Review this document** with your team
2. **Start with Phase 1** (lowest risk, highest impact)
3. **Monitor for 24 hours** before proceeding to Phase 2
4. **Coordinate with frontend team** for Phase 3 timeline
5. **Plan Phase 4** based on business priorities

---

**Document Status:** ✅ Ready for Implementation  
**Recommended Start Date:** Immediately (Phase 1)  
**Estimated Total Time:** 2-3 weeks (all phases)  
**Risk Level:** Low → Medium (increases with each phase)  

**Questions or issues?** Refer to the Rollback Strategy section or contact the team.
