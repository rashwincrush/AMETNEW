# Job Portal Contract (Canonical Spec)

_Last updated: 2025-12-10_

## 0. Scope & Overview

This document defines the **canonical contract** for the Job Portal module in this codebase.

- **What the Job Portal does (today):**
  - Lets **students/alumni** browse/search jobs, view details, apply to in-app jobs, and track their own applications.
  - Lets **employers** and **admins** post/manage jobs, pause/resume listings, and manage in-app applications for their jobs.
  - Supports **quick-link jobs** (external application URL) vs **in-app jobs** (ApplyDialog + job_applications rows).
  - Surfaces **application status** to applicants via dedicated views.
- **Where it lives (key components & routes):**
  - Main listings (rich view): `frontend/src/components/Jobs/JobListingsPage.js` → route `/jobs`.
  - Legacy/simple grid: `frontend/src/pages/JobsPage.jsx` + `components/Jobs/JobCard.jsx` (not wired as primary route in `App.js`).
  - Job detail: `components/Jobs/JobDetails.js` (+ `JobDetailsInApp`, `JobDetailsQuickLink`).
  - Apply-in-app surface: `ApplyDialog` (used from `JobListingsPage` cards and in-app details).
  - Applicant tracking:
    - Canonical: `components/Jobs/ApplicationTracking.js` → routes `/jobs/applications`, `/jobs/applications/:id`.
    - Compact list: `components/Jobs/JobApplicationStatus.js` → route `/my-applications`.
  - Employer posting flows:
    - Selection UI: `components/Jobs/PostJobSelection.js` → `/jobs/post/select`.
    - Full in-app posting form: `components/Jobs/PostJob.js` → `/jobs/post`.
    - Minimal link-only posting: `components/Jobs/PostJobWithLink.js` → `/jobs/post/link`.
  - Employer/admin application management:
    - `components/Jobs/ManageJobApplications.js` → `/jobs/:id/applications`, `/jobs/:jobId/manage`.
  - Alerts & bookmarks:
    - `components/Jobs/JobAlerts.js` → `/jobs/alerts`.
    - `components/Jobs/BookmarkedJobs.js` (linked from other modules; not a top-level route in `App.js`).
- **Key backend objects / RPCs / storage:**
  - Tables: `public.jobs`, `public.job_applications`, `public.job_bookmarks`, `public.companies`.
  - RPCs: `get_job_details`, `get_applications_for_job_v2`, `set_application_status`.
  - Storage: `company-logos` bucket for employer/company logos; `resumes` bucket for applicant resumes (signed URLs).
- **Roles affected:**
  - `student`, `alumni` → job seekers / applicants.
  - `employer` → job posters.
  - `admin`, `super_admin` → platform staff with elevated moderation & visibility.

This file is the **source of truth** for Job Portal **sections**, **data sources**, **navigation**, and **role behavior**, with a focused **student desired vs current** comparison.

---

## 1. Section / Unit Matrix (Canonical Contract)

### 1.1 Section matrix

