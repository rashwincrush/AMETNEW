# AMET Alumni – Role × Module ORPIE Audit (Code-Level)

> Code-level QA sanity pass based on current repo (React + Supabase) as of Nov 2025. 
> Focus: roles, access, filters, counts, and critical flows (Directory, Jobs, Groups, Mentorship, Registration, Messages).

---

## Section 1 – Role × Module Summary Matrix

Legend:

- **Access**: `ALLOWED` (normal use), `LIMITED` (read-only or gated), `DENIED` (no UI/route access by design).
- **Status**: `OK` (matches intent), `PARTIAL` (some inconsistencies / UX confusion), `BROKEN` (code contradicts intent / likely bug).

Role resolution & permissions come from:

- `frontend/src/contexts/AuthContext.js` (BASE_PERMISSIONS, `derivePermissions()`, `getUserRole()`, `hasPermission()`)
- `frontend/src/App.js` (routes + ProtectedRoute usage)

### 1.1 Student

- **Dashboard**  
  - **Access**: ALLOWED (via `access:dashboard`).  
  - **Status**: PARTIAL.  
  - **Notes**: Uses `AlumniDashboard` for all roles (`App.js`), quick actions include `Find Alumni`, `My Applications`, `Find Mentor`, `Join Groups`. Pending students are gated by permissions to mostly read-only listings (`derivePermissions`), but dashboard copy/tiles are alumni‑flavoured.

- **Alumni Directory**  
  - **Access**: ALLOWED (permission `view:alumni_directory`).  
  - **Status**: OK.  
  - **Notes**: `/directory` → `DirectoryPage` under `ProtectedRoute requiredPermission="view:alumni_directory"` and `RequireCompleteProfile` (`App.js`). Data from RPC/view (`useDirectory` & `public_profiles_view`), plus realtime refresh. Student is not listed there themselves (driven by DB view/RLS, not frontend inserts).

- **Profile / Settings**  
  - **Access**: ALLOWED.  
  - **Status**: OK.  
  - **Notes**: `/profile`, `/profile/security`, `/settings/notifications` all require `access:profile_settings`, which students have even when pending. Editing goes through `updateProfile()` -> `profiles` table only on SAFE fields.

- **Groups**  
  - **Access**: ALLOWED (permission `access:groups`).  
  - **Status**: PARTIAL.  
  - **Notes**: 
    - `/groups/*` guarded by `access:groups` and **only** employers are hard-redirected away (`getUserRole()==='employer' ? /events` in `App.js`).
    - In `GroupsList.js`, students can see/join groups except those tagged `alumni-only` (chip rendered + CTA disabled). Behavior matches “students can join only non‑alumni‑only groups”.

- **Mentorship**  
  - **Access**: ALLOWED but **approval-gated**.  
  - **Status**: OK / BY DESIGN.  
  - **Notes**: 
    - Route `/mentorship` & `/mentorship/me` under `ProtectedRoute requiredPermission="request:mentorship"` – students have it only when fully approved. 
    - In `Mentorship.js::handleSendRequest`, explicit guard: student role + `profile.alumni_verification_status !== 'approved'` → toast: “Your profile is not approved. Kindly contact administrator.”

- **Jobs**  
  - **Access**: ALLOWED, can apply in‑app.  
  - **Status**: OK.  
  - **Notes**: 
    - `/jobs` list → `ProtectedRoute requiredPermission="view:jobs"` (students have). 
    - `/jobs/:jobId/apply` uses `JobApplication.js` which *blocks employer* but allows students/alumni. `computeJobApplyState()` ensures only open, in‑app jobs are applied to. 
    - Application insert **omits `applicant_id`** so DB default/RLS derives from session (`job_applications` RLS enforces ownership).

- **Events**  
  - **Access**: ALLOWED (browse and RSVP), not allowed to **create**.  
  - **Status**: OK.  
  - **Notes**: 
    - `/events/*` under `access:events`. 
    - `/events/create`/`/events/new`/`/events/edit/:id` require `events:create`, which only `admin` and `super_admin` have (`BASE_PERMISSIONS`). Students don’t see **Create Event** quick action on dashboard (`AlumniDashboard` only shows Create Event when `!isStudent`).

- **Registration**  
  - **Access**: ALLOWED when not logged-in (`/register` → `EnhancedRegister`).  
  - **Status**: PARTIAL (schema/UX tight but not fully verifiable from current view).  
  - **Notes**: Existing memories indicate v2 registration feeds directly into `profiles` & degree/department catalog; code in this snapshot aligns but not fully re‑audited here.

