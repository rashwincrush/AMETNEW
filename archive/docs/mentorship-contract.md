# Mentorship Contract (Canonical Spec)

_Last updated: 2025-12-10_

## 0. Scope & Overview

This document defines the **canonical contract** for the Mentorship feature in this codebase.

- **What it does (conceptual):**
  - Let eligible users (primarily alumni and students) discover approved mentors/trainers.
  - Let mentees send mentorship requests and manage pending/active relationships.
  - Let approved mentors manage incoming requests, active mentees, capacity, and availability.
  - Provide a **role-aware hub** with status banners, tabs, and settings for both mentees and mentors.
  - Integrate mentorship relationships with the unified messaging system (`/messages`) via secure RPCs.

- **Where it lives (primary frontend entry points):**
  - **New panel-based hub (canonical going forward):**
    - `frontend/src/components/Mentorship/MentorshipLayout.jsx`
    - `frontend/src/components/Mentorship/MentorshipHub.jsx`
    - `frontend/src/components/Mentorship/MentorshipTabs.jsx`
    - `frontend/src/components/Mentorship/banners/MentorshipStatusBannerStrip.jsx`
    - `frontend/src/hooks/useMentorshipRoleContext.(ts|js)`
    - `frontend/src/hooks/useMentorshipSummary.js`
    - `frontend/src/hooks/useMentorshipBannerModel.js`
    - `frontend/src/hooks/useMentorshipEligibility.js`
    - `frontend/src/hooks/useMentorshipMutations.(ts|js)`
    - `frontend/src/hooks/useOpenMentorshipChat.js`
    - `frontend/src/lib/queries/mentorship.(ts|js)`
    - `frontend/src/constants/mentorshipCopy.js`
    - `frontend/src/utils/mentorshipStatus.js`
    - Panel components under `frontend/src/components/Mentorship/panels/*` (e.g. `FindMentorsPanel`, `MyMentorsPanel`, `MyMenteesPanel`, `RequestsPanel`, `MentorshipSettingsPanel`).

  - **Legacy/transition components (still routed in some places):**
    - `frontend/src/components/Mentorship/Mentorship.js` (**deprecated**, legacy all-in-one tabbed UI).
    - `frontend/src/components/Mentorship/MentorshipStatus.js` (status/requests MUI page).
    - `frontend/src/components/Mentorship/MentorshipRequestsDashboard.js` (requests dashboard MUI page).
    - `frontend/src/components/Mentorship/MentorshipDashboard.js` (mentor sessions placeholder page).
    - `frontend/src/components/Mentorship/MentorshipDirectory.js` (directory stub pointing back to Mentorship Program).
    - `frontend/src/components/Mentorship/MentorshipChat.js` (**deprecated**, legacy chat tied to `mentorship_messages`).
    - `frontend/src/components/Mentorship/MyMentorship.js` and `frontend/src/pages/mentorship/MyMentorshipPage.jsx` (my mentorships overview, including availability toggle and relationships list).
    - `frontend/src/pages/MentorshipPage.js` (older `/mentorship` subrouter for directory/profile/requests).

- **Primary routes (as used in code today):**
  - **Hub & tabs:**
    - `/mentorship` (expected to render `MentorshipLayout` → `MentorshipHub` with `?tab=...` query params).
    - `/mentorship?tab=find` – find mentors/trainers.
    - `/mentorship?tab=mentee` – mentee view: my trainers/mentors.
    - `/mentorship?tab=mentor` – mentor view: my trainees.
    - `/mentorship?tab=requests[&sub=sent|received]` – requests inbox/outbox.
    - `/mentorship?tab=settings[&mode=mentee|mentor]` – mentee/mentor settings.
  - **Legacy/auxiliary:**
    - `/mentorship/me` – My Mentorship page (uses `MyMentorshipPage.jsx`).
    - `/mentorship/profile/:id` – view mentorship profile (MUI-style).
    - `/mentorship/requests` – requests dashboard (MUI-style, `MentorshipRequestsDashboard`).
    - `/mentorship/directory` – disabled directory page that reroutes users to Mentorship Program.
    - `/mentorship/become-mentor` – older mentor application/settings flow (still referenced in banners and CTAs).
    - Mentorship-related navigation into unified messaging: `/messages?conversationId=...&source=mentorship&relationshipId=...` or `/messages?threadId=...&source=mentorship&requestId=...`.

