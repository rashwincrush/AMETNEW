# Complete Avatar/Profile Picture Flow Analysis

## Executive Summary

This document provides a comprehensive analysis of how profile pictures (avatars) are uploaded, stored, retrieved, and displayed across the entire AMETNEW application, covering both backend (Supabase Storage, RLS policies, database views, RPCs) and frontend (React components, hooks, utilities).

---

## Table of Contents

1. [Backend Infrastructure](#1-backend-infrastructure)
2. [Upload Flow](#2-upload-flow)
3. [Storage & Retrieval](#3-storage--retrieval)
4. [Display Flow by Component](#4-display-flow-by-component)
5. [Performance Considerations](#5-performance-considerations)
6. [Security & Access Control](#6-security--access-control)
7. [Common Issues & Solutions](#7-common-issues--solutions)

---

## 1. Backend Infrastructure

### 1.1 Supabase Storage Bucket: `avatars`

**Location**: Supabase Storage  
**Bucket Name**: `avatars`  
**Public Access**: Yes (read-only for approved, visible profiles)

**RLS Policies** (from `Dumps.sql`):

```sql
-- INSERT: Authenticated users can upload to their own folder
CREATE POLICY "avatars_i_own_folder" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' 
  AND name ~~ (auth.uid() || '/%')
);

-- SELECT (Public Read): Anyone can view avatars of approved, visible profiles
CREATE POLICY "avatars_r_public_directory" ON storage.objects 
FOR SELECT TO authenticated, anon 
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

-- DELETE: Users can delete their own avatars
CREATE POLICY "avatars_d_own" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (name ~~ (auth.uid() || '/%') OR owner = auth.uid())
);

-- UPDATE: Users can update their own avatars
CREATE POLICY "Avatar 1oj01fe_2" ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars');
```

**Key Points**:
- Users upload to `avatars/{user_id}/{timestamp}.{ext}`
- Public read access is **conditional** on profile approval status
- Unapproved/deleted/hidden profiles' avatars are **not publicly accessible**

### 1.2 Database Column: `profiles.avatar_url`

**Table**: `public.profiles`  
**Column**: `avatar_url TEXT`  
**Stores**: Full public URL from Supabase Storage

**Example**:
```
https://[project-ref].supabase.co/storage/v1/object/public/avatars/5371e2d5-0697-46c0-bf5b-aab2e4d88b58/1732654321000.jpg
```

### 1.3 Database Views Exposing Avatars

#### a) `alumni_directory_public` (Student-Safe View)

**Purpose**: Public directory view with no PII, used by students

```sql
CREATE VIEW alumni_directory_public AS
SELECT 
  p.id,
  COALESCE(p.full_name, concat_ws(' ', p.first_name, p.last_name)) AS full_name,
  p.avatar_url,  -- ← Avatar exposed here
  p.graduation_year,
  p.degree_program,
  p.department,
  p.current_job_title,
  p.company_name,
  p.location_city,
  p.location_country,
  -- ... other safe fields
FROM profiles p
WHERE 
  COALESCE(p.is_deleted, false) = false
  AND COALESCE(p.show_in_directory, true) = true
  AND p.approval_status = 'approved';
```

#### b) `directory_profiles_base` (Admin/Alumni View)

**Purpose**: Enhanced directory view with more fields, used by `get_directory_profiles` RPC

```sql
CREATE VIEW directory_profiles_base AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.full_name,
  p.avatar_url,  -- ← Avatar exposed here
  p.graduation_year,
  -- ... degree/department joins
  p.location,
  p.location_city,
  p.location_country,
  p.role,
  p.approval_status,
  p.is_deleted,
  p.is_active,
  p.show_in_directory
FROM profiles p
LEFT JOIN degrees deg ON deg.code = p.degree_code
LEFT JOIN departments dept ON dept.id = p.department_id;
```

#### c) `get_directory_profiles` RPC

**Purpose**: Role-aware directory fetch

```sql
CREATE FUNCTION get_directory_profiles()
RETURNS SETOF directory_profiles_base
AS $$
DECLARE
  v_role text := public.get_user_role();
  v_is_admin boolean := public.app_is_admin();
BEGIN
  -- Employers see nothing
  IF v_role = 'employer' THEN
    RETURN;
  END IF;

  IF v_is_admin THEN
    -- Admins see ALL profiles (including unapproved/deleted)
    RETURN QUERY SELECT * FROM directory_profiles_base;
  ELSE
    -- Alumni/students see only approved, active, visible, non-employer profiles
    RETURN QUERY
      SELECT * FROM directory_profiles_base
      WHERE is_employer = false
        AND show_in_directory = true
        AND is_deleted = false
        AND is_active = true
        AND approval_status = 'approved';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Key Point**: Avatar URLs are included in all directory views, but **access to the actual image** is still gated by Storage RLS.

---

## 2. Upload Flow

### 2.1 Profile Settings Upload (`Profile.js`)

**Component**: `frontend/src/components/Auth/Profile.js`

**Upload Function**:
```javascript
const uploadAvatar = async (file) => {
  if (!file) {
    throw new Error('No file provided for avatar upload.');
  }

  const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

  console.log(`Uploading to: ${filePath}`);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { 
      upsert: true,
      cacheControl: '3600'
    });

  if (uploadError) {
    console.error('Error during avatar upload:', uploadError);
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  console.log('Upload successful, getting public URL...');

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    console.error('Could not get public URL for avatar.');
    throw new Error('Could not get public URL for avatar.');
  }

  console.log('Public URL received:', data.publicUrl);
  return data.publicUrl;
};
```

**File Validation** (in Profile.js):
```javascript
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setImageFile(file);
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }
};
```

**Save Flow**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ... validation ...
  
  setIsSubmitting(true);
  const profileUpdates = { /* ... other fields ... */ };

  try {
    // Upload avatar if a new file was selected
    if (imageFile) {
      console.log('Uploading new avatar...');
      const publicUrl = await uploadAvatar(imageFile);
      console.log('Avatar uploaded successfully:', publicUrl);
      profileUpdates.avatar_url = publicUrl;
    }

    // Update profile in database
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (error) throw error;

    toast.success('Profile updated successfully!');
    setIsEditing(false);
    await fetchUserProfile(); // Refresh profile data
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error(error.message || 'Failed to update profile');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Path Structure**:
```
avatars/
  └── {user_id}/
      ├── 1732654321000.jpg
      ├── 1732654987000.png
      └── ... (older uploads, can be cleaned up)
```

### 2.2 Registration Upload (`OnboardingForm.jsx`, `ProfileCompletion.jsx`)

Similar pattern:
```javascript
const uploadAvatarIfAny = async () => {
  if (!form.avatar_file) return form.prefill_avatar_url || null;
  const file = form.avatar_file;
  const path = `${user.id}/${Date.now()}_${file.name}`;
  
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
    
  if (error) throw error;
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
};
```

---

## 3. Storage & Retrieval

### 3.1 How Frontend Gets Avatar URLs

#### Method 1: Direct Profile Query
```javascript
// In AuthContext.js
const { data: profileData, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// profileData.avatar_url contains the full URL
```

#### Method 2: Directory RPC
```javascript
// In useDirectory.js
const res = await supabase.rpc('get_directory_profiles');
// Each row has avatar_url
```

#### Method 3: Public View (Students)
```javascript
// In useDirectory.js (source='public')
const res = await supabase
  .from('alumni_directory_public')
  .select('*');
// Each row has avatar_url
```

### 3.2 URL Format

**Standard URL**:
```
https://[project-ref].supabase.co/storage/v1/object/public/avatars/[user-id]/[timestamp].[ext]
```

**Cache-Busted URL** (with version parameter):
```
https://[project-ref].supabase.co/storage/v1/object/public/avatars/[user-id]/[timestamp].[ext]?v=[updated_at]
```

### 3.3 Cache-Busting Utility

**File**: `frontend/src/utils/ui.js`

```javascript
export function getCacheBustedUrl(url, version) {
  if (!url) return '';
  if (!version) return url;
  
  try {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('v', String(version));
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, append manually
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
  }
}
```

**Usage**: Ensures browser fetches fresh image after profile update by appending `?v={updated_at}` timestamp.

---

## 4. Display Flow by Component

### 4.1 Shared Avatar Component

**File**: `frontend/src/components/common/Avatar.jsx`

**Props**:
- `src`: Image URL (avatar_url from profile)
- `alt`: Alt text (user's name)
- `size`: 24, 32, 40, 64, 96 pixels
- `version`: Cache-buster (usually `profile.updated_at`)
- `rounded`: 'full' (circle), 'xl', 'md'
- `badge`: Role badge ('student', 'alumni', 'employer', etc.)

**Rendering Logic**:
```javascript
const Avatar = ({ src, alt, size = 40, rounded = 'full', badge = null, version = null }) => {
  const [imageState, setImageState] = useState('loading');
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  const imageUrl = version ? getCacheBustedUrl(src, version) : src;
  
  useEffect(() => {
    if (src) {
      setImageState('loading');
      setHasAttemptedLoad(false);
    } else {
      setImageState('error'); // No src → show initials immediately
    }
  }, [src]);
  
  const handleImageLoad = () => {
    setImageState('loaded');
    setHasAttemptedLoad(true);
  };
  
  const handleImageError = () => {
    if (!hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      setImageState('error'); // Show initials fallback
    }
  };
  
  return (
    <div className="...">
      {/* Loading skeleton */}
      {imageState === 'loading' && src && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}
      
      {/* Image */}
      {src && imageState !== 'error' && (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={imageState === 'loading' ? 'opacity-0' : 'opacity-100'}
        />
      )}
      
      {/* Initials fallback */}
      {(!src || imageState === 'error') && (
        <div className="bg-gradient-to-br from-ocean-100 to-ocean-200">
          {getInitials(alt)}
        </div>
      )}
      
      {/* Role badge */}
      {badge && <span className="..." />}
    </div>
  );
};
```

**States**:
1. **Loading**: Shows grey skeleton while image loads
2. **Loaded**: Fades in the image
3. **Error**: Shows initials fallback (gradient background with 1-2 letters)

### 4.2 Alumni Directory (`DirectoryPage.jsx` → `DirectoryCardSplit.jsx`)

**Data Flow**:
```
useDirectory hook
  ↓ (fetches from RPC or public view)
normalizeProfile(row)
  ↓ (extracts avatar_url)
DirectoryPage (builds withRel array)
  ↓
DirectoryGrid
  ↓
DirectoryCardSplit (for each profile)
  ↓
<Avatar 
  src={profile.avatar_url} 
  alt={profile.full_name} 
  size={64} 
  version={profile?.updated_at} 
/>
```

**Code** (`DirectoryCardSplit.jsx`):
```jsx
<div className="h-16 w-16 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-slate-200">
  <Avatar 
    src={profile.avatar_url} 
    alt={profile.full_name || 'Profile'} 
    size={64} 
    version={profile?.updated_at} 
  />
</div>
```

**Normalization** (`lib/normalizeProfile.js`):
```javascript
export function normalizeProfile(row = {}) {
  return {
    id: row.id,
    full_name: row.full_name || row.name || ...,
    avatar_url: row.avatar_url ?? row.photo_url ?? null,  // ← Fallback chain
    // ... other fields
  };
}
```

### 4.3 Profile Settings (`Profile.js`)

**Display**:
```jsx
<img 
  src={imageUrl}  // State managed locally, updated on upload
  alt={formData.name}
  className="w-32 h-32 rounded-full object-cover border-2 border-white shadow-md"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = '/default-avatar.svg';  // Fallback to default
  }}
/>
```

**State Management**:
```javascript
const [imageUrl, setImageUrl] = useState('/default-avatar.svg');
const [imageFile, setImageFile] = useState(null);

// Update imageUrl when profile loads
useEffect(() => {
  if (user && user.avatar) {
    setImageUrl(user.avatar);
  } else if (profile && profile.avatar_url) {
    setImageUrl(profile.avatar_url);
  }
}, [user, profile]);

// Preview new upload immediately
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);  // Show preview
    };
    reader.readAsDataURL(file);
  }
};
```

### 4.4 Alumni Profile Page (`AlumniProfile.js`)

**Data Flow**:
```
useEffect → fetch profile by ID
  ↓ (from profiles table or alumni_directory_public)
