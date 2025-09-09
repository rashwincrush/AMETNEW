# 🧭 WINDSURF — END-TO-END AUDIT & FIX (AMET Alumni)

You’re my senior full-stack pair-programmer working on a Next.js + React app with Supabase (Auth, DB, Storage, Realtime, RLS).
Touch only these feature areas (the official AMET Alumni scope):
User Management & Profiles · Alumni Directory & Search · Event Management · Job Portal · Networking & Mentorship (Groups + Messaging) · Administration Tools · UI/UX & Accessibility · Social Media Integration
No features beyond this list. Fixes only; minimal schema changes strictly for correctness.

---

## 0) PROJECT SETUP & GUARDRAILS (DO FIRST)
- [ ] Branching: Create `bugfix/full-audit-amet-alumni`.
- [ ] Preflight runs: Start the app, open DevTools (Console + Network). Record all errors/warnings while reproducing the issues below.
- [ ] Test bed: Add/extend tests (React Testing Library + lightweight RPC/query tests) for each module touched.
- [ ] Role contexts: Test as Super Admin, Admin, Alumni, Student, Employer, Mentor where relevant.
- [ ] URL-mirrored filters: For Events and Directory, reflect filters in the URL query string and restore on mount.
- [ ] No overlays blocking clicks: Remove or re-z-index any dev banners/modals/sticky toolbars that overlap page controls.
- [ ] Activity log (lightweight): Add client-side logging for key user actions (route, user_id, action, meta, ts). We’ll wire the DB table in the “Admin Tools” module.
- [ ] Timezones: Classify Upcoming/Past events using UTC consistently; render to users in local TZ where needed (Asia/Kolkata).
- [ ] Commit hygiene: Commit per module with `fix:` / `chore:` / `test:` messages and a small “what changed + why” summary.

### 🔒 DB CROSS-CHECK & DELTAS (APPLIES TO EVERY MODULE BELOW)
At the end of each module, add a section named “DB Cross-check & Deltas” that:
- Compares code against:
  - Local path: `supabase/`
  - Local PDF: `Supabase Schema (1).pdf`
- Then states one of:
  - SQL Editor: No changes required.
  - SQL Editor: Required Changes → give an ordered checklist (Tables/Columns, Indexes, Views, Functions/Triggers, RLS/Grants, Storage) with object name, exact action, and rationale mapped to the frontend change.
- Call out any UI↔DB naming mismatches (e.g., longDescription vs long_description) and confirm the mapper that reconciles them.

---

## 1) USER MANAGEMENT & PROFILES
### 1A) Registration & Auth (Doc Points 1–13 + Placeholder/Dept List)
- [x] OAuth flow: After Google callback, ensure profile bootstrap and redirect to onboarding (not a protected route). Refresh session/JWT.
- [x] Name rules: Allow letters + single spaces; block digits/specials; preserve casing; trim/collapse spaces.
- [x] Email: Lowercase on blur/submit.
- [x] Phone: Allow optional +, digits only; store raw; display masked +91… if applicable.
- [x] Confirm password: Block paste; show tooltip “Type to confirm”.
- [x] Logo click: During onboarding, open in new tab without dropping wizard state.
- [x] LinkedIn: Validate https://linkedin.com/... (incl. www). No emails.
- [x] T&C / Privacy: Link routes and open in new tab; required agree checkbox enforced.
- [x] Degree (Point 11): Required Select with disabled placeholder; populate with official UG/PG/PhD/HND/MBA/Harbour Engineer program list.
- [x] Mentor skills UI: Normalize height: min-rows 3; clamp max height; scroll when overflow.
- [x] Prev button: Never auto-finalize; separate navigation from submit; preserve wizard state.
- Acceptance
  - [x] Google OAuth lands on onboarding without 403.
  - [x] Invalid inputs blocked; confirm-password cannot be pasted.
  - [x] T&C/Privacy open correctly; logo does not exit onboarding.
  - [x] Degree select saves real value; placeholder never persisted.
  - [x] Mentor skills height consistent; back never auto-submits.
- DB Cross-check & Deltas
  - SQL Editor: No changes required.

