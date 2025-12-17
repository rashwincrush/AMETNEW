# Master Cleanup Report (No Cleanup Executed)

This is a **consolidated master report** that combines:
- The **cleanup taxonomy** (what “cleanup” means in a production React + Supabase app)
- The **module-by-module cleanup plan** for this repository
- The **import/usage audit findings** (what is used vs unused)
- The **safety/rollout protocol** (new branch, and **no DB migrations without explicit approval**)

## Scope and Safety Contract

- **No cleanup has been performed** as part of this report.
- This report is intended for **future implementation**.
- **DB safety rule**: do not apply DB migrations or RLS changes without explicit approval.

## References (already saved)

- `docs/MODULE_CLEANUP_PLAN.md` (module plan; updated with Academics selector duplication)

---

# 1) Cleanup Taxonomy (What to clean in an app like this)

## 1.1 Duplicate implementations (JS/TS, old/new UI)

### What it is
- Multiple files implement the same concern (e.g., `.js` + `.ts`, `.jsx` + `.tsx`, legacy forms kept alongside new forms).

### Why it matters
- Silent drift: engineers edit one file, runtime uses the other.
- Inconsistent validation/session checks.
- Intermittent behavior when different code paths are used.

### What “done” looks like
- Exactly **one canonical implementation** per concern.
- Legacy copies are either:
  - removed (after verifying unused), or
  - converted into a thin compatibility wrapper (temporary only).

## 1.2 Import-resolution ambiguity cleanup

### What it is
- Imports without extension (e.g., `import X from './Thing'`) while both `Thing.jsx` and `Thing.tsx` exist.

### Why it matters
- Bundler resolution order decides which code runs.
- Leads to “ghost edits” and confusing regressions.

### What “done” looks like
- Imports are explicit (or only one file exists), especially for hot-path modules.

## 1.3 Layering cleanup (API vs services vs utils vs direct Supabase calls)

### What it is
- Supabase calls scattered across components, `utils/`, `services/`, and `api/`.

### Why it matters
- Security/session/role checks drift.
- Some paths use RPC; others do direct writes.

### What “done” looks like
- **Rule**: components call **module APIs**; module APIs talk to Supabase.
- Session validation and error normalization live in the module API layer.

## 1.4 Dependency cleanup

### What it is
- Unused packages, outdated packages, duplicated libraries.

### What “done” looks like
- Remove unused packages.
- Patch security vulnerabilities.
- Keep package choices consistent.

## 1.5 Security cleanup (Supabase/RLS/RPC)

### What it is
- Overlapping policies, inconsistent role helpers, overly broad grants.

### What “done” looks like
- Single canonical role resolution function.
- Tight and testable RLS.
- RPCs for operations that must enforce invariants.

**Safety**: DB changes require explicit approval.

## 1.6 Database schema/data cleanup

### What it is
- Orphans, legacy columns, missing constraints/indexes.

### What “done” looks like
- Clear migration hygiene.
- Constraints align with reality.
- Data audits and safe backfills.

## 1.7 UX/state cleanup

### What it is
- Missing loading/empty/error/retry states, inconsistent permission denial messaging.

### What “done” looks like
- Every major page and action flow has full state coverage.

## 1.8 Testing/QA cleanup

### What it is
- Lack of smoke coverage for critical flows.

### What “done” looks like
- Minimal smoke suite for auth, create/edit flows, and admin operations.

---

# 2) Current Repository Structure (Front-end)

- `frontend/src/api/` contains module API helpers (some in JS, some in TS).
- `frontend/src/services/` contains domain services (some duplicated in TS).
- `frontend/src/utils/` contains cross-cutting helpers and legacy module helpers.
- `frontend/src/components/` contains most UI modules.
- `frontend/src/pages/` contains routed page wrappers.

---

# 3) Module-by-Module Cleanup Plan (Repository-specific)

> Canonical routes are derived from `frontend/src/App.js`.

## 3.1 Directory

### Canonical entrypoints
- `/directory` → `frontend/src/components/Directory/DirectoryPage.jsx`
- `/directory/:id` → `frontend/src/components/Directory/AlumniProfile.js`

### Duplication notes
- Low duplication inside `components/Directory/*`.
- Risk mostly in shared profile mapping and hooks.

### Cleanup later
- Choose a canonical Directory data layer (`services/directoryApi.js` vs hooks) and reduce direct Supabase calls.

## 3.2 Events

### Canonical entrypoints
- `/events/*` → `frontend/src/pages/EventsPage.js`
- `/events/create` and `/events/new` → `frontend/src/components/Events/CreateEvent.js`
- `/events/edit/:id` → `frontend/src/components/Events/EditEvent.js`

### Legacy candidates (unused per import audit)
- `frontend/src/components/Events/CreateEventForm.js` (deprecated)
- `frontend/src/components/Events/EditEventForm.js` (deprecated)

### Needs confirmation before removal
- `EventDetail.js` vs `EventDetails.js`
- `Events.js` vs `EventsList.js`

## 3.3 Groups

### Canonical entrypoints
- `/groups/*` → `frontend/src/pages/GroupsPage.js`
- `/groups/:id/manage` → `frontend/src/pages/GroupManage.jsx`
- Create UI → `frontend/src/components/Groups/CreateGroup.js`

### Duplicate API modules (live)
- `frontend/src/api/groups.js`
- `frontend/src/api/groups.ts`

### Cleanup later
- Pick canonical (`.ts` or `.js`), then make imports explicit.

## 3.4 Mentorship

### Canonical entrypoints
- `/mentorship` → `frontend/src/components/Mentorship/MentorshipLayout.jsx`

### Duplicate API modules (live)
- `frontend/src/api/mentorshipApi.js`
- `frontend/src/api/mentorshipApi.ts`

