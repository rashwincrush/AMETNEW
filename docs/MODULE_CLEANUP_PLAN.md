# Module-by-Module Cleanup Plan/Report (No Changes Yet)

This document is **analysis-only**: it identifies **canonical files**, **duplicates/legacy variants**, **whether they are imported**, and a **safe, staged cleanup plan** you can approve later.

**Important**:
- This is written to support a *future* cleanup.
- No deletions/refactors were executed when producing this report.

---

## 0) Repo-Wide Rules (How We’ll Clean Safely Later)

- **Rule A (No behavior change first)**: Step 1 is *only* “unify imports” to the canonical files and run smoke checks.
- **Rule B (Delete only when unused)**: A file is a delete candidate only if we confirm it has **zero imports** and is not referenced by routing/build tooling.
- **Rule C (One canonical per concern)**:
  - One Supabase client module
  - One API module per domain (groups, mentorship, notifications)
  - One routed page/component per route

---

## 1) Cross-Cutting: Supabase + Auth + Infrastructure

### Supabase Client

- **Canonical**
  - `frontend/src/utils/supabase.js`

- **Duplicate / legacy**
  - `frontend/src/utils/supabaseWithTimeout.js`
    - **Imported?** No (only self references found)
    - **Action (later)**: Delete or archive after approval.
  - `frontend/src/utils/supabase.js.backup`
    - **Imported?** No
    - **Action (later)**: Delete after approval.

### Auth

- **Canonical**
  - `frontend/src/contexts/AuthContext.js`

- **Legacy snapshot**
  - `frontend/src/contexts/AuthContext.fixed.js`
    - **Imported?** No
    - **Action (later)**: Delete after approval.

---

## 2) Alumni Directory

### Routes / Entry Points (Canonical)

- `/directory` → `frontend/src/components/Directory/DirectoryPage.jsx`
- `/directory/:id` → `frontend/src/components/Directory/AlumniProfile.js`
- `/profile/:userId` → `frontend/src/pages/UserProfilePage.js` (profile viewer page; related but not the directory list)

### Directory module files

- Folder: `frontend/src/components/Directory/*` (low duplication inside the module)

### Supporting layers

- Services:
  - `frontend/src/services/directoryApi.js`
- Hooks:
  - `frontend/src/hooks/*` (directory-related hooks such as `useDirectorySecure.js` exist)

### Duplication risk

- Lower than Jobs/Mentorship. Duplication tends to appear in shared profile mapping/helpers rather than inside Directory folder.

### Cleanup (later)

- Focus on shared layers (profile mapping/services/hooks) once the canonical hook/service layer is chosen.

---

## 3) Events

### Routes / Entry Points (Canonical)

- `/events/*` → `frontend/src/pages/EventsPage.js`
- `/events/create` + `/events/new` → `frontend/src/components/Events/CreateEvent.js`
- `/events/edit/:id` → `frontend/src/components/Events/EditEvent.js`

### Duplicate / legacy UI

- `frontend/src/components/Events/CreateEventForm.js` (explicitly deprecated)
  - **Imported?** No imports found
  - **Action (later)**: Delete after approval.

- `frontend/src/components/Events/EditEventForm.js` (explicitly deprecated)
  - **Imported?** No imports found
  - **Action (later)**: Delete after approval.

### Potentially overlapping components (needs confirmation)

- `EventDetail.js` vs `EventDetails.js`
- `Events.js` vs `EventsList.js`

These may be used by different subroutes within `EventsPage.js`. Confirm actual imports from `EventsPage.js` before marking any as legacy.

### Cleanup (later)

- Stage 1: confirm which of the overlapping detail/list components are actually used.
- Stage 2: unify imports and then remove unused ones.

---

## 4) Groups

### Routes / Entry Points (Canonical)

- `/groups/*` → `frontend/src/pages/GroupsPage.js`
- `/groups/:id/manage` → `frontend/src/pages/GroupManage.jsx`
- Create UI → `frontend/src/components/Groups/CreateGroup.js`

### API Layer (Duplicate)

- `frontend/src/api/groups.js`
- `frontend/src/api/groups.ts`

**Evidence of use**
- Imports from `../api/groups` (no extension) are used by:
  - `frontend/src/pages/AdminGroupsPage.jsx`
  - `frontend/src/pages/GroupManage.jsx`
  - other groups-related components

This means this module currently depends on bundler extension resolution.

### Legacy duplication

- `frontend/src/utils/supabase.js` also contains legacy group helper functions (deprecated in comments).

### Cleanup (later)

- Pick ONE canonical public API surface for groups:
  - Option A: `api/groups.ts` canonical; keep/remove `api/groups.js` after migration.
  - Option B: `api/groups.js` canonical; remove `api/groups.ts` after migration.

