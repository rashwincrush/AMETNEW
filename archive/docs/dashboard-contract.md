# Dashboard Contract (Canonical Spec)

_Last updated: 2025-12-10_

## 0. Scope & Overview

This document defines the **canonical contract** for the unified application dashboard implemented by `frontend/src/components/Dashboard/AlumniDashboard.js`.

- **Unified landing:** All roles (Student, Alumni, Employer, Admin, Super Admin) land on this same React component via `getDashboardComponent()` in `App.js`.
- **Role behavior:** Differences are mostly **visibility/gating** of certain sections and **downstream permissions** in feature modules (events, jobs, groups, mentorship, admin tools).
- **Backend:** Most dashboard data comes from a single RPC `get_dashboard_summary_for_user` plus a few specialized RPCs and direct table queries.

This file is the **source of truth** for:

- Dashboard **sections** and their responsibilities
- **Data sources** (frontend hooks + RPCs/tables)
- **Navigation targets** (routes)
- **Role gating rules** (Student, Alumni, Employer, Admin/Super Admin)
- A **Student "desired vs current" diff** for auditing behavior

---

## 1. Dashboard Sections (Canonical Contract)

The table below defines dashboard sections as they should behave conceptually.

### 1.1 Section matrix

| ID | Section | Description / Purpose | Frontend data source | Backend objects / RPCs | Primary routes | Role gating (visibility)
|----|---------|-----------------------|----------------------|------------------------|----------------|---------------------------|
| S1 | **Header – Welcome** | Top-level heading: `Welcome back, {userName}!`. No actions. | `useAuth` → `user`, `profile` (`full_name` / `user_metadata.full_name` / `email`) | `auth.users`, `public.profiles` (for current user) | None | **All roles**: student, alumni, employer, admin, super_admin |
| S2 | **Pending Approval Banner** | Yellow browse-only banner explaining that the account is under review and some actions are disabled until approval. | `useAuth` + `useApproval` → `approvalFlags`, `approvalStatus`, `isFullyApproved`, `userRole` | Approval-related tables/RPCs behind `useApproval` (e.g. profile approval status) | None (informational only) | **Shown** when: `!approvalLoading && approvalFlags && userRole !== 'employer' && !isAdminLike && isTrulyPending && !isFullyApproved`. Effectively: pending **non-employer, non-admin**. |
| S3 | **Welcome Guide** (`<WelcomeGuide />`) | First-time user onboarding card with steps (complete profile, explore directory, discover events, mentorship / jobs). Tracks completion locally. | `useAuth` (`profile`, `userRole`) + `localStorage` keys `forgecircle_welcome_dismissed`, `forgecircle_onboarding_steps` | `public.profiles` to infer "profile complete"; no server state for step completion (localStorage only) | `/profile`, `/directory`, `/events`, `/mentorship`, `/jobs/post` | **All roles**, steps are role-aware: alumni get mentorship step; employers get `Post a job` step; students behave like alumni minus employer-specific job posting. |
| S4 | **Top Quick Actions (mobile)** (`<QuickActions />`) | Compact row of shortcuts for primary actions on small screens. | Static config in `WelcomeGuide` module + `userRole` | None (only routes; real logic lives in destination pages) | Typically `/profile`, `/directory`, `/events`, `/jobs`, `/mentorship`, `/groups`, etc. | **All roles**, but mobile-only (`md:hidden`). Exact actions can be role-aware but the presence of the block itself is not gated. |
| S5 | **Stats Cards Block** | 4 KPIs: Total Alumni, Upcoming Events, Job Opportunities, Connections. Read-only metrics. | `dashboardData.counts` from `supabase.rpc('get_dashboard_summary_for_user', { p_user_id })` | RPC: `get_dashboard_summary_for_user` summarizing counts from: `public.profiles` (alumni), `events`, `jobs`, `connections`, `messages`/`conversations` (for unread count) | None in current UI (numbers are not clickable) | **All roles**; values are personalized per user but there is no per-role hide. |
| S6 | **My Groups/Chapters Widget** (`<MyGroupsWidget />`) | Shows up to 3 groups/chapters the user belongs to or has pending invites. Includes empty state + CTA to explore groups. | `fetchMyGroupsSummary(3, user.id)` + realtime subscription on `public.group_members` | Helper: `fetchMyGroupsSummary` (joins `group_members` + `groups`). Realtime: `group_members`. | `/groups` (explore CTA), `/groups/:id` (each group row) | **All signed-in roles**. Exact privileges inside group pages are governed by RLS and group role. |
| S7 | **Recent Activities Widget** (`<ActivitiesWidget />`) | List of last 5 actions (RSVPs, job applications, connections, group joins, mentorship). Read-only, timestamped. | `supabase.rpc('get_recent_activity', { p_limit: 5 })` + realtime on multiple tables | RPC: `get_recent_activity`. Realtime: `event_attendees`, `job_applications`, `connections`, `group_members`, `mentorships`. | None (rows are not links presently) | **All roles**. Activities are scoped to the current user via the RPC contract. |
| S8 | **Upcoming Events Panel** | Shows upcoming events for the user, with empty state and CTA. | `dashboardData.upcomingEventsList` from `get_dashboard_summary_for_user` | RPC: `get_dashboard_summary_for_user` (events slice). Tables: `events`, `event_attendees` (for relevant subset). | `/events/:id` (each event), `/events` (View All). | **All roles**. |
| S9 | **Recommended Jobs Panel** | Recommended jobs list + empty state. Gives quick navigation to jobs and applications. | `dashboardData.jobRecommendationsList` from `get_dashboard_summary_for_user` | RPC: `get_dashboard_summary_for_user` (jobs slice). Tables: `jobs`, `job_applications`. | `/jobs/:id` (each job), `/jobs` (Browse All), `/my-applications` (View My Applications). | **Hidden for employers** (`isEmployer === true`). **Shown** for students, alumni, admins/super_admin. |
| S10 | **Bottom Quick Actions Grid** | Grid of navigation cards: Find Alumni, Create Event, My Applications, Find Mentor, Join Groups. | Static configuration inside `AlumniDashboard` using `userRole` to compute `isStudent`. | No direct data; cards link into modules that operate on `profiles`, `events`, `jobs`/`job_applications`, `mentorship_*`, `groups`/`group_members`. | `/directory`, `/events/create`, `/my-applications`, `/mentorship`, `/groups`. | Container visible to **all roles**. **Create Event** card hidden for `student`; others visible for everyone. |

