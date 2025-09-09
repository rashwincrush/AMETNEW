# Mentorship Fixes - Scope, Findings, and Work Plan

This file tracks the mentorship alignment tasks strictly within the given scope and without schema changes. Source of truth for DB schema/policies is `Dumps.sql`.

## Scope & Guardrails
- Do NOT add or remove DB columns.
- Align frontend to existing tables/columns from `Dumps.sql` only.
- Scope: User Management & Profiles, Alumni Directory & Search, Networking & Mentorship (Mentorship Program, Messaging System), Event Management, Administration Tools, UI/UX & Accessibility.

## Schema Confirmations (from `Dumps.sql`)
- mentors
  - Columns: `id uuid`, `user_id uuid` (FK → `profiles.id`), `status text` (CHECK: pending | approved | rejected), `expertise text[]`, `mentoring_preferences jsonb`, timestamps, etc. (lines ~36936-36950)
  - RLS: enabled; policies for insert/select/update; select allows `status='approved'` or own row or admins. (lines ~40954-40967)
- mentee_profiles
  - Exists (COPY present). (lines ~5170-5174)
- mentorship_requests
  - Columns: `id`, `mentee_id uuid` (FK → `profiles.id`), `mentor_id uuid` (FK → `profiles.id`), `status text` (CHECK: pending | accepted | rejected | completed), `message text`, `goals text`, `created_at`, `updated_at`. (lines ~37036-37047, 39955-39961)
  - RLS: enabled; insert (mentee only), select (mentor or mentee), update (mentor or mentee), delete (mentor or mentee), realtime select policy present. (lines ~40348-40633, 41015, 41088-41091)
  - UNIQUE (mentee_id, mentor_id): NOT found in dump. Implement UI check to prevent duplicates.
- mentorship_sessions
  - Columns: `id`, `mentorship_request_id uuid` (FK → `mentorship_requests.id`), `scheduled_time`, `duration_minutes`, `meeting_url`, `notes`, `created_at`. (lines ~37053-37061; 39965-39967)
  - Indexes: `mentorship_sessions_request_id_idx`, `mentorship_sessions_scheduled_time_idx`. (lines ~39093-39098)
  - RLS: enabled; insert requires parent request status = 'accepted'; select/update/delete allow mentor/mentee or admin. (lines ~41018-41044)
  - Realtime select policy present. (lines ~41092-41093)
- mentorship_messages
  - Columns: `id`, `mentorship_request_id uuid`, `sender_id uuid`, `message text`, `sent_at timestamptz default now()`. (lines ~36995-37001)
  - FKs: to `mentorship_requests(id)` and `profiles(id)`. (lines ~39930-39936)
  - RLS: enabled; insert/select permitted to mentor/mentee on the related request. (lines ~40990-41001)
  - Explicit `realtime:` policy not found; standard RLS select exists. If realtime subscription fails, we may add a named realtime policy via SQL editor (no schema change).
- profiles
  - Approval fields: `is_approved boolean` and `approval_status profile_approval_status` enum; consistency check present. (lines ~30548-30570)
- Role helpers
  - `is_admin()` exists.
  - `get_user_role()` exists and includes `'admin','super_admin'`. (lines ~45699-45743)
- Events (for group mentoring/office hours): `events` table exists. (lines ~33897-)

## Routing Inventory
- New route added: `/mentorship/me` → `components/Mentorship/MyMentorship.js` (simple container; to be expanded).
- Existing mentorship components to align (no schema changes):
  - `components/Mentorship/Mentorship.js`
  - `components/Mentorship/MentorRegistrationForm.js`
  - `components/Registration/MenteeRegistrationForm.js` (use this path; ignore older alternate)
  - `components/Mentorship/MentorshipRequestsDashboard.js`
  - `components/Mentorship/SessionScheduler.js`
  - `components/Mentorship/SessionsCalendar.js`
  - `components/Mentorship/MentorshipChat.js`

## Mappings (UI ↔ DB)
- mentors: `expertise text[]`, `mentoring_preferences jsonb`, `status text`
- mentorship_requests: `status`, `message`, `goals`, `created_at`, `updated_at`
- mentorship_sessions: `notes`
- mentorship_messages: `message`, `sent_at`