- **Home / Static / General**  
  - **Access**: ALLOWED (logged-out and logged-in).  
  - **Status**: OK.  
  - **Notes**: `/`, `/home`, `/about`, `/help`, `/contact`, `/terms-of-service`, `/privacy-policy` open without auth or with; scroll/top behavior handled by routing container.

- **Messages (DM)**  
  - **Access**: ALLOWED.  
  - **Status**: PARTIAL.  
  - **Notes**: `/messages` under `RequireCompleteProfile + ProtectedRoute requiredPermission="message:users"`. Students have `message:users` in base perms (fully approved only). Chat‑level checks are in `MessagingSystem` (not re-opened in this run) but previously ensured connections-only.

---

### 1.2 Alumni

Very similar to Student, but with more capabilities once approved.

- **Dashboard**  
  - **Access**: ALLOWED.  
  - **Status**: OK (functionally) / PARTIAL (copy).  
  - **Notes**: Stats & tiles tuned to alumni, but same component for all roles.

- **Alumni Directory**  
  - **Access**: ALLOWED.  
  - **Status**: OK.  
  - **Notes**: As for students, though alumni are the primary listed population.

- **Profile / Settings**  
  - **Access**: ALLOWED.  
  - **Status**: OK.

- **Groups**  
  - **Access**: ALLOWED.  
  - **Status**: OK.  
  - **Notes**: Alumni can create groups (`canCreateGroup(userRole)` allows alumni; `utils/permissions`/ACL only block students/employers), join/leave, post, etc.

- **Mentorship**  
  - **Access**: ALLOWED (as mentee by default, as mentor when approved).  
  - **Status**: OK.  
  - **Notes**: `ApprovedGuard` and `v_mentors_public` align directory + request/accept states; mentors can’t be their own mentees (explicit check in `handleSendRequest`).

- **Jobs**  
  - **Access**: ALLOWED.  
  - **Status**: OK.  
  - **Notes**: Alumni can browse/apply; cannot post jobs unless given employer role.

- **Events**  
  - **Access**: ALLOWED (browse & RSVP).  
  - **Status**: OK.  
  - **Notes**: Alumni also see **Create Event** quick tile, but route `/events/create` requires `events:create` (admin‑only). That’s a **logic/UX issue** (see L01).

- **Registration / Home / Messages**: Same as Student.

---

### 1.3 Employer

- **Dashboard**  
  - **Access**: ALLOWED (same AlumniDashboard).  
  - **Status**: PARTIAL.  
  - **Notes**: 
    - Employers see alumni‑oriented tiles, including **Find Alumni**, **Join Groups**, **Find Mentor**, **My Applications**.
    - Route guards then redirect or deny: `/directory` ⇒ `/jobs`, `/groups` ⇒ `/events`, `/mentorship` disallowed by perms. UX confusing but security preserved.

- **Alumni Directory**  
  - **Access**: **DENIED** by design.  
  - **Status**: OK (security) / PARTIAL (UX).  
  - **Notes**: 
    - Route `/directory` explicitly redirects employers to `/jobs` in `App.js`. 
    - Employers also lack `view:alumni_directory` permission, so even deep links go to `/access-denied`.

- **Profile / Settings**  
  - **Access**: ALLOWED (`access:profile_settings`).  
  - **Status**: OK.

- **Groups**  
  - **Access**: DENIED.  
  - **Status**: OK.  
  - **Notes**: 
    - `/groups/*` and `/groups/:id/manage` redirect employers to `/events`. 
    - `GroupsList` short-circuits to **Access Denied** card when `userRole==='employer'`.

- **Mentorship**  
  - **Access**: DENIED (cannot request mentorship or appear as mentor).  
  - **Status**: OK.  
  - **Notes**: Employer base perms don’t include `request:mentorship`/`manage:mentor_profile` etc.; ProtectedRoute blocks at route level.

- **Jobs**  
  - **Access**: 
    - ALLOWED to browse/manage their postings.  
    - DENIED to apply as candidate.  
  - **Status**: OK.  
  - **Notes**: 
    - `BASE_PERMISSIONS.employer` includes `view:jobs`, `post:jobs`, `manage:jobs`, `view:job_applications`, `manage:company_profile`.
    - Posting routes (`/jobs/post*`, `/jobs/create`) are behind `ApprovedGuard require="approved-employer"` + `ProtectedRoute requiredPermission="post:jobs"`.
    - `JobApplication.js` explicitly rejects employers (`if (role === 'employer') … Employers cannot apply to jobs`), addressing QA about employers applying like candidates.