- **Backend / DB objects (from code and types):**
  - **Core tables:**
    - `public.mentors` – mentor/trainer profile per user (`user_id`, `status`, `max_mentees`, `current_mentees`, expertise/preferences, etc.).
    - `public.mentorship_requests` – mentorship request rows with `id`, `mentor_id`, `mentee_id`, `status`, `message`, `goals`, timestamps.
    - `public.mentorship_relationships` – ongoing or past mentorship relationships (`mentor_id`, `mentee_id`, `status`, `start_date`, `end_date`, etc.).
    - `public.profiles` – user profile including approval flags and `is_available_for_mentorship`.
    - `public.alumni_directory_public` – read-only view for displaying `full_name` and `avatar_url` when hydrating identities.
    - Legacy: `public.mentorship_messages` (deprecated in favor of unified `conversations`/`messages`).

  - **Views:**
    - `public.v_my_mentorship_requests` – mentee-side request list (used by `useMentorshipSummary`, `MentorshipStatus`, `MentorshipRequestsDashboard`).
    - `public.v_my_mentorship_dashboard` – mentor-side request inbox (used by `MentorshipStatus`, `MentorshipRequestsDashboard`, `lib/queries/mentorship`).
    - `public.v_my_mentorship_relationships` – relationship list for current user (used by `MyMentorshipPage`, `useMentorshipSummary`).
    - `public.v_mentors_public` – underlying view used by `get_mentors_for_current_mentee` for listing mentors.

  - **RPCs (canonical write surface):**
    - `get_mentors_for_current_mentee(p_limit, p_offset)` – personalized mentor listing for current mentee.
    - `mentorship_request_create(p_mentor_id, p_message, p_goals)` – create new request (mentee-side).
    - `mentorship_request_respond(p_request_id, p_new_status[, p_reason])` – mentor responds (accept/reject) and may return `relationship_id`.
    - `mentorship_request_cancel(p_request_id)` – mentee cancels own request.
    - `mentorship_relationship_end(p_relationship_id, p_reason)` – end an active mentorship relationship.
    - `mentorship_end_all_between(p_other_user_id, p_reason)` – end all relationships between two users.
    - `mentorship_full_disconnect(p_other_user_id, p_reason)` – end mentorships and sever connection/DMs.
    - `mentorship_toggle_availability(p_next)` – toggle mentor availability, driving `profiles.is_available_for_mentorship` and capacity.
    - `mentorship_open_chat(p_relationship_id)` – open/create DM thread for a mentorship relationship (returns `conversation_id`).
    - `user_block(p_other_user_id, p_reason)` – block user, used for safety flows that impact mentorship and connections.
    - Admin RPCs: `admin_update_mentee_status(p_user_id, p_status)`, `admin_update_mentor_status(p_user_id, p_status)`.

- **Roles affected:**
  - `student`, `alumni`, `employer`, `admin`, `super_admin` – with **alumni/students** as primary mentees/mentors, and admin roles able to audit/override via admin RPCs and dashboards.

This file is the **source of truth** for:

- Mentorship **sections** (banners, panels, lists, settings, chat hops).
- **Data sources** (hooks, helpers, RPCs, views, tables) used by each section.
- **Navigation and role gating** for student, alumni, employer, admin_or_super_admin.
- An **Alumni "desired vs current" diff** as the main audit lens.

---

## 1. Section / Unit Matrix (Canonical Contract)

The table below focuses on the **panel-based Mentorship hub** as the canonical UX, while capturing existing legacy pages where relevant.

### 1.1 Sections

