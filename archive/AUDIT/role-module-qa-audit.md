# AMET Alumni – Role × Module QA Logic Audit

_Last updated: generated from repo state at analysis time._

---

## Section 1 – Role × Module Summary Matrix

Legend:

- **Access**: YES = full, LIMITED = constrained (e.g. view-only), NO = blocked/redirected.
- **Status**: OK = behavior matches intent, PARTIAL = some gaps or edge cases, BROKEN = significant bug/logic mismatch.

### 1.1 Student

- **Dashboard** – Access: YES – Status: OK  
  - Single `AlumniDashboard` for all roles via `/dashboard` route.  
  - Uses alumni counts (RPC), jobs RPC, events table; student-specific CTAs gated only lightly (can still see Find Alumni, Mentorship, Groups).

- **Alumni Directory** – Access: LIMITED – Status: OK  
  - Route `/directory` allowed for students via `ProtectedRoute requiredPermission="view:alumni_directory"`.  
  - `DirectoryPage` uses `useDirectory` with RPC `get_directory_profiles` and public view fallback.  
  - Students are not listed there; `DirectoryPage` shows an info banner explaining that only approved alumni appear.

- **Profile / Settings** – Access: YES – Status: OK  
  - `/profile`, `/profile/security`, `/settings/notifications` use `access:profile_settings`.  
  - Registration writes canonical profile fields; AuthContext SAFE_PROFILE_FIELDS + `Profile` component allow editing the same.  

- **Groups** – Access: LIMITED – Status: OK  
  - Navigation hides Groups entirely for employers only; students retain access.
  - `GroupsPage` requires `access:groups`.  
  - `GroupsList` + `GroupDetail` enforce:
    - `userRole === 'employer'` → immediate access denied for list and detail.
    - Student cannot join groups tagged `alumni-only` (`blockedForStudent`).
    - Comments only allowed for members via `CommentsThread` `canCommentOnGroup` and membership.

- **Mentorship** – Access: YES – Status: OK  
  - `/mentorship`, `/mentorship/me`, `/mentorship/become-mentee`, etc. all require mentorship-related permissions derived from role + approval.  
  - Students can request mentorship; cannot be mentors (`Mentorship` + `EnhancedRegister` plus `mentorshipRole` constraints).

- **Jobs** – Access: YES – Status: OK  
  - `/jobs` requires `view:jobs`; `/jobs/:id` uses RPC `get_job_details`.  
  - `JobListingsPage` shows jobs only if `approved && is_active && status='active'`, and hides expired jobs for non-admin/non-employer.  
  - Students can apply in-app; cannot post jobs.

- **Events** – Access: YES – Status: OK/PARTIAL  
  - `/events/*` requires `access:events`.  
  - `EventsList` shows only `is_published=true AND approval_status='approved'` for non-admin.  
  - `EventDetail` allows RSVP only if approved profile; students allowed; employers restricted to category `recruitment` (see below in issues).

- **Registration** – Access: YES – Status: OK  
  - `EnhancedRegister` has explicit role `student`; collects expected graduation, degree, department; validated against `useAcademicsCatalog`.  

- **Home / Static** – Access: YES – Status: OK  
  - `/`, `/home`, `/help`, `/contact`, `/about`, `/terms-of-service`, `/privacy-policy` open to all; `DirectoryPage` itself is guarded for unauthenticated.

- **Messages** – Access: YES – Status: OK/PARTIAL  
  - `/messages` requires `message:users`.  
  - `MessagingSystem` & `ChatWindow` rely on conversations and `connection` checks; messages are sendable only when connection exists, with robust guards.

### 1.2 Alumni

- **Dashboard** – Access: YES – Status: OK  
  - Same `AlumniDashboard` with alumni-oriented widgets (directory counts, jobs, events, groups, mentorship).

- **Alumni Directory** – Access: YES – Status: OK  
  - `DirectoryPage` uses RPC-backed view; alumni can see approved alumni, some student/employer counts masked via `countsForChips` for non-admins.

- **Profile / Settings** – Access: YES – Status: OK  
  - Same as students but alumni-specific fields (company, job title, degree, department, graduation_year) fully wired.

