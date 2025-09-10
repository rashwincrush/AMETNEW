# Frontend Information of All Modules (Deep Analysis)

This document maps each major frontend module to backend entities (tables, views, RPCs, triggers), summarizes key components, routes, data flows, and identifies gaps or missing pieces found by comparing the frontend implementation against the current database dump (`Dumps.sql`) and Supabase migrations.

Note: File paths refer to items under `frontend/src/components/` unless otherwise specified.

---

## Dashboard

- Frontend files
  - `Dashboard/AdminDashboard.js`
  - `Dashboard/AlumniDashboard.js`
  - Route: `/dashboard`
- Core UI/Features
  - Shows counts and recent items (events, jobs, alumni).
  - Uses profile presence and role to choose dashboard (production forces AlumniDashboard for all roles).
  - Realtime channel setup for system and user notifications.
- Backend dependencies
  - `public.profiles` (presence, role, counts)
  - `public.events` (upcoming events list/count)
  - `public.jobs` (open jobs list/count)
  - Notifications tables and channels (e.g., `public.admin_notifications`, `public.activity_log`)
- Observed issues
  - Previously hit 500 on `profiles` due to recursive RLS policy. Resolved by simplifying policies.
- Gaps
  - If large data volumes: consider materialized views for dashboard counts.
  - Ensure HEAD requests to `/rest/v1/profiles?select=id` are allowed by RLS for health checks.

---

## Cards (UI)

- Frontend files
  - `ui/card.jsx`, `ui/badge.jsx`, `ui/button.jsx`, `ui/avatar.jsx`, `ui/skeleton.jsx`, etc.
- Purpose
  - Presentation components used widely across modules. No direct backend dependency.
- Gaps
  - None at backend level. Ensure consistent loading skeleton usage.

---

## Directory (Alumni Directory & Profile)

- Frontend files
  - `Directory/AlumniDirectory.js`, `Directory/AlumniListItem.js`, `Directory/AlumniCard.js`, `Directory/AlumniProfile.js`
  - Route: `/directory` (listing), `/directory/:id` (profile page)
- Core UI/Features
  - Browse/search alumni, grid/list views.
  - Profile page shows avatar, name, position/company, location, education, about, achievements, skills, social links.
  - "Message" CTA creates or opens a conversation.
  - "Connect" CTA uses connections status.
- Backend dependencies
  - `public.profiles` (primary source for directory and profile)
  - Optional views (legacy): `public.public_profiles_view`, `public.profile_about_view`, `public.profile_education_view`, `public.profile_social_links`, `public.profile_achievements_view`
  - RPCs:
    - `public.get_or_create_conversation(target_user_id uuid)`
    - `public.get_connection_status(user_1_id uuid, user_2_id uuid)`
    - `public.get_profile_contact_details(target_user_id uuid)` (SECURITY DEFINER; returns email/phone based on permissions)
  - `public.connections` (connection status and rules)
- Recent frontend updates
  - `AlumniProfile.js` now fetches directly from `public.profiles` and enriches email/phone via `get_profile_contact_details` RPC for logged-in users per RLS.
  - DM creation uses `get_or_create_conversation(target_user_id := alumnus.id)`.
- Gaps
  - If legacy views are still referenced elsewhere, ensure they exist or remove calls.
  - Confirm `profiles` has columns used by UI: `full_name`, `avatar_url`, `bio`, `education` (json/array), `experience` (json), `skills` (json/array), `achievements` (json/array), `linkedin_url`, `website_url` or `website`, `phone`/`phone_number`, `email`, `company/company_name`, `position/current_position`, `batch/graduation_year`, `degree/course`, `department`, `city/location`.
  - Ensure RLS on `profiles` allows public reading of non-sensitive fields, and sensitive fields are fetched only via RPC.

---

## Profiles (Self profile & settings)

- Frontend files
  - `User/` and settings screens under `Admin/` or `Registration/`
  - `pages/UserProfilePage.js`
- Core UI/Features
  - View/Edit profile details, upload avatar, manage privacy, education/experience, social links, skills.
