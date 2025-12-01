# Batch/Graduation Year Consistency Implementation

## Overview
This document summarizes the comprehensive implementation of consistent batch/graduation year handling across the AMET Alumni application. The changes ensure that batch/graduation year information is:
- Always captured during registration
- Properly saved to the correct database columns based on user role
- Visible and editable in Profile Settings
- Consistently displayed across all UI components

## Implementation Date
November 29, 2024

## Changes Made

### 1. Centralized Utility Helper (`frontend/src/utils/batchYear.js`)

Created a new utility module with the following functions:

#### Core Functions:
- **`getProfileYearWriteFields(role, year)`**: Determines which database columns to write based on user role
  - Alumni → `graduation_year`
  - Student/Mentee → `expected_graduation_year`
  - Employer/Admin → `graduation_year` (optional)
  
- **`getEffectiveBatchYear(profile)`**: Extracts the effective batch year using COALESCE logic matching the backend view
  - Checks: `graduation_year` → `expected_graduation_year` → `batch_year` → `null`
  
- **`formatBatchLabel(year, fallback)`**: Formats year for display
  - Returns: `"Batch YYYY"` or custom fallback text
  
- **`validateBatchYear(year, role)`**: Validates year input with role-specific rules
  - Required for alumni and students
  - Optional for employers and admins
  - Range: 1970 to current year + 6
  - Alumni: cannot be future year
  - Students: can be future year
  
- **`getBatchYearLabel(role)`**: Returns appropriate field label based on role
- **`getBatchYearPlaceholder(role)`**: Returns contextual placeholder text
- **`generateYearOptions(role)`**: Generates dropdown options for year selection

### 2. Registration Flow Updates (`frontend/src/components/Auth/EnhancedRegister.js`)

#### Changes:
- **Imported centralized helpers** for validation and field mapping
- **Updated validation logic** (Step 2):
  - Alumni: Uses `validateBatchYear(formData.graduationYear, 'alumni')`
  - Students: Uses `validateBatchYear(formData.expectedGraduationYear, 'student')`
  - Replaced hardcoded validation with centralized helper
  
- **Updated Stage-2 payload** (auth.signUp):
  ```javascript
  const yearValue = selectedRole === 'student' 
    ? formData.expectedGraduationYear 
    : formData.graduationYear;
  const yearFields = getProfileYearWriteFields(selectedRole, yearValue);
  
  const stage2 = {
    ...yearFields, // Applies graduation_year and/or expected_graduation_year
    // ... other fields
  };
  ```
  
- **Updated profile upsert** (immediate session):
  - Uses same `getProfileYearWriteFields` helper
  - Ensures consistent column mapping for both signup paths

### 3. Profile Settings Updates (`frontend/src/components/Auth/Profile.js`)

#### Changes:
- **Added unified `batchYear` field** to formData state
  - Replaces separate handling of `graduation_year`, `expected_graduation_year`, and legacy `batch`
  
- **Form initialization**:
  ```javascript
  batchYear: getEffectiveBatchYear(cleanedProfile) || '',
  ```
  - Uses COALESCE logic to load from any source column
  
- **Validation on save**:
  ```javascript
  const role = getUserRole();
  const yearValidation = validateBatchYear(formData.batchYear, role);
  if (!yearValidation.isValid) {
    toast.error(yearValidation.error);
    return;
  }
  ```
  
- **Save logic**:
  ```javascript
  const userRole = getUserRole();
  const yearFields = getProfileYearWriteFields(userRole, formData.batchYear);
  
  const possibleFields = {
    ...yearFields, // Applies graduation_year and/or expected_graduation_year
    // ... other fields
  };
  ```
  
- **Edit mode UI**:
  - Replaced separate `graduation_year` and `expected_graduation_year` inputs
  - Added unified "Batch/Graduation Year" field with:
    - Role-appropriate label via `getBatchYearLabel(getUserRole())`
    - Role-appropriate placeholder via `getBatchYearPlaceholder(getUserRole())`
    - Required indicator for alumni and students
    - Helpful tooltip explaining the field
  
- **View mode UI**:
  ```javascript
  {hasValue(formData.batchYear) && (
    <p className="text-sm text-gray-600">{formatBatchLabel(formData.batchYear)}</p>
  )}
  ```

### 4. Read-Side UI Updates

All display components now use the centralized `formatBatchLabel` helper and COALESCE logic:

#### Updated Components:

**`frontend/src/components/Directory/DirectoryCardSplit.jsx`**:
```javascript
import { formatBatchLabel } from '../../utils/batchYear';

const batch = profile.graduation_year ?? profile.expected_graduation_year ?? 
              profile.batch_year ?? profile.batch ?? null;

{batch && (
  <p className="text-xs text-slate-500 mb-1">
    {formatBatchLabel(batch)}
  </p>
)}
```

**`frontend/src/components/Directory/AlumniProfile.js`**:
```javascript
import { formatBatchLabel } from '../../utils/batchYear';

graduationYear: data.graduation_year ?? data.expected_graduation_year ?? 
                data.batch_year ?? null,

const metaChips = [
  // ...
  alumnus.graduationYear ? formatBatchLabel(alumnus.graduationYear) : null,
  // ...
].filter(Boolean);
```

**`frontend/src/components/Directory/ProfileCard.jsx`**:
```javascript
import { formatBatchLabel } from '../../utils/batchYear';

{graduation_year && (
  <span className="inline-block mt-2 ...">
    {formatBatchLabel(graduation_year)}
  </span>
)}
```