- **Events**  
  - **Access**: ALLOWED (browse & RSVP).  
  - **Status**: OK.  
  - **Notes**: Employers have `access:events`; they do **not** have `events:create`.

- **Registration / Home / Messages**  
  - **Access**: ALLOWED.  
  - **Status**: OK.  
  - **Notes**: Employers can message users (`message:users`), but actual chat is connection‑gated.

---

### 1.4 Admin

- **Dashboard**  
  - **Access**: ALLOWED (uses AlumniDashboard for now).  
  - **Status**: PARTIAL.  
  - **Notes**: Admin has `access:all`; also separate admin dashboards exist (`components/Admin/*`), but main `/dashboard` route still uses `AlumniDashboard`.

- **Alumni Directory**  
  - **Access**: ALLOWED (via `access:all`).  
  - **Status**: PARTIAL.  
  - **Notes**: Same `DirectoryPage` as alumni/students; admin‑only views for unapproved/deleted alumni are in SQL/RPC (`get_directory_profiles` etc.). Frontend allows optional `adminFallback` path via `useDirectory`.

- **Profile / Settings / Groups / Mentorship / Jobs / Events / Messages**  
  - **Access**: ALLOWED (via `access:all`).  
  - **Status**: Mostly OK.  
  - **Notes**: Admin-specific pages (`/admin/*`) are all under `requiredPermission="access:all"` or `view:feedback_reports`.

- **Registration / Home**  
  - **Access**: As regular users; admins are just special roles.

---

### 1.5 Super Admin

Essentially Admin + extra reporting permission.

- **Access**: Same as Admin, with extra `view:feedback_reports`.  
- **Status**: OK.

---

## Section 2 – Detailed Bugs & Logic Issues (QA-derived)

Below, I take the QA bullets you outlined (via the examples list) and map them to the **current** code behavior.

### B01 – Employer dashboard tiles link to blocked modules

- **Module**: Dashboard, Directory, Groups, Mentorship  
- **Role(s)**: Employer  
- **Type**: LOGIC  
- **Status**: PARTIALLY FIXED / RISKY  
- **Summary**: Employers still see quick actions that route into modules they are not allowed to use (Directory, Groups, Mentorship) and then bounce via redirects or Access Denied.
- **Evidence**:  
  - `AlumniDashboard.js` quick actions (bottom grid):
    - `Find Alumni` → `to="/directory"` (lines ~624–627).  
    - `Join Groups` → `to="/groups"` (lines ~644–646).  
    - `Find Mentor` → `to="/mentorship"` (lines ~640–643).  
  - `App.js` routes:  
    - `/directory` redirects employers to `/jobs` (`getUserRole()==='employer' ? <Navigate to="/jobs"/>`).  
    - `/groups/*` and `/groups/:id/manage` redirect employers to `/events`.  
    - `/mentorship*` uses `ProtectedRoute requiredPermission="request:mentorship"`; employers never get that permission.
- **Root cause**: Dashboard is shared for all roles without role‑aware CTA visibility. Route guards correctly prevent unauthorized access, but UI still advertises entry points to functionality employers cannot actually use.
- **Concrete fix**:  
  - In `AlumniDashboard`, compute role via `getUserRole()` and conditionally render tiles:
    - Hide **Find Alumni** and **Find Mentor** when `userRole==='employer'`.  
    - Hide **Join Groups** when `userRole==='employer'`.  
  - Optionally add **employer‑specific tiles** (e.g., “Post a Job”, “Manage Applications”) to avoid “empty” dashboards for employers.

---

### B02 – Alumni dashboard “Create Event” tile for non-admins

- **Module**: Dashboard / Events  
- **Role(s)**: Alumni, Employer (non-admin)  
- **Type**: LOGIC  
- **Status**: NOT FIXED (in UX) / OK in security  
- **Summary**: Non‑admin alumni/employers see a **Create Event** tile on the dashboard that links to `/events/create`, but only `admin`/`super_admin` have the `events:create` permission; route returns Access Denied.
- **Evidence**:  
  - `AlumniDashboard.js`: quick actions: 
    - `!isStudent && <Link to="/events/create">Create Event</Link>` (lines ~629–633). This includes alumni and employers.  
  - `AuthContext.js`: only `admin` and `super_admin` BASE_PERMISSIONS include `events:create`.  
  - `App.js`: `/events/create` and `/events/new` routes are under `ProtectedRoute requiredPermission="events:create"`.