- Backend dependencies
  - `public.profiles`
  - Storage buckets for avatars (Supabase Storage; RLS policies for authenticated)
- Gaps
  - Verify presence of triggers on signup (`create_profile_on_signup.sql`) to create a profile row.
  - Ensure update/insert RLS policies on `profiles` allow self updates and inserts.

---

## Events & Calendar

- Frontend files
  - `Events/Events.js`, `Events/EventsList.js`, `Events/EventDetail.js`/`EventDetails.js`
  - `Events/CreateEvent.js`/`CreateEventForm.js`, `Events/EditEvent.js`/`EditEventForm.js`
  - `Events/EventCalendar.js`
  - `Events/EventFeedback*.js`
  - Route: `/events`, `/events/:id`
- Core UI/Features
  - Create/Edit/View events; RSVP/attendance; calendar view; feedback capture and dashboards.
- Backend dependencies
  - `public.events` (main)
  - `public.event_feedback` (or similarly named; see `event_feedback_validation_trigger.sql`)
  - `public.event_rsvp`/`public.event_attendees`/`public.event_registrations` (depending on schema)
  - RPCs/triggers from files: `event_rsvp_function.sql`, `event_feedback_validation_trigger.sql`
- Gaps
  - Verify actual table names: the dump list is long; ensure the RSVP and Feedback tables exist and align with component expectations.
  - RLS: creators/admins can update; attendees read; public read for listing.

---

## Jobs (Listings, Details, Apply, Manage)

- Frontend files
  - `Jobs/JobListingsPage.js`, `Jobs/JobsList.js`, `Jobs/JobCard.js`, `Jobs/JobDetail.js`/`JobDetails.js`
  - `Jobs/PostJob.js`, `Jobs/JobPostingForm.js`, `Jobs/EditJob.js`, `Jobs/JobAdminPanel.js`
  - `Jobs/JobApplyForm.js`, `Jobs/JobApplication.js`, `Jobs/JobApplicationForm.js`, `Jobs/ApplicationTracking.js`, `Jobs/ManageJobApplications.js`
  - `Jobs/BookmarkButton.js`, `Jobs/BookmarkedJobs.js`, `Jobs/PinButton.js`
  - Route: `/jobs`, `/jobs/:id`, `/jobs/post`, `/jobs/:id/apply`, etc.
- Core UI/Features
  - Browse jobs, search/filter, view details, save/bookmark, pin, apply/upload resume, admin post/edit/manage applications.
- Backend dependencies
  - `public.jobs`
  - `public.job_applications`
  - `public.bookmarked_jobs`
  - Possibly `public.pinned_jobs` (if feature present)
  - Storage bucket for resumes (`ResumeUploadForm.js`)
  - RPCs for composite queries (e.g., `get_company_jobs_with_bookmarks.sql`)
- Gaps
  - Ensure `public.job_alerts` exists if `JobAlerts.js` is used; many projects omit and do alerting client-side.
  - RLS must allow:
    - Anyone read jobs
    - Owners/admins can insert/update/delete their job postings
    - Applicants can insert and read their own applications; job owners/admins read applications for their jobs
  - Check migrations: `001_add_get_my_posted_jobs.sql`, `get_company_jobs_with_bookmarks.sql` present; verify in DB.

---

## Applications (Job applications)

- Frontend files
  - Under `Jobs/` as above: `JobApplication*`, `ManageJobApplications.js`, `ApplicationTracking.js`
- Backend dependencies
  - `public.job_applications`, `public.jobs`, `public.profiles`, `public.resume_profiles` (if used)
- Gaps
  - Ensure `resume_profiles` exists if referenced, otherwise route file upload to storage + reference URL in `job_applications`.

---

## Job Alerts

- Frontend files
  - `Jobs/JobAlerts.js`
- Backend dependencies
  - Typically `public.job_alerts` (user preferences, keywords, frequency)
- Gaps
  - If `job_alerts` not present in DB, add table or gate component feature flags to hide alerts.

---

## Filters & Different Views