| ID | Section | Description / Purpose | Frontend data source | Backend objects / RPCs / views | Primary routes | Role gating (visibility/usage) |
|----|---------|-----------------------|----------------------|-------------------------------|----------------|-------------------------------|
| S1 | **Mentorship Layout Shell** | Page frame with header, description, banner strip, tabs, and content container. | `MentorshipLayout.jsx` → static copy + composition of `MentorshipStatusBannerStrip`, `MentorshipTabs`, `MentorshipHub`. | Reads only current auth/profile via `useAuth`. | `/mentorship` | **All signed-in roles** (student, alumni, employer, admin/super_admin) can load; actual actions gated in downstream sections/RLS. |
| S2 | **Status Banner Strip** | Horizontal stack of up to 2 role-aware banners (mentee + mentor) summarizing status and CTAs. | `MentorshipStatusBannerStrip.jsx` + `useMentorshipBannerModel()` + `MENTORSHIP_COPY.banners.*`. | Depends on `mentors`, `mentorship_requests`, `mentorship_relationships` counts via `useMentorshipRoleContext` + RLS; profile-level flags (`approval_status`, `mentee_status`, `mentor_status`, `is_available_for_mentorship`). | `/mentorship` (always rendered inside layout) | **Student/Alumni:** see mentee banners once approved or when pending. **Alumni mentors:** additionally see mentor banners (pending/approved/at capacity). **Employer/Admin:** may see mentee banners if also mentee-approved; no dedicated employer copy. |
| S3 | **Tab Navigation (MentorshipTabs)** | Scrollable, role-aware tab chips mapping to mentee, mentor, requests, and settings views, driven by URL `?tab`, `sub`, `mode`. | `MentorshipTabs.jsx` + `useMentorshipRoleContext()` + URL search params. | Counts fetched directly: `mentorship_requests` (pending as mentee and mentor) and `mentorship_relationships` (active as mentee/mentor). | `/mentorship?tab=...` | Tabs shown based on context: mentee-only (approved mentee, no mentor profile), mentor-only (mentor profile only), or dual-role. Unapproved users see only basic `find` + `settings`. |
| S4 | **Find Mentors / Trainers Panel** | Browse mentor directory, search and filter, and navigate to request flows. Capacity and availability are respected in UI. | `FindMentorsPanel` (and **legacy** `Mentorship.js` + `FindMentorsPage.jsx`) using `useMentorshipSummary`, `useMentorshipMutations`, `getMentorCapacityState`. | Core: `rpc.get_mentors_for_current_mentee` + `v_mentors_public`, `profiles.is_available_for_mentorship`, `mentors.max_mentees/current_mentees_count`; request/relationship context from `v_my_mentorship_requests` and `v_my_mentorship_relationships`. | `/mentorship?tab=find`, legacy: `/mentorship` (old tab), `/mentorship/directory` (now disabled stub). | **Mentee-approved students/alumni:** can fully use. **Unapproved/pending:** see banners and disabled CTAs as per `useMentorshipEligibility`. Employers/admins not explicitly targeted but may render with limited actions. |
| S5 | **My Trainers (Mentee Panel)** | For users as mentees: list of active/past mentors, relationship statuses, and links to chat. | `MyMentorsPanel` + `useMentorshipSummary` + `useOpenMentorshipChat`. **Legacy**: parts of `MyMentorshipPage.jsx` and `MyMentorship.js`. | `v_my_mentorship_relationships` (mentee-facing), `mentorship_relationships`, `mentorship_open_chat` RPC via `mentorshipApi.openMentorshipChat`, `mentorship_relationship_end` for endings. | `/mentorship?tab=mentee`, legacy: `/mentorship/me` | **Mentee-approved student/alumni:** see and manage mentors. **Employers/admins:** only if also have mentee approval in profile; no separate copy. |
| S6 | **My Trainees (Mentor Panel)** | For approved mentors: list of active/past mentees, statuses, and links to manage/end relationships. | `MyMenteesPanel` + `useMentorshipRoleContext`, `useOpenMentorshipChat`, `useMentorshipMutations`. **Legacy**: `MentorshipStatus.js`, `MentorshipRequestsDashboard.js`, `MyMentorship.js` mentor sections. | `mentorship_relationships` (mentor-facing), `v_my_mentorship_dashboard` for request details, `mentorship_relationship_end`, `mentorship_end_all_between`, `mentorship_full_disconnect`. | `/mentorship?tab=mentor`, legacy: `/mentorship/requests`, mentor portions of `MentorshipStatus` and `MentorshipRequestsDashboard`. | **Alumni mentors with `mentors.status = 'approved'`:** full access. Pending/rejected mentors get banner + disabled actions. Students should not normally see this tab unless explicitly granted mentor role. |
| S7 | **Requests Panel (Sent / Received)** | Unified view of mentee-sent and mentor-received requests, with status chips and actions (accept/reject/cancel). | `RequestsPanel` + `useMentorshipMutations` (`useCreateMentorshipRequest`, `useAcceptMentorshipRequest`, `useRejectMentorshipRequest`, `useCancelMentorshipRequest`), `useMentorshipSummary`. Legacy: `MentorshipStatus.js`, `MentorshipRequestsDashboard.js`. | Views: `v_my_mentorship_requests`, `v_my_mentorship_dashboard`. RPCs: `mentorship_request_create`, `mentorship_request_respond`, `mentorship_request_cancel`. Error mapping via `mapMentorshipError` and `mentorshipStatus` helpers. | `/mentorship?tab=requests&sub=sent|received`, `/mentorship/requests` | **Mentee-approved:** can see sent requests and cancel pending ones. **Approved mentors:** can respond to received pending requests. Admin views can see global table view in `MentorshipRequestsDashboard`. |
| S8 | **Mentorship Settings Panel** | Role-aware settings for mentees and mentors (capacity, availability, preferences, goals). Some flows still routed via `become-mentor` legacy screen. | `MentorshipSettingsPanel.jsx` using `useMentorshipRoleContext`, `useMentorshipEligibility`, `useToggleMentorAvailability` (React Query wrapper over RPC), plus forms for mentor profile data and mentee goals (where implemented). | `mentors` table (`status`, `max_mentees`, `current_mentees`, expertise/preferences), `profiles.is_available_for_mentorship`, RPC `mentorship_toggle_availability`. Legacy direct write: some flows still call `supabase.from('profiles').update({ is_available_for_mentorship })`. | `/mentorship?tab=settings&mode=mentee|mentor`, `/mentorship/become-mentor`, `/mentorship/me` (availability toggle). | **Alumni/students:** mentee settings once profile approved. **Alumni mentors:** full mentor settings. **Admins:** indirectly affect mentor/mentee status via admin tooling and RPCs, not via this UI. |
| S9 | **My Mentorship Overview (Legacy)** | Combined view of relationships, mentor capacity, and availability toggle. Used as a transitional single-page overview. | `MyMentorshipPage.jsx` using `useAuth`, `supabase.from('v_my_mentorship_relationships')`, `endMentorshipRelationship`, and direct `profiles.is_available_for_mentorship` update. | `v_my_mentorship_relationships`, `mentors` (for mentor row), `profiles.is_available_for_mentorship`, `mentorship_relationship_end` RPC. | `/mentorship/me` | **Logged-in mentees/mentors:** can see; alumni primary. This should converge conceptually with S5/S6/S8 over time. |
| S10 | **Mentorship Requests Dashboard (Legacy Admin/Mentor View)** | MUI-based dashboard for reviewing requests as admin or mentor, hydrating identities from directory view. | `MentorshipRequestsDashboard.js` using `useAuth`, raw `supabase.from` queries, and `acceptMentorshipRequest` / `rejectMentorshipRequest`. | Admin path: `mentorship_requests` base table + `alumni_directory_public` identity join. Non-admin path: `v_my_mentorship_requests`, `v_my_mentorship_dashboard`. RPC: `mentorship_request_respond`. | `/mentorship/requests` | **Admin:** can see **all** requests directly from `mentorship_requests`. **Mentors/Mentees:** see only their own via views. |
| S11 | **Mentorship Dashboard (Sessions Placeholder)** | Older MUI-based page for mentor/mentee sessions, with tabs for "Schedule New Session" and "My Sessions". Does not yet wire to stable DB schema. | `MentorshipDashboard.js` using `SessionScheduler`, `SessionsCalendar`, and basic `mentors` check. | `mentors` (status check); any sessions-related tables are out of scope of current snapshot (placeholder). | `/mentorship/dashboard` or `/mentorship/matching` (depending on routing) | **Approved mentors/mentees:** routed here via old links; currently informational/placeholder. |
| S12 | **Legacy Mentorship Chat** | Deprecated 1:1 chat tied to mentorship requests and `mentorship_messages`. All new flows must use `/messages` with `mentorship_open_chat`. | `MentorshipChat.js` (explicitly marked `@deprecated`), with realtime subscriptions on `mentorship_messages`, `mentorship_requests`, and `mentorship_relationships`. | Tables: `mentorship_messages`, `mentorship_requests`, `mentorship_relationships`, `alumni_directory_public`. Utility: `checkConnectionStatus` enforces both mentorship active and connection status. | `/mentorship/chat/:requestId` (should no longer be linked from main flows). | **Any mentor/mentee** that can reach this route can view if they are a participant in the request. **Writes should be considered legacy and superseded by unified conversations/messages.** |

