# AVATAR/PROFILE PICTURE BACKEND AUDIT & FIX PLAN
## OPIB-∞ Complete Backend Analysis

**Date:** 2025-11-29  
**Scope:** Profile Picture/Avatar/DP for ALL roles (Student, Alumni, Admin, Super Admin, Employer)  
**Focus:** Backend only - Database schema, RLS policies, storage bucket, triggers, functions

---

## 🔴 CRITICAL FINDINGS

### 1. **DUPLICATE RLS POLICIES (MAJOR ISSUE)**
Found **DUPLICATE** RLS policies on `storage.objects` for `avatars` bucket:

```sql
-- Line 19700: avatars_d_own
CREATE POLICY "avatars_d_own" ON "storage"."objects" FOR DELETE TO "authenticated" 
USING ((bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid())));

-- Line 19704: avatars_d_owner (DUPLICATE!)
CREATE POLICY "avatars_d_owner" ON "storage"."objects" FOR DELETE TO "authenticated" 
USING ((bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid())));

-- Line 19712: avatars_r_own
CREATE POLICY "avatars_r_own" ON "storage"."objects" FOR SELECT TO "authenticated" 
USING ((bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid())));

-- Line 19716: avatars_r_owner (DUPLICATE!)
CREATE POLICY "avatars_r_owner" ON "storage"."objects" FOR SELECT TO "authenticated" 
USING ((bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid())));
```

**Impact:** Duplicate policies cause confusion, potential conflicts, and maintenance overhead.

---

### 2. **DUAL STORAGE COLUMNS (INCONSISTENCY)**
`profiles` table has **TWO** avatar-related columns:

```sql
-- Line 655: avatar_url (TEXT) - Public URL
"avatar_url" "text",

-- Line 754: avatar_path (TEXT) - Storage path
"avatar_path" "text",
```

**Current State:**
- `avatar_url`: Stores full public URL (e.g., `https://[project].supabase.co/storage/v1/object/public/avatars/[user_id]/[file].jpg`)
- `avatar_path`: Stores storage path (e.g., `[user_id]/[timestamp].jpg`)

**Problem:** 
- Dual columns create sync issues
- `avatar_path` is NOT consistently populated (based on trigger at line 509-545 in `admin_delete_user_cascade`)
- No constraint ensuring both are in sync
- Frontend likely only uses `avatar_url`, making `avatar_path` redundant

---

### 3. **MISSING ADMIN MODERATION RLS POLICY**
Current RLS policies do NOT allow admins to delete inappropriate avatars:

```sql
-- ❌ MISSING: Admin override policy for moderation
-- Admins/Super Admins CANNOT delete other users' avatars for moderation
```

**Impact:** Admins cannot moderate inappropriate profile pictures.

---

### 4. **OVERLY RESTRICTIVE PUBLIC READ POLICY**
```sql
-- Line 19720: avatars_r_public_directory
CREATE POLICY "avatars_r_public_directory" ON "storage"."objects" FOR SELECT TO "authenticated", "anon" 
USING ((bucket_id = 'avatars' AND EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = objects.owner 
    AND COALESCE(p.is_deleted, false) = false 
    AND COALESCE(p.show_in_directory, true) = true 
    AND COALESCE(p.approval_status::text, 'pending') = 'approved'
)));
```

**Problem:** 
- Avatars only visible if user is `approved` AND `show_in_directory = true`
- Pending users' avatars are NOT visible (even to themselves in some contexts)
- Breaks UX: User uploads avatar during registration, but can't see it until approved

---

### 5. **NO OAUTH AVATAR HANDLING IN BACKEND**
`handle_new_user()` trigger (line 6523-6542) does NOT extract OAuth avatar:

```sql
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
AS $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, approval_status, show_in_directory, is_deleted, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    coalesce(nullif(new.raw_user_meta_data->>'role','')::app_role_enum, 'alumni'),
    'pending',
    true,
    false,
    now()
  )
  on conflict (id) do nothing;
  return new;
end$$;
```

**Missing:**
- No extraction of `new.raw_user_meta_data->>'avatar_url'`
- No extraction of `new.raw_user_meta_data->>'picture'` (Google/LinkedIn)
- OAuth avatars stored in `auth.users.raw_user_meta_data` but NOT synced to `profiles.avatar_url`

---

### 6. **NO FILE VALIDATION AT DATABASE LEVEL**
No constraints on `avatar_url` or `avatar_path`:

```sql
-- ❌ MISSING: CHECK constraint for URL format
-- ❌ MISSING: CHECK constraint for path format
-- ❌ MISSING: File size/type validation (must be done at application layer)
```