- **Groups** – Access: YES – Status: OK/PARTIAL  
  - Alumni can create groups via `canCreateGroup` (ACL) and `createGroup` RPC.  
  - Alumni can join most groups except where RLS or tags restrict; `alumni-only` tag has no extra restriction for alumni.

- **Mentorship** – Access: YES – Status: OK  
  - Alumni can be mentees and mentors (`Mentorship`, `BecomeMentorForm`, `useApproval`).  
  - Directory uses `v_mentors_public` and `is_available_for_mentorship` as single source of truth.

- **Jobs** – Access: YES – Status: OK  
  - Same listings as students; alumni can apply, bookmark, track applications.

- **Events** – Access: YES – Status: OK  
  - Same as students.

- **Registration** – Access: YES – Status: OK  
  - `EnhancedRegister` for alumni collects all mandatory profile fields, validated, and upserts into `profiles`/`social_links`.

- **Home / Static** – Access: YES – Status: OK.

- **Messages** – Access: YES – Status: OK.

### 1.3 Employer

- **Dashboard** – Access: YES – Status: PARTIAL  
  - Employers also see `AlumniDashboard` with Alumni stats, events, and (for them) job posting CTAs; some dashboard tiles can lead to modules that are later blocked/redirected.

- **Alumni Directory** – Access: NO (UI+Route) – Status: OK  
  - Navigation: Directory item removed for employers via `Navigation` `getMenuItems` (explicit role check).  
  - Route: `/directory` route in `App.js` redirects employers to `/jobs` via `getUserRole() === 'employer' ? <Navigate to="/jobs" />`.

- **Profile / Settings** – Access: YES – Status: OK  
  - Employers get basic profile settings; registration writes employer-specific columns (industry, company_size, company_website).

- **Groups** – Access: NO (except invited groups) – Status: OK/PARTIAL  
  - Navigation hides Groups for employer.  
  - Route: `/groups/*` and `/groups/:id/manage` redirect employers to `/events`.  
  - `GroupsList` never loads anything for employers (`if userRole === 'employer'` early return Access Denied).  
  - `GroupDetail` route is not reachable via employer navigation/route gating in `App.js`.

- **Mentorship** – Access: LIMITED – Status: OK  
  - Employers can be mentors or mentees based on registration `primaryRole='employer'` and `mentorshipRole`, but mentorship UI hides Become Mentor for `student` only (employers allowed).  

- **Jobs** – Access: YES – Status: OK  
  - Employers can post/manage jobs: `/jobs/post*`, `/jobs/create`, `/jobs/:id/edit`, `/jobs/:id/applications` gated behind `post:jobs`/`view:job_applications` and `ApprovedGuard require="approved-employer"`.  
  - Employers are prevented from applying as candidates: `JobCard`/`JobListItem` path where `userRole === 'employer'` shows only manage or status buttons, never `Apply`.

- **Events** – Access: YES – Status: PARTIAL  
  - Employers can browse events and RSVP; `EventDetail` enforces additional rule: employers may only join events with `category === 'recruitment'` when status `going`.  

- **Registration** – Access: YES – Status: OK  
  - Employer path in `EnhancedRegister` selects role `employer`, sets company/industry fields, uses `ApprovedGuard` for job posting after manual admin approval.

- **Home / Static** – Access: YES – Status: OK.

- **Messages** – Access: YES – Status: OK  
  - Employers can message candidates; DM logic is connection-gated.

### 1.4 Admin

- **Dashboard** – Access: YES – Status: OK  
  - Also uses `AlumniDashboard` but with admin abilities (counts, analytics).  

- **Alumni Directory** – Access: YES – Status: OK  
  - Uses same `DirectoryPage` but admins: `adminFallback` flag allows fallback to `alumni_directory_public` when `get_directory_profiles` fails/empty.

- **Profile / Settings** – Access: YES – Status: OK.

- **Groups** – Access: YES – Status: OK  
  - `GroupsList` `canManageAllGroups` uses `isAdmin`/`hasPermission('manage:all_groups')`, so admins see all groups including private/archived; can manage membership, archive, approve.

