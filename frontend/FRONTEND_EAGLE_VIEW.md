# AMET Frontend – Eagle-View Overview

## 1. What this document is

This file is a **product + architecture map of the React frontend only**. It explains:

- **What the app is** from the UI side (major modules and flows).
- **How the frontend is wired** (entry points, routing, contexts, providers).
- **How roles and approvals shape the UI** (what different users see).
- **How the frontend talks to Supabase and the backend** at a high level.

It does **not** document backend implementation or Supabase schema in detail; it focuses on what the React app expects and how it behaves.

---

## 2. Frontend runtime stack (high-level)

- **Framework**: React (CRA-style entry in `src/index.js` + `src/App.js`).
- **Routing**: `react-router-dom` v6 using `<BrowserRouter>`, `<Routes>`, `<Route>`, `<Navigate>`.
- **Data fetching / caching**: `@tanstack/react-query` (`QueryClientProvider` in `App.js`).
- **Backend / DB client**: Supabase JS client via `src/utils/supabase.js`.
- **Realtime**: `RealtimeProvider` around the tree for Supabase realtime channels.
- **Auth & roles**: `AuthProvider` / `useAuth()` (`src/contexts/AuthContext.js`).
- **Notifications / toasts**:
  - `react-hot-toast` `<Toaster>` in `App.js`.
  - Custom `NotificationProvider` / `useNotification` (notification center / in-app alerts).
- **Layout shell**:
  - `Navigation` (left-side nav / primary navigation).
  - `Header` (top bar with user info, actions).
  - Flex layout for main content area.

---

## 3. Entry points and top-level providers

### 3.1 `src/index.js`

- Renders `<App />` into `#root` within `<React.StrictMode>`.
- Wraps `App` with `MobileNavProvider` for responsive/mobile navigation state.
- In **production**, silences most `console.*` calls to keep logs clean in prod.

### 3.2 `src/App.js`

`App` defines the **top-level application shell** and global providers:

- Wraps children in:
  - `<BrowserRouter>` (SPA routing).
  - `<QueryClientProvider>` (React Query client).
  - `<AuthProvider>` (auth/session/profile/roles/permissions).
  - `<RealtimeProvider>` (Supabase realtime connections).
  - `<NotificationProvider>` (in-app notification center).
  - `<AuthListener>` (reacts to auth events in the UI layer).
  - `<FeedbackWidget>` (global feedback component).
  - `<Toaster>` (toast notifications configuration).

`AppContent` is the **real router** that switches between:

- **Unauthenticated shell** (public routes like `/`, `/login`, `/register`, legal/help pages).
- **Authenticated shell** (dashboard + full app in a layout with `Navigation` + `Header`).

The decision is based on `useAuth()` and `user` presence, plus special handling for *rejected* users.

---

## 4. Global auth, roles, approvals, and permissions

### 4.1 `AuthContext` (`src/contexts/AuthContext.js`)

`AuthProvider` is the **canonical source of truth** for:

- **Supabase session** (`session`).
- **Authenticated user** (`user`).
- **Profile row** from `public.profiles` (`profile`).
- **Role** (`profile.role` or `user.user_metadata.role`, normalized to a single enum).
- **Approval flags** (approved/pending/rejected, fully approved flags) from:
  - `get_current_user_flags` RPC, or
  - Profile fields as fallback (`approval_status`, `alumni_verification_status`, `is_approved`).
- **Permissions** derived from role and approval state:
  - `BASE_PERMISSIONS` per role: `alumni`, `student`, `employer`, `admin`, `super_admin`.
  - Helpers: `hasPermission`, `hasAnyPermission`, `hasAllPermissions`.
  - Derived booleans: `isApproved`, `isPending`, `isRejected`, `isAdminLike`, `isFullyApproved`.

Other responsibilities:

- Fetch and seed `profiles` row from Supabase auth metadata when missing (safe fill-only fields).
- Keep approval flags in sync via RPC and profile.
- Subscribe to realtime changes on the current user’s profile and refetch.
- Handle OAuth sign-ins and map provider profile data into `profiles` (fill-only updates).
- Normalize role via `getUserRole()` and expose `userRole`.
- Handle sign-out, clearing state and localStorage, and redirecting to `/login`.

### 4.2 Protected routes & access control