---

### 7. **PROFILE COMPLETENESS REQUIRES AVATAR**
```sql
-- Line 723: is_profile_complete generated column
"is_profile_complete" boolean GENERATED ALWAYS AS (
  (email IS NOT NULL) AND 
  (first_name IS NOT NULL) AND 
  (last_name IS NOT NULL) AND 
  (graduation_year IS NOT NULL) AND 
  (degree_program IS NOT NULL) AND 
  (current_job_title IS NOT NULL) AND 
  (company_name IS NOT NULL) AND 
  (avatar_url IS NOT NULL)  -- ⚠️ Avatar REQUIRED for completeness
) STORED,
```

**Impact:** Users cannot have "complete" profile without avatar (may be intentional, but worth noting).

---

## 📊 CURRENT BACKEND STATE SUMMARY

### **Database Schema**
| Column | Type | Nullable | Purpose | Status |
|--------|------|----------|---------|--------|
| `profiles.avatar_url` | TEXT | YES | Full public URL | ✅ Primary SSOT |
| `profiles.avatar_path` | TEXT | YES | Storage path | ⚠️ Redundant, inconsistently populated |

### **Storage Bucket**
- **Bucket Name:** `avatars`
- **Path Format:** `{user_id}/{timestamp}_{random}.{ext}` (frontend convention, not enforced)
- **Public Access:** Yes (via RLS policies)
- **Bucket Type:** STANDARD (assumed, not explicitly defined in dump)

### **RLS Policies (Current)**
| Policy Name | Operation | Role | Logic | Status |
|-------------|-----------|------|-------|--------|
| `avatars_i_own_folder` | INSERT | authenticated | `name ~~ auth.uid() || '/%'` | ✅ Good |
| `avatars_r_own` | SELECT | authenticated | Own files only | ⚠️ Duplicate with `avatars_r_owner` |
| `avatars_r_owner` | SELECT | authenticated | Own files only | ⚠️ Duplicate with `avatars_r_own` |
| `avatars_r_public_directory` | SELECT | authenticated, anon | Approved users only | ⚠️ Too restrictive |
| `avatars_d_own` | DELETE | authenticated | Own files only | ⚠️ Duplicate with `avatars_d_owner` |
| `avatars_d_owner` | DELETE | authenticated | Own files only | ⚠️ Duplicate with `avatars_d_own` |
| **MISSING** | DELETE | authenticated | Admin override | ❌ Critical gap |
| **MISSING** | UPDATE | authenticated | Any role | ❌ No update policy |

### **Triggers & Functions**
| Function | Purpose | Avatar Handling | Status |
|----------|---------|-----------------|--------|
| `handle_new_user()` | Create profile on signup | ❌ Does NOT extract OAuth avatar | ⚠️ Incomplete |
| `admin_delete_user_cascade()` | Cleanup on user deletion | ✅ Deletes avatar from storage | ✅ Good |
| `_touch_updated_at()` | Update timestamp | N/A | ✅ Good |

### **OAuth Flow (Backend)**
1. User signs up via Google/LinkedIn
2. `auth.users.raw_user_meta_data` populated with:
   - `avatar_url` (Google/LinkedIn CDN URL)
   - `picture` (alternative field)
   - `first_name`, `last_name`, `full_name`
3. `handle_new_user()` trigger fires → creates `profiles` row
4. **❌ OAuth avatar URL NOT copied to `profiles.avatar_url`**
5. **❌ OAuth avatar NOT downloaded and re-uploaded to own storage**
6. **Result:** OAuth users have avatar in `auth.users` but NOT in `profiles` → frontend must fallback

---

## 🎯 RECOMMENDED FIX PLAN (BACKEND ONLY)

### **Phase 1: Clean Up Duplicate RLS Policies (P0 - Immediate)**

**Goal:** Remove duplicate policies, keep only one set with clear naming.

**Actions:**
1. Drop duplicate policies:
   ```sql
   DROP POLICY IF EXISTS "avatars_r_owner" ON storage.objects;
   DROP POLICY IF EXISTS "avatars_d_owner" ON storage.objects;
   ```

2. Rename remaining policies for clarity:
   ```sql
   -- Keep avatars_r_own, avatars_d_own, avatars_i_own_folder
   -- These are clear and consistent
   ```