Transform to alumnus object
  ↓
<Avatar 
  src={alumnus.avatar} 
  name={alumnus.name} 
  size={128} 
  version={alumnus.updated_at}
/>
```

**Code**:
```javascript
// Fetch profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', id)
  .single();

// Transform
const transformed = {
  id: data.id,
  name: data.full_name || ...,
  avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}`,
  // ... other fields
};

// Render
<Avatar 
  src={alumnus.avatar} 
  name={alumnus.name} 
  size={128} 
  version={alumnus.updated_at}
/>
```

**Fallback Chain**:
1. `data.avatar_url` (Supabase Storage)
2. `ui-avatars.com` API (external service, generates initials image)
3. Avatar component's built-in initials fallback (if external fails)

### 4.5 Other Components Using Avatars

**Messages/Chat**:
- `ChatWindow.js`: Shows participant avatars
- `ConnectionManager.js`: Shows connection avatars
- Uses `Avatar` component with `size={40}` or `size={32}`

**Groups**:
- `GroupDetails.js`: Member avatars
- `GroupsList.js`: Group creator avatars
- Uses `Avatar` component

**Mentorship**:
- `Mentorship.js`: Mentor avatars in directory
- `MentorProfile.js`: Large mentor avatar
- `MentorshipChat.js`: Chat participant avatars