| ID | Section | Description / Purpose | Frontend data source | Backend objects / RPCs | Primary routes | Role gating (visibility / actions) |
|----|---------|-----------------------|----------------------|------------------------|----------------|-------------------------------------|
| S1 | **Main Job Listings – Rich View** | Primary job browsing/search experience with cards, quick-link vs in-app badges, bookmark & share, ask-employer CTA, apply buttons, and pause/resume controls for owners. | `JobListingsPage` using `useAuth`, `useApproval`, `useOpenJobs`, `useExpiredJobs`, `getAppliedJobIdsForCurrentUser`, `computeJobApplyState`, `getApplicantsCount`, `requestConnectionForJob`, `toggleBookmarkRPC`. | `jobs` (core listing), `job_applications` (applied-ids check), `job_bookmarks`, `connections`, `profiles`, RPCs used by hooks (`useExpiredJobs` → `fetchExpiredJobsAdmin` / `fetchMyExpiredJobs`), storage `company-logos`. | `/jobs` | Visible to all signed-in roles with `view:jobs`. Student/alumni can apply (in-app or external) when `canApplyInApp`/`canApplyExternally` and not closed. Employers/admins see pause/resume + Manage applications for owned jobs. Expired-only tab visible only for employers/admins (students do not see expired list). |
| S2 | **Legacy Jobs Grid Page** | Older two-column grid of job cards with basic deadline/"Open vs Applications Closed" badges. No quick-link distinction, no bookmarks. Kept mainly for backward compatibility / potential admin use. | `JobsPage.jsx` with `useOpenJobs`, `useExpiredJobs`, `JobCard.jsx`, `JobsFilterBar`. | `jobs` as in S1 via hooks; same RLS surface. | _No direct route in `App.js`_ (was historically `/jobs`). | Not part of primary UX. If re-routed, would follow same `view:jobs` gating. |
| S3 | **Job Detail – In-App / Quick-Link Wrapper** | Canonical job detail view; fetches full job row (with normalized fields) and delegates to in-app vs quick-link subviews. Handles bookmark/share. | `JobDetails` with `useParams`, `useAuth`, `supabase.rpc('get_job_details', { p_id })`, `toggleBookmarkRPC`. | RPC `get_job_details` (joins jobs + company + possibly other views), `job_bookmarks`. | `/jobs/:id` | All roles with `view:jobs`. Underlying in-app/quick-link subcomponents enforce role-aware actions (apply, edit, delete) via props and RLS. |
| S4 | **Job Detail – Legacy (MUI)** | Older MUI-based job detail (`JobDetail.js`): reads `jobs` row directly and offers edit/delete for admins and apply/"Apply Externally" buttons. Not wired as primary route in `App.js`. | `JobDetail` using direct `supabase.from('jobs').select('*')`. | `jobs`. | _Not routed_ (legacy). | Legacy-only. Any future usage must be audited vs `JobDetails`. |
| S5 | **Apply In-App Dialog** | Modal form for in-app job applications (upload/choose resume, submit into `job_applications`). Opened from listings card or in-app details for non-quick jobs. Handles deadline and closed/paused state. | `ApplyDialog` (referenced from `JobListingsPage` cards and likely `JobDetailsInApp`), `supabase` writes to `job_applications` + storage `resumes`. | `job_applications` (insert), `jobs` (for deadline / `computeJobApplyState`), storage `resumes`. | Triggered from `/jobs` and `/jobs/:id`. | Only active for applicant roles (`student`, `alumni`) when `computeJobApplyState` says `canApplyInApp` and job is open, approved, active, not rejected. Employers/admins never see Apply buttons. |
| S6 | **Ask Employer CTA** | Card-level CTA for applicants to request a connection with the employer and deep-link into messaging for a specific job. | `JobListingsPage` JobCard/JobListItem using `requestConnectionForJob`, `navigate('/messages?peer=...&job=...')`. | `connections` / messaging-related tables (via `requestConnectionForJob` helper and DB triggers). | `/jobs` → `/messages?peer={employerId}&job={jobId}`. | Only visible for `userRole` ∈ {student, alumni}, when there is an employer id and viewer is not the owner. |
| S7 | **My Applications – Rich (ApplicationTracking)** | Canonical “My applications” page with filters, detailed job metadata, resume link, applied-when, and status badge. Shows only in-app applications. | `ApplicationTracking` using `useAuth`, `supabase.from('job_applications').select(... jobs:job_id (...))`, local status filters, signed resume URLs. | `job_applications` (scoped by RLS to current applicant), `jobs` (join), storage `resumes`. | `/jobs/applications`, `/jobs/applications/:id`, `/jobs/:jobId/applicants/:id` (for profile view). | Route requires `apply:jobs`. Component further guards that `userRole` must be `student` or `alumni`; others are redirected back to `/jobs`. |
| S8 | **My Applications – Compact (JobApplicationStatus)** | Alternative “My Job Applications” list with simple badges and resume link. Uses status normalization helpers and job join with minimal fields. | `JobApplicationStatus` using `useAuth`, `supabase.from('job_applications').select('..., jobs:job_id!inner (...)')`, `normalizeStatus`, `STATUS_LABEL`. | `job_applications`, `jobs`, storage `resumes`. | `/my-applications`. | Route requires `apply:jobs`. Intended for job-seeker roles (students/alumni); no extra role guard beyond permission. |
| S9 | **Employer Application Management** | Owner/admin view to list and manage applications for a given job: statuses, resume links, applicant display name/profile, connection status, messaging, and paging. | `ManageJobApplications` using `useParams`, `useAuth`, `supabase.auth.getSession`, direct `supabase.from('jobs')` for job ownership, RPC `get_applications_for_job_v2`, `set_application_status`, helper `idempotentConnect`, `getLatestEdge`, resume signed URLs. | `jobs` (for ownership + basic fields), RPC `get_applications_for_job_v2` (returns applications + total_count, scoped by job & owner), `job_applications`, `profiles` (fallback applicant names), `connections` (edges), storage `resumes`, RPC `set_application_status`. | `/jobs/:id/applications`, `/jobs/:jobId/manage`, `/jobs/:jobId/applicants/:applicantId` (profile). | Routes require `view:job_applications`. Component additionally enforces **owner-or-admin** logic: only job owners (posted_by/user_id/created_by) and admins can see applications or call `set_application_status`. Non-owners get access denied messaging. |
| S10 | **Job Posting – Entry Selection** | Simple choice page offering **Quick Link Post** vs **Full Job Form**. | `PostJobSelection` (pure UI, uses `Link` to routes). | None directly; downstream pages handle persistence. | `/jobs/post/select`. | Routes gated by `ApprovedGuard require="approved-employer"` and `ProtectedRoute requiredPermission="post:jobs"`. Only approved employers/admin-like users can enter. |
| S11 | **Job Posting – Full In-App Form** | Multi-step MUI form to create a rich in-app job (title, company, location, type, experience, summary, qualifications, skills, salary, deadline, contact email, and company logo). Handles company lookup/creation and logo propagation. | `PostJob` using `useAuth`, `useApproval`, `supabase`, `buildJobPayload`, `toISODate`, validators, `company-logos` storage upload, `useApproval` for employer approval gate. | `companies` (lookup or insert; update logo), `jobs` (insert payload from `buildJobPayload` with enforced `status='active'`, `is_active=true`, `is_approved=false`, `created_by`, `user_id`), storage `company-logos`. | `/jobs/post`. | Gated by `ApprovedGuard require="approved-employer"` + `post:jobs`. Only approved employer profiles and admins can post. Error handling maps RLS/approval failures to explicit messages. |
| S12 | **Job Posting – Quick Link** | Minimal form that creates a job with title and external application URL; primarily for external ATS or company boards. | `PostJobWithLink` using `useAuth`, `useNotification`, `supabase.from('jobs').insert({ title, application_url, description, is_active, is_approved:false, created_by })`. | `jobs`. | `/jobs/post/link`. | Also gated by `ApprovedGuard` + `post:jobs`. Quick but less structured; no in-app apply flow for these jobs. |
| S13 | **Job Alerts** | Saved job-alert preferences / notifications page (implementation details in `JobAlerts.js`). Integrates with NotificationCenter/hooks to manage job-related alerts. | `JobAlerts` (react component using job alert APIs and NotificationCenter). | Job alert table(s)/RPCs (not surfaced directly in code snippets; assumed `job_alerts`/similar). | `/jobs/alerts`. | Gated by `view:jobs`. Available to all roles with that permission; semantics mainly relevant for applicants. |
| S14 | **Bookmarked Jobs** | Lists jobs that the current user has bookmarked via bookmark buttons on listings/details. | `BookmarkedJobs` using `supabase` to pull `job_bookmarks` joined to `jobs`, plus bookmark helpers. | `job_bookmarks`, `jobs`. | Linked from other modules (no dedicated route in `App.js` snippet). | Only signed-in users; effectively job seekers. |
| S15 | **Admin Job Review / Verification** | Admin surfaces to audit job applications & job data as part of broader data verification flows (not primary seeker UI). | `Admin/JobApplicationReview.js`, `DataVerificationDashboard.jsx` referencing `job_applications` and related tables. | `job_applications`, `jobs`, plus admin audit tables. | Admin-only routes under `/admin/*` (see App.js). | Gated by `access:all` and additional admin guards. Not visible to normal roles. |