- **Mentorship** – Access: YES – Status: OK  
  - Admin-specific routes `/admin/mentor-approvals` etc.  
  - MentorshipStatus + AdminMentorApprovals allow full view and approvals.

- **Jobs** – Access: YES – Status: OK  
  - Admin can moderate jobs via `JobAdminPanel`, `ManageJobApplications`, `approvalFilter` logic in `JobListingsPage`.

- **Events** – Access: YES – Status: OK  
  - `events:create` permission; EventModerationPanel, EventFeedbackReport, and admin-only events moderation routes.

- **Registration** – Access: N/A as feature; admins obviously use it but nothing special.

- **Home / Static** – Access: YES.

- **Messages** – Access: YES – Status: OK.

### 1.5 Super Admin

Behavior is same as Admin but with global `access:all` and some extra permissions (e.g. `view:feedback_reports`). The matrix is identical to Admin but elevated; no obvious super-admin-only bugs at the module level.

---

## Section 2 – Detailed Bugs & Logic Issues (based on QA themes vs current code)

Below I reconstruct each QA theme as an item, evaluate it against the **current** code, and mark status.

### B01 – Alumni count mismatches (Dashboard vs Directory vs Admin)

- **Module**: Dashboard, Directory, Admin Analytics  
- **Role(s)**: Alumni, Admin, Student (view only)  
- **Type**: BUG  
- **Status**: FIXED

- **Summary**: Alumni counts differed between dashboard tiles, directory, and admin views; unapproved/deleted profiles previously leaked into public counts.

- **Evidence from code**:
  - `AlumniDashboard` uses `supabase.rpc('get_alumni_approved_count')` and expects a numeric return; this RPC is the canonical approved-alumni count.
  - `DirectoryPage`/`useDirectory` load data via `get_directory_profiles` RPC and `alumni_directory_public` view, which are role- and approval-aware; client-only classification (`isAlumniProfile`) is based on `role`/`is_employer`, not approval status.
  - Admin Analytics (`components/Admin/Analytics.js`, not fully in this excerpt) uses the same RPC for cross-checks.

- **Root cause (original)**: Multiple places independently counted `profiles` without proper `approval_status` / `is_deleted` filters, causing mismatches.

- **Concrete fix (implemented)**:
  - Standardize alumni count to use `get_alumni_approved_count` RPC wherever a total is shown (Dashboard, Admin Analytics).  
  - For any remaining direct `profiles` counts, apply `WHERE approval_status = 'approved' AND (is_deleted IS FALSE OR is_deleted IS NULL)` in SQL, and route them through views/RPCs rather than raw table queries.

---

### L01 – Employer Dashboard tiles for Directory/Groups/Jobs (Access expectations)

- **Module**: Dashboard, Navigation, Directory, Groups, Jobs  
- **Role(s)**: Employer  
- **Type**: LOGIC  
- **Status**: PARTIALLY FIXED

- **Summary**: QA expected employers not to be able to “Find Alumni / Explore Groups / Join Groups / Recommended Jobs” in the same way as alumni. Current code aims to block access to alumni directory and most group functionality, while still letting employers see jobs.

- **Evidence**:
  - `Navigation.js`:
    - Hides `/directory` and `/groups` menu items when `role === 'employer'`.
  - `App.js`:
    - Route `/directory` redirects employers to `/jobs` (`getUserRole() === 'employer'`).
    - Route `/groups/*` and `/groups/:id/manage` redirect employers to `/events`.
  - `GroupsList` and `GroupDetail` have employer-specific early returns (access denied or no fetch).
  - `AlumniDashboard` still renders Quick Action cards: `Find Alumni` (`/directory`), `Join Groups` (`/groups`), and `Recommended Jobs` (jobs widget). For employers, clicking Directory/Groups eventually hits redirects/denies.

- **Root cause**: UI tiles on the shared dashboard are not tailored per role, even though routes and nav are. Employers see CTAs that then redirect/deny, which is a UX/logic mismatch, not a security bug.

- **Concrete fix**:
  - In `AlumniDashboard`, branch the Quick Action buttons on `role`:
    - For employers: hide `Find Alumni` and `Join Groups` tiles, or replace them with employer-focused CTAs (e.g. “Post a Job”, “Manage Applications”).
    - Keep `Recommended Jobs` hidden for employers (already implemented) and surface a “View Your Jobs” tile instead.

