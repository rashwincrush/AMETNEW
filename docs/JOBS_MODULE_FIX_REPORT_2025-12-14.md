# Jobs Module – Fix Pack Report (2025-12-14)

- Owner: Cascade
- Scope: Frontend + Supabase (SQL/RPC/View/RLS/Triggers)
- Security: Followed Global Security Contract (RLS-first, least-privilege, no client secrets, input validation posture)

## 0) Executive Summary
- Fixed critical jobs feed gaps: logo override honored, contact fields returned, and rejected items excluded.
- Stabilized Edit form mode (Quick vs In-App) to prevent mid-edit flips and added HR contact fields to Quick edit UI.
- Hardened authorization: owner/admin update only; added protected-columns trigger to prevent non-admin status/approval flips.
- Implemented denorm sync trigger to keep jobs.company_name/logo_url up-to-date after company updates.
- Verified refetch/invalidation path after edit via sessionStorage flag in JobListingsPage.

## 1) Database Changes (Supabase)

### 1.1 RPC get_jobs_public_v5 (Dropped & Recreated)
- Action: Dropped extended signature variant to change return type safely; recreated function with:
  - company_logo_url := COALESCE(jobs.logo_url, companies.logo_url)
  - Include contact_name, contact_email, contact_phone in RETURNS TABLE
  - Guards: COALESCE(j.is_active,true)=true AND COALESCE(j.is_approved,false)=true AND COALESCE(j.is_rejected,false)=false and status/open/close guards
- Result: Public feed now returns correct branding and contact fields; rejected jobs are excluded.

### 1.2 View v_jobs_feed_inr (Replaced)
- Action: Replaced view to align with RPC:
  - Coalesce logo
  - Include description + contact_name/email/phone
  - Apply same public visibility guards (active/approved/not rejected + status/open/close windows)

### 1.3 RLS Hardened (jobs)
- Update policy replaced: owner/admin may update and must not be blocked; blocking user check merged into policy USING/WITH CHECK.
- Added BEFORE UPDATE trigger `trg_guard_jobs_protected_columns` that rejects non-admin edits to protected columns: is_approved, status, is_rejected.
- Existing SELECT policies already include public-open and owner/admin paths (confirmed) and INSERT/DELETE are guarded.

### 1.4 Denorm Sync Trigger
- Added `trg_sync_jobs_denorm` on companies(name, logo_url) UPDATE calling `sync_jobs_denorm_on_company_update()`:
  - Updates jobs.company_name = NEW.name
  - Updates jobs.logo_url = COALESCE(jobs.logo_url, NEW.logo_url) to preserve job-level override

### 1.5 Indices & RLS
- No new indices required immediately; existing indices cover feed and RLS predicates (created_by/posted_by, is_active, is_approved). Kept as-is.

## 2) Frontend Changes

### 2.1 EditJob.js
- Freeze form mode with `initialIsQuick` captured on first fetch; render branches now reference the frozen flag to avoid mid-edit flips.
- Added HR contact inputs (name/email/phone) to Quick edit UI; backend already persisted them.
- Prevent overposting: only admins send `is_active` in update payload.
- Kept existing logo upload flow and jobs.logo_url override pass-through.

### 2.2 Listings Refetch
- Verified JobListingsPage has a `jobsNeedsRefresh` sessionStorage flag read on mount to refetch once after an edit. No code changes needed.

### 2.3 JobCard
- Not changed in this pass. Next: unify all JobCards (JS/JSX/TSX) to the modern helper-backed version.

## 3) Validation & Testing Notes

### 3.1 Live Checks (DB)
- get_jobs_public_v5 returns:
  - company_logo_url honoring job-level logo
  - contact fields present
  - only active+approved+not-rejected items
- RLS policies present and RLS enabled on jobs.

### 3.2 Manual FE Tests
- Edit Complete job → typing URL no longer flips to Quick; full form remains visible.
- Edit Quick job → contact inputs visible and editable; saved values reflect in DB and feed.
- After save, navigating to listings triggers refetch and updates are visible.

## 4) Security/Risk Posture
- IDOR mitigated via owner/admin RLS update/delete; protected columns guarded by trigger.
- Rejected-leakage mitigated in RPC/view WHERE predicates.
- Overposting reduced on FE (no `is_active` from non-admin) and blocked server-side.
- No secrets in FE; SECURITY DEFINER RPC is read-only and fully predicate-guarded.

## 5) Rollout & Rollback
- Migrations are idempotent; safe to re-apply.
- Rollback: restore prior get_jobs_public_v5/view definitions and drop triggers/policy if necessary.

## 6) Remaining Work (Next Pass)
- Unify JobCard implementations (JS/JSX/TSX) to single component using helpers.
- Optional DB CHECK constraints for email/phone/url formats for stronger server-side validation.
- Optional rate limiting on updates (via RPC wrapper or DB-level throttle table+policy) if abuse becomes an issue.

## 7) Artifact Summary
- SQL: get_jobs_public_v5 recreated; v_jobs_feed_inr replaced; jobs update policy replaced; triggers added:
  - guard_jobs_protected_columns (jobs BEFORE UPDATE)
  - sync_jobs_denorm_on_company_update (companies AFTER UPDATE)
- FE: frontend/src/components/Jobs/EditJob.js updated.