**Before any deletion**: migrate all imports to explicit file extensions or a single index module.

---

## 5) Mentorship

### Routes / Entry Points (Canonical)

- `/mentorship` → `frontend/src/components/Mentorship/MentorshipLayout.jsx`

### API Layer (Duplicate)

- `frontend/src/api/mentorshipApi.js`
- `frontend/src/api/mentorshipApi.ts`

**Evidence of use**
- `frontend/src/hooks/useOpenMentorshipChat.js` imports `../api/mentorshipApi` (no extension), likely resolving to `.js` at runtime.

### Service Layer (Duplicate)

- `frontend/src/services/mentorship.js`
- `frontend/src/services/mentorship.ts`

### Cleanup (later)

- Decide canonical layering:
  - Recommended: `api/mentorshipApi.ts` as canonical typed API.
  - Keep `mentorshipApi.js` only as compatibility wrapper if needed.

- Standardize imports: either explicit `.ts` or import only from a single canonical module.

---

## 6) Jobs

### Routes / Entry Points (Canonical)

- `/jobs` → `frontend/src/components/Jobs/JobListingsPage.js`
- `/jobs/:id` → `frontend/src/components/Jobs/JobDetails.js`
- `/jobs/post` → `frontend/src/components/Jobs/PostJob.js`
- `/jobs/:id/edit` → `frontend/src/components/Jobs/EditJob.js`

### High-duplication hotspots

#### JobCard variants

- `frontend/src/components/Jobs/JobCard.js`
- `frontend/src/components/Jobs/JobCard.jsx`
- `frontend/src/components/Jobs/JobCard.tsx`

**Actual usage observed**
- `JobListingsPage.js` defines an inline `JobCard` component internally.
- Legacy pages/components import `JobCard.jsx`:
  - `frontend/src/pages/JobsPage.jsx`
  - `frontend/src/components/Jobs/JobsList.js`

So:
- Routed `/jobs` uses `JobListingsPage.js` (inline `JobCard`)
- `JobCard.jsx` is used by legacy/non-routed Jobs pages

#### JobDetailsQuickLink variants

- `JobDetailsQuickLink.jsx` and `JobDetailsQuickLink.tsx` both exist.
- `JobDetails.js` imports `./JobDetailsQuickLink` (no extension) → resolution order matters.

### Cleanup (later)

- Stage 1: decide whether to keep inline `JobCard` or unify to `JobCard.jsx`/`tsx`.
- Stage 2: enforce explicit extension imports where ambiguous.
- Stage 3: delete unused variants once imports are unified.

---

## 7) Profile / Account / Settings

### Routes / Entry Points (Canonical)

- `/profile` → `frontend/src/components/Auth/Profile`
- `/profile/security` → `frontend/src/pages/Profile/Security`
- `/settings/notifications` → `frontend/src/pages/Settings/NotificationSettings.jsx`

### Academics selectors (Degree/Department) — duplicate cluster (verified)

These selectors are used by the canonical Registration/Profile flows, but exist in **both** `.jsx` and `.tsx` forms.

- `frontend/src/components/academics/DegreeSelect.jsx`
- `frontend/src/components/academics/DegreeSelect.tsx`
- `frontend/src/components/academics/DepartmentSelect.jsx`
- `frontend/src/components/academics/DepartmentSelect.tsx`

**Evidence of use (imports without extension → resolution ambiguity risk)**
- `frontend/src/components/Auth/EnhancedRegister.js`
  - `import DegreeSelect from '../academics/DegreeSelect';`
  - `import DepartmentSelect from '../academics/DepartmentSelect';`
- `frontend/src/components/Auth/Profile.js`
  - `import DegreeSelect from '../academics/DegreeSelect';`
  - `import DepartmentSelect from '../academics/DepartmentSelect';`

**Risk**
- With both `.jsx` and `.tsx` present, the bundler will pick one by extension resolution order. It is easy to update the other file and ship no behavior change, creating “ghost edits”.

**Cleanup (later)**
- Choose a canonical file format for these selectors (`.tsx` recommended if TS is intended), then:
  - make the imports explicit OR remove the duplicate file after all imports are migrated.

### Legacy department inputs (likely unused, but still present)

- `frontend/src/components/forms/DepartmentInput.jsx`
  - **Imported?** No direct imports found; referenced in Registration as a comment (“removed DepartmentInput imports”).

- `frontend/src/hooks/useDepartments.js`
  - **Imported?** Yes, but only by `frontend/src/components/Auth/OnboardingForm.jsx`.
  - **Note**: `OnboardingForm.jsx` appears to be legacy/unrouted in `App.js`.