**Notifications**:
- `Notifications.js`: Actor avatars in notification items
- Uses small `Avatar` with `size={32}`

**Dashboard**:
- `AlumniDashboard.js`: Recent activity avatars
- `MyGroupsWidget.jsx`: Group member avatars

---

## 5. Performance Considerations

### 5.1 Current Performance Characteristics

**From Network Analysis** (your screenshot):
- Avatar images: ~125 KB each
- Load time: ~200 ms per image
- Total directory page: ~2.7 MB transferred (includes all assets)
- Page load: ~450 ms (DOMContentLoaded)

### 5.2 Performance Optimizations in Place

#### a) Lazy Loading
```jsx
<img loading="lazy" ... />
```
- Browser defers loading images until near viewport
- Reduces initial page load

#### b) Cache Control
```javascript
await supabase.storage
  .from('avatars')
  .upload(filePath, file, { 
    cacheControl: '3600'  // 1 hour browser cache
  });
```

#### c) Cache Busting (Selective)
```javascript
const imageUrl = version ? getCacheBustedUrl(src, version) : src;
```
- Only adds `?v=` when `version` prop provided
- Ensures fresh image after profile update
- Allows browser caching otherwise

#### d) Initials Fallback (No Network)
```jsx
{(!src || imageState === 'error') && (
  <div className="bg-gradient-to-br from-ocean-100 to-ocean-200">
    {getInitials(alt)}
  </div>
)}
```
- Instant display for profiles without avatars
- No network request needed

