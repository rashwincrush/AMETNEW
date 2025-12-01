# AVATAR BACKEND MIGRATIONS - EXECUTION GUIDE

## 📋 Pre-Flight Checklist

Before applying migrations, verify:

- [ ] Database backup completed
- [ ] Staging environment tested (if available)
- [ ] No active deployments in progress
- [ ] Team notified of maintenance window
- [ ] Rollback script ready (`ROLLBACK_avatar_migrations.sql`)

---

## 🚀 Migration Execution Steps

### **Step 1: Verify Current State**

```sql
-- Check existing RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE 'avatars_%'
ORDER BY policyname;

-- Expected: 6 policies (including duplicates)
-- avatars_d_own
-- avatars_d_owner (duplicate)
-- avatars_i_own_folder
-- avatars_r_own
-- avatars_r_owner (duplicate)
-- avatars_r_public_directory
```

### **Step 2: Apply Migrations in Order**

Run each migration file in sequence:

```bash
# From project root
cd supabase/migrations

# Migration 1: Cleanup duplicates
psql $DATABASE_URL -f 20251129_01_cleanup_duplicate_avatar_policies.sql

# Migration 2: Add admin moderation
psql $DATABASE_URL -f 20251129_02_add_admin_avatar_moderation.sql

# Migration 3: Fix read policies
psql $DATABASE_URL -f 20251129_03_fix_avatar_read_policies.sql

# Migration 4: OAuth avatar sync
psql $DATABASE_URL -f 20251129_04_add_oauth_avatar_sync.sql

# Migration 5: Add constraints
psql $DATABASE_URL -f 20251129_05_add_avatar_url_constraints.sql
```

**OR via Supabase CLI:**

```bash
supabase db push
```

---

## ✅ Post-Migration Verification

### **Test 1: Verify RLS Policies**

```sql
-- Should show exactly 5 policies (no duplicates)
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
```

### **Test 2: Verify Admin Can Delete Any Avatar**

```sql
-- Login as admin user, then try to delete another user's avatar
-- Should succeed (previously would fail)
DELETE FROM storage.objects 
WHERE bucket_id = 'avatars' 
  AND name = '<some_other_user_id>/<filename>';
```

### **Test 3: Verify User Can See Own Avatar (Pending Status)**

```sql
-- Create test user with pending status
INSERT INTO auth.users (id, email, raw_user_meta_data) 
VALUES (
  gen_random_uuid(), 
  'test@example.com', 
  '{"first_name": "Test", "last_name": "User"}'::jsonb
);

-- Upload avatar as that user
-- Verify user can SELECT their own avatar even though approval_status = 'pending'
```

### **Test 4: Verify OAuth Avatar Sync**

```sql
-- Simulate OAuth signup
INSERT INTO auth.users (id, email, raw_user_meta_data) 
VALUES (
  gen_random_uuid(), 
  'oauth@example.com', 
  '{"first_name": "OAuth", "last_name": "User", "picture": "https://lh3.googleusercontent.com/test.jpg"}'::jsonb
);

-- Check profiles table
SELECT id, email, avatar_url 
FROM profiles 
WHERE email = 'oauth@example.com';

-- Expected: avatar_url = 'https://lh3.googleusercontent.com/test.jpg'
```

### **Test 5: Verify URL Constraint**

```sql
-- Try to insert invalid URL (should fail)
UPDATE profiles 
SET avatar_url = 'not-a-url' 
WHERE id = auth.uid();

-- Expected: ERROR: new row violates check constraint "chk_avatar_url_format"

-- Try to insert valid URL (should succeed)
UPDATE profiles 
SET avatar_url = 'https://example.com/avatar.jpg' 
WHERE id = auth.uid();

-- Expected: Success
```

### **Test 6: Verify Index Exists**

```sql
-- Check index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' 
  AND indexname = 'idx_profiles_avatar_url_not_null';

-- Expected: 1 row returned
```

---

## 🔄 Rollback Instructions (If Needed)

If migrations cause issues:

```bash
# Apply rollback script
psql $DATABASE_URL -f ROLLBACK_avatar_migrations.sql

# Verify rollback
psql $DATABASE_URL -c "SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'avatars_%';"

# Expected: 6 policies (back to original state with duplicates)
```