> **Note:** This contract treats the **panel-based hub (S1–S8)** and unified messaging as canonical going forward. Legacy components (S9–S12) must not gain new features but should still respect the same backend constraints, RPCs, and RLS rules.

---

## 2. Role Views

This section summarizes how each **role** should experience the Mentorship module based on the current code.

### 2.1 Student

- **Visibility:**
  - Can reach `/mentorship` and see:
    - S1 Mentorship Layout Shell.
    - S2 Status Banner Strip (mentee banners driven by approval and mentee status).
    - S3 Tab Navigation (usually mentee-only tabs once approved: `find`, `mentee`, `requests`, `settings` with `mode=mentee`).
    - S4 Find Mentors Panel.
    - S5 My Trainers (when they have relationships).
    - S7 Requests Panel for sent requests.
    - S8 Settings Panel (mentee mode).
  - Legacy pages: may still reach `/mentorship/me`, `/mentorship/requests`, and `/mentorship/directory` via older links.

- **What they can do (from code):
  - **Browse mentors:**
    - List comes from `get_mentors_for_current_mentee` and is filtered client-side by search and `showAcceptingOnly` toggle.
    - Availability is determined by `profiles.is_available_for_mentorship` + mentor capacity (`current_mentees_count`, `max_mentees`).
  - **Send requests:**
    - Use `useCreateMentorshipRequest` / `mentorshipApi.createMentorshipRequest` → `mentorship_request_create` RPC.
    - Requests respect **backend checks** for eligibility, duplicate requests, capacity, and pending-request limit (5) as seen in `mapMentorshipError`.
  - **Cancel requests:**
    - `mentorship_request_cancel` via TS or JS services.
  - **View relationships:**
    - `v_my_mentorship_relationships` surfaces active/past mentors; UI shows capacity chips and links to chat/profile.
  - **Open chat:**
    - New flows should go through `useOpenMentorshipChat` → `mentorship_open_chat` RPC → `/messages` route.
    - Some legacy flows still call `ensureDmThreadWith`, which should be considered transitional.