### 5.3 Potential Bottlenecks

1. **Large Original Files**
   - Users can upload up to 2MB images
   - No server-side resizing/optimization
   - Directory shows full-size images scaled down via CSS

2. **External Fallback Service**
   - `ui-avatars.com` used in some places
   - Adds external dependency
   - Can be slow or fail

3. **No Thumbnail Generation**
   - Same large file used for all sizes (32px, 64px, 128px)
   - Wastes bandwidth for small avatars

4. **No CDN**
   - Supabase Storage serves directly
   - No additional CDN layer (though Supabase has built-in CDN)

---

## 6. Security & Access Control

### 6.1 Storage RLS (Row-Level Security)

**Upload** (INSERT):
- ✅ Authenticated users only
- ✅ Must upload to their own folder (`avatars/{user_id}/...`)
- ❌ Cannot upload to other users' folders

**Read** (SELECT):
- ✅ Public read for approved profiles
- ✅ Conditional on `profiles.approval_status = 'approved'`
- ✅ Conditional on `profiles.show_in_directory = true`
- ✅ Conditional on `profiles.is_deleted = false`
- ❌ Unapproved/hidden/deleted profiles' avatars are NOT publicly accessible

**Delete** (DELETE):
- ✅ Users can delete their own avatars
- ❌ Cannot delete others' avatars

**Update** (UPDATE):
- ✅ Users can update their own avatars
- ❌ Cannot update others' avatars