- **`ProtectedRoute` (`src/components/Auth/ProtectedRoute.js`)** wraps routes to enforce:
  - Authentication (`isAuthenticated`).
  - Optional **email verification** (`requireVerifiedEmail`).
  - Role-based admin checks (`requireAdmin`, `allowRoles`).
  - Permission-based checks using `hasPermission(requiredPermission)`.
  - Super-admin-only routes via `isSuperAdminOnly`.
- **Rejection handling**:
  - If profile/account is rejected, the app renders only the **Rejection page** and redirects everything else to `/rejection`.

This layer is how **product rules** (who can access mentorship, jobs posting, admin panels, etc.) are enforced on the frontend.

---

## 5. Routing & major product modules (eagle view)

The main single-page app is organized under authenticated routes in `AppContent`.

### 5.1 Public area (unauthenticated)

When `user` is **not** authenticated:

- **Home / marketing**:
  - `/`, `/home` → `HomePage` (landing / marketing page).
- **Auth**:
  - `/login` → `Login`.
  - `/register` → `EnhancedRegister` (multi-step registration with profile data capture).
  - `/forgot-password`, `/update-password`.
  - `/auth/callback` for OAuth callbacks.
- **Info & legal**:
  - `/terms-of-service` → `TermsOfService`.
  - `/privacy-policy` → `PrivacyPolicy`.
  - `/help` → `HelpCenter`.
  - `/contact` → `ContactUs`.
  - `/about` → `AboutPage`.
- **Protected feature routes** (`/directory`, `/events`, `/jobs`, `/mentorship`) redirect back to `/login`.

### 5.2 Authenticated layout shell

When `user` **is authenticated** and **not rejected**:

- Top-level layout:
  - `Navigation` (sidebar) and `Header` (top navigation + user info) wrap the main `<Routes>`.
- The main content area is a scrollable panel with a gradient background, where all primary modules render.

### 5.3 Dashboard

- Route: `/dashboard`.
- Component: `AlumniDashboard` inside `RequireCompleteProfile` + `ProtectedRoute`.
- Purpose:
  - Central home after login for **all roles** (alumni, students, employers, admins).
  - Shows **summary counts** and widgets:
    - Total alumni, connections, upcoming events, job opportunities, unread messages.
    - Recommended jobs, upcoming events.
    - Recent activity widget (unified feed across features).
- Data source:
  - RPC: `get_dashboard_summary_for_user(p_user_id)` via Supabase.
  - Uses internal helpers for timeouts/retries and consistent toast-based error handling.

### 5.4 Profile & settings

- Routes:
  - `/profile` → `Profile` (profile details & editable fields; gated by `access:profile_settings`).
  - `/profile/security` → `Security` (password/security related UI).
  - `/settings/notifications` → `NotificationSettings`.
  - `/complete-profile` → `ProfileCompletion` (used by `RequireCompleteProfile` gate).
- Behavior:
  - `RequireCompleteProfile` ensures users fill in mandatory profile fields before accessing core modules (like dashboard, directory, etc.).
  - Uses `updateProfile` from `AuthContext` paired with Supabase `profiles` table.

### 5.5 Alumni directory & user profiles

- Routes:
  - `/directory` → `DirectoryPage` (full alumni directory listing).
  - `/directory/:id` → `AlumniProfile` (public-ish profile view for an alumnus).
  - `/profile/:userId` → `UserProfilePage` (richer authenticated profile view).
- Access / gating:
  - Requires `view:alumni_directory` permission.
  - **Employers** (`getUserRole() === 'employer'`) are redirected from `/directory` to `/jobs`.
- Data flows:
  - Supabase queries `public.profiles` and related views for alumni info.
  - Shared catalog hooks (e.g. degree/department) help normalize academic fields.

### 5.6 Events

- Routes (authenticated area):
  - `/events/*` → `EventsPage` (events listing & details; `access:events`).
  - `/events/my-registrations` → `MyRegistrationsList`.
  - `/events/create`, `/events/new` → `CreateEvent` (admin-like creation; `events:create`).
  - `/events/edit/:id` → `EditEvent` (edit existing event).
  - `/admin/events/:id/feedback` → `EventFeedbackReport`.
  - `/admin/events/moderation` → `EventModerationPanel`.
- Behavior:
  - Core event flows: discover, register, view my registrations, admins manage and review feedback.
  - Frontend assumes Supabase tables for events, RSVPs, and feedback, enforced via RLS.

### 5.7 Jobs & applications