- **How approval and profile fields influence behavior:**
  - `approval_status !== 'approved'` → mentee CTAs are blocked/soft-disabled and banners instruct the user to complete profile and wait for approval.
  - `mentee_status` (if defined) must be `approved` for full mentee actions; otherwise, `useMentorshipEligibility` shows specific reasons.
  - Student role is also used in UI to **hide mentor-related CTAs** (e.g., "Become a Mentor").

### 2.2 Alumni

- **Visibility:**
  - Everything a Student can see, plus:
    - Mentor-specific banners (S2) when they have or are applying for a mentor profile.
    - Additional tabs in S3 when they are mentors or dual-role: `mentor`, `requests` (with received tab), `settings` in `mode=mentor`.
    - S6 My Trainees panel (once mentor profile exists).
  - Legacy pages like `MyMentorship`, `MentorshipDashboard`, and `MentorshipStatus` are primarily alumni-focused.

- **What they can do (from code):**
  - As **mentees**: identical to Student behavior.
  - As **mentors**:
    - Apply to become mentor (trainer) via legacy settings/`become-mentor` route and `mentors` table.
    - Review incoming requests using S7 / legacy dashboards (`v_my_mentorship_dashboard`).
    - Accept or reject requests via `mentorship_request_respond`.
    - Manage active mentees via `mentorship_relationships` + `mentorship_relationship_end` (and possibly `mentorship_end_all_between` / `mentorship_full_disconnect`).
    - Control capacity & availability using `mentors.max_mentees/current_mentees` and `profiles.is_available_for_mentorship` (RPC `mentorship_toggle_availability` is canonical; some legacy flows still update `profiles` directly).

- **How approval & profile fields influence behavior:**
  - `approval_status` must be `approved` for mentor and mentee statuses to be effective.
  - `mentee_status` + `mentor_status` determine whether `isApprovedMentee` / `isApprovedMentor` are true in `useMentorshipEligibility` and `useMentorshipRoleContext`.
  - `is_available_for_mentorship` + `max_mentees/current_mentees` drive copy like "You’re visible in the trainer directory", "You’re at capacity", and whether new requests can be sent in UI.