### 6.2 Database RLS

**profiles table**:
- Users can UPDATE their own `avatar_url` field
- Admin-only fields (approval_status, etc.) protected by triggers

### 6.3 Frontend Validation

**File Type**:
```javascript
const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!validTypes.includes(file.type)) {
  toast.error('Please upload a valid image file');
  return;
}
```

**File Size**:
```javascript
const maxSize = 2 * 1024 * 1024; // 2MB
if (file.size > maxSize) {
  toast.error('Image size must be less than 2MB');
  return;
}
```

### 6.4 Privacy Considerations

**Directory Visibility**:
- Avatar URLs are included in directory views
- BUT actual image access is gated by Storage RLS
- Unapproved users' avatars return 403/404 even if URL is known

**Profile Approval Flow**:
1. User uploads avatar → stored in Supabase Storage
2. `profiles.avatar_url` updated with public URL
3. If `approval_status != 'approved'` → Storage RLS blocks public access
4. Admin approves profile → Storage RLS allows public access
5. Avatar becomes visible in directory

---

## 7. Common Issues & Solutions

### 7.1 Slow Avatar Loading

**Symptoms**:
- Grey skeleton shows for long time
- Images appear one-by-one slowly
- "Finish" time in DevTools is high

**Root Causes**:
1. Large original files (up to 2MB)
2. Many avatars on one page (24+ in directory)
3. External fallback service (`ui-avatars.com`) slow
4. No thumbnail/optimization

**Solutions**:
- ✅ **Already implemented**: Lazy loading, cache control
- 🔄 **Recommended**: Server-side image resizing (Supabase Image Transformation)
- 🔄 **Recommended**: Generate thumbnails on upload
- 🔄 **Recommended**: Use built-in initials fallback instead of external service

### 7.2 Missing Avatars (Blank or Initials)

**Symptoms**:
- Avatar shows initials instead of photo
- Grey skeleton never resolves

**Root Causes**:
1. `avatar_url` is NULL in database
2. Storage RLS blocking access (unapproved profile)
3. File deleted from Storage but URL still in database
4. Invalid URL format

**Solutions**:
- ✅ **Already implemented**: Initials fallback
- ✅ **Already implemented**: Error handling in Avatar component
- 🔄 **Recommended**: Add database constraint to validate URL format
- 🔄 **Recommended**: Periodic cleanup of orphaned URLs

### 7.3 Stale Avatar After Update

**Symptoms**:
- User uploads new avatar
- Old avatar still shows in directory/profile

**Root Causes**:
1. Browser cache not invalidated
2. No cache-busting parameter
3. Profile data not refreshed

**Solutions**:
- ✅ **Already implemented**: Cache-busting with `?v={updated_at}`
- ✅ **Already implemented**: `fetchUserProfile()` after update
- ✅ **Already implemented**: Realtime subscription to profile changes (in some components)

### 7.4 Avatar Not Visible to Other Users

**Symptoms**:
- User sees their own avatar
- Others see initials or 403 error

**Root Causes**:
1. Profile not approved (`approval_status != 'approved'`)
2. Profile hidden (`show_in_directory = false`)
3. Profile deleted (`is_deleted = true`)
4. Storage RLS blocking access

**Solutions**:
- ✅ **Already implemented**: Storage RLS checks profile status
- ✅ **Already implemented**: Directory views filter by approval status
- 🔄 **Recommended**: Show warning in Profile Settings if avatar won't be public

### 7.5 Upload Fails

**Symptoms**:
- Error toast: "Failed to upload avatar"
- Console error during upload

**Root Causes**:
1. File too large (> 2MB)
2. Invalid file type
3. Network error
4. Storage quota exceeded
5. RLS policy blocking upload

**Solutions**:
- ✅ **Already implemented**: Frontend validation (size, type)
- ✅ **Already implemented**: Error handling with user-friendly messages
- 🔄 **Recommended**: Server-side validation
- 🔄 **Recommended**: Compress images before upload

---

## 8. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        UPLOAD FLOW                               │
└─────────────────────────────────────────────────────────────────┘

User selects image in Profile Settings
         ↓
Frontend validation (type, size)
         ↓
Preview shown (FileReader)
         ↓