---

## 2. Role Views

This section summarizes what each role **sees and can do** across the Job Portal sections S1–S15.

### 2.1 Student

- **Sections visible (primary UX):**
  - S1 Main Job Listings (rich) via `/jobs`.
  - S3 Job Detail wrapper via `/jobs/:id`.
  - S5 ApplyDialog (for in-app jobs only).
  - S6 Ask Employer CTA.
  - S7 ApplicationTracking (rich “My applications”) via `/jobs/applications`.
  - S8 JobApplicationStatus via `/my-applications`.
  - S14 Bookmarked Jobs (entry from other modules).
- **Core actions:**
  - Browse/search jobs via S1 with text search; filter bar provides further filters.
  - Open job details and view normalized description, skills, salary, company, deadline.
  - Apply to **in-app** jobs using ApplyDialog while job is open and before deadline.
  - For **quick-link** jobs, open external application URL in a new tab.
  - Request connection with employer via S6, then continue conversation in `/messages`.
  - Track status of in-app applications via S7 and S8 (status filters, badges, resume link).
  - Bookmark/unbookmark jobs; view bookmarked jobs later.
- **What they do *not* do:**
  - Cannot access posting routes S10–S12 (gated by `post:jobs` + employer approval).
  - Cannot see or manage other applicants (S9) or admin review dashboards (S15).