### 2.3 Employer

- **Visibility:**
  - Can technically reach `/mentorship` and see S1 and S2 banners, but the current code does **not** treat employers as mentees or mentors.
  - `useMentorshipRoleContext` only treats `role === 'student'` and `role === 'alumni'|'user'` specially, so employers fall into the "fallback" tab set (`find`, `settings`).

- **What they can do:**
  - Conceptually, employers should not participate in mentorship as mentees or mentors in the current product slice.
  - In practice, they may still see generic find/settings views with little actionable power; backend RLS and RPCs should prevent them from creating mentorship requests or mentor profiles unless explicitly supported.

- **Approval/profile influence:**
  - Employer profiles may be `approved`, but `mentee_status` / `mentor_status` are not expected to be populated; `useMentorshipEligibility` will treat them as not eligible.

### 2.4 Admin or Super Admin

- **Visibility:**
  - Can access all the same mentorship UI as Alumni (if they also have alumni-like profile) **plus** admin dashboards:
    - `MentorshipRequestsDashboard` showing **all** requests from `mentorship_requests` (base table) with hydrated identities.
  - Banners and tabs are rendered based on their profile role and mentor/mentee flags, not solely on admin status.

- **What they can do:**
  - Approve or reject mentor/mentee statuses via admin tools and RPCs (`admin_update_mentee_status`, `admin_update_mentor_status`).
  - Review all mentorship requests in `mentorship_requests` (auditing and moderation).
  - Force mentors unavailable through:
    - RPC-level decisions (e.g., capacity enforcement and status) and
    - `adminForceMentorUnavailable` helper, which performs a direct `profiles.is_available_for_mentorship = false` update (must be tightly controlled and auditable).
  - Use `user_block` / `mentorship_full_disconnect` for safety and abuse handling.

- **Approval/profile influence:**
  - Admins should still have their own `profiles` row; however, their ability to act on any request or mentor/mentee profile is governed by backend RLS and security-definer RPCs, not the frontend role flags alone.

---

## 3. Alumni – Desired vs Current Behavior

This section focuses on **alumni** as the key persona, acknowledging they can be **mentees, mentors, or both**.

### 3.1 Desired behavior (Alumni)

**D1 – Visibility**

- D1.1: An alumni with a regular approved profile should see the Mentorship hub (`/mentorship`) with:
  - Header + explanation (S1).
  - Status banners summarizing mentee and/or mentor status (S2).
  - Tabs appropriate to their state (S3):
    - Mentee-only: `Find Trainers`, `My Trainers`, `My Requests`, `Settings`.
    - Mentor-only: `My Trainees`, `Requests`, `Settings`.
    - Dual-role: all of the above.
  - Panels for find, mentors, mentees, requests, and settings (S4–S8).

**D2 – Actions**

- D2.1: As a **mentee**, an alumni should be able to:
  - Discover mentors who are approved and available for mentorship.
  - Send mentorship requests with optional message/goals.
  - Cancel own pending requests.
  - View list of active/past mentors and navigate to chat and profile.

- D2.2: As a **mentor**, an alumni should be able to:
  - Apply to become a mentor and see clear status (pending/approved/rejected).
  - When approved, receive requests in a clear inbox.
  - Accept or decline requests; acceptance creates/activates a relationship.
  - View active mentees and past relationships.
  - End relationships with an optional reason.
  - Control capacity and availability via a simple, safe settings UI.

- D2.3: As a **dual-role** user, an alumni should be able to:
  - Easily distinguish mentee vs mentor responsibilities.
  - Switch between their trainers and trainees without confusion.
  - Avoid any accidental self-mentoring or duplicate mentorships.

**D3 – Constraints & RLS expectations**

- D3.1: Alumni should only ever see **their own** mentee/mentor requests and relationships:
  - As mentee: only rows where `mentee_id = current_user_id`.
  - As mentor: only rows where `mentor_id = current_user_id`.
- D3.2: Capacity and availability must be enforced **server-side**:
  - No new requests should be accepted when a mentor is at capacity or unavailable.
  - Client-side messaging (`getMentorCapacityState`, `MentorCapacityPill`) is advisory only.
- D3.3: Duplicate requests and abuse prevention must be enforced via RPC constraints:
  - No multiple active/pending requests between the same mentor/mentee.
  - Max 5 pending requests per mentee at a time.