## Planned Changes by Stage (Frontend)
- STAGE 2 — Status & Terminology Consistency
  - Replace any request status label 'approved' → 'accepted'.
  - Replace any `requested_at` usage → `created_at` in requests UI.
  - Ensure mentor approval statuses exactly: `approved | pending | rejected`.
- STAGE 3 — Visibility Split
  - Public directory (Mentorship.js): list mentors where `mentors.status = 'approved'` joined to `profiles` for name/avatar.
  - My Mentorship (/mentorship/me): fetch mentor by `user_id = auth.uid()` (no status filter).
    - No row → render `MentorRegistrationForm`.
    - pending → show "Pending admin approval" badge.
    - approved → show mentor card + links (Requests, Sessions, Chat).
    - rejected → show reason (if available) + "Edit & Resubmit".
- STAGE 4 — Role Stacking & Approval Tiers
  - Alumni → Mentor approved by Admin.
  - Admin → Mentor approved by Super Admin via `get_user_role() = 'super_admin'`.
  - Do not remove existing roles; mentor capability = `mentors.status='approved'`.
  - Admin UI: two queues (Alumni mentor requests; Admin mentor requests).
- STAGE 5 — Request Mentorship CTA
  - Insert into `public.mentorship_requests` with `{ mentee_id: auth.uid(), mentor_id, message, goals, status: 'pending' }`.
  - Pre-insert check (UI) to prevent duplicates since UNIQUE(mentee_id, mentor_id) not in dump.
- STAGE 6 — Requests Dashboard Alignment
  - Normalize filters to `pending | accepted | rejected | completed`.
  - Replace any `requested_at` usage with `created_at`.
  - Replace UI text 'approved' (for requests) with 'accepted'.
- STAGE 7 — Session Scheduler (Basic)
  - Insert only: `mentorship_request_id, scheduled_time, duration_minutes, meeting_url, notes`.
  - Rename `meeting_notes` → `notes`; remove `meeting_type`, `location`, `created_by` (not in schema).
  - Block scheduling unless parent request status is `accepted`.
- STAGE 8 — Sessions Calendar Display
  - Join `mentorship_sessions` → `mentorship_requests` → `profiles` (mentor/mentee).
  - Show `scheduled_time, duration_minutes, meeting_url, notes`.
  - Compute Upcoming/Past using `scheduled_time + duration_minutes` vs now.
  - Remove references to `meeting_type`, `location`, `status`.

## Notes & Considerations
- `mentors.user_id` references `profiles.id`; `auth.uid()` equals `profiles.id` in this setup.
- Realtime: `mentorship_requests` and `mentorship_sessions` have explicit realtime-named policies; `mentorship_messages` has proper RLS but lacks a named `realtime:` policy string. If realtime streaming fails for messages, we can add such a policy in SQL editor (no column changes).
- Composite label rule (will be applied in UI where needed):
  - `profileApproved = profiles.is_approved === true || profiles.approval_status === 'approved'`
  - `mentorStatus = mentors.status for auth.uid()`
  - If `profileApproved && mentorStatus==='approved'` → "Approved + Mentor"
  - Else if `profileApproved && (!mentorStatus || mentorStatus in ['pending','rejected'])` → "Approved + Mentor Pending"
  - Do not show this composite if profile is not approved.

## Current Status
- [x] Verified schema and RLS for mentors, mentee_profiles, mentorship_requests, mentorship_sessions, mentorship_messages
- [x] Added route `/mentorship/me` with simple container `MyMentorship`
- [x] Align Mentorship.js to public directory query (approved mentors only) and CTA insert
- [x] Update MentorshipRequestsDashboard.js (statuses + created_at)
- [x] Update SessionScheduler.js (columns + block unless accepted)
- [x] Update SessionsCalendar.js (display + joins + remove unused fields)
- [x] Update MentorshipChat.js (field names + order by sent_at + realtime)
- [x] Admin UI queues for role-stacking approvals (Alumni vs Admin mentor requests)
- [x] Composite label display in applicable screens