### 2.2 Alumni

- **Sections visible:**
  - Same as Student for S1, S3, S5–S8, S14.
  - Depending on permissions and profile configuration, alumni may also have `post:jobs` and use S10–S12 as employers (if their `primary_role` is employer-like and approved). The code path defers to `useApproval` + `ApprovedGuard`.
- **Core actions:**
  - All student behaviors.
  - If configured as an employer (via profile), can also post jobs and manage them like Employers below.

### 2.3 Employer

- **Sections visible:**
  - S1 Main Job Listings (rich) with owner-aware actions.
  - S3 Job Detail wrapper for their own and others’ jobs.
  - S6 Ask Employer CTA is **not** relevant to them for their own jobs; listings instead show Manage/Accepting/Closed states.
  - S9 ManageJobApplications for jobs they own.
  - S10 PostJobSelection, S11 PostJob, S12 PostJobWithLink.
  - S13 JobAlerts (if permissions granted).
  - S14 Bookmarked Jobs (if they bookmark to monitor peers’ posts).
- **Core actions:**
  - Post new jobs (full in-app or quick-link) when employer profile is approved.
  - See their own open and expired jobs (via S1 + `useExpiredJobs` / `fetchMyExpiredJobs`).
  - Pause/resume their listings from S1 cards.
  - View and manage applications for owned jobs via S9, including status updates and contacting applicants.
- **What they do *not* do (by design of current code):**
  - They are not treated as applicants in S1 cards – they see “Accepting applications” / “Applications closed” instead of apply buttons for others’ jobs.
  - `ApplicationTracking` explicitly redirects non-student/alumni users; so employers cannot use S7 as applicants.

### 2.4 Admin / Super Admin

- **Sections visible:**
  - All of students’ applicant-facing surfaces **if** they hold `view:jobs`/`apply:jobs` permissions (depends on role config).
  - All employer-facing surfaces S9–S12, typically with global visibility (not just ownership), guarded by RLS and `isAdmin` checks.
  - S13 JobAlerts, S14 Bookmarked Jobs (if used personally).
  - S15 Admin Job Review / Verification dashboards under `/admin/*`.
- **Core actions:**
  - Monitor and moderate jobs and applications (S9, S15) without needing to be the posting user.
  - Post/edit jobs on behalf of the institution (S11/S12), constrained by RLS and DB constraints.
  - Use status updates and verification flows to enforce platform rules.

---

## 3. Student – Desired vs Current Behavior

This section focuses on the **student** job-seeker persona and compares **desired** contract vs **current** implementation based on the code.

### 3.1 Desired behavior (Student)

For users whose effective role is `student` (per `useAuth` / `getUserRole()`):

- **D1 – Visibility**
  - D1.1: On `/jobs`, students see a curated list of **open, approved, active, non-rejected** jobs only.
  - D1.2: Students **do not** see employer/admin-only expired or paused job lists in the main UI.
  - D1.3: On `/jobs/:id`, they see a clear distinction between **in-app** and **external/quick-link** jobs, with consistent messaging.
  - D1.4: “My applications” is available in at least one canonical place (linkable from dashboard and jobs module) with consistent status labels.

- **D2 – Actions**
  - D2.1: On listings/detail pages, a student can:
    - Open job details.
    - Apply **in-app** exactly once per job while job is open and before the deadline.
    - For external (quick-link) jobs, follow the link out with a clear confirmation, but no in-app application record is required unless specifically designed.
    - Bookmark jobs; view them later.
    - Request connection with employers (where the employer identity is available) and then message via `/messages`.
  - D2.2: In “My applications”, student can:
    - See a **reverse chronological** list of in-app applications.
    - Filter by canonical status (Submitted, Under review, Shortlisted, Interviewing, Offered, Hired, Rejected, Withdrawn).
    - Open the related job details and view the resume they used (via a signed URL) where available.
  - D2.3: Students must **never** see other applicants or their data.