- **Root cause**: Frontend CTA is role‑based only on `isStudent`, not on `events:create` permission or admin‑like role. Security is correct, but UX suggests capability that doesn’t exist.
- **Concrete fix**:  
  - In `AlumniDashboard`, gate the **Create Event** tile on `hasPermission('events:create')` or `isAdminLike` rather than `!isStudent`.

---

### B03 – Employers applying to jobs as candidates

- **Module**: Jobs (Apply)  
- **Role(s)**: Employer  
- **Type**: BUG (historical), now LOGIC  
- **Status**: FIXED  
- **Summary**: Employers should *not* be able to apply to jobs; instead they manage postings. Current code enforces that.
- **Evidence**:  
  - `JobApplication.js`:
    - Role resolved from `userRole`/`getUserRole`.  
    - Lines 137–141: `if (role === 'employer') { toast.error('Employers cannot apply to jobs from this portal.'); return; }`.
- **Root cause** (original): Missing role check around job application; employer RLS may have allowed inserts.  
- **Concrete fix**: Already implemented. No further change needed.

---

### B04 – Job details / list missing skills, deadline, logo

- **Module**: Jobs – Listing / Card / Detail  
- **Role(s)**: Student, Alumni, Employer  
- **Type**: BUG (historical)  
- **Status**: FIXED (for list & cards) / LEGACY RISK in old `JobDetail`  
- **Summary**: Earlier QA noted skills/requirements/deadline/logo not showing or mis‑aligned; current `JobListingsPage` & `JobCard/JobListItem` render them comprehensively.
- **Evidence**:  
  - `JobListingsPage.js` `JobCard` & `JobListItem`:
    - Logo: `ImageWithFallback src={getJobLogoUrl(job)} ... imgClassName="object-contain"` ensures logos fit nicely.  
    - Skills: chips derived from `job.skills` (array or CSV string) rendered up to 5 tags (lines ~315–333, 562–579).  
    - Deadline: uses `coalescedDeadline = job.deadline || job.application_deadline` and displays `Deadline: {formatKolkata(coalescedDeadline)}` (lines ~377–381, 602–603).  
    - Salary: robust fallbacks using `salary_display_inr`, `salary_range`, or `salary_min/max` formatting.
- **Root cause** (original): Use of older job components and direct `jobs` columns before introduced helpers (`getJobLogoUrl`, `computeJobApplyState`).  
- **Concrete fix**: Already implemented in modern components. Remaining risk: old `JobDetail.js` loads from `jobs` and uses `job.company`/`job.type`/`job.apply_url`, but this component is **not** mounted from `App.js` (App uses `JobDetails` instead). If still linked from legacy URLs, consider either deleting or clearly marking it unused.

---

### B05 – Quick Link job posting failing / confusing errors

- **Module**: Jobs – Post Job (Quick Link)  
- **Role(s)**: Employer  
- **Type**: LOGIC / UX  
- **Status**: FIXED (with explicit messaging)  
- **Summary**: QA complaint “Post job failing” is consistent with RLS preventing unapproved employers. Current code now surfaces **clear** error messages instead of generic failures.
- **Evidence**:  
  - `PostJob.js`:
    - Wrapping of posting routes via `ApprovedGuard require="approved-employer"` (`App.js` routes `/jobs/post*`, `/jobs/create`).
    - In both `handleQuickLinkSubmit` and `handleSubmit`, before insert: 
      - `if (!isApprovedEmployer && !isAdmin) { toast.error('Your profile is not approved. Kindly contact administrator.'); return; }`.
    - Error handling for RLS/permission errors checks for `42501`, "row-level security", `fc_is_fully_approved` and shows employer‑specific guidance.
- **Root cause** (original): Employers attempted to post while status not fully approved; RLS blocked insert but frontend showed unclear error.  
- **Concrete fix**: Already present. No additional change needed beyond copy‑tuning messages.

---

### B06 – Mentorship: unapproved students blocked from requesting