- Routes:
  - `/jobs` → `JobListingsPage` (job listings browser).
  - `/jobs/:id` → `JobDetails` (requires `view:jobs`).
  - `/jobs/:jobId/apply` → `JobApplication`.
  - `/jobs/:jobId/application-success` → redirects to `/jobs/applications`.
  - `/jobs/applications` & `/jobs/applications/:id` → `ApplicationTracking` (applicant’s tracking view).
  - `/my-applications` → `JobApplicationStatus` (applicant perspective).
  - **Employer / job poster flows** (require `post:jobs` & `view:job_applications`):
    - `/jobs/post`, `/jobs/post/select`, `/jobs/post/link`, `/jobs/create` → `PostJob*`, `JobPostingForm`.
    - `/jobs/:id/edit` & `/jobs/edit/:id` → `EditJob`.
    - `/jobs/:jobId/manage`, `/jobs/:id/applications` → `ManageJobApplications`.
  - `/jobs/alerts` → `JobAlerts` (saved search or alert-style flows).
- Gating:
  - View jobs: `view:jobs` permission.
  - Apply jobs: `apply:jobs` permission.
  - Post/manage jobs: `post:jobs` and usually `ApprovedGuard` for employer approval state.

### 5.8 Mentorship module (new hub)

- Canonical route: `/mentorship`.
- Main layout component: `MentorshipLayout`.
  - Provides header, description, status banners (via `MentorshipStatusBannerStrip`), and tab navigation.
- Tabs & hub:
  - `MentorshipTabs` + `MentorshipHub` coordinate the **role-aware navigation and panels**.
  - Tabs are driven by query params (e.g. `?tab=find`, `?tab=mentee`, `?tab=mentor`, `?tab=requests`, `?tab=settings`).
  - `MentorshipHub` chooses which panel to render:
    - `FindMentorsPanel` (discover mentors).
    - `MyMentorsPanel` (as mentee).
    - `MyMenteesPanel` (as mentor).
    - `RequestsPanel` (sent/received requests, via `sub` query param).
    - `MentorshipSettingsPanel` (mentor/mentee mode from `mode` query param).
- Role context:
  - `useMentorshipRoleContext()` centralizes: role (`student`/`alumni`), mentee approval, mentor profile existence, dual-role detection, counts (active mentors/mentees, sent/received requests), and capacity.
  - Tabs and default active panel adapt based on this context to surface the most relevant UI.
- Legacy routes:
  - Several older routes (e.g. `/mentorship/find`, `/mentorship/my-requests`, etc.) redirect into the new canonical `/mentorship` hub with appropriate query params.
- Access:
  - Gated by `ProtectedRoute` with `requiredPermission="request:mentorship"`.
  - Additional admin routes for mentor approvals:
    - `/admin/mentor-approvals` (mentor approval queue for admins).

### 5.9 Groups & networking

- Routes:
  - `/groups/*` → `GroupsPage` (group discovery/joining/participation; `access:groups`).
  - `/groups/:id/manage` → `GroupManage` inside `RequireGroupAdmin` (only group admins + site admins).
- Role & RLS assumptions:
  - `RequireGroupAdmin` queries `group_members` for the current user and target group, and only allows admins (or site-level admins via `profile.is_admin`).
  - Employers are redirected from groups to events.

### 5.10 Messaging

- Route: `/messages` → `Messages` (messaging system UI).
- Gated by `ProtectedRoute` with `requiredPermission="message:users"` and `RequireCompleteProfile`.
- Frontend behavior:
  - Derived from conversations/participants and messages tables.
  - Assumes proper RLS and DB triggers; frontend focuses on listing conversations, opening a thread, and sending messages.

### 5.11 Notifications

- Routes:
  - `/notifications` → `Notifications` (central page listing notifications / recent activity associations).
- Infrastructure:
  - `NotificationProvider` and `useNotification` for global snackbars/in-app alerts.
  - `AlumniDashboard` also surfaces recent activity, linking into deeper flows (jobs, events, mentorship, groups).

### 5.12 Admin area

- Routes under `ProtectedRoute requiredPermission="access:all"` (or `view:feedback_reports`):
  - `/admin/analytics` → `Analytics` (admin analytics dashboard).
  - `/admin/users` → `AdminUsersPage`.
  - `/admin/activity-logs` → `ActivityLogs`.
  - `/admin/settings` → `AdminSettings`.
  - `/admin/csv` → `CSVImportExport`.
  - `/admin/events/:id/feedback` → `EventFeedbackReport`.
  - `/admin/events/moderation` → `EventModerationPanel`.
  - `/admin/mentor-approvals` → `AdminMentorApprovals`.
  - `/admin/verify` → `DataVerificationDashboard`.
  - `/admin/feedback` → `FeedbackReport` (gated by `view:feedback_reports`).