### 1B) Profile Settings & Read Views (Doc Points 14–20 + Screens)
- [ ] Shared mapper `mapProfileForUI(profileRow)`:
  - fields: fullName, profession, phone, locationDisplay, companyPosition, degreeDepartment, graduationYear, skills[], interests[], achievements[{title,description}], about (about || brief), social{github,twitter,linkedin,website}.
- [ ] Achievements: jsonb array of {title,description}; hide if empty.
- [ ] Social links validation: GitHub/Twitter/X/LinkedIn/Website domain rules.
- [ ] Skills input: Tokenize by comma/space; trim; dedupe; store jsonb.
- [ ] Experience: header subtitle = Company — Position from positions[0]; timeline lists remaining.
- [ ] Education: Clean merge (degreeDepartment + graduationYear), no stray punctuation.
- [ ] Phone: Read/write with tel: link.
- [ ] About: Fallback to brief.
- [ ] Unsaved navigation: Warn on unload; preserve social links across tabs.
- Acceptance
  - [ ] Read pane and public profile match.
  - [ ] Achievements as cards; no raw JSON.
  - [ ] Social links enforced; Education clean; Phone visible.
- DB Cross-check & Deltas
  - [ ] Fill per template after implementation.

### 1C) Roles & Routing (Doc Points 25–26)
- [x] Role promotion: transactional update + session refresh.
- [x] Routing: Role-aware guards; Employer → Employer dashboard.
- Acceptance
  - [x] Admin elevation persists; Employer routed correctly.
- DB Cross-check & Deltas
  - SQL Editor: No changes required.

---

## 2) ALUMNI DIRECTORY & SEARCH
### 2A) Directory Cards (Screens)
- [x] Use shared mapper; under name show profession.
- [x] Education chip = degreeDepartment; nearby graduationYear.
- [x] Current role line = Company — Position.
- [x] Location from city/country; hide when empty.
- [x] Skills: up to 3 chips; hide if none.
- [x] CTA “View Profile”; responsive grid; full keyboard access.
  - Acceptance
    - [ ] Cards mirror profile; no placeholders; CTA works.
  - DB Cross-check & Deltas
  - SQL Editor: No changes required.
  - Notes
    - UI↔DB naming: Using `v_profiles_directory_card` view; education enrichment via `education_history` (latest `graduation_year`). Mapper `mapProfileToCard` normalizes fields.

### 2B) Profile View (read-only from Directory)
- [x] Render About/Experience/Education/Socials/Achievements via mapper; hide empty sections.
- Acceptance
  - [x] Public profile equals Profile Settings read view.
- DB Cross-check & Deltas
  - SQL Editor: No changes required.

---

## 3) EVENT MANAGEMENT
### 3A) Events List (Screens + Doc Points 31–36, 38–43)
- [x] Status: All | Upcoming | Past (default Upcoming), persist to URL.
- [x] Search: 250ms debounce over title, short_description, long_description, location.
- [x] Type filter: “All Types” + specifics; "Other" inline input → persists to event_type.
- [x] Sort: Default Date Desc (start_date desc).
- [x] Card location: Show when location present; hide if empty.
- [x] Visibility: Members see only is_published=true AND approval_status='approved'; Admin sees all.
  - Acceptance
    - [ ] Admin “All” shows past+upcoming; Member sees approved/published.
    - [ ] Search/filters reflected in network + URL; no console errors.
    - [ ] Cards display location when present.
  - DB Cross-check & Deltas
    - SQL Editor: No changes required.
    - Notes
      - UI↔DB naming: Frontend now uses `start_date` and `location` per DB; previous `start_time`/`location_text` references were corrected in `frontend/src/components/Events/Events.js`.
      - Recommended (optional) indexes for performance at scale:
        - Index on `events(start_date)` for status filtering and sorting.
        - Composite index on `events(approval_status, is_published)` for visibility filtering.

### 3B) Calendar View (Screens)
- [x] If using react-big-calendar: control date/view; onNavigate/onView; views=['month','week','day']; remove Agenda.
- [x] Fix z-index/pointer-events so toolbar receives clicks; keyboard focus rings and grid navigation.
  - Acceptance
    - [x] Prev/Next/Today and view change work by mouse & keyboard; no Agenda.
  - DB Cross-check & Deltas
    - SQL Editor: No changes required.