- D3.4: Chat write permissions must be conditioned on:
  - Active mentorship relationship.
  - Mutual connection/are_connected flag.
  - No blocks/`user_block` constraints.
- D3.5: All write operations (creating/updating requests, relationships, capacity, availability, chat) must flow via **RPCs** and respect RLS; direct `update` on base tables should be reserved for tightly controlled admin flows.

### 3.2 Current implementation summary (from code)

**C1 – Visibility & role context**

- `useMentorshipRoleContext` derives:
  - `isStudent`, `isAlumni` based on `profile.role`/fallbacks.
  - `isMenteeApproved` from `approvalStatus === 'approved'`.
  - Mentor profile presence and `mentorStatus` from `mentors` table.
  - Dual-role flag when both mentee-approved and mentor profile exist.
  - Summary counts via:
    - `mentorship_requests` (pending as mentee/mentor).
    - `mentorship_relationships` (active as mentee/mentor).
- `MentorshipTabs` and `MentorshipHub` both use this context to choose default and visible tabs.

**C2 – Data & RPC usage**

- Mentor listing:
  - Uses `supabase.rpc('get_mentors_for_current_mentee', { p_limit, p_offset })` for personalized mentor lists.
  - Uses `is_available_for_mentorship`, `current_mentees_count`, `max_mentees` from view fields to determine capacity.
- Requests & relationships:
  - Mentee requests: `v_my_mentorship_requests` via `useMentorshipSummary`, `MentorshipStatus`, `MentorshipRequestsDashboard`, and `lib/queries/mentorship`.
  - Mentor request inbox: `v_my_mentorship_dashboard`.
  - Relationships: `v_my_mentorship_relationships` in `MyMentorshipPage` and summary hook.
- Write operations:
  - Requests: `mentorship_request_create`, `mentorship_request_respond`, `mentorship_request_cancel` (through TS/JS services and `useMentorshipMutations`).
  - Relationship endings: `mentorship_relationship_end`, plus broader `mentorship_end_all_between` and `mentorship_full_disconnect` APIs.
  - Availability: both `mentorship_toggle_availability` (TS services + React Query hook) and legacy direct `profiles.update` in `MyMentorshipPage`.
  - Chat: canonical path `mentorship_open_chat` via `mentorshipApi.openMentorshipChat` and `/messages`; legacy path uses `ensureDmThreadWith` and `mentorship_messages`.

**C3 – Constraints surfaced in UI**

- `mapMentorshipError` (TS and JS variants) maps backend error strings/codes to semantic error codes:
  - `NOT_ELIGIBLE_MENTEE`, `MENTOR_UNAVAILABLE`, `DUPLICATE_ACTIVE_REQUEST`, `CAPACITY_REACHED`, `PENDING_REQUEST_LIMIT`, `MENTOR_NOT_SELECTABLE`, `REQUEST_ALREADY_EXISTS`, `INVALID_STATUS_TRANSITION`, `ALREADY_ENDED`, `FORBIDDEN`.
- `useMentorshipEligibility` computes `isApprovedMentee` / `isApprovedMentor` and provides human-readable reasons when blocked.
- `MENTORSHIP_COPY` and `useMentorshipBannerModel` provide structured UX copy for banners and empty states based on counts and statuses.

### 3.3 Alignment (Alumni: desired vs current)

- **A1 – Role-aware visibility:**
  - Alumni can be mentee-only, mentor-only, or dual-role, and the tab set adjusts accordingly (matches D1.1).
  - Status and banner logic differentiates between unapproved, pending, rejected, and approved mentors/mentees.
- **A2 – RPC-centric writes:**
  - Core mutations (requests, responses, cancellations, relationship endings, chat opening, disconnects) are routed through RPCs as desired (matches D3.5).
- **A3 – Capacity/availability:**
  - UI clearly marks mentors as accepting/not-accepting/at-capacity via `getMentorCapacityState` and `MentorCapacityPill`, aligned with view fields (matches D3.2 at the presentation layer).
- **A4 – Duplicate & limit handling:**
  - `mapMentorshipError` and client logic anticipate duplicate requests and 5-request limit; user-facing messages guide mentees appropriately (matches D3.3 semantically).