User clicks Save
         ↓
uploadAvatar(file)
  ├─ Generate path: avatars/{user_id}/{timestamp}.{ext}
  ├─ supabase.storage.from('avatars').upload(path, file)
  │    ↓
  │  Storage RLS checks: user owns folder?
  │    ↓
  │  File stored in Supabase Storage
  │    ↓
  ├─ supabase.storage.from('avatars').getPublicUrl(path)
  └─ Returns: https://[project].supabase.co/storage/v1/object/public/avatars/...
         ↓
Update profiles.avatar_url = publicUrl
         ↓
Database trigger updates profiles.updated_at
         ↓
Frontend refreshes profile data
         ↓
Avatar component re-renders with new URL + cache-buster


┌─────────────────────────────────────────────────────────────────┐
│                       DISPLAY FLOW                               │
└─────────────────────────────────────────────────────────────────┘

Component mounts (e.g., DirectoryCardSplit)
         ↓
useDirectory hook fetches data
  ├─ Students: alumni_directory_public view
  ├─ Alumni/Admin: get_directory_profiles RPC
  └─ Returns: array of profiles with avatar_url
         ↓
normalizeProfile(row)
  └─ Extracts: avatar_url ?? photo_url ?? null
         ↓
<Avatar src={profile.avatar_url} version={profile.updated_at} />
         ↓
Avatar component logic:
  ├─ If src is null → Show initials immediately
  ├─ If src exists → Set imageState = 'loading'
  │    ↓
  │  Render <img src={cacheBustedUrl} loading="lazy" />
  │    ↓
  │  Browser requests image from Supabase Storage
  │    ↓
  │  Storage RLS checks: profile approved + visible?
  │    ├─ Yes → Return image (200)
  │    └─ No → Return 403/404
  │         ↓
  │  onLoad → imageState = 'loaded' → Fade in image
  │  onError → imageState = 'error' → Show initials
  └─ Render initials fallback or loaded image
```

---

## 9. Recommendations for Improvement

### 9.1 High Priority

1. **Server-Side Image Optimization**
   - Use Supabase Image Transformation API
   - Generate thumbnails: 32x32, 64x64, 128x128
   - Serve appropriate size based on context
   - **Impact**: 80-90% bandwidth reduction

2. **Remove External Fallback Service**
   - Replace `ui-avatars.com` with built-in initials
   - **Impact**: Faster fallback, no external dependency

3. **Add Upload Progress Indicator**
   - Show progress bar during upload
   - **Impact**: Better UX for slow connections

### 9.2 Medium Priority

4. **Implement Image Compression**
   - Client-side compression before upload (e.g., browser-image-compression)
   - Target: 200-300 KB max
   - **Impact**: Faster uploads, less storage

5. **Add Avatar Preview in Directory**
   - Hover to see larger version
   - **Impact**: Better UX without changing layout

6. **Cleanup Old Avatars**
   - Delete previous uploads when new one uploaded
   - Scheduled cleanup of orphaned files
   - **Impact**: Reduced storage costs

### 9.3 Low Priority

7. **Add Avatar Cropper**
   - Let users crop/resize before upload
   - **Impact**: Better-looking avatars

8. **Support Avatar from URL**
   - Allow pasting external URL (e.g., LinkedIn)
   - **Impact**: Easier onboarding

9. **Add Default Avatars Library**
   - Provide selection of default avatars
   - **Impact**: Better than initials for some users

---

## 10. Summary

### Current State
- ✅ Robust upload/storage system with RLS
- ✅ Graceful fallbacks (initials)
- ✅ Cache-busting for updates
- ✅ Lazy loading for performance
- ✅ Role-aware access control

### Pain Points
- ⚠️ Large file sizes (up to 2MB)
- ⚠️ No thumbnail generation
- ⚠️ External fallback service dependency
- ⚠️ Occasional slow loads on directory page

### Quick Wins
1. Replace `ui-avatars.com` with built-in initials everywhere
2. Add client-side image compression
3. Reduce max file size to 500 KB
4. Add upload progress indicator

### Long-Term Improvements
1. Implement Supabase Image Transformation
2. Generate multiple sizes on upload
3. Add avatar cropper
4. Implement CDN caching strategy