**`frontend/src/components/AlumniProfileCard.jsx`**:
```javascript
import { formatBatchLabel } from '../../utils/batchYear';

const displayBatch = graduation_year ?? expected_graduation_year ?? 
                     batch_year ?? batch;

{displayBatch && (
  <span className="inline-block mt-2 ...">
    {formatBatchLabel(displayBatch)}
  </span>
)}
```

## Data Flow

### Write Flow (Registration & Profile Editing):
1. User enters year in appropriate field (graduation year or expected graduation year)
2. `validateBatchYear(year, role)` validates the input
3. `getProfileYearWriteFields(role, year)` determines which DB columns to write
4. Supabase update/insert writes to correct columns based on role:
   - Alumni: `graduation_year` set, `expected_graduation_year` cleared
   - Student: `expected_graduation_year` set, `graduation_year` cleared
   - Employer/Admin: `graduation_year` set (optional)

### Read Flow (All Display Components):
1. Backend view `public_profiles_view_v2` provides:
   ```sql
   COALESCE(
     p.graduation_year,
     p.expected_graduation_year,
     p.batch_year
   ) AS graduation_year
   ```
2. Frontend components use COALESCE logic for fallback:
   ```javascript
   const batch = profile.graduation_year ?? profile.expected_graduation_year ?? 
                 profile.batch_year ?? profile.batch ?? null;
   ```
3. `formatBatchLabel(batch)` formats for display: `"Batch YYYY"`

## Validation Rules

### Alumni:
- **Required**: Yes
- **Range**: 1970 to current year
- **Error**: "Graduation year cannot be in the future for alumni"

### Students:
- **Required**: Yes
- **Range**: 1970 to current year + 6
- **Error**: "Expected graduation year is required for students"

### Employers/Admins:
- **Required**: No
- **Range**: 1970 to current year + 6
- **Note**: Optional but encouraged

## Database Schema

### Relevant Columns in `public.profiles`:
- `graduation_year` (integer): Real graduation year for alumni
- `expected_graduation_year` (integer): Expected year for students
- `batch_year` (integer): Legacy/optional field
- `batch` (text): Legacy label field (not actively used)

### Backend View:
```sql
CREATE OR REPLACE VIEW public.public_profiles_view_v2 AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.current_location,
  p.company_name,
  COALESCE(
    p.graduation_year,
    p.expected_graduation_year,
    p.batch_year
  ) AS graduation_year
FROM public.profiles p
WHERE
  COALESCE(p.is_deleted, false) = false
  AND COALESCE(p.show_in_directory, true) = true
  AND COALESCE(p.approval_status::text, 'pending') = 'approved';
```

## Testing Scenarios

### 1. New Alumni Registration
- **Action**: Register as alumni, leave graduation year empty
- **Expected**: Form blocks with error "Graduation year is required for alumni"
- **Action**: Fill 2020
- **Expected**: Registration succeeds, DB has `graduation_year = 2020`
- **Verify**: Directory card shows "Batch 2020", Profile page shows "Batch 2020"

### 2. New Student Registration
- **Action**: Register as student, leave expected year empty
- **Expected**: Form blocks with error "Expected graduation year is required for students"
- **Action**: Fill 2025
- **Expected**: Registration succeeds, DB has `expected_graduation_year = 2025`
- **Verify**: Directory card shows "Batch 2025", Profile page shows "Batch 2025"

### 3. Admin Editing Profile
- **Action**: Admin changes Batch/Grad year in Profile Settings
- **Expected**: Validation passes, DB updates correct column
- **Verify**: All UIs show updated value

### 4. Existing User with Partial Data
- **Scenario**: User with only `expected_graduation_year = 2025` set
- **Expected**: 
  - Profile form pre-fills `batchYear = 2025`
  - Saving without changes preserves the value
  - All display components show "Batch 2025"

### 5. Avatar Regression Check
- **Verify**: Avatar still loads correctly from `avatar_url` in:
  - Directory cards
  - Profile page
  - Profile settings header

## Benefits

1. **Consistency**: Single source of truth for batch/year logic
2. **Maintainability**: Centralized validation and formatting
3. **Flexibility**: Handles role-specific requirements
4. **Robustness**: COALESCE logic ensures data is found from any source
5. **User Experience**: Clear labels, validation messages, and tooltips
6. **Data Integrity**: Proper column mapping prevents data loss or confusion

## Future Considerations

1. **Migration**: Consider migrating legacy `batch` and `batch_year` data to standard columns
2. **Admin Tools**: Add admin UI to bulk-update or migrate batch data
3. **Analytics**: Track batch year completion rates by role
4. **Validation**: Consider adding server-side validation in RLS or triggers

## Files Modified

### New Files:
- `frontend/src/utils/batchYear.js` (centralized utility)

### Modified Files:
- `frontend/src/components/Auth/EnhancedRegister.js`
- `frontend/src/components/Auth/Profile.js`
- `frontend/src/components/Directory/DirectoryCardSplit.jsx`
- `frontend/src/components/Directory/AlumniProfile.js`
- `frontend/src/components/Directory/ProfileCard.jsx`
- `frontend/src/components/AlumniProfileCard.jsx`

## Rollout Notes

- **No breaking changes**: Existing data remains compatible
- **Backward compatible**: COALESCE logic reads from all legacy fields
- **Immediate effect**: New registrations and edits use new logic
- **Gradual migration**: Existing users will see correct data via COALESCE
- **No RLS changes**: All changes are frontend + payload mapping only