- **Module**: Mentorship – Request flow  
- **Role(s)**: Student (pending/unapproved), Alumni  
- **Type**: LOGIC (policy vs expectation)  
- **Status**: BY DESIGN (now explicit)  
- **Summary**: QA note “Request mentorship error (please contact admin)” corresponds to a now **explicit** policy: unapproved students cannot send mentorship requests.
- **Evidence**:  
  - `Mentorship.js::handleSendRequest`:
    - Resolves `role = getUserRole()` and `isApproved = profile.alumni_verification_status === 'approved'`.  
    - If `role.toLowerCase()==='student' && !isApproved` → shows `toast.error('Your profile is not approved. Kindly contact administrator.');` and aborts.
  - Mentorship routes themselves are under `ProtectedRoute requiredPermission="request:mentorship"`, which is only granted when `derivePermissions` sees `isFullyApproved`.
- **Root cause**: Policy changed from “any student can request” to “only fully approved students can request”; QA expectation may not have matched.  
- **Concrete fix**: None if this policy is accepted. If product expectation is different, relax either `derivePermissions` for pending students (add `request:mentorship` for `pending`) or remove the student+approval check in `handleSendRequest`.

---

### B07 – Mentorship: mentor joins own program as mentee

- **Module**: Mentorship – Request flow  
- **Role(s)**: Mentor  
- **Type**: BUG  
- **Status**: FIXED  
- **Summary**: Mentors used to be able to request mentorship from themselves. Now explicitly blocked.
- **Evidence**:  
  - `Mentorship.js::handleSendRequest`:
    - After computing `menteeId` (profile.id or user.id) and `mentorId` (from mentor row):
      - `if (mentorId === menteeId) { toast.error("You can’t join your own mentorship as a mentee."); return; }`.
- **Root cause**: Lack of equality check between mentor and mentee IDs.  
- **Concrete fix**: Already implemented.

---

### B08 – Mentorship: mentee count incorrect on cards

- **Module**: Mentorship Directory / Mentor cards  
- **Role(s)**: All who see mentors directory  
- **Type**: BUG  
- **Status**: FIXED  
- **Summary**: Earlier, mentee counts were derived client‑side from relationships or status; now they rely on a dedicated view column `current_mentees_count`.
- **Evidence**:  
  - `Mentorship.js::fetchApprovedMentors` queries `v_mentors_public` and maps: 
    - `totalMentees: typeof mentor.current_mentees_count === 'number' ? mentor.current_mentees_count : 0`.
- **Root cause**: Previously, counts pulled from different tables (requests vs relationships) with inconsistent filters.  
- **Concrete fix**: Use DB view `v_mentors_public` as single source of truth.

---

### B09 – Groups: join / image posts / non-members commenting

- **Module**: Groups list & detail  
- **Role(s)**: Student, Alumni, Employer  
- **Type**: BUGs (historical)  
- **Status**: FIXED (join, posting, non‑member commenting)  
- **Summary**: Multiple QA notes around join button not working, group posts failing, and non‑members posting. Current code is aligned with triggers & RLS.
- **Evidence**:  
  - **Join & leave:** `GroupsList.js` uses `fetchGroups`, `joinGroup`, `leaveGroup`, `requestGroupMembership`. 
    - Employers: short‑circuited (no fetch, Access Denied card). 
    - Students blocked from **alumni‑only** groups by tag (`blockedForStudent`). 
    - For private groups, non‑admins call `requestGroupMembership()` instead of direct join. 
    - Leave logic ensures at least one admin remains (`group_members` count filter).
  - **GroupDetails posting:** 
    - `handleCreatePost` checks `if (!isMember) { toast.error('You must be a member to post in this group.'); return; }`. 
    - Posts inserted into `group_posts` with `group_id`, `user_id`, `content` only; then author identity hydrated via `profiles` / `alumni_directory_public` – no frontend bypass of RLS.
- **Root cause** (original): Direct inserts with explicit `user_id`, older views, and lack of membership checks.  
- **Concrete fix**: Already applied (and matches prev. SQL trigger/RLS work). No changes required.

---

### B10 – Directory: unapproved/deleted alumni visible in public directory

