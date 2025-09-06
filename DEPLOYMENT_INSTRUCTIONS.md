# Deployment Instructions

This document provides step-by-step instructions for deploying the recent fixes to the Supabase realtime subscriptions, Edge Functions, and SQL RPC fallback functions.

## 1. Deploy SQL Functions

The admin user deletion feature requires proper SQL functions to be deployed to your Supabase instance. Deploy these in the following order:

```bash
# Connect to your Supabase database and run the SQL files
psql YOUR_SUPABASE_DB_URL -f migrations/admin_delete_user_simplified_fallback.sql

# Only run this if admin_delete_user_fallback is needed as an additional fallback
# psql YOUR_SUPABASE_DB_URL -f migrations/admin_delete_user_fallback.sql
```

Alternatively, you can copy-paste the SQL content into the Supabase SQL Editor in the dashboard.

## 2. Deploy Edge Function

The Edge Function has been updated to properly handle CORS issues. Deploy it using the Supabase CLI:

```bash
# Navigate to the functions directory
cd supabase/functions

# Deploy the admin-delete-user function
supabase functions deploy admin-delete-user --project-ref YOUR_PROJECT_REF
```

**Important Note for Production:**
- Before deploying to production, set `const IS_DEV = false;` in the Edge Function to enforce stricter CORS policies.
- Update the `ALLOWED_ORIGINS` list to include all valid production domains.

## 3. Verify Deployments

After deployment, verify that both deletion methods work:

1. Test the Edge Function:
   - Use the admin interface to delete a test user.
   - Check browser console for successful CORS preflight and Edge Function response.

2. Test the SQL Fallback:
   - Temporarily disable the Edge Function (you can rename it locally) and try deleting a user.
   - The simplified SQL fallback should run successfully.

## 4. Troubleshooting

### Edge Function CORS Issues
- If you still encounter CORS issues, check:
  - The request origin matches an allowed origin
  - The preflight OPTIONS request returns HTTP 204
  - The response contains proper `Access-Control-Allow-*` headers

### SQL Fallback Issues
- If the SQL fallback fails with "relation does not exist" errors, verify:
  - The function was properly deployed to the database
  - Any referenced tables (like admin_actions) exist in the database
  - Function permissions are granted to authenticated users

## 5. Frontend Changes

The frontend code has been updated to:
- Fix toast.warning issues by using toast.custom
- Implement a multi-level fallback strategy for user deletion
- Handle various error scenarios with proper user feedback

No additional deployment steps are needed for the frontend changes if using the standard deployment process.