### 3C) Edit Event (Screens)
- [x] Bind long_description ⇄ textarea; persist on save.
- [x] Prefill/persist organizer_name, organizer_email, organizer_phone.
  - Acceptance
    - [ ] Existing text appears; organizer info present; changes saved.
  - DB Cross-check & Deltas
  - SQL Editor: No changes required.
  - Notes
    - UI↔DB naming: `longDescription` (UI) maps to `long_description` (DB). Organizer fields map to `organizer_name`, `organizer_email`, `organizer_phone`.

### 3D) Event Details (Screens)
- [x] Add location icon; hide block if location empty.
- [x] Gate “View Feedback” until now() >= end_time or status='completed'.
- [x] Attendees drawer loads rows with avatar/name/role.
  - Acceptance
    - [ ] Icon visible; feedback gating correct; attendees list loads.
  - DB Cross-check & Deltas
  - SQL Editor: No changes required.
  - Notes
    - UI↔DB naming: Uses `venue`, `address`, `virtual_link`, `end_date`, and `status` from `events`.
    - Attendees query uses `event_rsvps` + `profiles` for avatar/name/role; no schema changes.

### 3E) KPIs — Total Attendees (Screens)
- [x] Count rule: include only status IN ('going','attended').
- [x] Per-event totals use COUNT(DISTINCT attendee_id). Avoid join fan-out.
  - Acceptance
    - [ ] KPI stable and matches DB row counts.
  - DB Cross-check & Deltas
  - SQL Editor: No changes required.
    - Source: `event_attendees.attendance_status` in ('going','attended'). Consider index on `(attendance_status)` for large datasets.

---

## 4) JOB PORTAL (Doc Points 28–36, 38–43)
- [x] Visibility: Members see only approved & active; Admin can filter Pending/Rejected. (client-side approval filter + RPCs)
- [x] Delete: Owners & Admins can delete (confirm RLS + UI).
- [x] Posting roles: Allow Admin, Employer, Mentor; lock others.
- [x] Search: 250ms debounce across title/desc/company/location.
- [x] Filters: Wire type/experience/location/industry/salaryRange/postedWithin; “Reset Filters” works. (Department pending)
- [x] Back: Preserve list state via URL-mirrored filters/sort/page/view.
- [x] Layout: Normalize spacing, alignment, and card height.
- [x] Label rename: “Requirements” → “Qualification” (kept DB field; UI label updated).
- [x] Student view: Show deadline (list and details).
- [x] Overview: Show Industry/Department/Experience Level when present.
- [x] Resume upload: MIME/size validation and clear errors; uploads to `resumes` bucket.
- [x] Apply: Prevent duplicate via pre-check; return friendly message.
- [x] Hide resume uploader for posters.
  - Acceptance
    - [ ] Lists reflect approvals; delete works for owners/Admin; instant search & filters OK; back restores state; label updated; deadline/overview visible; upload/apply succeed; posters don’t see uploader.
  - DB Cross-check & Deltas
  - SQL Editor: Required Changes
    - Tables/Columns
      - job_applications — Add unique constraint on (job_id, applicant_id). Rationale: enforce single application per user; UI depends on uniqueness.
    - Indexes
      - job_applications(job_id, applicant_id) — unique index to support the above.
    - RLS Policies & Grants
      - storage bucket `resumes`: ensure authenticated users can upload/read their own files; restrict content types to PDF/DOC/DOCX if possible. Frontend enforces MIME/size.
    - Views/Functions
      - Confirm RPCs `get_jobs_with_bookmarks_v2` and `get_my_posted_jobs` filter approvals correctly. If not, add server-side approval filters to reduce client-side filtering.
      - Added `get_jobs_with_bookmarks_v3(p_department text)` to support Department server-side filtering and return `{ items, total_count }` JSON.
    - Naming mismatches & mapper confirmation
      - UI label “Qualification” maps to DB `requirements` array. No DB rename required; purely UI label change.

---

