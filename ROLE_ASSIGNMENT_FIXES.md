# Role Assignment Fixes - AMET Alumni Portal

## Issues Identified

Our audit of the role assignment process in the AMET Alumni Portal revealed several issues:

1. **Metadata Key Inconsistency**: The frontend sent `role` but the database trigger looked for `user_type` first, potentially causing role mismatches.

2. **Double Role Setting**: Roles were being set in two places:
   - In the auth metadata during signup
   - Directly in the profiles table via INSERT

3. **Potentially Problematic Default**: The database defaulted to 'alumni' role if no role was specified.

## Changes Made

### 1. Frontend Changes (EnhancedRegister.js)

- Standardized on the `role` metadata key in authentication
- Removed duplicate role setting from profile data insert
- Added enhanced logging to verify role assignment
- Added role verification check after profile creation

```javascript
// Before
const { data: authData, error: signUpError } = await signUpWithEmail(
  formData.email,
  formData.password,
  {
    full_name: `${formData.firstName} ${formData.lastName}`.trim(),
    role: formData.primaryRole,
  }
);

// After - Added logging and verification
const { data: authData, error: signUpError } = await signUpWithEmail(
  formData.email,
  formData.password,
  {
    full_name: `${formData.firstName} ${formData.lastName}`.trim(),
    role: formData.primaryRole,
  }
);

console.log('Registration metadata sent:', {
  role: formData.primaryRole,
  fullName: `${formData.firstName} ${formData.lastName}`.trim()
});

// Profile data with role removed - now set by DB trigger
const profileData = {
  id: authData.user.id,
  full_name: `${formData.firstName} ${formData.lastName}`.trim(),
  email: formData.email,
  phone: formData.phone.trim() || null,
  // role field removed - will be set by DB trigger from auth metadata
  ...
}
```

### 2. Database Trigger Changes

Updated both `create_profile_on_signup.sql` and `add_company_id_to_profiles.sql` to:

- Use only the `role` metadata key (removing `user_type` check)
- Change default role from 'alumni' to more neutral 'user'
- Add clarifying comments

```sql
-- Before
COALESCE(NEW.raw_user_meta_data ->> 'user_type', NEW.raw_user_meta_data ->> 'role', 'alumni')

-- After
-- Standardized to use only 'role' metadata key, with 'user' as safer default
COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
```

## Testing & Verification

The changes add several verification mechanisms:

1. **Console Logging**: Registration now logs metadata sent to Supabase Auth
2. **Error Debugging**: Enhanced error logging for failed profile creation
3. **Role Verification**: Explicit check after registration to confirm role was properly set

## Next Steps

After deploying these changes:

1. Monitor the console logs during new user registrations
2. Verify that roles are being correctly assigned based on the registration form
3. If any issues persist, the enhanced logging will provide better diagnostics

---

**Note**: The database changes (`create_profile_on_signup.sql` and `add_company_id_to_profiles.sql`) will need to be applied to your Supabase instance. You may need to run these SQL scripts in the Supabase SQL Editor or update them through your deployment process.