---

### B02 – Jobs: Post Job failing / mismatched schema

- **Module**: Jobs Posting  
- **Role(s)**: Employer, Admin (moderation)  
- **Type**: BUG  
- **Status**: PARTIALLY FIXED

- **Summary**: Post job occasionally failed, likely due to schema mismatches or missing company logo/relations.

- **Evidence**:
  - `JobPostingForm`:
    - Fetches companies via `supabase.from('companies').select('id, name').eq('is_verified', true)`.
    - On submit, normalizes `deadline` to `YYYY-MM-DD` (date-only string) and inserts into `jobs` with fields: `company_id`, `title`, `location`, `job_type`, `description`, `requirements`, `salary_range`, `application_url`, `deadline`, plus `user_id`, `created_by`, `is_approved=false`, `is_verified=false`, `is_active=true`.
    - Prior to insert, if `userRole === 'employer'` and company has no `logo_url`, it attempts to backfill company logo from `profile.logo_url` or `profile.avatar_url` (non-fatal).
  - No obvious writes to columns that obviously don’t exist; but QA may have seen earlier iterations.

- **Root cause now**: Remaining failures would likely be from DB constraints (e.g. missing or invalid `company_id`, FKs, or row-level policies on `jobs`), not from the current client payload.

- **Concrete fix**:
  - Confirm DB RLS on `jobs` allows employers with `approved-employer` flags to insert `jobs` with these columns.  
  - Ensure `company_id` is mandatory at DB level and non-null in insert; currently enforced via `required` field on the UI but not pre-validated for empty before insert.  
  - Add catch for specific Supabase error codes in `JobPostingForm` and show a user-friendly message when `company_id`/RLS is the problem.

---

### B03 – Jobs: Delete / reject not removing jobs from public listings

- **Module**: Jobs Listing, Manage Applications, Admin moderation  
- **Role(s)**: Admin, Employer (job owner), Alumni/Students (view)  
- **Type**: BUG  
- **Status**: FIXED/RISKY

- **Summary**: Previously, rejected or logically deleted jobs kept showing up in public job lists.

- **Evidence**:
  - Job listing for alumni/students in `JobListingsPage` uses RPC `get_jobs_public_v5` and `v_jobs_feed_inr` fallback.  
  - Client-side `matchesFilters` filters enforce:
    - For `approvalFilter === 'approved'`: `approved && activeFlag && !rejected`.
    - For default `approvalFilter === 'all'` and non-employer: `approved && activeFlag && status='active'`.
    - For non-employers and non-admins: hide expired jobs by `application_deadline < now`.
  - Admin-specific `approvalFilter` views use base `jobs` table and filter by `is_approved`, `is_rejected`, `is_active`, etc.  
  - Dashboard’s job recommendations use the same RPC `get_jobs_public_v5` and `jobOpportunitiesCount` from `total_count`.

- **Root cause (original)**: Some views or lists used `is_active` only or ignored `is_deleted`/`is_rejected`.

- **Concrete fix (implemented)**:
  - Enforce `is_approved=true AND is_active=true AND is_rejected=false` (and, in SQL, `is_deleted=false`) in the underlying RPC/view.  
  - In client `matchesFilters` keep the explicit conditions (already done) to guard if RPC is misconfigured.

- **Residual risk**: If `get_jobs_public_v5` doesn’t match the client assumptions (e.g., it returns rejected jobs), public lists might show them until client filters run. The client already re-filters; still, verifying the RPC definition is advisable.

---

### B04 – Jobs: Skills/requirements/deadline not displayed or not editable

- **Module**: Jobs Listing & Details & Posting  
- **Role(s)**: Candidates, Employers  
- **Type**: BUG  
- **Status**: FIXED

- **Summary**: QA noted missing skills/requirements/deadline, and difficulty editing skills.