These screens give admins visibility and control over data, events, mentor approvals, and feedback.

---

## 6. Cross-cutting hooks, services, and utilities

Beyond the modules above, the frontend uses several **cross-cutting abstractions**:

- **Hooks** (`src/hooks/`):
  - Role / approval helpers like `useMentorshipRoleContext`.
  - Custom hooks for fetching data via Supabase with React Query (e.g., activity, profiles, directory filters, etc.).
- **Services** (`src/services/`):
  - Encapsulate calls to Supabase tables/RPCs to keep components slim.
  - Example: profile-related helpers (`getMyProfile`, `upsertMyProfileFillOnly`, `updateMyProfile`) ensuring frontend never writes admin-only fields.
- **Utils** (`src/utils/`):
  - `supabase.js` – central Supabase client, realtime registry, helper functions.
  - `logger` – environment-aware logging.
  - Display helpers (e.g., `getDisplayName`), data formatting, feature-specific utilities.
- **Lib** (`src/lib/`):
  - Shared role helpers (e.g., `isAdminLike`), constants, and small pure functions used by components.

These are used by multiple feature areas (auth, directory, mentorship, jobs) to enforce **consistent patterns**.

---

## 7. How the frontend talks to Supabase / backend

### 7.1 Data access patterns

- Direct **Supabase client calls** for simple table reads/writes:
  - E.g., `supabase.from('profiles').select(...)` in `AuthContext` and profile screens.
  - `supabase.from('group_members')`, `supabase.from('mentorship_requests')`, etc. in feature modules.
- **RPC-based calls** for aggregated or performance-sensitive info:
  - `get_dashboard_summary_for_user` for dashboard.
  - `get_current_user_flags` for approval/verification state.
- **React Query** wraps many of these calls:
  - Provides caching, refetch, loading/error states, and query invalidation.

### 7.2 Realtime

- `AuthContext` listens to **profile changes** via `onPostgresChangesOnce` and refetches the profile when updates occur.
- Some modules (e.g., mentorship relationships, messages) may rely on similar realtime subscriptions through the shared realtime provider.

### 7.3 Error handling & UX

- Common patterns:
  - Use `toast.error` for user-facing errors in dashboard and other modules.
  - Fallback logic for timeouts/network errors with friendly messages.
- Loading states:
  - Global **"Initializing application..."** spinner while auth/session is resolving.
  - Module-level loading spinners or skeletons (e.g., dashboard widgets, lists).

---

## 8. Role / approval model (frontend perspective)

From the frontend’s point of view, **everything** hangs off:

- `user` (Supabase auth user).
- `profile` (row in `public.profiles`).
- `userRole` (normalized from `profile.role` or auth metadata role, default `alumni`).
- `approvalStatus` & `isFullyApproved` (derived from RPC/fields).

Key behaviors driven by this model:

- **Directory access**: requires `view:alumni_directory` permission.
- **Mentorship access**: requires `request:mentorship` (basic entry), plus mentorship-specific flags for mentor/mentee capabilities.
- **Jobs**:
  - Browsing jobs: `view:jobs`.
  - Applying: `apply:jobs`.
  - Posting/managing jobs: `post:jobs` + `ApprovedGuard` for employers.
- **Groups**: `access:groups`.
- **Messaging**: `message:users`.
- **Admin-only areas**: `access:all` or `view:feedback_reports`.

The combination of **role + approval** determines what the user can **see and do** in the UI, and `ProtectedRoute` + component-level checks enforce these rules consistently.

---

## 9. Mental model for working with this frontend

- Think of the app as a **single-authenticated shell** with a few public pages:
  - Once logged in, users live in the `Navigation` + `Header` layout.
- **AuthContext** is the backbone:
  - Any feature that cares about user identity, profile, role, or approvals should use `useAuth()`.
- **Routes map directly to product modules**:
  - Dashboard, Directory, Events, Jobs, Mentorship, Groups, Messages, Admin.
- **Supabase is the single backend API** from the frontend’s perspective:
  - Tables, views, and RPCs hide most server-side complexity.
- **Roles/permissions are enforced at both frontend and RLS**:
  - Frontend protects UX and navigation.
  - RLS and RPCs enforce true security.

This document should give you enough of a **bird’s-eye map** to reason about new features, refactors, and audits without diving into every individual component file.
