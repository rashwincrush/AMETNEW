# Hotfix: ApplicationTracking.js - source_type Column Error

## Problem
```
GET …/rest/v1/job_applications?...&jobs.source_type=eq.in_app… → 400
PostgREST error: column jobs_1.source_type does not exist
```

**Root cause**: `source_type` is a computed column on the view `v_jobs_public` (derived via CASE on application URLs), not a physical column on the `jobs` table. When embedding `jobs:job_id(...)` and filtering `jobs.source_type`, PostgREST joins the `jobs` table (not the view) → column doesn't exist → error 42703.

## Solution Applied: Hotfix A (Minimal Frontend Change)

### File Modified
`frontend/src/components/Jobs/ApplicationTracking.js`

### Changes Made

#### 1. Updated Query (Lines 22-43)
**Before**:
```javascript
const { data, error } = await supabase
  .from('job_applications')
  .select(`
    id, created_at, status, resume_url,
    jobs:job_id (
      id, title, company_name, location, job_type, deadline,
      source_type  // ❌ This column doesn't exist on jobs table
    )
  `)
  .eq('applicant_id', user.id)
  .eq('jobs.source_type', 'in_app')  // ❌ This filter fails
  .order('created_at', { ascending: false });
```

**After**:
```javascript
const { data, error } = await supabase
  .from('job_applications')
  .select(`
    id, created_at, status, resume_url,
    jobs:job_id (
      id, title, company_name, location, job_type, deadline,
      apply_url, application_url, external_url  // ✅ Fetch URL fields instead
    )
  `)
  .eq('applicant_id', user.id)
  // ✅ Removed the .eq('jobs.source_type', 'in_app') filter
  .order('created_at', { ascending: false });
```

#### 2. Client-Side Derivation (Lines 49-65)
Added logic to derive `source_type` on the client using the same semantics as `v_jobs_public`:

```javascript
// Derive source_type client-side (same semantics as v_jobs_public)
const appsWithSourceType = (data || []).map(app => ({
  ...app,
  jobs: app.jobs ? {
    ...app.jobs,
    source_type: (app.jobs.apply_url || app.jobs.application_url || app.jobs.external_url)
      ? 'quick_link'
      : 'in_app'
  } : null
}));

// Filter for in_app jobs only (matching original intent)
const inAppApplications = appsWithSourceType.filter(app => 
  app.jobs && app.jobs.source_type === 'in_app'
);

setApplications(inAppApplications);
```

#### 3. Bonus: Fixed Status Badge Color (Line 95)
While fixing the query, also replaced `blue-*` token with `ocean-*`:
```javascript
case 'submitted':
  return 'bg-ocean-100 text-ocean-800';  // ✅ Was bg-blue-100 text-blue-800
```

## Impact
- **Unblocks**: `/jobs/applications` page now loads without errors
- **Preserves behavior**: Still filters for in-app jobs only (original intent maintained)
- **Non-breaking**: No database changes required
- **Minimal**: Only touches query logic and adds client-side derivation

## Alternative (Not Implemented)
**Option B**: Create a view `v_job_applications_public` that joins `job_applications` → `v_jobs_public` so `source_type` is present server-side. This would be cleaner long-term but requires DB changes.

## Testing
1. Navigate to `/jobs/applications`
2. Verify page loads without 400 error
3. Verify only in-app job applications are shown
4. Verify status badges display correctly

## Files Changed
- `frontend/src/components/Jobs/ApplicationTracking.js` (3 changes: query, derivation, badge color)

## Type
**Hotfix** - Minimal query change + client derivation (not pure UI-only, but non-breaking and necessary to unblock the page)