**Migration:**
```sql
-- Migration: cleanup_duplicate_avatar_policies.sql
BEGIN;

-- Drop duplicate SELECT policy
DROP POLICY IF EXISTS "avatars_r_owner" ON storage.objects;

-- Drop duplicate DELETE policy
DROP POLICY IF EXISTS "avatars_d_owner" ON storage.objects;

COMMIT;
```

---

### **Phase 2: Add Admin Moderation RLS Policy (P0 - Immediate)**

**Goal:** Allow admins/super_admins to delete any avatar for moderation.

**Migration:**
```sql
-- Migration: add_admin_avatar_moderation.sql
BEGIN;

-- Admin can delete any avatar for moderation
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

COMMIT;
```

---

### **Phase 3: Fix Public Read Policy (P0 - Immediate)**

**Goal:** Allow users to see their own avatar regardless of approval status, while keeping public directory restricted.

**Current Problem:** `avatars_r_public_directory` is too restrictive.

**Solution:** Split into TWO policies:
1. Users can ALWAYS see their own avatar
2. Public can see avatars of approved users only

**Migration:**
```sql
-- Migration: fix_avatar_read_policies.sql
BEGIN;

-- Policy 1: Users can always read their own avatars
CREATE POLICY "avatars_r_own_always" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid())
);

-- Policy 2: Public directory - approved users only
-- Keep existing avatars_r_public_directory but make it more permissive
DROP POLICY IF EXISTS "avatars_r_public_directory" ON storage.objects;

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
      -- Removed show_in_directory check - avatar visible even if hidden from directory
      AND COALESCE(p.approval_status::text, 'pending') = 'approved'
  )
);

COMMIT;
```

**Note:** This allows:
- ✅ Users see their own avatar immediately after upload (even if pending)
- ✅ Approved users' avatars visible to everyone
- ❌ Pending/rejected users' avatars NOT visible to others (privacy)

---

### **Phase 4: Deprecate `avatar_path` Column (P1 - Low Priority)**

**Goal:** Simplify schema by removing redundant `avatar_path` column.

**Rationale:**
- `avatar_url` is sufficient (can extract path from URL if needed)
- `avatar_path` is inconsistently populated
- Reduces sync issues

**Migration (CAREFUL - Data Loss Risk):**
```sql
-- Migration: deprecate_avatar_path.sql
-- ⚠️ ONLY run this after verifying avatar_path is NOT used in frontend/backend

BEGIN;

-- Step 1: Verify no code references avatar_path
-- (Manual check required)

-- Step 2: Drop column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_path;

COMMIT;
```

**⚠️ HOLD:** Do NOT run this until frontend audit confirms `avatar_path` is unused.

---

### **Phase 5: Add OAuth Avatar Sync to `handle_new_user()` (P0 - Immediate)**

**Goal:** Extract OAuth avatar URL from `raw_user_meta_data` and store in `profiles.avatar_url`.

**Note:** This does NOT download the OAuth avatar (that's frontend's job), but ensures the URL is available in `profiles` table.

**Migration:**
```sql
-- Migration: add_oauth_avatar_sync.sql
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  oauth_avatar_url text;
BEGIN
  -- Extract OAuth avatar URL (Google/LinkedIn)
  oauth_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

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
    avatar_url  -- ✅ NEW: Add OAuth avatar URL
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
    oauth_avatar_url  -- ✅ NEW: Store OAuth avatar URL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

COMMIT;
```

**Impact:**
- ✅ OAuth users will have `profiles.avatar_url` populated immediately
- ⚠️ URL points to Google/LinkedIn CDN (expires after 1 hour)
- ⚠️ Frontend MUST download and re-upload to own storage (separate task)

---

### **Phase 6: Add URL Format Constraints (P1 - Nice to Have)**

**Goal:** Ensure `avatar_url` is always a valid URL.

**Migration:**
```sql
-- Migration: add_avatar_url_constraints.sql
BEGIN;

-- Add CHECK constraint for URL format
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_avatar_url_format 
CHECK (
  avatar_url IS NULL 
  OR (
    avatar_url ~ '^https?://.+' 
    AND length(avatar_url) <= 2048
  )
);

-- Add index for analytics/search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_avatar_url_not_null 
ON public.profiles(avatar_url) 
WHERE avatar_url IS NOT NULL;

COMMIT;
```

---

### **Phase 7: Add Storage Cleanup Job (P1 - Future)**

**Goal:** Delete orphaned avatar files (in storage but not referenced in `profiles.avatar_url`).

**Approach:** Create Supabase Edge Function (not SQL migration).