---

## 2. Role Views (Canonical "What Each Role Sees")

This section summarizes how each role should experience the dashboard, using the sections above.

### 2.1 Student

- **Landing:** `AlumniDashboard` as main/home.
- **Sections visible:**
  - S1 Header, S2 Pending Banner (when pending), S3 Welcome Guide, S4 Quick Actions (mobile), S5 Stats, S6 My Groups, S7 Recent Activities, S8 Upcoming Events, S9 Recommended Jobs, S10 Quick Actions Grid (without Create Event card).
- **Core behaviors:**
  - Network: browse alumni (directory), send **connection requests**, join groups.
  - Opportunities: browse/apply to jobs; see and manage **job applications**.
  - Events: browse and RSVP to events.
  - Mentorship: browse mentors, send **mentorship requests**, manage their side of the relationship.
  - Creation: **cannot create events** from dashboard quick actions.

### 2.2 Alumni

- **Landing:** Same dashboard.
- **Sections visible:**
  - S1, S2 (when pending), S3, S4, S5, S6, S7, S8, S9, S10 (including Create Event card if not blocked elsewhere).
- **Core behaviors:**
  - All student behaviors, plus:
    - Can **offer mentorship** (set availability, manage mentee requests) where permitted by role/RLS.
    - Can **create events** (subject to permissions) via `/events/create`.

### 2.3 Employer

- **Landing:** Same dashboard.
- **Sections visible:**
  - S1, S3, S4, S5, S6, S7, S8, S10. (S2 pending banner and S9 Recommended Jobs are suppressed.)