**Cleanup (later)**
- Confirm `OnboardingForm.jsx` is unused in production routing.
- If confirmed unused, `useDepartments.js` and `DepartmentInput.jsx` become safe removal candidates.

### Module files

- Profile components: `frontend/src/components/Profile/*`

### Services

- `frontend/src/services/profile.js` (canonical)
- `frontend/src/services/socialLinks.js` + `frontend/src/services/socialLinks.ts` (duplicate)
- `frontend/src/services/avatar.js`

### Cleanup (later)

- Decide whether social links should be TS canonical or JS canonical, then unify imports.

---

## 8) Admin / User Management / Content Management

### Routes / Entry Points (Canonical)

- `/admin/users` → `frontend/src/components/Admin/users/AdminUsersPage`
- `/admin/groups` → `frontend/src/pages/AdminGroupsPage.jsx`
- `/admin/events/moderation` → `frontend/src/components/Events/EventModerationPanel.jsx`
- `/admin/activity-logs` → `frontend/src/components/Admin/ActivityLogs.js`
- `/admin/settings` → `frontend/src/components/Admin/AdminSettings.js`
- `/admin/verify` → `frontend/src/components/Admin/DataVerificationDashboard.jsx`
- `/admin/feedback` → `frontend/src/components/Admin/FeedbackReport.js`

### Duplicates / backups

- `frontend/src/components/Admin/RoleManagement.js.backup`
  - **Imported?** No
  - **Action (later)**: delete after approval

- `frontend/src/components/Admin/RoleManagement.fix.js`
  - **Imported?** No evidence found
  - **Action (later)**: likely delete/merge; needs content review before removal.

---

## 9) Notifications

### Canonical

- Page: `frontend/src/components/Notifications/NotificationsPage.js` (used in `App.js`)
- API: `frontend/src/api/notifications.ts` (imported by NotificationsPage)
- Hooks: `frontend/src/hooks/useNotifications.ts`

### Legacy / duplicate

- `frontend/src/components/Notifications.js` (legacy)
  - Listed as deprecated in `frontend/src/components/Notifications/README.md`
  - Not used by `App.js`
  - Action (later): confirm no imports and delete after approval

- `frontend/src/api/notifications.js` (legacy)
  - Mentioned deprecated in `README.md`

- `frontend/src/hooks/useNotifications.js` is a bridge re-export to `.ts`
  - Keep until all legacy imports are migrated.

---

## 10) Messaging

### Canonical

- `/messages` → `frontend/src/components/Messages/Messages`

### Legacy splits

- `frontend/src/components/Messages/Messages-part1.js`
- `frontend/src/components/Messages/Messages-part2.js`
- `frontend/src/components/Messages/Messages-part3.js`

**Imported?** No imports found.

Action (later): delete after approval.

---

## Supabase (Backend) Scope Note

The repo’s Supabase Edge Functions are minimal:
- `supabase/functions/set-role`
- `supabase/functions/admin-invite-user`

Most module logic lives in SQL migrations/RLS/RPCs. A separate DB-focused audit can be produced later.

---

# Consolidation Plan (Proposed, Not Executed)

## Phase 0 — Confirm
Approve the list of safe deletes and the import-migration strategy.

## Phase 1 — Unify imports (no deletions)
- Choose canonical `api/groups.{js|ts}`
- Choose canonical `api/mentorshipApi.{js|ts}`
- Keep `api/notifications.ts` canonical
- Make ambiguous imports explicit (especially `JobDetailsQuickLink`)

## Phase 2 — Delete confirmed unused
Delete files only after:
- not routed
- not imported
- not referenced by docs/build tooling

## Phase 3 — Optional hardening
Reduce surface area by removing legacy helpers from `utils/supabase.js` and moving them into module-specific APIs.

---

# Safe Removal Candidates (Pending Approval)

Based on import checks:
- `frontend/src/utils/supabase.js.backup`
- `frontend/src/utils/supabaseWithTimeout.js`
- `frontend/src/contexts/AuthContext.fixed.js`
- `frontend/src/components/Events/CreateEventForm.js`
- `frontend/src/components/Events/EditEventForm.js`
- `frontend/src/components/Messages/Messages-part1.js`
- `frontend/src/components/Messages/Messages-part2.js`
- `frontend/src/components/Messages/Messages-part3.js`
- `frontend/src/components/Admin/RoleManagement.js.backup`

**Needs careful migration first (NOT safe delete yet):**
- `frontend/src/api/groups.js` vs `frontend/src/api/groups.ts`
- `frontend/src/api/mentorshipApi.js` vs `frontend/src/api/mentorshipApi.ts`
- Jobs duplicates (`JobCard.*`, `JobDetailsQuickLink.*`)