**Pseudocode:**
```typescript
// supabase/functions/cleanup-orphaned-avatars/index.ts
export default async function cleanupOrphanedAvatars() {
  // 1. List all files in avatars bucket
  const { data: files } = await supabase.storage.from('avatars').list();
  
  // 2. Get all avatar_url values from profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('avatar_url')
    .not('avatar_url', 'is', null);
  
  // 3. Extract paths from URLs
  const referencedPaths = profiles.map(p => extractPathFromUrl(p.avatar_url));
  
  // 4. Find orphaned files (in storage but not in profiles)
  const orphanedFiles = files.filter(f => !referencedPaths.includes(f.name));
  
  // 5. Delete orphaned files older than 30 days
  for (const file of orphanedFiles) {
    if (isOlderThan30Days(file.created_at)) {
      await supabase.storage.from('avatars').remove([file.name]);
    }
  }
}
```

**Schedule:** Run daily via cron.

---

## 🚀 MIGRATION EXECUTION ORDER

### **Immediate (This Week)**
1. ✅ **Phase 1:** Clean up duplicate RLS policies
2. ✅ **Phase 2:** Add admin moderation policy
3. ✅ **Phase 3:** Fix public read policies
4. ✅ **Phase 5:** Add OAuth avatar sync to `handle_new_user()`

### **Next Week**
5. ✅ **Phase 6:** Add URL format constraints

### **Future (Month 2)**
6. ⚠️ **Phase 4:** Deprecate `avatar_path` (only after frontend audit)
7. ⚠️ **Phase 7:** Add storage cleanup job

---

## 📋 FINAL RLS POLICY STATE (After All Fixes)

```sql
-- INSERT: Own folder only
CREATE POLICY "avatars_i_own_folder" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name ~~ (auth.uid() || '/%'));

-- SELECT: Own files always visible
CREATE POLICY "avatars_r_own_always" 
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid()));

-- SELECT: Public directory (approved users only)
CREATE POLICY "avatars_r_public_approved" 
ON storage.objects FOR SELECT TO authenticated, anon
USING (
  bucket_id = 'avatars' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = objects.owner 
      AND COALESCE(p.is_deleted, false) = false 
      AND COALESCE(p.approval_status::text, 'pending') = 'approved'
  )
);

-- DELETE: Own files only
CREATE POLICY "avatars_d_own" 
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid()));

-- DELETE: Admin moderation
CREATE POLICY "avatars_d_admin_moderation" 
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);
```

**Total Policies:** 5 (down from 7, no duplicates)

---

## ✅ VERIFICATION CHECKLIST

After applying migrations, verify:

- [ ] Only 5 RLS policies exist on `storage.objects` for `avatars` bucket
- [ ] No duplicate policies (`avatars_r_owner`, `avatars_d_owner` removed)
- [ ] Admin can delete any avatar (test with admin account)
- [ ] User can see their own avatar immediately after upload (even if pending)
- [ ] Pending user's avatar NOT visible to other users
- [ ] Approved user's avatar visible to everyone
- [ ] OAuth sign-up populates `profiles.avatar_url` with OAuth URL
- [ ] `avatar_url` constraint rejects invalid URLs
- [ ] Index on `avatar_url` exists

---

## 🔒 SECURITY NOTES

### **What This Fixes:**
✅ Admin moderation capability  
✅ User can see own avatar immediately  
✅ No duplicate policies (reduces attack surface)  
✅ OAuth avatar URL captured in profiles  

### **What This Does NOT Fix (Frontend Required):**
❌ OAuth avatar download and re-upload (frontend must do this)  
❌ File type validation (frontend must validate before upload)  
❌ File size validation (frontend must validate before upload)  
❌ EXIF metadata stripping (frontend must strip before upload)  
❌ Image compression (frontend must compress before upload)  

---

## 📊 IMPACT ANALYSIS

### **Data Loss Risk:** ⚠️ LOW
- No data deletion (except Phase 4, which is optional)
- All migrations are additive (add policies, modify function)

### **Downtime Risk:** ✅ NONE
- All migrations can run without downtime
- RLS policy changes are instant

### **Breaking Changes:** ✅ NONE
- Existing functionality preserved
- Only adds new capabilities (admin moderation, OAuth sync)

---

## 🎯 NEXT STEPS

1. **Review this document** with team
2. **Test migrations** in staging environment
3. **Apply Phase 1-3, 5** immediately (P0)
4. **Coordinate with frontend team** for OAuth avatar download implementation
5. **Apply Phase 6** next week (P1)
6. **Schedule Phase 7** for next month (storage cleanup job)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-29  
**Author:** OPIB-∞ Backend Audit