- **Core behaviors:**
  - Post and manage jobs via downstream routes (`/jobs/post`, `/jobs`).
  - Possibly create and manage employer-branded events (`/events/create`).
  - Browse alumni/directory as candidates (directory and groups), subject to RLS and privacy settings.
  - Recommended Jobs is **not shown**, as employers are not job-seeking users here.

### 2.4 Admin / Super Admin

- **Landing:** Same dashboard, acts as *personal* home (not admin control plane).
- **Sections visible:**
  - S1, S3, S4, S5, S6, S7, S8, S9, S10. S2 (Pending Banner) is hidden for admin-like users.
- **Core behaviors:**
  - Use dashboard primarily to see their own stats and quick navigation.
  - Platform-level admin controls (user approvals, verification, role changes, audits) live under **separate admin routes** and components (`components/Admin/*`, e.g. `AdminDashboard`, `UserApprovalDashboard`, `DataVerificationDashboard`).
  - Have elevated permissions in downstream modules (events, jobs, groups, mentorship), enforced via RLS and secure RPCs.

---

## 3. Student Role – Desired vs Current Behavior

This section focuses on the **Student** role to compare the intended contract ("desired") vs what the current implementation actually does ("current"). It is meant as a lightweight audit, not a full QA spec.

### 3.1 Desired behavior (Student)

For a user whose effective role is `student`:

- **D1 – Visibility**
  - D1.1: Sees S1–S10, with these exceptions:
    - S2: Shown only while approval is `pending`.
    - S9: Shown (students can see recommended jobs).
    - S10: Create Event card hidden; other cards visible.

- **D2 – Actions from dashboard**
  - D2.1: Can **navigate** to all major functional modules:
    - Directory: `/directory` to search alumni and send connection requests.
    - Groups: `/groups` to discover and **request to join** groups; actual membership governed by DB triggers and RLS.
    - Events: `/events` and `/events/:id` to **RSVP** to events they are allowed to attend.
    - Jobs: `/jobs` and `/jobs/:id` to **apply to jobs**; `/my-applications` to view/manage their own applications.
    - Mentorship: `/mentorship` to **request mentorship** and interact with mentors.
  - D2.2: Cannot create admin-level resources like events directly from dashboard quick actions:
    - S10 Create Event should not be present for `student`.
  - D2.3: All state-changing operations (RSVP, apply, join, request mentorship, send connection request) are validated and enforced server-side via RLS and secure RPCs.

- **D3 – Constraints & feedback**
  - D3.1: While `pending` approval, Student can **browse** but privileged actions may be limited; the banner (S2) clearly communicates this.
  - D3.2: Errors and network issues are surfaced through toasts or inline messages (e.g., dashboard summary failing, groups widget errors) but should not crash the page.

### 3.2 Current implementation summary (from code)

Based on `AlumniDashboard.js`, `WelcomeGuide.jsx`, `MyGroupsWidget.jsx`, and `ActivitiesWidget.jsx`:

- **C1 – Visibility logic**
  - C1.1: `role` is derived from `useAuth` (`userRole` or `profile.role` or `getUserRole()`). `isStudent` is `role === 'student'`.
  - C1.2: S2 Pending Banner is rendered when: `!approvalLoading && approvalFlags && userRole !== 'employer' && !isAdminLike && isTrulyPending && !isFullyApproved`. Students meet this when pending.
  - C1.3: S9 Recommended Jobs is hidden only for `isEmployer === true`. Students therefore see S9.
  - C1.4: In S10 Quick Actions Grid, the Create Event card is wrapped in `!isStudent`, so Students do **not** see that card.

- **C2 – Data and RPCs**
  - C2.1: `fetchDashboardData` calls `supabase.rpc('get_dashboard_summary_for_user', { p_user_id: user.id })` to populate:
    - `totalAlumni`, `personalConnections`, `upcomingEventsCount`, `jobOpportunitiesCount`, `unreadMessagesCount`, `upcomingEventsList`, `jobRecommendationsList`.
  - C2.2: `MyGroupsWidget` calls `fetchMyGroupsSummary(3, user.id)` and subscribes to `public.group_members` for realtime updates.
  - C2.3: `ActivitiesWidget` calls `supabase.rpc('get_recent_activity', { p_limit: 5 })` and subscribes to realtime updates across: `event_attendees`, `job_applications`, `connections`, `group_members`, `mentorships`.