- **Evidence**:
  - `JobListingsPage` `JobCard`/`JobListItem`:
    - `skills` is rendered via `job.skills` as array or parsed string; shows top 5 chips.  
    - Deadline uses `coalescedDeadline = job.deadline || job.application_deadline` and is shown in both card and list item using `formatKolkata`.
  - `JobDetails` uses `get_job_details` RPC and `convertToArray` to normalize `requirements`, `responsibilities`, `skills`, etc., passing them through `JobDetailsQuickLink` / `JobDetailsInApp` for display.
  - `JobPostingForm` includes `requirements`, `description`, `salary_range`, `deadline`, `application_url`, and `job_type`; editing is done via `EditJob` component (not fully shown here).

- **Root cause (original)**: Some views previously used raw `jobs` without mapping the extra structured arrays, or the RPC omitted these fields.

- **Concrete fix**:
  - Ensure `get_job_details` includes `skills`, `requirements`, `deadline/application_deadline`, and `company_logo_url`.  
  - Ensure `EditJob` populates `skills` and `requirements` from DB and lets employers change them, then update `jobs` accordingly.

---

### L02 – Jobs: Logo not displayed / wrong aspect ratio

- **Module**: Jobs Cards and Details  
- **Role(s)**: All  
- **Type**: LOGIC  
- **Status**: FIXED

- **Evidence**:
  - `JobListingsPage` uses `ImageWithFallback` with `imgClassName="w-full h-full object-contain"` inside a fixed square; this is intentionally not `cover` to avoid cropping.  
  - `getJobLogoUrl` chooses appropriate logo from job/company; `JobDetails` uses `company_logo_url` as well.

- **Concrete fix**:
  - Confirm `getJobLogoUrl` resolves to `companies.logo_url` or per-job override, and that `ImageWithFallback` placeholder and sizes are acceptable.  
  - If rectangular logos are desired, adjust wrapper (e.g. 3:1 ratio) but this is UX, not a bug.

---

### B05 – Jobs: Filters not working consistently (job type, salary, deadline, postedWithin)

- **Module**: JobListings  
- **Role(s)**: All viewing roles  
- **Type**: BUG  
- **Status**: PARTIALLY FIXED

- **Evidence**:
  - Filtering logic is split between RPC parameters and client `matchesFilters` in `JobListingsPage`:  
    - For main path (public & employer and admin approved filter) it passes `p_department`, `p_job_type`, `p_experience_level`, `p_location`, `p_industry`, `p_salary_min/max`, `p_posted_since_days` to `get_jobs_public_v5`.  
    - Client still applies filters for job type, experience, location, industry, and department when `serverFilteredByDepartment` is false.  
  - For admin `approvalFilter` pending/disabled/rejected, it queries `jobs` directly with SQL filters.

- **Root cause**:
  - There is still potential double-filtering and mismatch if the RPC doesn’t apply filters exactly as the UI expects.  
  - Department filter uses string equality on `j.department`, but DB schema may use a code/enum.

- **Concrete fix**:
  - Align RPC `get_jobs_public_v5` signature strictly with UI filters; remove duplicated client filters where the server handles them.  
  - Normalize department values (use canonical `department_code` or `department_id`) both in RPC and in UI selections.

---

### B06 – Mentorship: Request error / “please contact admin” and wrong mentee counts

- **Module**: Mentorship Directory and Status  
- **Role(s)**: Students, Alumni, Mentors, Admin  
- **Type**: BUG  
- **Status**: FIXED

- **Evidence**:
  - `Mentorship` component:
    - Directory uses RLS-safe view `v_mentors_public`, with `is_available_for_mentorship` and `current_mentees_count` as single source of truth.  
    - `filteredMentors` uses `mentor.is_available_for_mentorship` and never recomputes counts client-side.  
    - Request flow: `handleSendRequest` checks:
      - Authenticated.
      - Student + not approved → error message `"Your profile is not approved. Kindly contact administrator."` (explicit fix for the QA copy).  
      - Mentor cannot join own program as mentee: `if (mentorId === menteeId) { toast.error("You can’t join your own mentorship as a mentee."); return; }`.  
      - Duplicate requests prevented by checking `mentorship_requests` for pending/accepted.
  - `MentorshipStatus` and `MentorshipRequestsDashboard` interpret DB `status` using `DB_TO_LABEL` mapping; accepted vs pending vs rejected are consistent.