- Frontend files
  - Filters spread across `EventsList.js`, `JobListingsPage.js`, `AlumniDirectory.js`
  - Views: list/grid/calendar toggles (`EventCalendar.js`, jobs grid/list)
- Backend dependencies
  - Query params to `events`, `jobs`, `profiles`
- Gaps
  - Consider server-side supported filters (indices on frequently filtered columns: `location`, `company`, `degree_program`, `graduation_year`, job `location`, `type`, `tags`).

---

## Mentorship

- Frontend files
  - `Mentorship/Mentorship.js`, `MentorshipDashboard.js`, `MentorshipDirectory.js`, `MentorDirectory.js`, `MentorProfile.js`
  - Forms: `MentorRegistrationForm.js`, `MenteeRegistrationForm.js`, `BecomeMentorForm.js`, `MentorSettings.js`
  - Scheduling: `SessionScheduler.js`, `SessionsCalendar.js`, `MentorshipStatus.js`, `MentorshipRequestsDashboard.js`, `AdminMentorApprovals.js`
  - Route: `/mentorship`, `/mentorship/sessions`, etc.
- Backend dependencies
  - Tables per provided SQL: `mentorship_messaging_schema.sql`, `mentorship_request_schema.sql`, `mentorship_sessions_schema.sql`
  - Likely: `public.mentors`, `public.mentees`, `public.mentorship_requests`, `public.mentorship_sessions`, `public.mentor_availability`
  - RPCs for matching and scheduling.
- Gaps
  - Confirm exact table names exist in DB; create views/RPCs for calendar.
  - RLS rules: mentors can manage their slots; mentees can book/cancel their sessions; admins approve mentors.

---

## My Mentorship

- Frontend files
  - `Mentorship/MyMentorship.js`, `MentorshipStatus.js`
- Backend dependencies
  - `public.mentorship_sessions`, `public.mentorship_requests`, user’s role in mentor/mentee tables.
- Gaps
  - Efficient composite endpoints (RPCs) for “my upcoming/past sessions” and request status reduce client roundtrips.

---

## Edit Mentorship Details

- Frontend files
  - `MentorSettings.js`, `MentorRegistrationForm.js`, `BecomeMentorForm.js`
- Backend dependencies
  - `public.mentors` (profile fields and availability)
- Gaps
  - Ensure `mentors` table stores fields the forms post (bio, expertise, industries, years of experience, availability blocks).

---

## Groups

- Frontend files
  - `Groups/GroupsList.js`, `Groups/GroupDetail.js`, `Groups/GroupManage.jsx`, `Groups/GroupCreate.js`, `Groups/GroupMembers.js`
  - Route: `/groups`, `/groups/:id`, `/groups/manage/:id`
- Core UI/Features
  - Create/join/manage groups; membership requests; posts/events per group (if enabled); admin tools for the group.
- Backend dependencies
  - `public.groups`, `public.group_members`, `public.group_requests` (naming may vary)
- Gaps
  - Confirm exact table names exist (dump shows many tables; we saw `conversation_members` but not `group_members` in the snippet). Adjust queries to actual names.

---

# Tracked Task List (Owners + Acceptance Criteria)

- __Profiles: Contact privacy via RPC__
  - Owner: Backend
  - Tasks:
    - Ensure `public.get_profile_contact_details(target_user_id uuid)` exists as SECURITY DEFINER and enforces: owner OR admin OR accepted connection.
  - Acceptance:
    - As owner/admin/accepted connection: calling RPC returns non-null `email` and `phone` for a target user.
    - As unrelated authenticated user: RPC returns nulls for both fields.
    - Frontend `AlumniProfile.js` shows/hides Email/Phone accordingly.

- __Profiles: RLS sanity__
  - Owner: Backend
  - Tasks:
    - Confirm `public.profiles` policies: SELECT for authenticated; INSERT/UPDATE restricted to `id = auth.uid()`; admins via `is_admin()` if needed.
  - Acceptance:
    - Authenticated users can load profiles list and specific profile.
    - Only owner can update their row; admins can when intended.