- **C3 – Navigation**
  - C3.1: Welcome Guide steps link to `/profile`, `/directory`, `/events`, `/mentorship` (for alumni/user roles). Employer-specific `Post a job` is behind `userRole === 'employer'`.
  - C3.2: Upcoming Events (S8) links to `/events/:id` and `/events`.
  - C3.3: Recommended Jobs (S9) links to `/jobs/:id`, `/jobs`, and `/my-applications`.
  - C3.4: S10 Quick Actions Grid links to `/directory`, `/events/create` (hidden for students), `/my-applications`, `/mentorship`, `/groups`.

### 3.3 Alignment (Student: desired vs current)

From the comparison above:

- **A1 – Section visibility**
  - A1.1: Students see S1–S10 with the correct gating:
    - S2 shown only for pending, non-admin, non-employer → **matches D1.1.**
    - S9 visible for non-employers → Students see Recommended Jobs → **matches D1.1.**
    - S10 hides Create Event when `isStudent` → **matches D1.1.**

- **A2 – Navigation paths**
  - A2.1: All expected navigation targets are present:
    - Directory, Groups, Events, Jobs, Mentorship, My Applications – **matches D2.1.**

- **A3 – Behavior surface**
  - A3.1: Dashboard does not itself implement state-changing operations; it links into dedicated modules that handle apply/join/RSVP/requests. This **matches D2.3** as long as those modules correctly enforce RLS and secure RPC usage.

### 3.4 Open questions / potential gaps (to verify)

These are **not confirmed bugs**, but areas to validate against the contract and backend/RLS:

- **G1 – Scope of `get_recent_activity`**
  - Question: Does `get_recent_activity(p_limit := 5)` filter activities **per current user**, or could it include global activity? The widget assumes the RPC is user-scoped.
  - Action: Confirm RPC definition in Supabase; ensure it always filters by the authenticated user id (from auth context) or session, not by a client-supplied `user_id` param.

- **G2 – Recommended Jobs eligibility for Students**
  - Question: Are jobs in `jobRecommendationsList` filtered for **student-eligible** or generally open roles? For example, an employer-only job type should not appear to a student.
  - Action: Review `get_dashboard_summary_for_user` implementation to confirm its job recommendation logic and ensure it respects job visibility rules by role and RLS.

- **G3 – Pending approval enforcement depth**
  - Observation: The Pending Banner (S2) is purely informational; enforcement of "browse-only" behavior must be done via permissions/RLS in events, jobs, groups, connections, and mentorship modules.
  - Action: Validate per-module that a `pending` student cannot: post jobs, create events, or perform any action that contractually requires full approval.

- **G4 – Event creation hardening for Students**
  - Current UI hides the Create Event quick action when `isStudent`, but there may be other paths to `/events/create` (e.g., direct URL entry or shared links).
  - Action: Ensure the `/events/create` route and underlying APIs enforce role-based authorization (disallowing `student` from creating events even if they hit the URL manually).

- **G5 – Error handling consistency**
  - `AlumniDashboard` uses toasts and spinner fallbacks when RPCs fail or time out. Other downstream modules (jobs, events, groups, mentorship) may have their own patterns.
  - Action: For Student flows, review those modules to ensure consistent, non-leaky error feedback (no raw error messages, no stack traces, no exposure of internal IDs in user-facing text).

---

## 4. How to Use This Document

- **Product & UX:** Use sections 1–2 as the canonical definition of what the dashboard is supposed to expose for each role.
- **Frontend:** Treat this as a contract; when refactoring `AlumniDashboard` or related widgets, update this spec to match any intentional changes.
- **Backend & RLS:** Use the data source/backend columns and G1–G5 to audit RPCs and Row-Level Security policies to ensure they align with the intended per-role behavior.
- **QA:** Use section 3 as a starting checklist for Student dashboard testing; extend the same pattern to Alumni, Employer, and Admin roles as needed.