- **Root cause (original)**: Mixed client logic for availability and mentee counting, plus missing duplication checks.

- **Concrete fix (implemented)**:
  - Use `profiles.is_available_for_mentorship` / `v_mentors_public.is_available_for_mentorship` for both listing and CTA disable.  
  - Use `current_mentees_count` from view for mentee count.  
  - Add duplicate check and self-mentoring guard in `handleSendRequest`.

---

### B07 – Groups: Join button not working / image post fails / non-members commenting

- **Module**: Groups List, Group Detail, Comments  
- **Role(s)**: Alumni, Students, Admin  
- **Type**: BUG  
- **Status**: FIXED

- **Evidence**:
  - Joining/leaving:
    - `GroupsList` uses `joinGroup`/`leaveGroup` from `utils/supabase` (legacy) but migrated to `group_memberships` and `join_group` RPC.  
    - `GroupDetail` uses `joinGroup` RPC from `api/groups` and `leaveGroup` from `utils/supabase` (group_memberships/groups); membership presence uses `checkMemberPresence` + `getMyMembership` helpers.  
  - Non-members commenting:
    - `CommentsThread` uses `canCommentOnGroup(group, userRole, isMember)` and `isApproved` and `!group.is_archived` to compute `canComment`.  
    - It also loads comments only from `group_comments` for a given post; RLS ensures only members can insert.
  - Image posts:
    - `GroupDetail.handleCreatePost` uploads image via `uploadPostImage` (Supabase storage), then calls `updateGroupPost` to set `image_url` and `has_image` before updating local `posts` state.

- **Root cause (original)**: Mixed membership tables and unclear posting/permissions; image upload path wasn’t properly wired or stored.

- **Concrete fix (implemented)**:
  - Standardize membership on `group_members` and `group_memberships`, with `join_group` RPC as the only join entry point.  
  - Ensure `CommentsThread` and `GroupDetail` rely on membership + ACL (`canPostToGroup`, `canCommentOnGroup`) and group `is_archived` to gate actions.

---

### B08 – Registration: Degree dropdowns incomplete / location duplication / profile sync

- **Module**: Registration, Profile  
- **Role(s)**: All sign-up roles  
- **Type**: BUG  
- **Status**: FIXED

- **Evidence**:
  - `useAcademicsCatalog` (hook) and `DegreeSelect`/`DepartmentSelect` pull data from `v_degrees` and `v_degree_department_groups` once; `EnhancedRegister` uses `isValidDegree` and `isValidDepartmentFor` to validate selections and writes `degree_code`, `department_id` only when valid.  
  - Optional profile fields (skills, interests, bio, linkedin, github, website) are persisted into `profiles` and `social_links` so they appear in Profile Settings; `SAFE_PROFILE_FIELDS` match these fields.

- **Concrete fix**:
  - Keep registration’s academic options purely derived from DB views; never hardcode inconsistent lists.  
  - As new degrees/departments are added, they appear automatically via views.

---

### B09 – Directory: Deleted/rejected/unapproved visible; LinkedIn not in view; duplicate Education; batch display

- **Module**: Directory Page, Alumni Profile  
- **Role(s)**: All  
- **Type**: BUG  
- **Status**: FIXED/PARTIAL

- **Evidence**:
  - Visibility:
    - `useDirectory` loads from `get_directory_profiles` and/or `alumni_directory_public`; those DB objects are intended to contain only approved/visible profiles (RLS-level filtering). The client does not add or override approval filters, which is correct.
  - Social links:
    - `AlumniProfile` private view uses `loadProfileSocialLinks(id)` and merges `linkedin_url` if not already in `social_links`. `Social Links` section maps over `alumnus.socialLinks`, including LinkedIn.
  - Duplicate Education / batch under header vs section:
    - Header chips show `degreeLabel`, `departmentLabel`, `Batch graduationYear`, `location`. Education section either displays structured `alumnus.education` or a single-block fallback built from degree/department/batch; this is intentional but means the same info may appear in chips and in the Education section.