## 5) NETWORKING & MENTORSHIP
### 5A) Messaging System (Doc Point 27 + prior fixes)
{{ ... }}
- [x] Sorting: latest_message_at desc.
- [x] Preview: Use full last message row (content + ts).
- [x] Realtime: Idempotent message UUID; subscribe once per channel.
  - Acceptance
  - [x] Correct historic conversations per user; previews accurate; no dupes; realtime updates once.
  - DB Cross-check & Deltas
  - SQL Editor: Required Changes
    - Indexes
      - conversations(latest_message_at) — for conversation list sorting.
      - messages(conversation_id, created_at) — for latest preview.
      - messages(conversation_id, read_at) — for unread count queries.
      - conversation_participants(user_id, conversation_id) — for participant lookups.
    - Tables/Columns
      - messages — Unique index on (client_uuid) for idempotent send.
    - Storage
      - message_attachments bucket: public read; authenticated insert policy.
    - Functions
      - `mark_conversation_as_read(p_conversation_id uuid, p_user_id uuid)` helper to bulk mark messages read.
    - Note: All included in `supabase/migrations/20250906_windsurf_required_changes.sql`.

### 5B) Groups (Screens & Doc: FK embed + Access Denied)
- [x] Visibility: Public groups visible to all; private groups visible only to members (RLS + client guards).
- [x] Explicit embed: Use explicit PostgREST embed by FK name for creator.
- Acceptance
  - [x] Non-admins see all public, approved groups; and private groups only when a member. Admins can see all groups.
  - [x] Creator information appears on group records (explicit FK embed with fallback).
- DB Cross-check & Deltas
  - SQL Editor: No changes required.
  - Notes
    - UI uses explicit FK embed `profiles!groups_created_by_fkey` to fetch creator; if FK name differs, code falls back to a second query to fetch `profiles(created_by)`.
    - Visibility is enforced by merging two queries for non-admins: public approved groups and private groups where the current user is a member (via `group_members`). This aligns with expected RLS.

### 5C) Mentorship (Doc Point 51)
- [x] Confirm RLS permits mentor role to insert program rows; fix client validation & payload; success route after create.
- Acceptance
  - [x] Mentor can create a mentorship program with title, description, optional start/end dates, and active flag.
  - [x] Client validates required title and date ordering; navigates to dashboard on success.
- DB Cross-check & Deltas
  - SQL Editor: Required Changes
    - RLS Policies & Grants
      - mentorship_programs — Enable RLS (if not already) and add INSERT policy allowing users with roles in ('mentor','admin','super_admin').
    - Functions/Triggers
      - handle_updated_at() — ensure present.
      - Trigger set_mentorship_programs_updated_at — BEFORE UPDATE to maintain updated_at.
    - Notes
      - Implemented idempotently in `supabase/migrations/20250906_windsurf_required_changes.sql`.

---

## 6) ADMINISTRATION TOOLS
### 6A) Approvals & Visibility (Doc Points 21–22, 24, 28)
- [x] Directory and job/event lists must filter by is_approved/approval_status and is_published where applicable.
- [x] On event create, enqueue an Admin notification (bell/inbox) entry.
- Acceptance
  - [x] Only approved/allowed items visible to non-admins; Admin sees & manages approvals; event create triggers admin notification.
- DB Cross-check & Deltas
  - SQL Editor: Required Changes
    - Tables/Columns
      - admin_notifications — Create table with id, created_at, notification_type, entity_type, entity_id, message, created_by, is_read.
    - RLS Policies & Grants
      - Enable RLS; allow SELECT/UPDATE only for roles in ('admin','super_admin').
    - Functions/Triggers
      - notify_admin_on_event_create() — AFTER INSERT trigger on public.events to insert an admin notification.
    - Notes
      - Implemented idempotently in `supabase/migrations/20250906_windsurf_required_changes.sql`.

### 6B) User Ops (Doc Points 44–49)
- [ ] Show last_sign_in_at in Admin user list.
- [ ] Update rejection message to Alumni@ametuniv.ac.in.
- [ ] Admin delete job path (UI + RLS).
- [ ] Revoke super_admin (visible only to existing super_admin); refresh session.
- [ ] Remove user per policy: soft-delete/anonymize or hard-delete + admin log.
- [ ] Auto-assign batch group on verification (grad_year/department).
- Acceptance
  - [ ] Actions work and reflect immediately; audit entries created.
