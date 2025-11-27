# Student Profile Fields - Complete Analysis

## Overview
This document provides a comprehensive breakdown of all profile fields available to a **student** user in the Profile Settings page, including image settings, personal information, academic details, professional information, and social links.

---

## Table of Contents
1. [Profile Image Settings](#1-profile-image-settings)
2. [Personal Information Fields](#2-personal-information-fields)
3. [Academic Information Fields](#3-academic-information-fields)
4. [Professional Information Fields](#4-professional-information-fields)
5. [Skills & Achievements](#5-skills--achievements)
6. [Social Links](#6-social-links)
7. [Resume Management](#7-resume-management)
8. [Database Schema Mapping](#8-database-schema-mapping)
9. [Field Validation Rules](#9-field-validation-rules)
10. [Student-Specific Differences](#10-student-specific-differences)

---

## 1. Profile Image Settings

### Avatar/Profile Picture

**Location**: Top of profile page, circular image with camera icon overlay when editing

**Field Details**:
- **Database Column**: `profiles.avatar_url` (TEXT)
- **Storage Location**: Supabase Storage bucket `avatars/{user_id}/{timestamp}.{ext}`
- **Display Size**: 128px × 128px (rounded-full)
- **Edit Control**: Camera icon button overlay in edit mode

**Upload Specifications**:
```javascript
// File Type Validation
const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// File Size Validation
const maxSize = 2 * 1024 * 1024; // 2MB maximum

// Upload Path Structure
const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;
```

**Features**:
- ✅ Real-time preview on file selection
- ✅ Client-side validation (type, size)
- ✅ Automatic fallback to `/default-avatar.svg` on error
- ✅ Cache-busting with `?v={updated_at}` parameter
- ✅ Lazy loading for performance

**Error Handling**:
- Invalid file type → Toast error: "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
- File too large → Toast error: "Image size should be less than 2MB"
- Upload failure → Toast error: "Failed to upload avatar: {error message}"

**Code Reference**:
```jsx
// Profile.js lines 471-491
const handleImageChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
    return;
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    toast.error('Image size should be less than 2MB');
    return;
  }

  setImageFile(file);
  setImageUrl(URL.createObjectURL(file)); // Preview
};
```

---

## 2. Personal Information Fields

### Section: "Personal Information"
**Card**: Glass card with border-bottom heading

### 2.1 First Name
- **Field Name**: `first_name`
- **Database Column**: `profiles.first_name` (TEXT)
- **Input Type**: Text
- **Required**: ✅ Yes
- **Validation**: 
  - Must not be empty
  - Length: 1-100 characters (trimmed)
  - Database constraint: `chk_first_name_fmt`
- **Placeholder**: None
- **Grid Position**: Left column (1 of 2)

### 2.2 Last Name
- **Field Name**: `last_name`
- **Database Column**: `profiles.last_name` (TEXT)
- **Input Type**: Text
- **Required**: ✅ Yes
- **Validation**: 
  - Must not be empty
  - Length: 1-100 characters (trimmed)
  - Database constraint: `chk_last_name_fmt`
- **Placeholder**: None
- **Grid Position**: Right column (2 of 2)

### 2.3 Email
- **Field Name**: `email`
- **Database Column**: `profiles.email` (TEXT, NOT NULL)
- **Input Type**: Email
- **Required**: ✅ Yes
- **Editable**: ❌ No (disabled, grey background)
- **Validation**: 
  - Must be valid email format
  - Must be lowercase
  - Cannot end with `.co` (database constraint)
  - Pattern: `/\S+@\S+\.\S+/`
- **Placeholder**: None
- **Grid Position**: Left column (1 of 2)
- **Note**: Email is read-only; users cannot change it in profile settings

### 2.4 Phone
- **Field Name**: `phone`
- **Database Column**: `profiles.phone` (TEXT)
- **Input Type**: Tel
- **Required**: ❌ No (optional)
- **Validation**: 
  - E.164 format: `^\+?[0-9]{7,15}$`
  - Auto-normalized on blur
  - Database constraint: `chk_phone_e164`
- **Placeholder**: "+1 (555) 123-4567"
- **Grid Position**: Right column (2 of 2)
- **Normalization Logic**:
```javascript
// Profile.js lines 26-34
const normalizePhone = (raw) => {
  const input = (raw ?? '').trim();
  if (!input) return null; // empty -> NULL
  const hasPlus = input.startsWith('+');
  const digits = input.replace(/[^0-9]/g, '');
  const normalized = hasPlus ? `+${digits}` : digits;
  const isValid = /^\+?\d{7,15}$/.test(normalized);
  return isValid ? normalized : { error: 'Please enter a valid phone...' };
};
```

### 2.5 Location
- **Field Name**: `location`
- **Database Column**: `profiles.location` (TEXT)
- **Input Type**: Text
- **Required**: ❌ No
- **Validation**: None
- **Placeholder**: "City, Country"
- **Grid Position**: Left column (1 of 2)

### 2.6 Date of Birth
- **Field Name**: `date_of_birth`
- **Database Column**: `profiles.date_of_birth` (DATE)
- **Input Type**: Date
- **Required**: ❌ No
- **Validation**: None (browser date picker handles format)
- **Placeholder**: None
- **Grid Position**: Right column (2 of 2)
- **Display Format** (view mode): "Month Day, Year" (e.g., "January 15, 1998")

### 2.7 About Me
- **Field Name**: `about`
- **Database Column**: `profiles.about` (TEXT)
- **Input Type**: Textarea
- **Required**: ❌ No
- **Rows**: 4
- **Validation**: None
- **Placeholder**: "Tell us about yourself, your experience, and interests..."
- **Grid Position**: Full width (spans both columns)
- **Note**: This is the main bio/description field

---

## 3. Academic Information Fields

### Section: "Personal Information" (continued)
**Note**: Academic fields are embedded in the Personal Information section

### 3.1 Expected Graduation Year
- **Field Name**: `expected_graduation_year`
- **Database Column**: `profiles.expected_graduation_year` (INTEGER)
- **Input Type**: Number
- **Required**: ❌ No
- **Validation**: 
  - Min: 1900
  - Max: Current year + 10
  - Database constraint: `chk_profiles_expected_grad_year_range` (1900-2100)
- **Placeholder**: "Enter your expected graduation year (e.g. 2026)"
- **Grid Position**: Full width
- **Student-Specific**: ✅ Yes (only shown to students, not alumni)
- **Code Reference**:
```jsx
// Profile.js lines 1121-1142
{isStudent && (
  <div className="space-y-2">
    <label>Expected Graduation Year</label>
    <input
      type="number"
      name="expected_graduation_year"
      value={formData.expected_graduation_year || ''}
      min="1900"
      max={new Date().getFullYear() + 10}
      placeholder="Enter your expected graduation year (e.g. 2026)"
    />
  </div>
)}
```

### 3.2 Degree Program
- **Field Name**: `degree_code`
- **Database Column**: `profiles.degree_code` (TEXT, FK to `degrees.code`)
- **Input Type**: Custom Select Component (`DegreeSelect`)
- **Required**: ✅ Yes
- **Validation**: 
  - Must be a valid degree code from `degrees` table
  - Validated via `useAcademicsCatalog` hook
- **Options**: Loaded from `degrees` table (e.g., "B.E.", "M.E.", "B.Tech", etc.)
- **Grid Position**: Full width
- **Behavior**: Changing degree clears department selection
- **Not Shown For**: Employers

**Component**:
```jsx
// Profile.js lines 1145-1151
<DegreeSelect
  value={formData.degree_code || ''}
  onChange={(v) => setFormData(prev => ({ 
    ...prev, 
    degree_code: v, 
    department_id: '' // Clear department when degree changes
  }))}
  required
/>
```

### 3.3 Department
- **Field Name**: `department_id`
- **Database Column**: `profiles.department_id` (UUID, FK to `departments.id`)
- **Input Type**: Custom Select Component (`DepartmentSelect`)
- **Required**: ✅ Yes
- **Validation**: 
  - Must be a valid department ID for the selected degree
  - Validated via `useAcademicsCatalog` hook
- **Options**: Loaded from `departments` table, filtered by `degree_code`
- **Grid Position**: Full width
- **Disabled**: When no degree is selected
- **Not Shown For**: Employers

**Component**:
```jsx
// Profile.js lines 1152-1160
<DepartmentSelect
  degreeCode={formData.degree_code || ''}
  value={formData.department_id || ''}
  onChange={(v) => setFormData(prev => ({ ...prev, department_id: v }))}
  required
  disabled={!formData.degree_code}
/>
```

### 3.4 Student ID
- **Field Name**: `student_id`
- **Database Column**: `profiles.student_id` (TEXT)
- **Input Type**: Text
- **Required**: ❌ No (explicitly marked as optional)
- **Validation**: None
- **Placeholder**: "Enter your student ID for verification (optional)"
- **Grid Position**: Full width
- **Label**: "Student ID <span>(optional)</span>"
- **Purpose**: For verification purposes

---

## 4. Professional Information Fields

### Section: "Professional Information"
**Card**: Separate glass card with border-bottom heading

### 4.1 Company
- **Field Name**: `company`
- **Database Column**: `profiles.company_name` (TEXT)
- **Input Type**: Text
- **Required**: ❌ No
- **Validation**: None
- **Placeholder**: None
- **Grid Position**: Left column (1 of 2)
- **Note**: Maps to `company_name` in database but displayed as "Company" in UI
- **Backend Mapping**:
```javascript
// Profile.js line 295
company: cleanedProfile.company_name || initialCompany
```

### 4.2 Position
- **Field Name**: `position`
- **Database Column**: `profiles.current_job_title` (TEXT)
- **Input Type**: Text
- **Required**: ❌ No
- **Validation**: None
- **Placeholder**: None
- **Grid Position**: Right column (2 of 2)
- **Note**: Maps to `current_job_title` in database but displayed as "Position" in UI
- **Backend Mapping**:
```javascript
// Profile.js line 296
position: cleanedProfile.current_job_title || ''
```

### 4.3 Experience
- **Field Name**: `experience`
- **Database Column**: `profiles.experience` (TEXT)
- **Input Type**: Text
- **Required**: ❌ No
- **Validation**: None
- **Placeholder**: "e.g., 10+ years in marine engineering"
- **Grid Position**: Left column (1 of 2)
- **Note**: Free-text field for describing years/type of experience

### 4.4 Professional Headline
- **Field Name**: `headline`
- **Database Column**: `profiles.headline` (TEXT)
- **Input Type**: Text
- **Required**: ❌ No
- **Validation**: None
- **Placeholder**: "e.g., Senior Marine Engineer at Ocean Shipping Ltd."
- **Grid Position**: Right column (2 of 2)
- **Display**: Shown under name in profile header (ocean-600 color)

### 4.5 Skills
- **Field Name**: `skills`
- **Database Column**: `profiles.skills` (JSONB, array)
- **Input Type**: Custom tokenized input (chip-based)
- **Required**: ❌ No
- **Validation**: 
  - Must be array type (database constraint: `ck_profiles_skills_array`)
  - Stored as JSON array
- **Placeholder**: "Type a skill and press Enter"
- **Grid Position**: Full width
- **Behavior**: 
  - Enter or comma adds skill
  - Backspace on empty input removes last skill
  - Duplicate prevention (uses Set)
  - Display as colored chips with remove button

**Code Reference**:
```jsx
// Profile.js lines 1237-1258
<div className="flex flex-wrap gap-2">
  {(formData.skills || []).map((skill, idx) => (
    <span key={`${skill}-${idx}`} className="inline-flex items-center bg-ocean-100 text-ocean-800 px-2 py-1 rounded-full text-xs">
      {skill}
      <button type="button" onClick={() => removeSkill(skill)}>×</button>
    </span>
  ))}
  <input
    type="text"
    value={skillInput}
    onChange={(e) => setSkillInput(e.target.value)}
    onKeyDown={handleSkillKeyDown}
    placeholder="Type a skill and press Enter"
  />
</div>
```

### 4.6 Achievements
- **Field Name**: `achievements`
- **Database Column**: `profiles.achievements` (JSONB, array of objects)
- **Input Type**: Dynamic list of title + description pairs
- **Required**: ❌ No
- **Validation**: 
  - Must be array type (database constraint: `ck_profiles_achievements_array`)
  - Empty achievements are filtered out on save
  - Each achievement must have a title (description optional)
- **Structure**:
```javascript
{
  title: string,      // Required
  description: string // Optional
}
```
- **Grid Position**: Full width
- **Behavior**: 
  - "+ Add Achievement" button adds new entry
  - Each entry has remove button (X icon)
  - Title field: "Achievement Title (e.g., Employee of the Month)"
  - Description field: "Description (optional)", 2 rows

**Code Reference**:
```jsx
// Profile.js lines 1260-1296
<div className="space-y-3">
  {Array.isArray(formData.achievements) && formData.achievements.map((achievement, index) => (
    <div key={index} className="p-3 border rounded-md bg-gray-50 relative space-y-2">
      <input
        type="text"
        placeholder="Achievement Title (e.g., Employee of the Month)"
        value={achievement.title || ''}
        onChange={(e) => handleAchievementChange(index, 'title', e.target.value)}
      />
      <textarea
        placeholder="Description (optional)"
        rows={2}
        value={achievement.description || ''}
        onChange={(e) => handleAchievementChange(index, 'description', e.target.value)}
      />
      <button onClick={() => handleRemoveAchievement(index)}>
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  ))}
</div>
<button onClick={handleAddAchievement}>+ Add Achievement</button>
```

---

## 5. Skills & Achievements

**Note**: Skills and Achievements are part of the Professional Information section in edit mode, but displayed in a separate card in view mode.

### View Mode Display

**Section**: "Skills & Achievements"
**Card**: Separate glass card, only shown if skills or achievements exist
**Layout**: 2-column grid

**Skills Display**:
- Heading: "Skills"
- Display: Colored chips (bg-ocean-100, text-ocean-800)
- Layout: Flex wrap with gap

**Achievements Display**:
- Heading: "Achievements"
- Display: Border-left accent (border-ocean-500)
- Structure: Title (bold) + Description (smaller text)
- Layout: Vertical stack with spacing

---

## 6. Social Links

### Section: "Social Links"
**Card**: Separate glass card with border-bottom heading

### 6.1 LinkedIn
- **Field Name**: `socialLinks.linkedin`
- **Database Table**: `social_links` (separate table)
- **Database Column**: `social_links.linkedin_url` (TEXT)
- **Input Type**: URL
- **Required**: ❌ No
- **Validation**: 
  - Must match pattern: `^https://(www\.)?linkedin\.com/(in|pub|company|school)/.+`
  - Database constraint: `ck_profiles_linkedin_url_pattern`
  - Auto-normalized to add `https://` if missing
- **Placeholder**: "https://linkedin.com/in/yourname"
- **Helper Text**: "Use https://linkedin.com/in/... (no www)."
- **Grid Position**: Left column (1 of 2)

### 6.2 GitHub
- **Field Name**: `socialLinks.github`
- **Database Table**: `social_links`
- **Database Column**: `social_links.github_url` (TEXT)
- **Input Type**: URL
- **Required**: ❌ No
- **Validation**: 
  - Custom validation via `validateGitHub` function
  - Auto-normalized to add `https://` if missing
- **Placeholder**: "https://github.com/yourname"
- **Grid Position**: Right column (2 of 2)

### 6.3 Twitter/X
- **Field Name**: `socialLinks.twitter`
- **Database Table**: `social_links`
- **Database Column**: `social_links.x_url` (TEXT)
- **Input Type**: URL
- **Required**: ❌ No
- **Validation**: 
  - Custom validation via `validateX` function
  - Auto-normalized to add `https://` if missing
- **Placeholder**: "https://twitter.com/yourname"
- **Grid Position**: Left column (1 of 2)
- **Note**: UI uses "twitter" but database stores as "x_url"

### 6.4 Personal Website
- **Field Name**: `socialLinks.website`
- **Database Table**: `social_links`
- **Database Column**: `social_links.website_url` (TEXT)
- **Input Type**: URL
- **Required**: ❌ No
- **Validation**: 
  - Custom validation via `validateWebsite` function
  - Auto-normalized to add `https://` if missing
- **Placeholder**: "https://yourwebsite.com"
- **Grid Position**: Right column (2 of 2)

### Social Links Storage

**Important**: Social links are stored in a **separate table** (`social_links`), not in the `profiles` table.

**Loading**:
```javascript
// Profile.js lines 355-366
const links = await loadProfileSocialLinks(user.id);
formDataInitial.socialLinks = {
  linkedin: links.linkedin || '',
  github: links.github || '',
  twitter: links.x || '',      // Map X -> twitter for UI
  website: links.website || '',
};
```

**Saving**:
```javascript
// Profile.js (in handleSubmit)
await saveProfileSocialLinks(user.id, {
  linkedin: formData.socialLinks.linkedin,
  github: formData.socialLinks.github,
  x: formData.socialLinks.twitter,  // Map twitter -> X for DB
  website: formData.socialLinks.website,
});
```

### URL Normalization

All social links are automatically normalized to ensure proper format:

```javascript
// Profile.js lines 37-42
const normalizeUrl = (value) => {
  if (!value) return '';
  const stripped = String(value).replace(/^[a-z]+:\/*/i, '');
  if (stripped.trim() === '') return '';
  return `https://${stripped}`;
};
```

**Example**:
- Input: `linkedin.com/in/johndoe`
- Normalized: `https://linkedin.com/in/johndoe`

---

## 7. Resume Management

### Section: "Resume Management"
**Component**: `<ProfileResume />`
**Location**: Bottom of profile page (view mode only)
**Note**: This is a separate component that handles resume upload/download

**Features**:
- Upload resume (PDF, DOC, DOCX)
- View current resume
- Download resume
- Delete resume

**Database Column**: `profiles.resume_url` (TEXT)

---

## 8. Database Schema Mapping

### Complete Field Mapping Table

| UI Field Name | Form Data Key | Database Column | Database Type | Table | Required | Notes |
|---------------|---------------|-----------------|---------------|-------|----------|-------|
| Profile Picture | imageFile | avatar_url | TEXT | profiles | No | Stored in Supabase Storage |
| First Name | first_name | first_name | TEXT | profiles | Yes | 1-100 chars |
| Last Name | last_name | last_name | TEXT | profiles | Yes | 1-100 chars |
| Email | email | email | TEXT | profiles | Yes | Read-only, lowercase |
| Phone | phone | phone | TEXT | profiles | No | E.164 format |
| Location | location | location | TEXT | profiles | No | Free text |
| Date of Birth | date_of_birth | date_of_birth | DATE | profiles | No | Date picker |
| About Me | about | about | TEXT | profiles | No | Textarea |
| Expected Graduation Year | expected_graduation_year | expected_graduation_year | INTEGER | profiles | No | Student only |
| Degree Program | degree_code | degree_code | TEXT | profiles | Yes | FK to degrees |
| Department | department_id | department_id | UUID | profiles | Yes | FK to departments |
| Student ID | student_id | student_id | TEXT | profiles | No | Optional |
| Company | company | company_name | TEXT | profiles | No | - |
| Position | position | current_job_title | TEXT | profiles | No | - |
| Experience | experience | experience | TEXT | profiles | No | Free text |
| Professional Headline | headline | headline | TEXT | profiles | No | - |
| Skills | skills | skills | JSONB | profiles | No | Array of strings |
| Achievements | achievements | achievements | JSONB | profiles | No | Array of objects |
| LinkedIn | socialLinks.linkedin | linkedin_url | TEXT | social_links | No | Separate table |
| GitHub | socialLinks.github | github_url | TEXT | social_links | No | Separate table |
| Twitter/X | socialLinks.twitter | x_url | TEXT | social_links | No | Separate table |
| Website | socialLinks.website | website_url | TEXT | social_links | No | Separate table |
| Resume | (file upload) | resume_url | TEXT | profiles | No | Via ProfileResume component |

### Additional Profile Columns (Not in Form)

These columns exist in the `profiles` table but are **not editable** in the profile settings form:

| Column | Type | Purpose | Set By |
|--------|------|---------|--------|
| id | UUID | Primary key | System (auth.users.id) |
| created_at | TIMESTAMP | Account creation | System |
| updated_at | TIMESTAMP | Last update | System (trigger) |
| role | app_role_enum | User role | System/Admin |
| approval_status | profile_approval_status | Approval state | Admin |
| is_approved | BOOLEAN | Approved flag | Admin |
| is_deleted | BOOLEAN | Soft delete | Admin |
| is_active | BOOLEAN | Active status | System |
| show_in_directory | BOOLEAN | Directory visibility | User (separate setting) |
| is_employer | BOOLEAN | Employer flag | System |
| is_admin | BOOLEAN | Admin flag | System |
| verified | BOOLEAN | Verification status | Admin |
| full_name | TEXT | Computed name | Trigger (from first + last) |
| graduation_year | INTEGER | Actual grad year | Alumni only |
| batch | TEXT | Batch identifier | System |

---

## 9. Field Validation Rules

### Client-Side Validation

**Form Submission** (`validateForm` function):
```javascript
// Profile.js lines 222-255
const validateForm = () => {
  const errors = {};
  
  // First name required
  if (!formData.first_name) {
    errors.first_name = 'First name is required';
  }
  
  // Last name required
  if (!formData.last_name) {
    errors.last_name = 'Last name is required';
  }
  
  // Email required and valid format
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email is invalid';
  }
  
  // Filter out empty achievements
  if (Array.isArray(formData.achievements)) {
    const validAchievements = formData.achievements.filter(achievement => 
      achievement && typeof achievement === 'object' && 
      achievement.title && achievement.title.trim() !== ''
    );
    formData.achievements = validAchievements;
  }
  
  return Object.keys(errors).length === 0;
};
```

### Database Constraints

**From `profiles` table schema**:

1. **Email Constraints**:
   - `chk_email_lower`: Must be lowercase
   - `chk_email_not_co`: Cannot end with `.co`
   - Pattern: Valid email format

2. **Name Constraints**:
   - `chk_first_name_fmt`: 1-100 characters (trimmed)
   - `chk_last_name_fmt`: 1-100 characters (trimmed)

3. **Phone Constraint**:
   - `chk_phone_e164`: Must match `^\+?[0-9]{7,15}$`

4. **LinkedIn Constraint**:
   - `ck_profiles_linkedin_url_pattern`: Must match LinkedIn URL pattern

5. **JSONB Constraints**:
   - `ck_profiles_skills_array`: Skills must be array type
   - `ck_profiles_achievements_array`: Achievements must be array type
   - `ck_profiles_interests_array`: Interests must be array type
   - `ck_profiles_social_links_object`: Social links must be object type

6. **Year Constraint**:
   - `chk_profiles_expected_grad_year_range`: 1900-2100

7. **Approval Consistency**:
   - `ck_profiles_is_approved_consistent`: `is_approved` must match `approval_status = 'approved'`

### Social Links Validation

**Validation Functions** (from `socialLinks.validation.js`):

```javascript
// LinkedIn
export const validateLinkedIn = (url) => {
  const pattern = /^https:\/\/(www\.)?linkedin\.com\/(in|pub|company|school)\/.+/;
  return pattern.test(url);
};

// GitHub
export const validateGitHub = (url) => {
  const pattern = /^https:\/\/(www\.)?github\.com\/.+/;
  return pattern.test(url);
};

// X/Twitter
export const validateX = (url) => {
  const pattern = /^https:\/\/(www\.)?(twitter|x)\.com\/.+/;
  return pattern.test(url);
};

// Website
export const validateWebsite = (url) => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};
```

---

## 10. Student-Specific Differences

### Fields Only Shown to Students

1. **Expected Graduation Year**
   - Replaces "Graduation Year" field (shown to alumni)
   - Max value: Current year + 10
   - Placeholder: "Enter your expected graduation year (e.g. 2026)"

### Fields Hidden from Students

None. Students have access to all the same fields as alumni, with the exception of the graduation year field being replaced by expected graduation year.

### Role Detection

```javascript
// Profile.js lines 106-107
const isEmployer = getUserRole() === 'employer';
const isStudent = getUserRole() === 'student';
```

### Conditional Rendering

```jsx
// Graduation Year (Alumni)
{!isStudent && (
  <div className="space-y-2">
    <label>Graduation Year</label>
    <input type="number" name="graduation_year" ... />
  </div>
)}

// Expected Graduation Year (Students)
{isStudent && (
  <div className="space-y-2">
    <label>Expected Graduation Year</label>
    <input type="number" name="expected_graduation_year" ... />
  </div>
)}

// Academic Fields (Not for Employers)
{!isEmployer && (
  <>
    <DegreeSelect ... />
    <DepartmentSelect ... />
  </>
)}
```

---

## 11. Profile Completeness

### Computed Field: `is_profile_complete`

**Database Column**: `profiles.is_profile_complete` (BOOLEAN, GENERATED)

**Calculation**:
```sql
-- Dumps.sql line 682
is_profile_complete GENERATED ALWAYS AS (
  (email IS NOT NULL) AND 
  (first_name IS NOT NULL) AND 
  (last_name IS NOT NULL) AND 
  (graduation_year IS NOT NULL) AND 
  (degree_program IS NOT NULL) AND 
  (current_job_title IS NOT NULL) AND 
  (company_name IS NOT NULL) AND 
  (avatar_url IS NOT NULL)
) STORED
```

**Required for Complete Profile**:
1. ✅ Email (always present)
2. ✅ First Name
3. ✅ Last Name
4. ✅ Graduation Year (or Expected Graduation Year for students)
5. ✅ Degree Program (degree_code)
6. ✅ Current Job Title (position)
7. ✅ Company Name (company)
8. ✅ Avatar URL (profile picture)

**Note**: This is a **generated column** that automatically updates when any of these fields change.

---

## 12. Save Flow

### Form Submission Process

**Step-by-Step**:

1. **User clicks "Save Changes"**
   - `handleSubmit` function triggered
   - Prevents default form submission

2. **Validation**
   - Client-side validation via `validateForm()`
   - Checks required fields
   - Filters empty achievements

3. **Avatar Upload** (if new image selected)
   ```javascript
   if (imageFile) {
     const publicUrl = await uploadAvatar(imageFile);
     profileUpdates.avatar_url = publicUrl;
   }
   ```

4. **Prepare Profile Updates**
   ```javascript
   const profileUpdates = {
     first_name: formData.first_name,
     last_name: formData.last_name,
     phone: normalizePhone(formData.phone),
     location: formData.location,
     headline: formData.headline,
     about: formData.about,
     company_name: formData.company,
     current_job_title: formData.position,
     experience: formData.experience,
     degree_code: formData.degree_code,
     department_id: formData.department_id,
     expected_graduation_year: formData.expected_graduation_year,
     student_id: formData.student_id,
     date_of_birth: formData.date_of_birth,
     skills: formData.skills,
     achievements: formData.achievements,
     // ... other fields
   };
   ```

5. **Update Profiles Table**
   ```javascript
   const { error } = await supabase
     .from('profiles')
     .update(profileUpdates)
     .eq('id', user.id);
   ```

6. **Update Social Links** (separate table)
   ```javascript
   await saveProfileSocialLinks(user.id, {
     linkedin: formData.socialLinks.linkedin,
     github: formData.socialLinks.github,
     x: formData.socialLinks.twitter,
     website: formData.socialLinks.website,
   });
   ```

7. **Refresh Profile Data**
   ```javascript
   await fetchUserProfile();
   ```

8. **Success Feedback**
   - Toast notification: "Profile updated successfully!"
   - Exit edit mode
   - Display updated profile

### Error Handling

**Upload Errors**:
- Avatar upload fails → Toast error with message
- Profile update fails → Toast error with message
- Social links update fails → Logged but not blocking

**Validation Errors**:
- Required fields missing → Inline error messages
- Invalid format → Toast error before submission

---

## 13. View Mode Display

### Profile Header

**Layout**: Flex row with avatar and info

**Displayed**:
- Avatar (128px circular)
- Full Name (first_name + last_name, text-2xl bold)
- Professional Headline (headline, text-ocean-600)
- Degree + Department (if present, text-sm gray)
- Approval Status Badge (colored pill)

**Buttons**:
- "Reset Password" (navigates to `/update-password`)
- "Edit Profile" (toggles edit mode)

### About Section

**Condition**: Only shown if `about` has value
**Display**: Full-width card with paragraph text

### Professional Information Section

**Condition**: Only shown if any professional field has value
**Layout**: 2-column grid

**Left Column**:
- Position + Company (with BriefcaseIcon)
- Degree + Department (with AcademicCapIcon)
- Experience (if present)

**Right Column**:
- Contact Information
  - Email (with EnvelopeIcon)
  - Phone (with PhoneIcon, clickable tel: link)
  - Location (with MapPinIcon)
  - Date of Birth (with calendar icon)

### Skills & Achievements Section

**Condition**: Only shown if skills or achievements exist
**Layout**: 2-column grid

**Skills**:
- Colored chips (bg-ocean-100)
- Flex wrap layout

**Achievements**:
- Border-left accent
- Title (bold) + Description
- Vertical stack

### Social Links Section

**Condition**: Only shown if any social link exists
**Layout**: 2-column grid

**Display**:
- Platform name (capitalized, bold)
- URL (clickable link, truncated)
- Opens in new tab (target="_blank")

### Resume Management

**Component**: `<ProfileResume />`
**Always Shown**: Yes (in view mode)

---

## 14. Unsaved Changes Protection

### Features

1. **Browser Unload Warning**
   - Warns user before closing tab/window
   - Only if in edit mode with unsaved changes

2. **In-App Navigation Warning**
   - Intercepts anchor clicks
   - Confirms before navigating away
   - Only for same-origin links

3. **Browser Back Button**
   - Intercepts popstate event
   - Confirms before going back
   - Pushes current URL back if user cancels

### Implementation

```javascript
// Profile.js lines 391-453
useEffect(() => {
  const handleBeforeUnload = (e) => {
    const hasUnsaved = isEditing && 
      JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
    if (hasUnsaved) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isEditing, formData]);
```

---

## 15. Summary

### Total Fields Available to Students

**Editable Fields**: 24
- 1 Image field (avatar)
- 6 Personal information fields
- 4 Academic fields (including expected graduation year)
- 4 Professional fields
- 2 Skills/Achievements fields (dynamic arrays)
- 4 Social links
- 1 Resume (via separate component)
- 2 Additional fields (about, student ID)

**Read-Only Fields**: 1
- Email

**System Fields** (not shown in form): 15+
- ID, timestamps, role, approval status, etc.

### Required Fields for Students

**Minimum Required**:
1. First Name ✅
2. Last Name ✅
3. Email ✅ (auto-populated, read-only)
4. Degree Program ✅
5. Department ✅

**For Complete Profile** (additional):
6. Avatar ✅
7. Expected Graduation Year ✅
8. Position ✅
9. Company ✅

### Optional Fields

All other fields are optional and can be left empty.

---

## 16. Code References

### Key Files

1. **Frontend**:
   - `/frontend/src/components/Auth/Profile.js` (main component, 1549 lines)
   - `/frontend/src/components/Auth/ProfileResume.jsx` (resume management)
   - `/frontend/src/components/academics/DegreeSelect.jsx` (degree selector)
   - `/frontend/src/components/academics/DepartmentSelect.jsx` (department selector)
   - `/frontend/src/services/socialLinks.js` (social links CRUD)
   - `/frontend/src/services/socialLinks.validation.js` (validation functions)
   - `/frontend/src/hooks/useAcademicsCatalog.js` (degree/department data)

2. **Backend**:
   - `/Dumps.sql` (lines 608-757: profiles table schema)
   - `/supabase/migrations/*.sql` (various migrations)

### Key Functions

- `handleSubmit` (lines 494-799): Main save logic
- `uploadAvatar` (lines 901-936): Avatar upload
- `validateForm` (lines 222-255): Client validation
- `normalizePhone` (lines 26-34): Phone normalization
- `normalizeUrl` (lines 37-42): URL normalization
- `handleImageChange` (lines 471-491): Image upload validation

---

## End of Document

This comprehensive analysis covers every field, validation rule, database mapping, and behavior for student profiles in the AMETNEW application.