- **Module**: Alumni Directory  
- **Role(s)**: Public / Logged-in non-admins  
- **Type**: BUG (historical)  
- **Status**: LIKELY FIXED but depends on DB view  
- **Summary**: Frontend now reads from **views/RPCs** that are intended to filter approved, non‑deleted, alumni‑role profiles; there is no explicit client-side filter on `approval_status`, so correctness depends on the DB definition.
- **Evidence**:  
  - `AlumniDirectory.js` uses `supabase.from('public_profiles_view')...` – a restricted view, not raw `profiles`. 
  - `useDirectory.js` uses `alumni_directory_public` and RPCs `get_directory_profiles`, `get_directory_profiles_search`, with an `adminFallback` option to read the public view if RPC fails.  
  - Realtime subscription in `AlumniDirectory` only refreshes on profile changes that are likely related to approval/role fields.
- **Root cause** (original): UI querying `profiles` directly without approval/deletion filters; fix moved those filters server-side into views/RPCs.  
- **Concrete fix**: Confirm in live DB that `public_profiles_view` and `alumni_directory_public` include `WHERE approval_status='approved' AND is_deleted=false AND role='alumni'`. From the app’s code, no additional changes needed.

---

### B11 – Employers accessing Find Alumni / Explore Groups / Join Groups from their own dashboard widgets

- **Module**: Dashboard, Directory, Groups  
- **Role(s)**: Employer  
- **Type**: LOGIC / UX  
- **Status**: PARTIALLY FIXED (security OK, UX confusing)  
- **Summary**: Overlaps B01 but worth calling out: employer permissions are correct (no directory, no groups), but the **dashboard CTA design** still suggests those features are available.
- **Evidence**: Same as B01.  
- **Root cause**: Shared AlumniDashboard; missing role-specific CTA layout.  
- **Concrete fix**: see B01; add employer-specific dashboard variant or conditional blocks.

---

## Section 3 – New Issues Found (Not in QA Notes)

### N01 – “My Applications” dashboard tile open to all roles

- **Module**: Dashboard / Job Application Status  
- **Role(s)**: All logged-in roles (including Employer, Admin)  
- **Type**: LOGIC  
- **Status**: PARTIAL  
- **Summary**: The **My Applications** tile on the dashboard links to `/my-applications`, which is wrapped in `ProtectedRoute` **without** a `requiredPermission`. That means any authenticated role (including employers, admins) can open it, though only candidates will likely see meaningful data.
- **Evidence**:  
  - `AlumniDashboard.js` quick action: `Link to="/my-applications"`.  
  - `App.js` route: `/my-applications` → `<ProtectedRoute><JobApplicationStatus /></ProtectedRoute>` (no permission/role guard).
- **Root cause**: Route guard relies only on authentication, not role.  
- **Concrete fix**: 
  - Decide whether employers/admins should see **My Applications**. If not, either:
    - Gate the route: `ProtectedRoute requiredPermission="apply:jobs"` and add `apply:jobs` only to candidate roles in `BASE_PERMISSIONS`; or
    - Hide the tile for non‑candidate roles on dashboard via `userRole` check.

---

### N02 – Admin still using Alumni-style dashboard instead of AdminDashboard

- **Module**: Dashboard  
- **Role(s)**: Admin, Super Admin  
- **Type**: LOGIC / UX  
- **Status**: PARTIAL  
- **Summary**: `App.js::getDashboardComponent()` always returns `<AlumniDashboard />` for all roles; the customized `AdminDashboard` component is never mounted from the main routes.
- **Evidence**:  
  - `App.js` `getDashboardComponent()` explicitly: “Force Production Dashboard for all roles” and returns `AlumniDashboard user={profile || user}`.  
  - `AdminDashboard.js` exists but is not referenced.
- **Root cause**: Simplification to a single dashboard.  
- **Concrete fix**: If admins should get a different at-a-glance view, branch in `getDashboardComponent()` based on `userRole` (e.g., `if (isAdminLike) return <AdminDashboard user={...} />`), or remove `AdminDashboard.js` to reduce confusion.

---

### N03 – Legacy JobDetail component mismatched with modern job schema

- **Module**: Jobs – Legacy JobDetail  
- **Role(s)**: All (if directly routed)  
- **Type**: IMPLEMENTATION / MAINTAINABILITY  
- **Status**: RISKY (if reachable)  
- **Summary**: `JobDetail.js` reads from the `jobs` table using older column names (`company`, `type`, `apply_url`) and provides delete/edit actions. App routes, however, use a different `JobDetails` component; if any legacy deep-links hit `JobDetail`, behavior could be inconsistent or broken.
- **Evidence**:  
  - `JobDetail.js` selects `from('jobs').select('*')` and renders `job.company`, `job.type`, `job.apply_url`.  
  - `App.js` imports `JobDetails` (not `JobDetail`) for `/jobs/:id` route.