- __Directory: Data source consistency__
  - Owner: Backend
  - Tasks:
    - Keep `public.public_profiles_view` aligned with the fields used by `Directory/AlumniDirectory.js` and `Directory/AlumniCard.js` (id, full_name, avatar_url, degree_program, graduation_year, current_job_title, company_name, location, department, skills).
  - Acceptance:
    - `/directory` loads without 4xx/5xx and supports search/filter/sort/pagination using the view.

- __Social Links: View + table fallback__
  - Owner: Backend
  - Tasks:
    - Ensure `public.profile_social_links` view returns an object with `linkedin`, `github`, `x` (or `twitter`), `website` keys.
    - Keep `public.social_links` table (type,url,profile_id) available for fallback.
  - Acceptance:
    - `services/socialLinks.(js|ts)` returns links via view when present; falls back to table when not.

- __Jobs: Job alerts storage__
  - Owner: Backend
  - Tasks:
    - Create `public.job_alerts` with RLS (see SQL below).
  - Acceptance:
    - Authenticated user can CRUD their own alerts; others cannot read or modify them.
    - Frontend `Jobs/JobAlerts.js` works end-to-end (create/update/toggle/delete).

- __Messages: RLS hardening__
  - Owner: Backend
  - Tasks:
    - Ensure RLS on `public.messages` allows only conversation participants to read/write.
    - Provide helper `public.is_conversation_participant(user_id, conversation_id)` as SECURITY DEFINER.
  - Acceptance:
    - Participant can read their conversation messages; non-participants receive 0 rows / 403.
    - Sending a message (insert) succeeds only for participants.

- __Events: RSVP/Feedback schema alignment__
  - Owner: Backend
  - Tasks:
    - Verify presence and column names of RSVP and Feedback tables used by `Events/*` components; align RLS.
  - Acceptance:
    - Create/Edit/RSVP/Feedback flows succeed without schema errors.

- __Groups: Tables and RLS__
  - Owner: Backend
  - Tasks:
    - Ensure `groups`, `group_members`, `group_requests` tables exist per frontend behavior; align triggers per memory.
  - Acceptance:
    - Create Group and Join Group actions operate without manual user_id inserts; membership reflected correctly.

- __Notifications: Unread counts__
  - Owner: Backend
  - Tasks:
    - Confirm unread count RPCs from migrations (`add_get_unread_notifications_count*.sql`) are deployed and grant execute to `authenticated`.
  - Acceptance:
    - Dashboard/Notifications pages display correct unread counts for the logged-in user.

- __Indices for performance__
  - Owner: Backend
  - Tasks:
    - Add indices on frequently filtered fields (profiles: `location`, `graduation_year`, `degree_program`; jobs: `location`, `type`, `tags`; events: `start_time`, `status`).
  - Acceptance:
    - Queries on list pages maintain p95 < 200ms under expected load.

---

# SQL Migrations (apply in Supabase SQL Editor or migrations pipeline)