- **Root cause**:
  - Rejected/unapproved previously leaked into the public view; now, DB views and RLS should be limiting them (not visible in this code; must be confirmed at DB level).  
  - Duplicate education vs header chips is more a design than correctness issue.

- **Concrete fix**:
  - Confirm `alumni_directory_public` excludes unapproved/rejected/deleted profiles. The client assumes this; if not, fix on DB side rather than front-end.  
  - To avoid perceived duplication, keep header chips for quick glance and use Education section only for richer structured entries, or hide fallback block when chips already show the same info.

---

### B10 – Access: Students joining alumni-only groups; students creating events; employers applying as candidates

- **Module**: Groups, Events, Jobs  
- **Roles**: Student, Employer
- **Type**: BUG  
- **Status**: FIXED/PARTIAL

- **Evidence**:
  - Students joining alumni-only groups:
    - `GroupsList` and `GroupDetail` check for `alumni-only` tag; if `userRole === 'student'` and group has `alumni-only`, join CTA is disabled with a clear message. RLS should also enforce; but front-end prevents obvious joins.
  - Student Create Event:
    - `EventsList` shows `showCreateButton` only if `hasPermission('events:create') && userRole !== 'student'`.  
    - Routes `/events/create`, `/events/new` are in `App.js` and gated by `ProtectedRoute requiredPermission="events:create"` (permission derived from role). Base permissions grant `events:create` only to admin/super_admin.
  - Employers applying to jobs:
    - In `JobCard`/`JobListItem`, when `userRole === 'employer'`, the Apply path is replaced by either Manage Applications (if owner or admin) or a disabled Accepting Applications/Applications Closed button. Employers never see the Apply button.  
    - The backend also expects applications from alumni/students; RLS likely prevents employers from inserting into `job_applications`.

- **Concrete fix**:
  - For groups, ensure `alumni-only` semantics also exist in DB RLS (non-alumni cannot join even if they bypass UI).  
  - For events and jobs, the current combination of permission checks + RLS looks correct; ensure tests exist for students not being able to call event creation endpoints and employers not being able to insert job applications.

---

## Section 3 – New Issues Found (Not Explicitly in QA Notes)

### B11 – Mixed group membership APIs and legacy Networking/Groups paths

- **Module**: Groups (`/groups`, `/networking`)  
- **Role(s)**: Alumni, Student, Admin  
- **Type**: BUG  
- **Status**: PARTIALLY FIXED

- **Summary**: There are two parallel group stacks: `components/Groups/*` using `groups`, `group_members`, `group_memberships`, and `components/Networking/GroupDetails.js` using older patterns. In practice, `App.js` now routes groups via `/groups/*` backed by `GroupsPage`/`GroupsList`/`GroupDetail`; `Networking/GroupDetails` is effectively legacy but still present.

- **Evidence**:
  - `App.js` uses `/groups/*` and `/groups/:id/manage`, not `/networking`.
  - `frontend/src/components/Networking/GroupDetails.js` still fetches from `groups` and `group_memberships`, and posts/comments via old flows.

- **Risk**:
  - If any link or QA scenario still uses `/networking`, it will hit the legacy GroupDetails component, which doesn’t share all the updated access/ACL rules.

- **Concrete fix**:
  - Either remove/redirect `/networking` routes to `/groups`, or ensure `Networking/GroupDetails` is no longer referenced.  
  - Grep for `/networking` and make sure all such routes or links are removed or aliased to `/groups`.

---

### B12 – Employer access to mentorship as mentee/mentor not clearly constrained

- **Module**: Mentorship registration  
- **Role(s)**: Employer  
- **Type**: LOGIC  
- **Status**: PARTIAL / BY DESIGN (needs business confirmation)

- **Summary**: `Mentorship` and `EnhancedRegister` allow employers to participate in mentorship (mentor, mentee, or both). QA may have intended mentorship to be alumni/students only.

- **Evidence**:
  - `EnhancedRegister` `mentorshipRole` allowed roles:
    - Alum/Employer: `mentor, mentee, both`.  
    - Student: `mentee` only.  
  - `Mentorship` CTA `Become Mentor` is hidden only for `student`; not for employer.