- **Root cause**: Migration to a new jobs schema + new components left the old `JobDetail` orphaned.  
- **Concrete fix**: Either:
  - Remove `JobDetail.js` and dead routes that reference it, or 
  - Update it to use the same helpers (`getJobCompanyName`, `getJobLogoUrl`, `computeJobApplyState`) and ensure it is never mounted for public users.

---

### N04 – Pending approvals and BASE_PERMISSIONS divergence

- **Module**: Global permissions  
- **Role(s)**: All non-admin roles  
- **Type**: LOGIC  
- **Status**: OK but subtle  
- **Summary**: Pending users get a restricted permission subset via `derivePermissions` which is **different** from `BASE_PERMISSIONS`. This is correct but easy to misunderstand when inspecting only the base map.
- **Evidence**:  
  - `AuthContext.js`: `derivePermissions()` returns:
    - For pending `student`/`alumni`: only `access:dashboard`, `access:profile_settings`, `view:jobs`, `access:events`.  
    - For pending `employer`: only `access:dashboard`, `view:jobs`, `access:events`, `access:profile_settings`.  
  - All other permissions (directory, mentorship, groups, post:jobs, etc.) are withheld until `approvalFlags.isFullyApproved` or admin.
- **Root cause**: Designed gating, but can lead to confusion if QA expects BASE_PERMISSIONS to apply verbatim regardless of approval status.  
- **Concrete fix**: Documentation rather than code: clearly document that BASE_PERMISSIONS represent **full capabilities** and pending users get a restricted subset.

---

## Section 4 – Pre-Launch Priority Checklist

**BLOCKERS (must fix before launch)**

1. **B01 / B11 – Employer dashboard tiles into blocked features**  
   - *Reason*: High confusion and QA regression: employers see “Find Alumni / Join Groups / Find Mentor” and then are bounced. Even if security is correct, this feels broken.  
   - *Action*: Make `AlumniDashboard` CTA rendering role‑aware and replace with employer‑specific shortcuts (e.g., Post Job, Manage Applications).

2. **B02 – Create Event CTA for non-admins**  
   - *Reason*: Alumni/employers click “Create Event” and receive Access Denied.  
   - *Action*: Gate the tile on `events:create` permission.

3. **N01 – My Applications route open to all roles**  
   - *Reason*: Employers/admins can open a candidate‑oriented route; could confuse QA and users.  
   - *Action*: Either restrict `/my-applications` to candidate roles via a new permission (`apply:jobs`) or hide tile for non‑candidates.

---

**SHOULD FIX (highly recommended)**

1. **B10 – Directory approval/deletion filters (DB verification)**  
   - *Reason*: If views are misconfigured, PII leakage / unapproved profiles in directory would be a serious issue.  
   - *Action*: On live DB, verify `public_profiles_view` & `alumni_directory_public` filter on `approval_status='approved'`, `is_deleted=false`, and correct role.

2. **N02 – Admin dashboard experience**  
   - *Reason*: Admins currently see a pure alumni dashboard; they do have separate admin pages, but “Admin Dashboard” component exists and is unused.  
   - *Action*: Either wire `AdminDashboard` for admin roles or delete it to avoid confusion.

3. **N03 – Legacy JobDetail**  
   - *Reason*: Could be hit via outdated links; fields don’t align with new schema, and delete semantics may differ from new job moderation flows.  
   - *Action*: Update or remove.

---

**CAN WAIT (minor / non-critical)**

1. **Cosmetic / copy mismatches** (e.g., mentorship messages about approval, admin stats placeholders in `AdminDashboard`).  
2. **Dead code / unused helpers** such as `getAvailabilityColor` in `Mentorship.js`.  
3. **Fine-grained role labels** in directory/memberships (e.g., defaulting unknown roles to “Alumni” in `GroupDetails` member list) – harmless but could be improved later.

---

### Closing

This audit is based purely on the **current repo state** (React + Supabase) and assumes DB views/RPCs implement the intended filters (particularly for directory, jobs, and mentorship counts). The main **security posture** (RLS, permissions, role gating) is sound; the highest-risk issues are **UX/logic mismatches** between dashboard CTAs and route-level permissions.