## 1) Job Alerts (table + RLS)

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  keywords text[] DEFAULT '{}',
  locations text[] DEFAULT '{}',
  frequency text NOT NULL DEFAULT 'instant', -- instant | daily | weekly
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_alerts_user_id_idx ON public.job_alerts(user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_job_alerts_updated_at ON public.job_alerts;
CREATE TRIGGER trg_job_alerts_updated_at
BEFORE UPDATE ON public.job_alerts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_alerts_select ON public.job_alerts;
CREATE POLICY job_alerts_select ON public.job_alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS job_alerts_insert ON public.job_alerts;
CREATE POLICY job_alerts_insert ON public.job_alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS job_alerts_update ON public.job_alerts;
CREATE POLICY job_alerts_update ON public.job_alerts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS job_alerts_delete ON public.job_alerts;
CREATE POLICY job_alerts_delete ON public.job_alerts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMIT;

## 2) Messages RLS hardening

```sql
BEGIN;

-- Helper: check if a user participates in a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_user_id uuid, p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id AND cp.user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

-- Enforce RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_participants_select ON public.messages;
CREATE POLICY messages_participants_select ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

DROP POLICY IF EXISTS messages_participants_insert ON public.messages;
CREATE POLICY messages_participants_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_conversation_participant(auth.uid(), conversation_id) AND sender_id = auth.uid());

DROP POLICY IF EXISTS messages_participants_update ON public.messages;
CREATE POLICY messages_participants_update ON public.messages
  FOR UPDATE TO authenticated
  USING (false); -- no direct updates; edits not allowed

DROP POLICY IF EXISTS messages_participants_delete ON public.messages;
CREATE POLICY messages_participants_delete ON public.messages
  FOR DELETE TO authenticated
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

COMMIT;

Note: Adjust the table/column names if your messages schema differs.

---

# Frontend Patches for Legacy Views

- __Summary of scan__
  - `Directory/AlumniProfile.js`: already refactored to use `public.profiles` + RPC `get_profile_contact_details`.
  - `Directory/AlumniDirectory.js`: uses `public.public_profiles_view` which currently exists and is healthy. No change required.
  - `services/socialLinks.(js|ts)`: attempts `public.profile_social_links` first and falls back to `public.social_links` table. This matches current backend state.

- __Action__
  - No further patches are required at this time because there are no remaining calls to removed views. If you choose to deprecate `public.public_profiles_view` later, refactor `AlumniDirectory.js` to select from `public.profiles` and map fields accordingly.

---

# Tight Recommendations (Scope-locked)

- __Apply the SQL in this file__ in the Supabase SQL Editor to create `job_alerts` and harden messages RLS.
- __Keep `public.public_profiles_view`__ in sync with fields used by the Directory, or schedule a refactor to query `public.profiles` directly.
- __Use RPCs for sensitive data__ (contact details, unread counts) and for composite queries (e.g., “my sessions”, “my posted jobs”).

---

# Schema Sync & RPC Alignment (Tight Plan + Snippets)

## Profiles (columns + usage)
- Required columns to rely on in UI: `first_name`, `last_name`, `full_name`, `email`, `phone`/`phone_number`, `role`, `is_admin`, `approval_status`, `is_deleted`, `is_profile_complete`, `avatar_url`, `bio`, `education` (jsonb[]), `experience` (jsonb[]), `skills` (jsonb[]), `achievements` (jsonb[]), `linkedin_url`, `website`.
- Checks in code:
  - `Directory/AlumniProfile.js` maps `full_name` and fallbacks. OK. Add conditional UI badges for `approval_status` and `is_profile_complete` if desired.
  - Directory list (`AlumniDirectory.js`) uses `public_profiles_view`; confirm the view projects `department`, `graduation_year`, `skills`.
  - Role handling centralized in `AuthContext` (memory c3751866...), OK.

## Events (fields + RPCs)
- Fields to align: `title`, `description`, `start_date`, `end_date`, `venue` (rename from `venue_name`), `organizer_name`, `price`, `agenda` jsonb, `requirements` text[], `amenities` text[], `gallery` text[], `approval_status`, `status`, `is_public`.
- Replace direct inserts with RPCs:
  - Create: `create_new_event(p_event jsonb)`
  - Update status: `update_event_status_rpc(p_event_id uuid, p_status text)`
  - Search: `search_events(p_query text, p_limit int, p_offset int)`
- Minimal patch (Create):
```diff
// frontend/src/components/Events/CreateEventForm.js
+ const { data, error: insertError } = await supabase
+   .rpc('create_new_event', { p_event: finalEventData });
```
- Map `venue_name` -> `venue` in payload and ensure arrays/jsonb types for agenda/requirements/amenities/gallery.

## Jobs (fields + RPCs)
- Fields: `is_approved`, `approval_status`, `is_active`, `department`, `application_deadline` (aka `deadline`).
- RPCs already used in `Jobs/JobListingsPage.js`:
  - `get_jobs_with_bookmarks_v3`/`v2`, `get_my_posted_jobs`.
- Admin approvals:
  - Moderate: `admin_set_approval(p_entity text, p_id uuid, p_status text)` or `moderate_content(...)` depending on schema.
- If bookmark table name is `bookmarked_jobs` in DB, but UI uses `job_bookmarks`, reconcile to the actual table name (adjust inserts/deletes accordingly).

## Messaging (RPCs + RLS)
- Use RPCs:
  - `find_or_create_conversation(p_target_user_id uuid)`
  - `get_user_conversations(p_user_id uuid)`
  - `mark_conversation_as_read(p_conversation_id uuid)`
- Minimal patch (open DM):
```diff
// frontend/src/components/Directory/AlumniProfile.js
+ const { data: conversationId, error } = await supabase.rpc('find_or_create_conversation', {
+   p_target_user_id: alumnus.id
+ });
```
- Ensure `Messages/*` loads list via `get_user_conversations` and calls `mark_conversation_as_read` on open.

## Groups (RPCs + triggers)
- Join actions should use: `join_group(p_group_id uuid)`.
- Auto-batch assignment: `auto_assign_batch_group_for_profile(p_profile_id uuid)` (usually called by trigger/cron; optional manual call on profile completion).
- Frontend already avoids manual `user_id` inserts (memory 5852af2c...). OK.

## Connections & Notifications
- Connections: keep using `public.connections` with RLS and helper RPCs if present (e.g., `get_connection_status`).
- Notifications: emit via `create_notification(p_user_id uuid, p_type text, p_payload jsonb)`; list via view/RPC; realtime via channel `notifications:{userId}`.

## Roles & Permissions API (Admin)
- Centralize in `utils/supabase.js` wrappers:
  - `admin_set_user_role`, `assign_user_role`, `remove_user_role`, `get_roles`, `get_user_permissions`.
```js
// utils/supabase.js (wrapper signatures)
export const setUserRole = (userId, role) => supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role });
export const assignUserRole = (userId, role) => supabase.rpc('assign_user_role', { p_user_id: userId, p_role: role });
export const removeUserRole = (userId, role) => supabase.rpc('remove_user_role', { p_user_id: userId, p_role: role });
export const getRoles = () => supabase.rpc('get_roles');
export const getUserPermissions = (userId) => supabase.rpc('get_user_permissions', { p_user_id: userId });
```

## Analytics/Dashboard RPCs
- Use: `get_dashboard_stats(p_user_id uuid)`, `get_user_analytics(p_user_id uuid)`.
- Wire to `Admin/Dashboard.js` and `AlumniDashboard.js` panels.

## Client-side Validation (mirror SQL constraints)
- __Email__: lowercase before submit; reject domains ending with `.co` if required.
- __Phone__: E.164 regex `^\+?[1-9]\d{7,14}$`.
- __Name__: allow letters, spaces, hyphens; max length as per schema.
- __Social links__: restrict keys to `linkedin`, `github`, `website`, `instagram`, `facebook`, `x`; validate URLs.
```js
export const validatePhoneE164 = (s) => /^\+?[1-9]\d{7,14}$/.test((s||'').trim());
export const normalizeEmail = (s) => (s||'').trim().toLowerCase();
export const disallowCo = (s) => !normalizeEmail(s).endsWith('.co');
```

## Realtime Wiring (messages, notifications, conversations)
- Subscribe using `supabase.channel` with RLS-friendly filters and update local state on `eventType` INSERT/UPDATE/DELETE.
```js
const ch = supabase.channel(`conversations:${user.id}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handler)
  .subscribe();
```

## Admin Workflows (RPCs)
- __Approvals__: `moderate_content(p_entity, p_id, p_status)` or `admin_set_approval(...)` per schema.
- __User Mgmt__: `admin_soft_delete_user(p_user_id)`, `admin_delete_user_rpc(p_user_id)`, `enqueue_user_hard_delete(p_user_id)`.

## Error Handling (RLS-aware)
- Catch 403/permission errors from Supabase and show meaningful toasts: “You don’t have permission to perform this action.”
- Fallback to readonly views when RPCs fail due to RLS, where appropriate.

---

# Implementation Notes
- Create wrapper functions in `frontend/src/utils/supabase.js` for all RPCs above and gradually replace direct `.from()` calls in forms/lists.
- Prioritize swapping Events create/update to RPCs and Messaging to `find_or_create_conversation` + `get_user_conversations`.
- Keep this document as the single source of truth for schema-aligned calls and validations.

---

# Component Patch Checklist & Diffs (Apply These Changes)

Use these minimal patches to align the frontend with your schema and RPCs. Keep names and parameter keys exactly as shown for consistency.

## 1) Events: Create via RPC and field mapping

File: `frontend/src/components/Events/CreateEventForm.js`

- Map `venue_name` -> `venue` before sending
- Replace direct insert with `create_new_event`

```diff
// after computing finalEventData
+ // Align field names with DB schema
+ if (finalEventData.venue_name) {
+   finalEventData.venue = finalEventData.venue_name;
+   delete finalEventData.venue_name;
+ }
// replace insert with RPC
- const { data, error: insertError } = await supabase
-   .from('events')
-   .insert([finalEventData])
-   .select()
-   .single();
+ const { data, error: insertError } = await supabase
+   .rpc('create_new_event', { p_event: finalEventData });
```

Optional follow-ups elsewhere in Events:
- Use `update_event_status_rpc(p_event_id, p_status)` for admin approvals.
- Use `search_events(p_query, p_limit, p_offset)` for listings if available.

## 2) Messaging: RPC-aligned open DM + read receipts

File: `frontend/src/components/Directory/AlumniProfile.js`

```diff
- const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
-   target_user_id: alumnus.id
- });
+ const { data: conversationId, error } = await supabase.rpc('find_or_create_conversation', {
+   p_target_user_id: alumnus.id
+ });
```

Files: `frontend/src/components/Messages/*`
- Load list via `get_user_conversations(p_user_id)` and mark reads with `mark_conversation_as_read(p_conversation_id)` when a conversation is opened.

## 3) Jobs: Bookmarks table name alignment

File: `frontend/src/components/Jobs/JobListingsPage.js`

If your DB table is `public.bookmarked_jobs`, switch off `job_bookmarks`:

```diff
- .from('job_bookmarks')
+ .from('bookmarked_jobs')
```

Keep RPC usage for lists (`get_jobs_with_bookmarks_v3/v2`, `get_my_posted_jobs`).

## 4) Roles & Permissions: Central wrappers

File: `frontend/src/utils/supabase.js`

Add wrappers (call exact RPC names):

```js
export const setUserRole = (userId, role) => supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role });
export const assignUserRole = (userId, role) => supabase.rpc('assign_user_role', { p_user_id: userId, p_role: role });
export const removeUserRole = (userId, role) => supabase.rpc('remove_user_role', { p_user_id: userId, p_role: role });
export const getRoles = () => supabase.rpc('get_roles');
export const getUserPermissions = (userId) => supabase.rpc('get_user_permissions', { p_user_id: userId });
```

## 5) Client-side Validation helpers (mirror SQL)

Create `frontend/src/utils/validation.js` (or place in an existing helpers module) and import in forms:

```js
export const normalizeEmail = (s) => (s||'').trim().toLowerCase();
export const disallowCo = (s) => !normalizeEmail(s).endsWith('.co');
export const validatePhoneE164 = (s) => /^\+?[1-9]\d{7,14}$/.test((s||'').trim());
export const validateName = (s) => /^[A-Za-z\-\s]{2,100}$/.test((s||'').trim());
export const validateSocialKey = (k) => ['linkedin','github','website','instagram','facebook','x'].includes((k||'').toLowerCase());
```

Usage pattern in forms (example):
```js
if (!disallowCo(email)) return setError('Emails ending with .co are not allowed');
if (!validatePhoneE164(phone)) return setError('Enter a valid phone number in international format');
```

## 6) RLS-aware Error Handling

Pattern for catching 403/permissions:

```js
const { data, error } = await supabase.rpc('some_rpc', { /* params */ });
if (error) {
  if (String(error.code || '').includes('403') || /permission/i.test(error.message)) {
    toast.error("You don’t have permission to perform this action.");
  } else {
    toast.error(error.message || 'Request failed');
  }
  return;
}
```