### Duplicate services
- `frontend/src/services/mentorship.js`
- `frontend/src/services/mentorship.ts`

### Cleanup later
- Choose canonical layering: recommend TS API as canonical; keep JS only as compatibility if needed.

## 3.5 Jobs

### Canonical entrypoints
- `/jobs` → `frontend/src/components/Jobs/JobListingsPage.js`
- `/jobs/:id` → `frontend/src/components/Jobs/JobDetails.js`

### Duplication hotspots
- `JobCard.js`, `JobCard.jsx`, `JobCard.tsx` all exist.

### Usage reality
- `/jobs` uses an inline `JobCard` inside `JobListingsPage.js`.
- Legacy `JobsList.js` and `pages/JobsPage.jsx` import `JobCard.jsx`.

### Cleanup later
- Decide canonical `JobCard` strategy (inline vs extracted single file), then delete unused variants.

## 3.6 Profile / Account / Settings

### Canonical entrypoints
- `/profile` → `frontend/src/components/Auth/Profile`
- `/profile/security` → `frontend/src/pages/Profile/Security`
- `/settings/notifications` → `frontend/src/pages/Settings/NotificationSettings.jsx`

### Academics selectors duplication (verified)
These are actively imported without extension:
- `frontend/src/components/academics/DegreeSelect.jsx`
- `frontend/src/components/academics/DegreeSelect.tsx`
- `frontend/src/components/academics/DepartmentSelect.jsx`
- `frontend/src/components/academics/DepartmentSelect.tsx`

**Used by**
- `frontend/src/components/Auth/EnhancedRegister.js`
- `frontend/src/components/Auth/Profile.js`

**Risk**: extension-resolution ambiguity.

### Legacy department utilities
- `frontend/src/components/forms/DepartmentInput.jsx`
  - no direct imports found
- `frontend/src/hooks/useDepartments.js`
  - imported only by `frontend/src/components/Auth/OnboardingForm.jsx`
  - `OnboardingForm.jsx` appears unrouted (confirm before removal)

### Services duplication
- `frontend/src/services/socialLinks.js` and `frontend/src/services/socialLinks.ts`

## 3.7 Admin / User Management / Content

### Canonical entrypoints
- `/admin/users` → `frontend/src/components/Admin/users/AdminUsersPage`
- `/admin/groups` → `frontend/src/pages/AdminGroupsPage.jsx`
- `/admin/events/moderation` → `frontend/src/components/Events/EventModerationPanel.jsx`

### Backup/patch candidates
- `frontend/src/components/Admin/RoleManagement.js.backup` (unused)
- `frontend/src/components/Admin/RoleManagement.fix.js` (no evidence of imports; review before removal)

## 3.8 Notifications

### Canonical
- `frontend/src/components/Notifications/NotificationsPage.js`
- `frontend/src/api/notifications.ts`
- `frontend/src/hooks/useNotifications.ts`

### Legacy
- `frontend/src/components/Notifications.js` (deprecated per README; confirm no imports)
- `frontend/src/api/notifications.js` (deprecated)
- `frontend/src/hooks/useNotifications.js` is a bridge re-export; keep until all legacy imports migrate.

## 3.9 Messaging

### Canonical
- `frontend/src/components/Messages/Messages`

### Legacy drafts (unused)
- `Messages-part1.js`
- `Messages-part2.js`
- `Messages-part3.js`

---

# 4) Import/Usage Audit Summary (Key Findings)

## Confirmed unused (safe removal candidates after approval)
- `frontend/src/utils/supabase.js.backup`
- `frontend/src/utils/supabaseWithTimeout.js`
- `frontend/src/contexts/AuthContext.fixed.js`
- `frontend/src/components/Events/CreateEventForm.js`
- `frontend/src/components/Events/EditEventForm.js`
- `frontend/src/components/Messages/Messages-part1.js`
- `frontend/src/components/Messages/Messages-part2.js`
- `frontend/src/components/Messages/Messages-part3.js`
- `frontend/src/components/Admin/RoleManagement.js.backup`

## Live duplicates (do not delete until imports are migrated)
- `frontend/src/api/groups.js` vs `frontend/src/api/groups.ts`
- `frontend/src/api/mentorshipApi.js` vs `frontend/src/api/mentorshipApi.ts`
- `frontend/src/api/notifications.js` vs `frontend/src/api/notifications.ts`
- Academics selectors: `DegreeSelect.jsx/tsx`, `DepartmentSelect.jsx/tsx`
- Jobs cards/details: multiple variants exist

---

# 5) Rollout / Execution Protocol (When You Implement Later)

## Phase 0: Create a working branch
- Work in a **new branch** only.

## Phase 1: Unify imports (no deletions)
- Choose canonical module per duplicate cluster.
- Make imports explicit to remove resolution ambiguity.

## Phase 2: Delete only after proof
- Delete only files with:
  - no imports
  - not routed
  - not referenced by build scripts

## Phase 3: Verify
- Smoke-check flows:
  - login
  - create event/group/job
  - directory browse
  - mentorship request
  - admin pages

## DB safety
- No DB migrations/RLS changes without explicit approval.

---

# 6) Next Actions (When You Approve Cleanup)

- Confirm your preferred canonical direction:
  - JS-first or TS-first for `api/` and `components/academics/*`
- Decide Jobs canonical `JobCard` approach:
  - keep inline (JobListingsPage) vs extract a single JobCard component
- Confirm whether `OnboardingForm.jsx` is definitively retired.

---

# Appendix: Where to look

- Routes and canon: `frontend/src/App.js`
- Module APIs: `frontend/src/api/`
- Shared client: `frontend/src/utils/supabase.js`
- Saved plan: `docs/MODULE_CLEANUP_PLAN.md`