- **A5 – Ownership & scoping:**
  - All view/table queries on the frontend filter by `user.id` for mentee_id or mentor_id; assuming RLS mirrors this, it matches D3.1.

### 3.4 Open questions / gaps (to verify or converge)

The following are **not confirmed bugs**, but alignment gaps or areas needing explicit decisions:

- **G1 – Legacy vs new hub routing**
  - There are multiple entry points (`/mentorship` with tabs, `/mentorship/me`, `/mentorship/requests`, `Mentorship.js`, `MentorshipStatus.js`, `MentorshipDashboard.js`).
  - Action: Decide which surfaces are canonical (likely the panel-based hub + My Mentorship overview) and ensure all top-level links route there, not to deprecated components.

- **G2 – Direct profile updates vs RPC for availability**
  - `MyMentorshipPage` directly updates `profiles.is_available_for_mentorship`; newer flows use `mentorship_toggle_availability`.
  - Action: Confirm that **all non-admin** availability/capacity changes must go through `mentorship_toggle_availability` for consistent business rules and auditability.

- **G3 – Chat consistency**
  - Some flows still use `ensureDmThreadWith` and legacy MentorshipChat; others use `mentorship_open_chat` + unified `/messages` UI.
  - Action: Ensure mentorship chat entry points **only** use `useOpenMentorshipChat` and `mentorship_open_chat`, and that DB/RLS gating (relationship status, connection, blocks) fully matches D3.4.

- **G4 – Employer behavior**
  - Employers are not first-class in mentorship flows but can technically hit `/mentorship`.
  - Action: Decide explicitly whether employers can be mentees/mentors; if not, ensure RPC/RLS and UI enforce read-only/no-op behavior, and clarify via banners.

- **G5 – Admin global visibility and overrides**
  - `MentorshipRequestsDashboard` allows admins to read from `mentorship_requests` with broad visibility; admin helpers can directly update profiles.
  - Action: Validate RLS + security-definer behavior for admin RPCs and ensure they cannot be invoked from non-admin contexts; confirm that direct `profiles` writes are limited to admin-only flows.

- **G6 – Status field normalization**
  - `mapMentorshipError` contains logic for bad enum values (e.g., `mentorship_request_status` enum migration). There may still be legacy rows with invalid statuses.
  - Action: Confirm data clean-up and ensure all enum-based constraints and status transitions are reflected in both DB and UI.

---

## 4. How to Use This Document

- **Product / UX:**
  - Treat Sections 0–3 as the **canonical Mentorship contract**.
  - When adjusting flows (e.g., simplifying tabs, merging legacy dashboards into the hub), update this spec to reflect intentional changes rather than letting behavior drift.
  - Use the Role Views and Alumni diff as a checklist when reviewing copy and state transitions.

- **Frontend (React):**
  - Use the **panel-based hub** (S1–S8) as the single source of truth for new UI work.
  - When touching mentorship code:
    - Prefer hooks and APIs listed here (`useMentorshipRoleContext`, `useMentorshipSummary`, `useMentorshipMutations`, `useOpenMentorshipChat`, `mentorshipApi` RPC wrappers).
    - Avoid introducing new direct `supabase.from('...').update()` calls for mentorship objects; use RPCs instead.
    - Keep `mentorshipStatus` helpers and `MENTORSHIP_COPY` mappings in sync with backend enums and error semantics.

- **Backend / DB / RLS:**
  - Use this contract to validate that:
    - Views (`v_my_mentorship_*`) and RPCs enforce ownership (`mentor_id`/`mentee_id` = current user) and status transitions.
    - Capacity and availability are enforced server-side, not only in the UI.
    - Admin RPCs and direct writes respect least-privilege and are unreachable from non-admin roles.
  - Any changes to enums, status fields, or RPC signatures must be reflected both here and in the frontend helpers.

- **QA / SDET:**
  - Use the **Alumni section (3)** as a starting test plan:
    - Test mentee-only, mentor-only, and dual-role alumni accounts for visibility, actions, and error handling.
    - Verify capacity, duplicate request, and pending-request-limit paths using realistic data.
    - Confirm that users never see or can act on other users’ mentorship requests/relationships.
    - Validate all chat entry points use the unified `/messages` system and honor relationship + connection status.
  - Extend the same patterns to Student and Admin personas, and clarify expected behavior for Employers.