- DB Cross-check & Deltas
  - [ ] Fill per template after implementation.

### 6C) Activity Logs (Lightweight)
- [x] Minimal Admin view to read user_activity_logs with time-range and action filters.
- [x] Log: Events filter/view changes; Directory search/filter actions; Messages list loads.
- Acceptance
  - [x] Logs list entries with route/user_id/action/meta/ts; no PII beyond user_id.
- DB Cross-check & Deltas
  - SQL Editor: Required Changes
    - Tables/Columns
      - user_activity_logs — Create table: id uuid pk default gen_random_uuid(), created_at timestamptz default now(), user_id uuid (FK profiles), route text, action text, meta jsonb, ip text, ua text.
    - RLS Policies & Grants
      - Enable RLS. INSERT: authenticated WHERE user_id = auth.uid(). SELECT: only roles in ('admin','super_admin').
    - Indexes
      - idx_ual_created_at(created_at desc), idx_ual_action(action), idx_ual_user(user_id, created_at desc).
    - Notes
      - Implemented idempotently in `supabase/migrations/20250906_windsurf_required_changes.sql`. Per your preference, execute deltas via the Supabase SQL Editor on the live DB.

---

## 7) UI/UX & ACCESSIBILITY (Cross-cutting + Registration Popup)
- [ ] Replace clickable <div> with <button>/<a>; icon-only controls have accessible names.
- [ ] Visible focus rings across interactive controls; correct tab order; aria roles for loading states.
- [ ] Consistent style tokens: spacing, radii (2xl), soft shadows; responsive across Events, Calendar, Directory, Messages.
- [ ] Placeholders are hints only; never persisted (validate pre-submit).
- [ ] Success popup after registration: modal “Registration successful! Please check your email to verify your account.” with OK → Home.
- [ ] Add location icons in Event cards/details; hide empty sections (Skills/Achievements) rather than showing “No …”.
- Acceptance
  - [ ] Keyboard-only and SR flows are good; no color/contrast regressions.
  - [ ] Registration modal shows, then OK → Home.
  - [ ] No “Unknown/No skills listed” placeholders in UI.
- DB Cross-check & Deltas
  - [ ] Fill per template after implementation.

---

## 8) DB & MIGRATION HYGIENE (errors seen in prior attempts)
Issues to reconcile (no code here; produce the plan + checklist)
- [ ] Missing column in policy: `profiles_select` referenced `is_hidden` that doesn’t exist → either add column (boolean default false) or remove from policy and use is_approved only.
- [ ] Duplicate policy/constraint syntax: fix `ADD CONSTRAINT IF NOT EXISTS …` placement and ensure idempotent migrations; avoid “duplicate policy” errors by dropping/replacing with stable names.
- [ ] Notifications function return type change: cannot alter return type → plan to DROP FUNCTION … then recreate; include a data backfill if types changed.
- [ ] Realtime channel “subscribe only once”: ensure each component subscribes once; cleanup on unmount; reuse a single channel instance per topic.
- Acceptance
  - [ ] Re-running migrations idempotent; policies compile; app no longer throws these errors at runtime.
- DB Cross-check & Deltas
  - [ ] Fill per template after implementation.

---

## 9) FINAL QA & PR
- [ ] Module test passes (unit/integration) + manual QA scripts per module.
- [ ] No console errors; Network calls reflect filters & roles.
- [ ] PR: `full audit fixes — profiles, directory, events, jobs, messaging, admin, a11y`
- [ ] Include Fix Log mapping each doc/screenshot point to files changed and tests added.
- [ ] Attach a demo script describing step-by-step verification per role (Admin/Alumni/Employer/Mentor/Student).
- [ ] Hand-off Note: Summarize all “SQL Editor: Required Changes” from each module into one ordered checklist for execution in Supabase.

---

✅ DONE
Follow the modules in order, and for each: implement fixes → Acceptance → DB Cross-check & Deltas (compare with your local `supabase/` folder + schema PDF) → note the exact SQL editor changes if needed.