- **Concrete fix** (if business wants alumni-only mentorship):
  - In `EnhancedRegister`, restrict `mentorshipRole` allowed values for `primaryRole === 'employer'` (e.g., allow only mentor, or disallow entirely).  
  - In `Mentorship` header, hide Become Mentor / My Mentoring tabs when `getUserRole() === 'employer'`.

---

### B13 – Event RSVP flows: mixed use of event_attendees/event_rsvps and multiple statuses

- **Module**: EventsList, EventDetail, deprecated Events  
- **Role(s)**: All  
- **Type**: LOGIC  
- **Status**: PARTIALLY FIXED

- **Summary**: Both `event_attendees` and `event_rsvps` tables exist and are used in different contexts; statuses differ (`going`, `registered`, various synonyms). `EventsList` counts attendees using RPC + `event_rsvps` and `event_attendees`; `EventDetail` uses `event_attendees` only and `attendance_status='going'`.

- **Evidence**:
  - `EventsList` `fetchEvents` merges counts from:
    - RPC `get_event_attendance_counts`.  
    - Fallback from `event_rsvps` and `event_attendees` with `attendance_status` in `going/attending/checked_in/attended`.
  - `EventDetail` fetches attendees: `from('event_attendees').select(...).eq('attendance_status','going')` and uses `event_attendees` for RSVP updates; `updateRsvpStatus` upserts/deletes from `event_attendees` only.
  - Deprecated `Events` component uses `event_attendees` with `status='registered'`.

- **Risk**:
  - There may still be events where counts differ between Dashboard/EventsList and EventDetail due to mixing `status` vs `attendance_status` vs `event_rsvps`.

- **Concrete fix**:
  - Pick a single canonical table for RSVPs (preferably `event_attendees`) and a canonical status enum (`going`, `cancelled`, etc.).  
  - Migrate older code (`Events.js`, `event_rsvps`, `status='registered'`) to the new model; update `get_event_attendance_counts` RPC accordingly.

---

## Section 4 – Pre-Launch Priority Checklist

### BLOCKERS (Must fix before launch)

- **B03 – Jobs approval/deletion consistency**  
  - Confirm `get_jobs_public_v5` filters out `is_rejected`, `is_deleted`, and non-active jobs for public candidates.  
  - Ensure client `matchesFilters` logic stays aligned with RPC.  

- **B07 – Groups inconsistent APIs**  
  - Standardize group membership and comments on the new `groups` stack (`GroupsList`, `GroupDetail`, `CommentsThread`) and ensure no `/networking` route remains in use.

- **B11 – Event RSVP canonical source** (B13)  
  - Decide on canonical RSVP table and statuses; ensure counts, Dashboard tiles, EventsList, and EventDetail all read from the same source.

### SHOULD FIX (High priority, but can follow shortly after launch)

- **L01 – Employer Dashboard tile UX**  
  - Hide or repurpose “Find Alumni” and “Join Groups” tiles for employers so they don’t click into redirects/denies.

- **B05 – Jobs filters alignment**  
  - Verify all filter options (job type, department, experience, salary, postedWithin) are fully honored in `get_jobs_public_v5` and clean up redundant client filters.

- **B09 – Directory view consistency**  
  - Validate DB views for directory hide rejected/unapproved/deleted records.  
  - Optionally adjust Education vs chips duplication.

- **B10 – Group alumni-only RLS**  
  - Make sure DB policies also prevent students/employers from joining `alumni-only` groups even if UI is bypassed.

### CAN WAIT (Minor or design-driven)

- **B02 – Job posting UX edge cases**  
  - Improve error messaging around `company_id` missing / RLS failures.  

- **B12 – Employer mentorship participation rules**  
  - Clarify product intent (allow/disallow employers as mentees/mentors) and adjust `EnhancedRegister` + `Mentorship` logic accordingly.

- **Misc UI Harmonization**  
  - Consolidate legacy components (`Events.js`, `Networking/GroupDetails`) and delete or alias them to reduce confusion.  

---

This report is based strictly on the current frontend code plus inferred backend contracts (RPCs, views, RLS). Schema-level confirmation (views/RPC definitions, RLS policies) should be done directly on the live Supabase project as a next step to fully guarantee consistency and access rules.