- **D3 – Constraints & security expectations**
  - D3.1: Job visibility and application creation are enforced by **RLS and server-side checks**, not just frontend conditions.
  - D3.2: A student cannot create or edit jobs, cannot change application statuses, and cannot see owner-only controls like pause/resume.
  - D3.3: Resumes are served via short-lived signed URLs from a private bucket; raw storage paths/keys are not exposed.
  - D3.4: Any errors from RLS / validation are translated to user-friendly toasts (no leaking SQL or internal messages).

### 3.2 Current implementation (from code)

- **C1 – Visibility & listing filters**
  - C1.1: `/jobs` in `App.js` renders `JobListingsPage` behind `RequireCompleteProfile` + `ProtectedRoute requiredPermission="view:jobs"`.
  - C1.2: `useOpenJobs({ role, search })` selects from `jobs`, then for applicant roles (`role === 'student' || 'alumni'`) filters client-side to **non-expired** rows where `deriveJobStatus(row) === 'open'` (i.e., `is_approved = true`, `is_rejected != true`, not deadline-passed, not paused/closed). This matches D1.1 in spirit.
  - C1.3: `useExpiredJobs` is invoked only if `expiredOnly` is true and `isAdmin(role)` (or via `JobsList`/`JobsPage`, `isAdmin(role) || isEmployer(role)`), so students do *not* see expired lists.
  - C1.4: S3 JobDetails fetches a single job via `get_job_details` and normalizes fields. Visibility of that RPC is left to RLS; frontend does not try to bypass it.

- **C2 – Apply & quick-link behavior**
  - C2.1: Card-level apply controls in `JobListingsPage` derive `applyState = computeJobApplyState(job)` and booleans `{ canApplyInApp, canApplyExternally, isClosed, isQuickLink }`.
  - C2.2: For `userRole` ∈ {`alumni`, `student`}:
    - If quick-link and `canApplyExternally`, the CTA is **“Apply on employer site”** with a confirmation dialog before opening the external URL in a new tab.
    - If non-quick and `canApplyInApp` and `hasApplied === false`, the CTA is **“Apply now”**, opening `ApplyDialog` with `jobId` and `deadline`.
    - After a successful in-app apply, `hasApplied` is derived from `job_applications` via `getAppliedJobIdsForCurrentUser`, and the CTA becomes **“Application submitted”** (disabled).
    - If `isClosed` or deadline passed, CTAs degrade to **“Applications closed”**.
  - C2.3: Employers see “Accepting applications” / “Applications closed” informational buttons instead of apply actions; admins/owners see **“Manage applications”**.

- **C3 – My applications surfaces**
  - C3.1: `ApplicationTracking` (`/jobs/applications`) queries `job_applications` joined to `jobs`, infers `source_type` client-side from `apply_url`/`application_url`/`external_url`, and **filters to `source_type === 'in_app'`**, then signs resume URLs. Status is normalized and filterable; route is further constrained to `userRole` ∈ {student, alumni}.
  - C3.2: `JobApplicationStatus` (`/my-applications`) also joins `job_applications` to `jobs`, normalizes status with `normalizeStatus`, shows a badge and signed resume link. It does **not** apply a quick-link filter but, in practice, there are no quick-link application rows being written.
  - C3.3: Both views rely on RLS in `job_applications` so that `applicant_id` == current user; no client-supplied user id is used in the queries.

- **C4 – Ownership & employer/admin actions**
  - C4.1: `ManageJobApplications` computes `actualJobId` from route params, fetches the job row from `jobs`, and if not admin, applies an **ownership OR filter** on `posted_by`, `user_id`, `created_by` to prevent non-owners from seeing applications.
  - C4.2: Once ownership is confirmed, it calls `supabase.rpc('get_applications_for_job_v2', { p_job_id, p_limit, p_offset })`, sorts rows, and signs resumes. Status updates call `supabase.rpc('set_application_status', { p_application_id, p_status, p_notes: null })` with client-side whitelist `CANONICAL_DB_VALUES`.
  - C4.3: Error handling for RLS failures in `handleStatusChange` maps DB errors to **“Only the job owner can manage applications.”**

### 3.3 Alignment (Student: desired vs current)

- **A1 – Listing & visibility**
  - A1.1: `useOpenJobs` + `deriveJobStatus` + deadline filtering means students see only open, approved, non-rejected, non-expired jobs → **matches D1.1** from the frontend side, assuming RLS on `jobs` mirrors the same rules.
  - A1.2: Students cannot toggle the expired-only view in `JobListingsPage` and `JobsPage` → **matches D1.2**.