---

## 📊 Expected Impact

### **Immediate Changes**
✅ Duplicate RLS policies removed (6 → 5 policies)  
✅ Admins can now delete inappropriate avatars  
✅ Users see their own avatar immediately after upload  
✅ OAuth users have `avatar_url` populated in `profiles` table  
✅ Invalid URLs rejected by constraint  

### **No Breaking Changes**
✅ Existing avatar uploads continue to work  
✅ Existing avatar URLs remain valid  
✅ No downtime required  
✅ No data loss  

### **Frontend Changes Required (Separate Task)**
⚠️ Frontend must download OAuth avatars and re-upload to own storage  
⚠️ Frontend must handle OAuth avatar URL expiry (1 hour)  
⚠️ Frontend should use `profiles.avatar_url` as single source of truth  

---

## 🐛 Troubleshooting

### **Issue: Migration 05 fails with "constraint already exists"**

**Solution:**
```sql
-- Drop existing constraint first
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_avatar_url_format;

-- Then re-run migration 05
```

### **Issue: Index creation fails with "already exists"**

**Solution:**
```sql
-- Drop existing index first
DROP INDEX IF EXISTS idx_profiles_avatar_url_not_null;

-- Then re-run migration 05
```

### **Issue: Admin still cannot delete avatars**

**Diagnosis:**
```sql
-- Check if admin policy exists
SELECT * FROM pg_policies 
WHERE policyname = 'avatars_d_admin_moderation';

-- Check if user has admin role
SELECT id, email, role 
FROM profiles 
WHERE id = auth.uid();
```

**Solution:**
- Ensure user has `role = 'admin'` or `role = 'super_admin'`
- Re-run migration 02 if policy missing

### **Issue: OAuth avatar not syncing**

**Diagnosis:**
```sql
-- Check handle_new_user function
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Should contain: oauth_avatar_url := COALESCE(...)
```

**Solution:**
- Re-run migration 04
- Verify trigger is attached to `auth.users` table

---

## 📈 Monitoring

After migrations, monitor:

1. **Avatar upload success rate** (should remain >98%)
2. **Admin moderation actions** (track deletions)
3. **OAuth avatar sync rate** (% of OAuth users with `avatar_url` populated)
4. **Constraint violations** (invalid URL attempts)
5. **Storage bucket size** (should not change significantly)

---

## 🎯 Next Steps (Frontend Team)

After backend migrations complete:

1. **Implement OAuth avatar download** in `AuthContext.js`
   - Detect OAuth sign-in
   - Download avatar from `profiles.avatar_url` (OAuth URL)
   - Re-upload to `avatars/{user_id}/{timestamp}.jpg`
   - Update `profiles.avatar_url` with new storage URL

2. **Update avatar upload components**
   - Use centralized `services/avatar.js`
   - Remove direct `supabase.storage.from('avatars')` calls
   - Implement validation, compression, EXIF stripping

3. **Create `useAvatar` hook**
   - Centralize avatar state management
   - Handle realtime updates
   - Implement retry logic

4. **Test end-to-end flows**
   - Manual upload → avatar visible immediately
   - OAuth sign-up → avatar synced within 5s
   - Admin moderation → delete inappropriate avatar
   - Pending user → sees own avatar, others don't

---

## 📝 Migration Log Template

```
Date: 2025-11-29
Executed by: [Your Name]
Environment: [Production/Staging]
Start time: [HH:MM]
End time: [HH:MM]

Migrations applied:
✅ 20251129_01_cleanup_duplicate_avatar_policies.sql
✅ 20251129_02_add_admin_avatar_moderation.sql
✅ 20251129_03_fix_avatar_read_policies.sql
✅ 20251129_04_add_oauth_avatar_sync.sql
✅ 20251129_05_add_avatar_url_constraints.sql

Verification results:
✅ RLS policies: 5 (expected)
✅ Admin can delete avatars: YES
✅ User sees own avatar (pending): YES
✅ OAuth avatar sync: YES
✅ URL constraint: YES
✅ Index exists: YES

Issues encountered: [None/List issues]

Rollback required: [NO/YES - reason]

Notes: [Any additional observations]
```

---

**Ready to apply migrations?** Follow the steps above in order. If any issues arise, use the rollback script immediately.