- **A2 – Apply behavior**
  - A2.1: Per job, frontend enforces a clean apply matrix: single in-app apply with dedup based on `job_applications`, closed when past deadline or paused/rejected → **matches D2.1** conceptually.
  - A2.2: External quick-link jobs only expose an external apply CTA without trying to log in-app applications → **aligned with D2.1** (no tracking for external-only flows by design).

- **A3 – My applications behavior**
  - A3.1: ApplicationTracking provides detailed in-app application tracking with filtering and signed resume URLs, which **matches D2.2** for in-app applications.
  - A3.2: JobApplicationStatus offers a simpler list; together they cover the visibility requirement, though there is some duplication of purpose.

- **A4 – Security & constraints**
  - A4.1: Students never see other applicants: all `job_applications` reads are applicant-scoped and RLS-guarded; ownership checks live only in S9 for employers/admins → **matches D2.3 / D3.2**.
  - A4.2: Resume links are always issued through short-lived signed URLs from the `resumes` bucket; raw storage paths are not rendered in the UI → **matches D3.3**.
  - A4.3: RLS / approval errors in job posting and status updating are explicitly mapped to friendly messages (e.g., employer approval required) → **aligns with D3.4**.

### 3.4 Open questions / gaps to verify (not new features)

These are **verification items**, not feature requests.

- **G1 – Single canonical “My applications” surface**
  - Today both ApplicationTracking (S7) and JobApplicationStatus (S8) exist and are routable. The desired contract is “one canonical My applications experience”; reality is “two partially overlapping views”.
  - **Check:** Which route is linked from Dashboard and navigation? Treat that as canonical and ensure the other is either deprecated or clearly secondary.

- **G2 – Quick-link application tracking**
  - In practice, only in-app applications result in `job_applications` rows. Quick-link jobs currently do not create in-app records.
  - **Check:** This is acceptable if the product intent is “external applications are not tracked in-app”. If that intent changes, RLS-safe tracking endpoints would be required.

- **G3 – Consistency of status vocabulary**
  - Status normalization happens in multiple helpers (`applicationStatus`/`normalizeStatus`, JobApplicationStatus, ApplicationTracking, ManageJobApplications). Some legacy status values may flow through and get mapped.
  - **Check:** Confirm the canonical allowed DB values and ensure all frontend mapping tables and admin tools only emit these.

- **G4 – RLS alignment for jobs visibility**
  - Frontend assumes that `deriveJobStatus === 'open'` plus deadline logic matches RLS visibility of `jobs` for students (i.e., they cannot see unapproved/pending or rejected jobs).
  - **Check:** Audit RLS policies on `public.jobs` to confirm that students can only select from rows that are effectively considered “open” by the frontend logic.

- **G5 – Employer vs applicant role edges**
  - `ApplicationTracking` hard-blocks non-student/alumni users at component level; `ProtectedRoute` uses permissions. It is possible for a user with both applicant-like role and employer privileges to have an ambiguous experience.
  - **Check:** Confirm effective roles and permissions for hybrid users (alumni who are also employers) and ensure they can still see their own applications without conflicting guards.

---

## 4. How to Use This Document

- **Product & UX**
  - Treat S1–S15 and Section 2 as the canonical description of what the Job Portal exposes for each role.
  - When adjusting flows (e.g., moving My applications entry points, changing quick-link copy), update this spec to remain in sync.

- **Frontend Engineering**
  - Use this as a contract for:
    - Which components are considered **canonical** (e.g., `JobListingsPage`, `JobDetails`, `ApplicationTracking`) vs legacy.
    - What role gates and feature flags you must preserve when refactoring.
  - When consolidating overlapping surfaces (e.g., S7 vs S8), document the change here.

- **Backend / RLS**
  - Use the data source lists and student desired contract (3.1) to review:
    - RLS policies on `jobs`, `job_applications`, `job_bookmarks`, `companies`.
    - RPCs `get_job_details`, `get_applications_for_job_v2`, `set_application_status` for correct ownership and role checks.
  - Any change in job visibility rules or application lifecycle should be reflected here and in the relevant RPCs.

- **QA**
  - Use Sections 2 and 3 as baseline checklists for end-to-end Student Job Portal testing:
    - Listings/visibility, apply flow, My applications, and absence of cross-user data leakage.
  - Mirror the same pattern to derive focused tests for Alumni, Employer, and Admin roles.
