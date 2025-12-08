# AMET Alumni Platform – Feature & Flow Deep Dive

This document describes, in depth, the core UX modules of the AMET Alumni Platform:

- Navigation & Header
- Dashboard
- Alumni Directory (search, profiles, connections)
- Events (browse, RSVP, feedback, moderation)
- Jobs (applicant + employer journeys)
- Mentorship (mentee + mentor journeys)
- Groups (create → approve → join → manage)

It focuses on:

- What each screen shows
- Which buttons/links exist and where they navigate
- Which roles can see each item
- Which Supabase tables / APIs are typically hit

Role/permission references follow the enums and permission map in `src/contexts/AuthContext.js` and `src/lib/roles.*`.

---

## 1. Navigation & Header

### 1.1 Side Navigation (`components/Layout/Navigation.js`)

**Component**: `Navigation`

**Used in**: `AppContent` when a user is authenticated (wrapped around all private routes).

**Role/permission inputs**:

- `useAuth()` provides:
  - `getUserRole()` → `'alumni' | 'student' | 'employer' | 'admin' | 'super_admin'`
  - `hasPermission(permission: string)`
  - `isAdmin` (DB role `admin` or `super_admin`)

**Base menu model** (`allMenuItems`):

- `/dashboard`
  - **Label**: "Dashboard"
  - **Icon**: `HomeIcon`
  - **Permission**: `access:dashboard`
- `/directory`
  - **Label**: "Alumni Directory"
  - **Icon**: `UsersIcon`
  - **Permission**: `view:alumni_directory`
- `/events`
  - **Label**: "Events"
  - **Icon**: `CalendarIcon`
  - **Permission**: `access:events`
- `/jobs`
  - **Label**: "Job Portal"
  - **Icon**: `BriefcaseIcon`
  - **Permission**: `view:jobs`
- `/mentorship`
  - **Label**: "Mentorship"
  - **Icon**: `AcademicCapIcon`
  - **Permission**: `request:mentorship`
- `/groups`
  - **Label**: "Groups"
  - **Icon**: `UserGroupIcon`
  - **Permission**: `access:groups`
- `/messages`
  - **Label**: "Messages"
  - **Icon**: `ChatBubbleLeftRightIcon`
  - **Permission**: `message:users`

**Effective visibility (`getMenuItems`)**:

- Start from `allMenuItems`.
- Compute `role = getUserRole()`.
- For each item:
  - If `role === 'employer'` and `item.path` is `/directory` or `/groups` → HIDDEN, even if employer has permissions.
  - Else show only if `hasPermission(item.permission)` returns `true`.

**So per role** (assuming default permissions in `AuthContext`):

- **Alumni** (`role='alumni'`):
  - Dashboard, Alumni Directory, Events, Job Portal, Mentorship, Groups, Messages.
- **Student** (`role='student'`):
  - Same as alumni, except no mentor-profile management entries (those are driven by routes, not menu).
- **Employer** (`role='employer'`):
  - Dashboard, Events, Job Portal, Messages.
  - **No** Directory or Groups entries in sidebar (even though they might have some underlying permissions).
- **Admin / Super Admin**:
  - Have `access:all` and thus see all items (Directory and Groups included).

**Active state**:

- `isActive(path)` is `true` when:
  - `location.pathname === path` **or** `location.pathname.startsWith(path + '/')`.
- Active items get different background/text styling and `aria-current="page"`.

**Bottom actions (desktop sidebar)**:

- **Profile Settings**
  - **Label**: "Profile Settings"
  - **Icon**: `CogIcon`
  - **Route**: `/profile`
  - **Visibility**: all authenticated users.
- **Admin Settings**
  - **Label**: "Admin Settings"
  - **Icon**: `ShieldCheckIcon`
  - **Route**: `/admin/settings`
  - **Visibility**: only if `isAdmin === true`.
- **Logout**
  - Custom SVG icon with arrow box.
  - Calls `handleLogout` → `signOut()` from `AuthContext` and ends up at `/login`.
  - Present to all users.

**Mobile navigation**:

- Use `MobileNavContext` for `open` / `setOpen` state.
- A full-screen overlay renders similar menu items as desktop, but:
  - Includes a top bar with logo, title "AMET Alumni" and close button (`XMarkIcon`).
  - Each nav item closes the menu (`setOpen(false)`) when clicked.
  - Bottom actions mirror desktop: Profile Settings, Admin Settings (admin only), Logout.
- ESC key closes the panel.

### 1.2 Header (`components/Layout/Header.js`)

**Component**: `Header`

**Used in**: Authenticated layout, above main content.

**Inputs and state**:

- `useAuth()` for `user`, `profile`, `signOut`.
- `useCurrentUserIdentity()`:
  - Provides `name` (display name), `avatarUrl`, `isLoading`.
- `useMobileNav()` for mobile menu toggle.
- Internal state: `showUserMenu` (profile dropdown open/closed).

**Left side (logo & mobile menu)**:

- On small screens (`md:hidden`):
  - **Hamburger button** (`Bars3Icon`), labelled "Open menu":
    - Toggles `setNavOpen(true)` → opens mobile `Navigation` sidebar.
- Logo area (`<Link to="/">`):
  - Visual logo is actually handled inside Navigation and other components; in Header this may be intentionally empty or styled through CSS.

**Center (tagline banner)**:

- Only visible on `sm+` screens.
- Shows an animated tagline text (via inline `@keyframes fade-in-slide-up`) – messaging about alumni networking and opportunities.
- Purely informational; no clickable controls.

**Right side (notifications + user menu)**:

- **Notifications Bell** (`<Bell />`)
  - Imported from `components/Notifications/Bell`.
  - Typically navigates or opens notifications and may show unread count (implementation in `Bell`).
- **User avatar & name button**
  - Shows:
    - Display name from `useCurrentUserIdentity()` (or fallback from profile/auth context).
    - Role label: derived from `currentUser.role`:
      - `super_admin` → "Super Admin"
      - `admin` → "Administrator"
      - `employer` → "Employer"
      - `student` → "Student"
      - else `primary_role || role || 'Alumni'`.
    - Avatar image:
      - `src = avatarUrl + '?t=' + timestamp` to bust caches.
      - Fallback `/default-avatar.svg` on error.
  - Clicking toggles `showUserMenu` dropdown.

**User dropdown menu**:

- Appears as a positioned `div` when `showUserMenu === true`.
- Contents:
  - **User summary header**:
    - Name (bold), email, role label.
  - **"Your Profile" link**
    - `/profile`
    - Closes menu on click.
  - Divider.
  - **"Sign out" button**
    - Calls `handleLogout`:
      - `setShowUserMenu(false)`
      - `signOut()` from `AuthContext` (also clears Supabase session/state)
      - `navigate('/login')`.

**Outside click handling**:

- `useEffect` attaches `mousedown` listener on `document`:
  - If click is outside `userMenuRef`, closes the dropdown.

---

## 2. Dashboard (`components/Dashboard/AlumniDashboard.js`)

**Component**: `AlumniDashboard`

**Used for**: All roles as the unified dashboard (`App.js` always renders this for `/dashboard`).

**Key inputs**:

- `useAuth()` for `user`, `profile`, `userRole`.
- `useNotification()` to surface errors.
- `supabase` client to fetch personalized insights.
- `ActivitiesWidget` and `MyGroupsWidget` (imported child components) for activity feeds and group previews.

**High-level layout**:

- A main grid of cards (statistics + widgets).
- A right-side column (on large screens) for recent activities and groups.
- A bottom grid of **Quick Action Buttons**.

### 2.1 Main statistics & insights cards

While the file is large, core patterns are:

- **Stats cards** (top row):
  - Likely include counts like:
    - "Connections", "Events Registered", "Jobs Applied", "Mentorships", etc.
  - Data fetched via Supabase queries (e.g., from `connections`, `event_rsvps`, `job_applications`, `mentorship_requests`).
  - `StatSkeletonCard` shows pulsating placeholders while loading.

- **Upcoming events** card:
  - Lists the next few events relevant to the user.
  - Supabase tables: `events`, `event_rsvps`.
  - Buttons/links inside each item typically:
    - "View Event" → route `/events/...`.
    - "Manage" for admins.

- **Recommended jobs** card:
  - Query from `jobs` table with filters (e.g., active & not expired, maybe by degree/department/location).
  - Each entry may be clickable (to job details page) or have a "View" button.
  - Empty state shows an illustration and copy encouraging exploring the job portal.

- **ActivitiesWidget** (`<ActivitiesWidget />`):
  - Encapsulated component that queries recent activity via either the RPC or fallback queries.
  - Renders a list of recent items:
    - E.g., "You applied to X", "You joined Group Y", etc.
  - Each entrance usually links to the relevant detail page.

- **MyGroupsWidget**:
  - Shows a subset of groups the user is a member of.
  - CTA links to `/groups` or specific group pages.

### 2.2 Quick Action buttons (bottom grid)

At the bottom of the dashboard, there is a **grid of clickable cards** that act as shortcuts:

- **"Find Alumni"**
  - Icon: `UsersIcon`
  - Route: `/directory`
  - Role visibility:
    - Shown for users that can access directory (alumni/student/admin).
    - Employers are usually redirected away from `/directory` by route logic.

- **"Create Event"**
  - Icon: `CalendarIcon`
  - Route: `/events/create`
  - Role/permissions:
    - Only meaningful for users with `access:events` (admins or event organizers).
    - Component itself is just a link; enforcement is done by `ProtectedRoute` on the route.

- **"My Applications"**
  - Icon: `ClipboardDocumentCheckIcon`
  - Route: `/my-applications`
  - For alumni/students applying to jobs.

- **"Find Mentor"**
  - Icon: `AcademicCapIcon`
  - Route: `/mentorship`
  - Requires `request:mentorship`.

- **"Join Groups"**
  - Icon: `ChatBubbleLeftRightIcon`
  - Route: `/groups`
  - Hidden for employers via route-level redirect.

Each card is styled with "glass" aesthetics and hover effects, but logically they are **simple navigation buttons**.

### 2.3 Role-based behavior

- The dashboard **component** itself adjusts messaging and data for the current `userRole`, but route-level access is controlled in `App.js`:
  - `ProtectedRoute requiredPermission="access:dashboard"`.
- Employers will see job/employer-centric data, but the same component is used.
- Admins may see additional stats (e.g., platform-wide metrics) via extra cards (or the Admin dashboard screen `AdminDashboard.js` in other contexts).

### 2.4 Alumni Directory – Search, Profiles, Connections

The **Alumni Directory** is a core module that lets alumni/students/admins search and connect with other alumni.

- Primary list route: `/directory` → `DirectoryPage`.
- Detail route: `/directory/:id` → `AlumniProfile`.
- Underlying data sources:
  - `alumni_directory_public` view – **student-safe** public fields (no contact info).
  - `profiles` table – full profile (private view; restricted by RLS).
  - `get_directory_profiles` RPC – role-aware directory payload for non-students.
  - `v_directory_connection_states` view + `connections` table – connection state & counts.

#### 2.4.1 Routes & role-based access

- In `App.js`:
  - `/directory` route:
    - Wrapped in `RequireCompleteProfile` and `ProtectedRoute requiredPermission="view:alumni_directory"`.
    - If `getUserRole() === 'employer'`:
      - Immediately `<Navigate to="/jobs" replace />` – employers are redirected away.
    - Otherwise → renders `<DirectoryPage />`.
  - `/directory/:id`:
    - `RequireCompleteProfile` + `ProtectedRoute requiredPermission="view:alumni_directory"`.
    - Renders `<AlumniProfile />`.

So:

- **Students** and **alumni/admins** with `view:alumni_directory` can open Directory and individual profiles.
- **Employers** are routed away from directory list and profiles even if they have some underlying permissions.

#### 2.4.2 Component breakdown – `DirectoryPage`

**File**: `components/Directory/DirectoryPage.jsx`

- **Purpose**
  - Modern, role-aware directory experience for `/directory`.
  - Combines:
    - Search + filter UI.
    - Tabs for **All**, **Requests Received**, **Requests Sent**, **My Connections**, and optionally **Employers**.
    - Priority strip for pending connection requests.
    - Grid of alumni cards with connection state.

- **Key state**
  - User/rel state:
    - `me` – current authenticated user (via `supabase.auth.getUser()`).
    - `relMap: Map<other_user_id, rel>` – from `v_directory_connection_states`.
    - `counts` – `{ received, sent, connected }` plus derived `all` and `employers`.
    - `activeFilter` – `'all' | 'received' | 'sent' | 'connected' | 'employers'`.
    - `relsLoaded` – guard to avoid re-query loops.
  - Search, sort, pagination:
    - `searchTerm`, `debouncedSearch` – debounced text query.
    - `currentPage`, `itemsPerPage` – client-side pagination over filtered list.
    - `sortBy` – `'full_name,asc' | 'full_name,desc' | 'graduation_year,asc|desc'`.
  - Filters (drawer + chips):
    - `filters` – object with `graduation_year`, `department`, `degree_program`, `current_job_title`, `location`.
    - `showFilters` – toggles right-side filter drawer.

- **Directory data via `useDirectory`**
  - `source` is chosen from `useAuth().getUserRole()`:
    - `role === 'student'` → `source = 'public'` (uses `alumni_directory_public`).
    - All others → `source = 'rpc'` (uses `get_directory_profiles` RPC, with `adminFallback` to public view on error).
  - Hook returns `{ items, total, loading: dirLoading, error: dirError, dataset }`.
  - `base = dataset.map(normalizeProfile)` fills consistent fields (title, company, location, degree, department, batch).

- **Relationship loading & counts**
  - `loadRels()`:
    - Queries `v_directory_connection_states` with `select('other_user_id, status, pending_side, edge_ts')`.
    - Builds `relMap` keyed by `other_user_id`.
  - `loadCounts()`:
    - Three count-only queries on `connections`:
      - Pending received, pending sent, accepted/connected (for the current user), using `select('id', { count: 'exact' })` and `.limit(0)`.
    - Stores in `counts`.
  - `useConnectionsRealtime(me?.id, callback)`:
    - Listens for any connection changes involving `me.id`.
    - On change: refetches rels + counts.

- **Search, filter, sort pipeline**
  - `searchTerm` debounced to `debouncedSearch` with 300ms `setTimeout`.
  - `useDirectory` is called with:
    - `query: debouncedSearch`.
    - `filters` (batch, department, degree, designation, location).
    - `sort: sortKey` derived from `sortBy`.
  - Filter drawer fields (Batch Year, Department, Degree, Designation, Location) update `filters` and reset `currentPage`.
  - Active filter chips under the search bar show selected batch/department with clear buttons.

- **Rel-aware projection**
  - `withRel` = `base.map(p => ({ ...normalizeProfile(p), rel: relMap.get(p.id) || { status: null, pending_side: null, edge_ts: null } }))`.
  - `priority` strip:
    - `withRel.filter(p => p.rel.status === 'pending')`.
    - Sorted by `rel.edge_ts` desc; top 8 shown as "Priority Connections".
  - `rest` – `withRel` minus the priority IDs.
  - `applyFilter()` applies `activeFilter` over `rel` state and employer flag (for Employers tab).
  - `filtered`:
    - If active tab is `all` → filter over `rest` (priority shown separately).
    - Else filter over full `withRel`.

- **UI layout & controls**
  - **Header card**:
    - Title: "Alumni Directory".
    - Search box with clear button.
    - **Filters** button opens drawer.
    - **Sort** `<select>` for name (A–Z/Z–A) and graduation year.
  - **ChipBar**:
    - Tabs: All, Requests Received, Requests Sent, My Connections, and Employers (if `isAdmin`).
    - Counts shown from `counts` plus derived `all`/`employers`.
  - **Priority strip** (when `priority.length > 0` and active tab is `all`):
    - Shows up to 8 pending connections in a highlighted card.
    - Uses `DirectoryGrid` with `compact` layout.
  - **Main grid section**:
    - Header label changes based on active tab (All Profiles / My Connections / Received Requests / Sent Requests).
    - Shows inline spinner when `loading`.
    - Uses `DirectoryGrid` with `pageItems` and `me?.id`.
  - **Pagination**:
    - Derived `totalAlumni = filtered.length`.
    - `pageItems = filtered.slice(pageStart, pageStart + itemsPerPage)`.
    - Prev/Next buttons with ARIA labels and disabled state when at bounds.

- **Filters drawer**
  - Right-side overlay with fields for:
    - Batch Year (number), Department, Degree, Designation, Location (text inputs).
  - "Clear All" → resets all filter fields but does not close drawer.
  - "Apply Filters" → closes drawer and resets `currentPage` to 1.

#### 2.4.3 `useDirectory` hook

**File**: `frontend/src/hooks/useDirectory.js`

- **Purpose**
  - Centralizes fetching and client-side search/filter/sort/pagination for directory data.

- **Inputs**
  - `query` – free-text search.
  - `filters` – `graduation_year`, `department`, `degree_program`, `current_job_title`, `location`.
  - `sort` – `'name_asc|name_desc|year_asc|year_desc'`.
  - `page`, `pageSize` – for client-side pagination.
  - `source` – `'public' | 'rpc'`.
  - `adminFallback` – whether to fall back to `alumni_directory_public` if RPC fails.

- **Data loading**
  - If `source === 'public'`:
    - `supabase.from('alumni_directory_public').select('*')`.
    - Maps `location_city`/`location_country` to a synthetic `location` string.
  - Else (`source === 'rpc'`):
    - `supabase.rpc('get_directory_profiles')`.
    - If empty or error and `adminFallback` is true, or on catch:
      - Attempts backup `alumni_directory_public` query and the same `location` mapping.
  - Errors:
    - If both primary and fallback fail → `error` is set and `all = []`.

- **Client search & filters**
  - For each profile `p`:
    - Builds canonical `name`, `degree`, `department`, `title`, `company`, `location` strings from many possible fields.
  - `passesText` when any of `[name, degree, department, title, company, location]` contains `query`.
  - Additional filters must pass:
    - Batch year.
    - Department substring.
    - Degree substring.
    - Designation substring.
    - Location substring.

- **Sort & paginate**
  - Sort by name or grad year depending on `sort`.
  - `total = sorted.length`.
  - `items = sorted.slice(start, start + pageSize)` based on `page`.
  - Returns `{ items, total, loading, error, dataset: sorted }`.

#### 2.4.4 Grid & chips – `DirectoryGrid` and `ChipBar`

- **`DirectoryGrid`** (`components/Directory/DirectoryGrid.jsx`)
  - Props: `items`, `meId`, `currentTab`, `onChanged`, `compact`, `loading`.
  - Loading state:
    - Shows a fixed 3-column skeleton grid with enough placeholder cards.
  - Empty state:
    - Bordered card: "No alumni match your search." with guidance to adjust filters.
  - Normal state:
    - 1–3 column responsive grid.
    - Renders `DirectoryCardSplit` per profile (card split layout that includes connection actions).

- **`ChipBar`** (`components/Directory/ChipBar.jsx`)
  - Props: `counts`, `active`, `onChange`, `showEmployers`.
  - Renders button chips for:
    - **All**, **Requests Received**, **Requests Sent**, **My Connections**, and optional **Employers**.
  - Each chip:
    - Uses `aria-pressed` to indicate selection.
    - Shows count if provided.
    - Applies different styles when active vs inactive.

#### 2.4.5 Card layout – `AlumniCard`

**File**: `components/Directory/AlumniCard.js`

- **Purpose**
  - Visual card for a single alumnus in grid view.
  - Highlights avatar, role, company, education, location, and a subset of skills.

- **Important derived fields**
  - `fullName` from various possible name fields.
  - `initials`/`avatarUrl` – fallback logic.
  - `position`, `company`, `location` – from public directory view fields.
  - `degreeLabel` and `gradYear` via `getDegreeLabel` + graduation year; combined into `degreeDisplay`.
  - `skills` array – normalized from JSON/text to array, with privacy check `!alumnus.isPrivate?.skills`.

- **Card structure & actions**
  - Header:
    - Gradient banner.
    - Centered avatar.
    - Name + optional **Mentor** badge if `alumnus.isMentor` (derived from mentor IDs in `DirectoryPage`).
    - Current position line.
  - Body:
    - Company row (`BriefcaseIcon`).
    - Education row (`AcademicCapIcon`).
    - Location row (`MapPinIcon`).
    - Skills chips (up to 3 visible, `+N` for the rest).
  - Footer:
    - **View Profile** button linking to `/directory/{alumnus.id}`.

#### 2.4.6 Profile view – `AlumniProfile`

**File**: `components/Directory/AlumniProfile.js`

- **Purpose**
  - Detailed profile page for a single alumnus at `/directory/:id`.
  - Role-aware: students see a privacy-preserving view; others see richer contact and social data.

- **Loading & data sources**
  - Fetches current user session to determine `currentUser`.
  - Uses `useAuth().getUserRole()` to decide which Supabase source to use:
    - Students:
      - `alumni_directory_public` (view) by `id`.
      - Builds a minimal `alumnus` object (no email/phone) and maps achievements.
    - Non-students:
      - `profiles` table by `id`.
      - If row missing or not visible, tries `alumni_directory_public` as fallback (`_usePublicTransform`).
  - For private view:
    - Fetches `socialLinks` via `loadProfileSocialLinks(id)` and merges with `linkedin_url` if necessary.
    - Later effect calls `get_profile_contact_details` RPC to enrich `email` and `phone` (non-students only).
    - Another effect maps degree/department codes using `useAcademicsCatalog()`.

- **Connection state & CTA**
  - `useConnectionRel(currentUser?.id, id)` returns `{ status, pending_side }` based on `v_directory_connection_states`.
  - `ConnectionCTA` uses this state plus `meId`/`peerId` to decide between Connect, Accept/Decline, Cancel, Message, and Remove.
  - All mutations ultimately operate on the `connections` table; realtime updates flow back into both `useConnectionRel` and the directory lists.

#### 2.4.7 Directory services – `directoryApi`

**File**: `frontend/src/services/directoryApi.js`

- `fetchPublicDirectory({ search, limit, offset })`
  - Queries `alumni_directory_public` with range pagination and `count: 'exact'`.
  - Optional `search`:
    - Uses `.or()` across `full_name`, `degree_program`, `company_name`, `location_city`, `location_country`, `current_job_title` with `ilike` patterns.
  - Returns `{ data, count }` or throws on error.

- `fetchMentorContact(mentorId)`
  - RPC `get_mentor_contact(mentor_uuid := mentorId)`.
  - Used by `MentorContactPanel` (and indirectly by AlumniProfile sidebar) to retrieve mentor meeting links.

#### 2.4.8 Directory connection flows – `useConnectionRel` + `ConnectionCTA`

- **Supabase primitives**
  - `connections` table – stores connection edges between two users with a `status` field (e.g., pending/accepted/connected/declined/removed) and who requested whom.
  - `v_directory_connection_states` view – precomputes, **for the current user**, a row per `other_user_id` with:
    - `status` – net connection state relative to the current user.
    - `pending_side` – `'sent' | 'received'` when there is a pending request.

**Hook – `useConnectionRel`**

**File**: `frontend/src/hooks/useConnectionRel.js`

- Returns a small `rel` object `{ status, pending_side }` for (`meId`, `peerId`).
- If `!meId` or `!peerId` or `meId === peerId`:
  - Immediately sets `{ status: null, pending_side: null }` and avoids any network work.
- Otherwise:
  - Queries `v_directory_connection_states` for `other_user_id = peerId` and reads `status`/`pending_side`.
  - Subscribes to `postgres_changes` on `connections` twice:
    - Filtered by `requester_id = meId`.
    - Filtered by `recipient_id = meId`.
  - On any payload where the other endpoint is `peerId`, refetches the view row and updates `rel`.
  - On cleanup, removes the realtime channel to avoid leaks.

**Component – `ConnectionCTA`**

**File**: `frontend/src/components/shared/ConnectionCTA.jsx`

- **Inputs**
  - `meId`, `peerId` – current and target user.
  - `rel` – `{ status, pending_side }` from `useConnectionRel`.
  - `currentTab` – `'all' | 'received' | 'sent' | 'connected'` (Directory tabs).
  - `scope` – `'directory' | 'profile'` (affects which actions are shown).
  - `onChanged` – optional callback after successful mutation.
  - `onMessage` – invoked when user chooses to message.

- **Internal mechanics**
  - Uses `busy` to serialize actions and disable buttons while requests are in flight.
  - Uses `overrideRel` for optimistic UI after connect/remove.
  - Computes `effStatus` / `effSide` by merging `overrideRel` over `rel`.
  - Calls helpers from `utils/connections`:
    - `idempotentConnect` (create/request connection, tolerant of duplicates).
    - `cancelPending` (cancel outgoing pending).
    - `acceptPending` / `declinePending` (handle incoming request).
    - `removeConnection` (disconnect existing relationship).

- **Displayed actions (by state)**
  - Pending **received** (from perspective of `meId`):
    - Shows **Accept** and **Decline** buttons (mainly when `scope='profile'` or `currentTab='received'`).
  - Pending **sent**:
    - Shows a "Request sent" pill + **Cancel** button.
  - Connected (`status` in `['accepted','connected']`):
    - In profile scope: **Message** + **Remove**.
    - In directory scope: a single **Message** CTA.
  - No relationship / reset (`status` null or declined/removed):
    - Shows **Connect** button that calls `idempotentConnect` and updates `overrideRel` to pending-sent.

Overall, Directory connection flows are:
- Read-only via `useConnectionRel` against `v_directory_connection_states`.
- Mutated through `ConnectionCTA` button handlers touching `connections`.
- Reflected live in Directory cards and Alumni profiles via Supabase realtime and local optimistic updates.

---
## 3. Jobs – Applicant & Employer Journeys

### 3.1 Applicant journey – browsing & applying

**Primary route**: `/jobs` → `JobListingsPage`.

**Component**: `components/Jobs/JobListingsPage.js`

**Incoming context**:

- `useAuth()` → `user`, `userRole`.
- `useJobsRealtime()` to reflect updates.
- `supabase` for querying `jobs` and related tables.
- `getApplicantsCount`, `hasAppliedHelper` utilities for per-job state.

**Key UI regions**:

1. **Search bar**
   - Free-text search input bound to `searchQuery`.
   - Search icon (`MagnifyingGlassIcon`) button.
   - Triggers `fetchJobs()` with updated filters.

2. **View toggles**
   - Icons: `Squares2X2Icon` (grid) and `ListBulletIcon` (list view).
   - Toggle internal `viewMode` state and change layout of results.

3. **Filters panel**
   - Controlled by `filtersOpen` + `toggleFilters()`.
   - Contains `<select>`s for:
     - Job type (full-time, part-time, contract, internship).
     - Department.
     - Experience.
     - Industry.
     - Location.
     - Salary range.
   - When opened, `filtersRef` is scrolled into view and first filter gets focus.
   - Filters are applied via conditions in `fetchJobs()` Supabase queries.

4. **Alerts & bookmarks**
   - **Job alerts**:
     - A CTA linking to `/jobs/alerts` and/or button to create alerts for current filter set.
     - Internally uses relevant tables for saving alert preferences.
   - **Bookmarking**:
     - Each job card includes `BookmarkButton`:
       - Uses `toggleBookmarkRPC` to add/remove bookmarks.
       - Updates UI instantly; actual table is likely `job_bookmarks` or similar.

5. **Job results list**
   - For each job, `JobCard`/`JobCard.jsx` renders:
     - Title, company, location (with `MapPinIcon`), type, posted time (`timeAgo` helper), salary, source type.
     - Badges for `quick link` vs `in-app` jobs, based on `isQuickLink`.
   - Per-job actions for **applicants**:
     - **View details**: Navigate to `/jobs/:id` or open `JobDetailsInApp`.
     - **Apply**:
       - If quick link: open external URL via `coalesceAppUrl(job)`.
       - If in-app: open `ApplyDialog` / `JobApplyForm`.
       - The apply form posts to `job_applications` and possibly `resume_uploads` via `ResumeUploadForm`.
     - **Share**: `shareJob` helper (copy link, native share sheet where supported).

6. **Pagination**
   - `currentPage` and page size are used to limit results.
   - Buttons **Previous** / **Next** adjust `currentPage` and recall `fetchJobs()`.

**Typical applicant flow**:

1. Navigate to `/jobs` from sidebar or dashboard.
2. Search and filter to desired role.
3. Open job detail:
   - `/jobs/:id` → `JobDetails.js` (full screen) or quick view.
4. Click **Apply**:
   - If external, user is redirected to `job.apply_url`.
   - If internal:
     - In-app dialog collects fields (cover letter, attachments, question answers).
     - On submit, new row in `job_applications` is created.
5. After application:
   - User can visit `/jobs/applications` or `/my-applications` → `ApplicationTracking` / `JobApplicationStatus`.
   - Cards show status with consistent labels using `statusChips`.

### 3.2 Employer journey – posting & managing jobs

**Posting routes** (protected by `ApprovedGuard` + `post:jobs` permission):

- `/jobs/post` → `PostJob` (multi-step wizard for structured job posting).
- `/jobs/post/select` → `PostJobSelection` (choose between quick link & form-based posting).
- `/jobs/post/link` → `PostJobWithLink` (simpler quick-link posting screen).
- `/jobs/create` → `JobPostingForm` (alternative entry point).

#### 3.2.1 PostJob (multi-step wizard)

**Component**: `components/Jobs/PostJob.js`

**Key dependencies**:

- `useAuth()` → `user`, `profile`, `userRole`, `isAdmin`.
- `useApproval()` → `isApprovedEmployer` (gating for non-admin employers).
- `supabase` for inserts.
- `buildJobPayload`, `toISODate`, `isValidUrl`, `isValidEmail` for validation and transformation.

**State and structure**:

- `showSelectionScreen` + `postingType`:
  - Initially, employers see a selection screen (quick link vs full application).
  - After choosing, `showSelectionScreen = false` and `postingType` is either `'link'` or `'form'`.
- `activeStep` across `steps = ['Core Info', 'Job Content', 'Details & Contact']`.
- `formData` object holds all job fields including:
  - `title`, `company_name`, `location`, `job_type`, `experience_level`, `department`, `industry`, salary range, `deadline`, summary, responsibilities, qualifications, nice-to-have skills, contact email, etc.
- `isSubmitting`, `errors`, `logoFile`, `logoPreview` for UX and validation.

**Buttons**:

- Selection screen:
  - "Post with a Link" → sets `postingType='link'`, shows minimalist form.
  - "Collect Applications in App" → `postingType='form'`, shows full wizard.
- Wizard navigation:
  - **Next** and **Back** buttons to move between steps.
  - **Save & Publish** (or similar) on final step:
    - Validates input.
    - Constructs payload using `buildJobPayload(formData, options)`.
    - Inserts into `jobs` table, likely with `is_approved` flag depending on admin vs employer.
- Upon success:
  - `toast.success(...)`.
  - `navigate` to job details or employer job overview.

**Employer-specific UX**:

- Pre-fill company name & logo from employer `profile` (if `primary_role === 'employer'`).
- Show additional hints related to approval (job may be pending admin review).

#### 3.2.2 Managing applications

**Routes**:

- `/jobs/:jobId/manage` → `ManageJobApplications`.
- `/jobs/:id/applications` → same component.

**Component**: `components/Jobs/ManageJobApplications.js`

**Data flow**:

- `actualJobId = jobId || id` from URL params.
- `supabase.auth.getSession()` used to log/verify current user.
- Fetch job row from `jobs` with: `id, title, posted_by, user_id, created_by, company_id`.
- If not admin, backend filters ensure only owner (posted_by/user_id/created_by) can see it.
- Fetch applications (paginated) from `job_applications` joined with applicant profiles.

**Per-application UI**:

- Columns include:
  - Applicant name and email.
  - Application date.
  - Current status (dropdown) using canonical statuses:
    - DB values normalized via `STATUS_MAP` and `DB_TO_LABEL`.
    - UI statuses: `Submitted`, `Under review`, `Shortlisted`, `Offered`, `Rejected`.
  - Links and buttons:
    - **"View Profile"** → `/profile/:applicant_id`.
    - **"Message"** or **"Request Connection"**:
      - `canMessage(app.applicant_id)` uses `getLatestEdge` / connections to decide.
      - If connection exists: "Message" → `navigate('/messages?peer=APPLICANT_ID&job=JOB_ID')`.
      - Else: "Request Connection" → calls `handleRequestConnection(app.applicant_id)` using `idempotentConnect`.

**Status updates**:

- Changing the status dropdown triggers an update to `job_applications.status`.
- Saving states tracked in `savingIds` set, showing "Saving…" indicator.

### 3.3 Component breakdown – `JobListingsPage`

**File**: `components/Jobs/JobListingsPage.js`

- **Responsibilities**:
  - Fetch and display jobs list with search, filters, and sort.
  - Switch between grid/list layouts and handle view mode.
  - Wire up bookmark, share, and apply actions.

- **Key state**:
  - `jobs`, `loading`, `error` – overall list state.
  - `searchQuery`, `filters`, `sortBy`, `viewMode` – query and UI controls.
  - Employer/admin flags influence which jobs are visible and which CTAs are shown.

- **Important controls/buttons**:
  - Search input + icon: updates `searchQuery` and triggers `fetchJobs()`.
  - Filter `<select>` elements: update `filters` used in Supabase queries.
  - View toggles (grid/list): set `viewMode` and change rendering.
  - Per-job actions on cards:
    - **Apply** → opens in-app `JobApplicationForm` or external link.
    - **Bookmark** → calls bookmark RPC and updates UI.
    - **Share** → calls `shareJob` helper.

### 3.4 Component breakdown – `PostJob`

**File**: `components/Jobs/PostJob.js`

- **Responsibilities**:
  - Multi-step wizard for employers/admins to create jobs.
  - Supports quick-link postings and full in-app application postings.

- **Key state**:
  - `postingType`: `'link' | 'form'` – which UX is active.
  - `activeStep`: index into `steps = ['Core Info', 'Job Content', 'Details & Contact']`.
  - `formData`: object holding all job fields (title, company, location, job_type, experience_level, department, industry, salary, deadline, description, etc.).
  - `errors`, `logoFile`, `logoPreview`, `isSubmitting` – validation and UX status.

- **Main controls/buttons**:
  - Selection screen:
    - **"Post with a Link"** – chooses quick-link mode, minimal fields.
    - **"Collect Applications in App"** – chooses full wizard.
  - Wizard navigation:
    - **Next** / **Back** buttons move between steps (with per-step validation).
    - Final **Save & Publish** button:
      - Builds payload with `buildJobPayload(formData, options)`.
      - Inserts into `jobs` via Supabase, respecting employer vs admin approval rules.
      - Shows success toast and navigates to job detail/employer overview.

### 3.5 Component breakdown – `ManageJobApplications`

**File**: `components/Jobs/ManageJobApplications.js`

- **Responsibilities**:
  - For a single job, list all applications.
  - Allow job owner/admins to update statuses and contact applicants.

- **Key state**:
  - `job`: minimal job info (title, owner) for the header.
  - `applications`: array of rows joined to applicant profiles.
  - `loading`, `error` – data-fetch status.
  - `savingIds`: a `Set` of application IDs currently being updated.
  - `currentPage`, `pageSize`, `totalCount` – pagination.

- **Main UI & actions**:
  - Applications table with columns:
    - Applicant name/email (linked to `/profile/:id`).
    - Applied date.
    - Status dropdown:
      - Values like `Submitted`, `Under review`, `Shortlisted`, `Offered`, `Rejected`.
      - Writes to `job_applications.status` on change and updates `savingIds`.
    - **"View Profile"** button → candidate profile.
    - **"Message"**/**"Request Connection"** button:
      - Uses `canMessage` + `idempotentConnect` to ensure a connection/chat edge.
  - Pagination controls at bottom to flip pages.

### 3.6 Component breakdown – `JobApplicationForm`

**File**: `components/Jobs/JobApplicationForm.js`

- **Purpose**:
  - Minimal in-app application form used from job detail dialogs.
  - Upload resume to Supabase Storage and create a `job_applications` row.

- **Props**:
  - `jobId` – the job being applied for.
  - `deadline` – used to prevent late applications.

- **Internal state**:
  - `coverLetter` – optional free text.
  - `resumeFile` – uploaded File object.
  - `isSubmitting` – disables submit while request is in-flight.
  - Derived `isDeadlinePassed` – computed from `deadline` vs `new Date()`.

- **Validation rules**:
  - Resume is **required**.
  - Max size 5MB; allowed types: PDF/DOC/DOCX.
  - If deadline is in the past, block submit.
  - If no authenticated `user`, block submit.

- **Form fields**:
  - Heading: "Apply for this Job".
  - Cover letter `<textarea>` (optional), bound to `coverLetter`.
  - Resume `<input type="file">` (required), bound via `handleFileChange`.
  - Submit `<button>` showing "Submitting..." while `isSubmitting`.

- **Submit flow** (`handleSubmit`):
  1. Prevent default submit.
  2. Run auth/resume/deadline checks.
  3. Check for existing application for `(job_id, applicant_id)` and short-circuit with toast if found.
  4. Upload resume to `storage.bucket('resumes')` at `userId/jobId-fileName`.
  5. Insert `job_applications` row with `status = 'submitted'`.
  6. On success: show toast, clear state, and reset form.

- **Backend touchpoints**:
  - Supabase Storage bucket `resumes`.
  - Table `job_applications`.

### 3.7 Job detail – `JobDetails`

**File**: `components/Jobs/JobDetails.js`

- **Purpose**
  - Full-page detail view for a single job at `/jobs/:id`.
  - Shows rich job description, company information, and allows bookmarking/sharing.
  - For in-app jobs, integrates `JobApplicationForm` or Apply dialog.

- **Data loading**
  - On mount, fetches job data:
    - `supabase.from('jobs').select('*, companies (name, logo_url)').eq('id', id).single()`.
    - Normalizes array-like fields (requirements, responsibilities, preferredQualifications, benefits, skills, applicationProcess) via `convertToArray`.
    - Builds a `job` object with consistent arrays for display.
  - Bookmark status:
    - After job + user are known, queries `bookmarked_jobs` for `(job_id, user_id)` to set `isBookmarked`.

- **Bookmark & share actions**
  - Bookmark toggle:
    - If `isBookmarked` → delete from `bookmarked_jobs` for `(user_id, job_id)`.
    - Else → insert new row.
    - Shows success toasts on add/remove.
  - Share:
    - Uses Web Share API when available with `title`, `text`, and `url` (current page).
    - Fallback copies `window.location.href` to clipboard.

- **Apply entry point**
  - For in-app jobs, renders inline `JobApplicationForm` or opens an Apply dialog.
  - For quick-link jobs, uses `coalesceAppUrl(job)` and `JobDetailsQuickLink` to send applicants to external site.

- **UI highlights**
  - Header:
    - Job title, company (link to `/companies/:id`), badges for Quick Link vs In-App, approval state.
  - Body:
    - Sections for job summary, responsibilities, qualifications, preferred qualifications, benefits, skills.
    - Company panel: logo, name, optional values/benefits.
  - Footer/side CTA:
    - Apply, Bookmark, Share buttons with appropriate disabled and loading states.

- **Supabase tables**
  - `jobs`, `companies`, `bookmarked_jobs`.

### 3.8 Full-page application – `JobApplication`

**File**: `components/Jobs/JobApplication.js`

- **Purpose**
  - Legacy/full-screen application page at `/jobs/:jobId/apply`.
  - Allows selecting an existing resume or uploading a new one, plus an optional cover letter, before creating a `job_applications` row.

- **Data loading**
  - If `!jobId` → toast error and redirect to `/jobs`.
  - If not logged in → `isLoading` cleared and form gated.
  - Fetches job row from `jobs` by id; navigates back with error toast on failure.
  - Checks for existing application for `(job_id, applicant_id)`; prevents duplicates and navigates back to job.
  - Fetches `user_resumes` for the current user:
    - Orders by `is_primary` then `uploaded_at`.
    - Prefers primary resume as `selectedResumeId`.

- **Form model & state**
  - Core state:
    - `formData.coverLetter` – optional text.
    - `selectedResumeId` – choose from existing resumes.
    - `resumeFile` – new resume file to upload.
  - Tracks `userResumes`, `isLoading`, `isSubmitting`.

- **Submit flow**
  1. Guard: ensure active Supabase auth session (`supabase.auth.getSession()`).
  2. Require either `selectedResumeId` or `resumeFile`.
  3. If using existing resume:
     - Lookup by id in `userResumes` and extract `file_url` + filename.
  4. If uploading new file:
     - Restrict extensions to PDF/DOC/DOCX.
     - Build unique path `${userId}/${timestamp}-${random}.${ext}`.
     - Upload to `storage.from('resumes')` with `upsert: true`.
     - Get public URL and insert into `user_resumes` (best-effort) for reuse.
  5. Build `payload` with `job_id`, `resume_url`, `cover_letter`.
  6. Insert into `job_applications` and handle common errors:
     - `23505` duplicate → toast "You have already applied" and navigate to job.
     - `23503` foreign key → job removed; toast and redirect to `/jobs`.
     - Permission/RLS errors → user-friendly toast.

- **Supabase tables & storage**
  - `jobs`, `job_applications`, `user_resumes`.
  - Storage bucket `resumes`.

### 3.9 My applications – `ApplicationTracking` & `JobApplicationStatus`

#### 3.9.1 `ApplicationTracking` (in-app jobs)

**File**: `components/Jobs/ApplicationTracking.js`

- **Routes**: `/jobs/applications`, `/jobs/applications/:id`.
- **Audience**: only `student`/`alumni` roles:
  - If `userRole` is not in that set, redirects to `/jobs` with an error toast.

- **Data loading**
  - Queries `job_applications` joined with `jobs` for the current user:
    - `id, created_at, status, resume_url`.
    - `jobs:job_id (id, title, company_name, location, job_type, deadline, apply_url, application_url, external_url)`.
  - Derives `source_type` client-side (quick link vs in_app) based on URLs.
  - Filters to only those where `source_type === 'in_app'` to match original UX.

- **Status filters & badges**
  - Local `filter` state with options: all, submitted, reviewing, interview, offered, rejected, withdrawn.
  - `filteredApplications` computed from `applications` and `filter`.
  - `getStatusBadgeClass(status)` maps statuses to Tailwind-style badge classes.

- **UI**
  - Heading "My Job Applications".
  - Empty-state card inviting the user to browse jobs.
  - For each application:
    - Job title linking to `/jobs/{job_id}`.
    - Status pill.
    - Applied date (`formatDate`) and relative time (`calculateDaysAgo`).
    - Company name, location, job type, and optional resume link.

#### 3.9.2 `JobApplicationStatus` (legacy summary)

**File**: `components/Jobs/JobApplicationStatus.js`

- **Route**: `/my-applications`.
- **Purpose**
  - Simple summary of job applications for the current user.
  - Similar to `ApplicationTracking` but implemented with a different query + layout.
- **Data fetch**
  - Selects `job_applications` where `applicant_id = user.id`, with `jobs:job_id!inner (id, title, company_name, source_type)`.
  - Renders list of applications showing job title, company, applied date, optional resume link, and a colored status chip from `getStatusColor`.

### 3.10 Job alerts – `JobAlerts`

**File**: `components/Jobs/JobAlerts.js`

- **Purpose**
  - Manage saved search/notification rules for jobs at `/jobs/alerts`.
  - Create, edit, delete alert rows in `job_alerts`.

- **Data & state**
  - `alerts` – list of alert records for `user.id`.
  - `showCreateForm`, `editingAlert`, `formData` for the compose/edit panel.
  - Lookup maps: `JOB_TYPE_MAP`, `FREQ_MAP`, `EXP_MAP` mapping UI values to DB tokens.

- **Fetching alerts**
  - `fetchAlerts()`:
    - `supabase.from('job_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })`.
    - Handles network/auth/database errors with targeted toasts.

- **Create/update flow**
  - Normalizes form values (keywords, location, job_type, experience_level, min/max salary, frequency, is_active).
  - Validates:
    - Non-empty `alert_name`.
    - Salary range consistency when both `min_salary`/`max_salary` present.
  - Uses `insert` or `update` on `job_alerts` depending on `editingAlert`.
  - Handles unique name conflicts via Postgres `23505` error with a friendly message.

- **Delete flow**
  - `handleDelete(alertId)` → confirm + delete from `job_alerts`, then refetch list.

### 3.11 Simple posting – `JobPostingForm`, `PostJobSelection`, `PostJobWithLink`

#### 3.11.1 `JobPostingForm`

**File**: `components/Jobs/JobPostingForm.js`

- Alternate posting entry at `/jobs/create`.
- Uses MUI form to capture job basics:
  - `company_id`, `title`, `location`, `job_type`, `description`, `requirements`, `salary_range`, `application_url`, `deadline`.
- Fetches verified companies for the `Company` select.
- Employer-specific behavior:
  - When employer posts and selected company has no logo, infers a logo from employer `profile` (logo_url/avatar_url).
- On submit:
  - Normalizes `deadline` to `YYYY-MM-DD`.
  - Inserts into `jobs` with `user_id`, `created_by`, `is_approved=false`, `is_verified=false`, `is_active=true`.

#### 3.11.2 `PostJobSelection`

**File**: `components/Jobs/PostJobSelection.js`

- Simple chooser screen at `/jobs/post/select`:
  - **Post with a Link** → navigates to `/jobs/post/link`.
  - **Fill Out Form Manually** → navigates to `/jobs/post` (PostJob wizard).
- Purely presentational; all permissions enforced at the route level via `ApprovedGuard` + `ProtectedRoute`.

#### 3.11.3 `PostJobWithLink`

**File**: `components/Jobs/PostJobWithLink.js`

- Streamlined posting form for external jobs at `/jobs/post/link`.
- Fields:
  - `title` – job title.
  - `jobUrl` – external job link.
- Submit flow:
  - Validates both fields.
  - Inserts into `jobs` with:
    - `title`, `application_url: jobUrl`.
    - Generic description explaining that it is external.
    - `is_active=true`, `is_approved=false`, `created_by = user.id`.

### 3.12 Saved jobs – `BookmarkedJobs`

**File**: `components/Jobs/BookmarkedJobs.js`

- **Purpose**
  - Show all jobs that the current user has saved/bookmarked.

- **Data loading**
  - Fetches `job_bookmarks` rows for the current user and collects job IDs.
  - Fetches job details for those IDs from `jobs` joined with `companies` and `job_applications(count)`.
  - Maintains `bookmarkedJobIds` to quickly check whether each job is bookmarked.

- **Bookmark toggle**
  - If job already bookmarked → delete from `job_bookmarks` and remove from `bookmarkedJobs`.
  - Else → insert into `job_bookmarks`, then fetch job row and append to list.

- **UI**
  - Heading "My Bookmarked Jobs" plus intro text.
  - If list non-empty → `Grid` of `JobCard` components (reused from `JobListingsPage`) with `handleBookmark` wired.
  - Else → simple empty state.

### 3.13 Resume profile & uploads – `ResumeUploadForm`

**File**: `components/Jobs/ResumeUploadForm.js`

- **Purpose**
  - Central place for applicants to upload/store resume and cover letter and configure job alert profile preferences.

- **Existing profile detection**
  - On mount, queries `resume_profiles` for `user.id`.
  - If found, pre-populates `formData` (portfolio, LinkedIn, desired job titles/industries/locations, relocation flag, job alert prefs, keywords).

- **File upload helpers**
  - `uploadFile(file, bucket)`:
    - Enforces 5MB limit and PDF/DOC/DOCX types.
    - Uploads to `${user.id}/${timestamp_random}.ext` in the given bucket.
    - Returns public URL via `getPublicUrl`.
  - Uses `resumes` and `cover-letters` buckets for resume and cover letter respectively.

  - **Profile fields & submit**
  - Links: `portfolioLink`, `linkedinProfile` with URL validation and auto-`https://` prefix.
  - Arrays: `desiredJobTitles`, `desiredIndustries`, `preferredLocations`, `jobAlertKeywords` derived from comma-separated strings.
  - Flags: `willingToRelocate`, `jobAlertActive`, `jobAlertFrequency`.
  - Submit flow:
    - Validates link formats.
    - Uploads resume/cover letter if provided and updates URLs.
    - Builds `profileData` with arrays + cleaned URLs.
    - Upserts into `resume_profiles` by `user_id`.
    - Uses `toFriendlyToast` for rich error messaging and toasts.

### 3.14 Jobs module summary – end-to-end flows

- **Applicant perspective**
  - Discover jobs on `/jobs` via `JobListingsPage` with search, filters, view toggles, and status badges.
  - Dive into a job via `JobDetails` at `/jobs/:id` to see full description, company context, and Apply/Bookmark/Share.
  - Apply either:
    - Inline via `JobApplicationForm` (simple cover letter + resume upload to the `resumes` bucket), or
    - Via the full-screen `JobApplication` page, choosing an existing resume (`user_resumes`) or uploading a new file.
  - Track outcomes in:
    - `ApplicationTracking` (`/jobs/applications`) for in-app submissions, or
    - `JobApplicationStatus` (`/my-applications`) for a legacy overview.
  - Manage personal job tooling:
    - `BookmarkedJobs` for saved roles.
    - `JobAlerts` and `ResumeUploadForm` for alerts + profile (preferences, resume, cover letter) stored in `job_alerts` and `resume_profiles`.

- **Employer perspective**
  - Create jobs via:
    - `PostJob` multi-step wizard at `/jobs/post` for rich, in-app postings.
    - `PostJobSelection` and `PostJobWithLink` for quick external-link listings.
    - `JobPostingForm` (`/jobs/create`) as an alternative simple form.
  - Review and manage applicants through `ManageJobApplications`, changing statuses and optionally connecting/messaging applicants.
  - All flows write through core tables like `jobs`, `job_applications`, `job_bookmarks`/`bookmarked_jobs`, `job_alerts`, `user_resumes`, and `resume_profiles`, plus storage buckets `resumes` and `cover-letters`.

---

## 4. Mentorship – Mentee and Mentor Flows

### 4.1 Mentorship directory & requests (`/mentorship`)

**Route**: `/mentorship` → `components/Mentorship/Mentorship.js` (with `ProtectedRoute requiredPermission="request:mentorship"`).

### 4.2 My Mentorship hub (`/mentorship/me`)

**Route**: `/mentorship/me` → `components/Mentorship/MyMentorship.js`.

**Purpose**:
  - Unified view for a logged-in user as **mentee** and/or **mentor**.
  - Manage:
    - As mentee: sent requests, statuses, starting chat, scheduling sessions.
    - As mentor: incoming requests (accept/reject), relationships, sessions.

- Unified view for a logged-in user as **mentee** and/or **mentor**.
- Manage:
  - As mentee: sent requests, statuses, starting chat, scheduling sessions.
  - As mentor: incoming requests (accept/reject), relationships, sessions.

**Key data sources**:

- `fetchMenteeRequests(user.id)` and `fetchMentorRequests(user.id)` via React Query.
- `mentorship_requests` and `mentorship_relationships` tables.
- Realtime updates using `onPostgresChangesOnce` on relevant tables.

**Mentee side**:

- **Sent requests** list:
  - Each row:
    - Mentor avatar, name.
    - Created date/time.
    - Status chip (`RequestStatusChip` / `statusChip`).
  - Actions:
    - If `status === 'accepted'`:
      - **"Start Chat"** → `/messages?tab=chats&peer=MENTOR_ID`.
      - **"Schedule Session"** → opens `CreateSessionModal` with `requestId`.
    - If `status === 'pending'`:
      - **"Cancel"** button (`CancelButton`):
        - Optimistically updates React Query cache (status → `cancelled_by_user`).
        - Sends update: `mentorship_requests.status = 'cancelled_by_user'`.

**Mentor side**:

- **Received requests** list:
  - Each row:
    - Mentee avatar, name.
    - Created at timestamp.
    - Optional message.
    - `RequestStatusChip`.
  - Actions for `status === 'pending'`:
    - **"Accept"**: triggers mutation → updates `mentorship_requests.status = 'accepted'`.
      - DB triggers then create/activate `mentorship_relationships`, and may insert notifications.
    - **"Reject"**: updates status to `rejected`.
  - Actions for `status === 'accepted'`:
    - **"Go to Chat"**: `/messages?tab=chats&peer=MENTEE_ID`.

**Sessions**:

- `CreateSessionModal` allows mentors to schedule sessions linked to a request.
- Data stored in a `mentorship_sessions` table (or similar); component handles date/time pickers and notes.

### 4.3 Becoming a mentor (`/mentorship/become-mentor`)

**Route**: `/mentorship/become-mentor` → `MentorRegistrationForm` (`ProtectedRoute requiredPermission="manage:mentor_profile"`).

**Component**: `components/Mentorship/MentorRegistrationForm.js`

**Purpose**:

- Collect mentor profile data used to list them in the directory.

**Flow**:

1. On mount:
   - `supabase.auth.getUser()` fetches the current auth user.
   - If no user: show error & redirect to `/login`.
   - Else: `getMyMentorProfile()` (from `services/mentors`) loads existing mentor record if any.
   - Depending on existing state, UI may show different banners:
     - New mentor vs pending approval vs approved.
2. Form sections:
   - **Capacity & Experience**:
     - `mentoring_capacity_hours_per_month`.
     - `mentoring_experience_years`.
     - `mentoring_experience_description`.
   - **Expertise**:
     - Tag-based input for `expertise` (array of strings).
   - **Preferences** (`mentoring_preferences` object):
     - Communication method (Email, Slack/Teams, Video Call, Phone Call, In-person).
     - Format (1-on-1 Sessions, Group Mentoring, Project Collaboration, Informal Check-ins).
     - Duration (1–3, 3–6, 6–12 months, Ongoing).
   - **Mentoring statement**:
     - `mentoring_statement` – free-text summary.
   - **Other controls**:
     - Tag chips add/remove logic for `expertise`.
3. Actions:
   - **Clear Form** – resets to `initialFormData`.
   - **Save Mentor Profile** – calls `upsertMentor(formData)`:
     - Upserts into `mentor_profiles` (or `mentors`) table.
     - Shows notifications via `useNotification`.
     - Navigates back to `/mentorship/me` or dashboard on success.

### 4.4 Becoming a mentee (`/mentorship/become-mentee`)

**Route**: `/mentorship/become-mentee` → `MenteeRegistrationForm` (`ProtectedRoute requiredPermission="request:mentorship"`).

**Component**: `components/Mentorship/MenteeRegistrationForm.js`

**Flow**:

1. On mount:
   - `supabase.auth.getSession()`:
     - If no session: redirect to `/login` and show warning.
     - Else: `user = session.user` and `fetchUserAndProfile(user)`.
   - `fetchUserAndProfile` loads existing mentee profile from `mentee_profiles`.
2. Form fields:
   - `career_goals` (textarea).
   - `areas_seeking_mentorship` (tags).
   - `specific_skills_to_develop` (tags).
   - `preferred_mentor_characteristics`.
   - `time_commitment_available` (numeric).
   - `preferred_communication_method` (select: video_call, email, messaging, in_person).
   - `statement_of_expectations` (textarea).
3. Buttons:
   - **Cancel** → Link to `/dashboard`.
   - **Save Profile** →
     - Upserts into `mentee_profiles` using `supabase.from('mentee_profiles').upsert(...)`.
     - Shows success/error via `useNotification`.

### 4.5 Component breakdown – `MentorProfile`

**File**: `components/Mentorship/MentorProfile.js`

- **Purpose**
  - Show a detailed public profile for a single mentor.
  - Allow approved mentees to send a mentorship request with a short message and goals.
  - Prevent duplicate pending requests between the same mentor–mentee pair.

- **Key state**
  - `mentor` – merged data from `mentors` + `alumni_directory_public` (`mentor.profile` holds `full_name`, `avatar_url`).
  - `loading` – while mentor details and existing request status load.
  - `showRequestModal` – whether the request modal is open.
  - `requestMessage`, `requestGoals` – controlled inputs for the request.
  - `isSubmitting` – disables Send while the request is being inserted.
  - `existingRequest` – any `mentorship_requests` row for this mentor/mentee with status `pending` or `accepted`.

- **Data loading flow** (`useEffect`)
  1. If there is no `user`, exit early (profile requires login).
  2. Load mentor core row from `mentors` where `user_id = mentorId` from URL.
  3. Load public identity from `alumni_directory_public` (`id, full_name, avatar_url`) and attach to `mentor.profile`.
  4. Load any existing mentorship request between `user.id` and `mentorId` with status in `['pending', 'accepted']` into `existingRequest`.

- **Page layout**
  - Header:
    - Avatar: `mentor.profile.avatar_url || '/default-avatar.svg'`.
    - Name: `mentor.profile.full_name`.
    - Static subtitle: “Maritime Professional”.
  - Left column (About & Expertise):
    - Heading “About Me” with `mentor.mentoring_statement` rendered with `whitespace-pre-wrap`.
    - “Expertise” heading with chips for each entry in `mentor.expertise`.
  - Right column (Mentorship Details):
    - Experience, max mentees, capacity per month.
    - Preferences list:
      - If `mentoring_preferences` is an object, show each `key: value` line.
      - Otherwise show stringified fallback (`"Not specified"` when empty).

- **Contact and actions**
  - `<MentorContactPanel mentorId={mentorId} />` handles unlocking contact details after acceptance.
  - **Request Mentorship** button:
    - Shown only if `hasPermission('request:mentorship')` and `mentor.status === 'approved'`.
    - Disabled when:
      - `loading` is true.
      - `existingRequest` is present.
      - `user.id === mentorId` (self profile).
    - Label:
      - “This is your profile” when self.
      - `Request {existingRequest.status}` when there is an existing row.
      - Otherwise “Request Mentorship”.

- **Request modal**
  - Title: “Send Mentorship Request”.
  - Body:
    - Textarea bound to `requestMessage` (“why you'd like to connect”).
    - Text input bound to `requestGoals` (“Your goals (optional)”).
  - Buttons:
    - **Cancel** – closes modal.
    - **Send Request** – calls `handleRequestSubmit` and is disabled when submitting or both fields are blank.

- **Submit flow** (`handleRequestSubmit`)
  1. Require at least one of `requestMessage` or `requestGoals` to be non-empty.
  2. Require `user` to be present; otherwise toast “You need to be logged in to send a request.”
  3. Require `isApprovedMentee` from `useApproval()`; otherwise toast about unapproved profile.
  4. Duplicate guard: query `mentorship_requests` for same mentor/mentee with `status = 'pending'`; if found, set `existingRequest` and toast “You already have a pending request for this mentor.”
  5. Build payload `{ mentor_id, mentee_id, message, goals, status: 'pending' }`.
  6. Insert into `mentorship_requests` and select minimal columns.
  7. On success: update `existingRequest`, close modal, clear inputs, show success toast.

- **Supabase tables/views touched**
  - `mentors` – mentor configuration and status.
  - `alumni_directory_public` – public identity lookup.
  - `mentorship_requests` – requests created and checked for duplicates.

### 4.6 Advanced subcomponents – Mentorship

#### 4.6.1 `RequestMentorshipButton`

**File**: `components/Mentorship/RequestMentorshipButton.jsx`

- **Purpose**
  - Small CTA component used inside mentor cards in `Mentorship.js`.
  - Handles all client-side guards before inserting into `mentorship_requests`.
  - Emits a global event so other parts of the app can refresh their data.

- **Props**
  - `mentorId` (string, required) – target mentor’s `user_id`.
  - `disabled` (boolean, default `false`) – force-disable (e.g., mentor not accepting).
  - `requested` (boolean, default `false`) – indicates an existing pending/accepted request.
  - `onSuccess` (function) – optional callback after successful insert.

- **Internal state & hooks**
  - `busy` – local spinner/disable flag while network call is in progress.
  - `useApproval()` – provides `loading` and `isApprovedMentee`.
  - `useAuth()` – provides `user` (used to detect self-mentorship).

- **Click handler flow** (`onClick`)
  1. If `!isApprovedMentee`:
     - Show toast: "Your profile is not approved. Kindly contact administrator."
     - Abort.
  2. If `requested` is true → noop (button treated as informational).
  3. If `user.id === mentorId` (`isOwnerMentor`):
     - Show toast: "You can’t join your own mentorship as a mentee."
     - Abort.
  4. Fetch current auth user via `supabase.auth.getUser()` and derive `uid`.
  5. Insert into `mentorship_requests`:
     - Columns: `mentor_id`, `mentee_id`, `status: 'pending'`.
  6. Error handling:
     - If message includes `mentorship_requests_no_self_mentee` → show self-join error.
     - Otherwise delegate to `handleSupabaseGuardError` (covers RLS, network, etc.).
  7. On success:
     - Toast: "Request sent!".
     - Dispatch a global browser event: `mentorship:request:created` with `{ mentorId, menteeId: uid }` so listeners (e.g., `Mentorship.js`) can refresh lists.
     - Invoke `onSuccess` callback if provided.

- **Disabled state & label**
  - `isDisabled = loading || busy || !isApprovedMentee || disabled || requested`.
  - If `isOwnerMentor` → render static text instead of a button: "You are the mentor for this program."
  - Button text:
    - `"Request pending"` when `requested`.
    - `"Sending…"` when `busy`.
    - Else `"Request Mentorship"`.
  - Tooltip (`title` attribute):
    - Not approved → explains approval requirement.
    - `requested` → "Request pending".
    - `disabled` → "This mentor isn’t accepting requests right now."
    - Default → "Request mentorship".

- **Supabase tables**
  - `mentorship_requests` – inserts a new request row.

#### 4.6.2 `MentorContactPanel`

**File**: `components/Mentorship/MentorContactPanel.js`

- **Purpose**
  - Shows a **locked/unlocked contact card** for a mentor.
  - Ensures mentee only sees meeting link after an accepted relationship.

- **Props**
  - `mentorId` (string, required) – mentor’s `user_id`.

- **State**
  - `status` – `'checking' | 'none' | 'locked' | 'unlocked'`.
  - `contact` – object returned by `fetchMentorContact` (typically contains `default_meeting_link`).
  - `err` – string error message when contact cannot be fetched.

- **Effect: permission + relationship check**
  1. Verify mentor is approved:
     - Query `mentors` for `{ user_id, status }` where `user_id = mentorId` and `status = 'approved'`.
     - If no row → `status = 'none'` (nothing rendered).
  2. Check if the current user has an **accepted relationship**:
     - From `mentorship_requests` where `mentor_id = mentorId`, `mentee_id = user.id`, `status = 'accepted'`.
     - And from `mentorship_relationships` where `mentor_id = mentorId`, `mentee_id = user.id`, `status` in `['active', 'accepted']`.
     - If neither present → `status = 'locked'`.
  3. If accepted:
     - Call `fetchMentorContact(mentorId)` from `services/directoryApi`.
     - On success → set `contact` and `status = 'unlocked'`.
     - On failure → keep `status = 'locked'` and surface `err`.

- **Rendering states**
  - `checking` → small "Checking mentorship status…" message.
  - `none` → render `null`.
  - `locked` →
    - Info alert: "Mentor contact unlocks after your mentorship is accepted."
    - Inline link to `/mentorship/mentor/{mentorId}` ("Request mentorship").
    - Optional error line if `err` is set.
  - `unlocked` →
    - Card labelled "Mentor Contact".
    - If `contact.default_meeting_link` → clickable "Meeting Link" opening in new tab.
    - Otherwise → muted text "Meeting link not set by mentor."

- **Supabase tables/services**
  - `mentors` – checks mentor approval.
  - `mentorship_requests` – checks accepted mentee request.
  - `mentorship_relationships` – checks active/accepted relationships.
  - `fetchMentorContact` – fetches contact details, likely from a profiles/mentor profile view.

#### 4.6.3 `CreateSessionModal`

**File**: `components/Mentorship/CreateSessionModal.js`

- **Purpose**
  - Full-screen modal used from the mentee/mentor hubs to **schedule mentorship sessions**.
  - Creates rows in `mentorship_sessions` with start/end times, meeting link, and notes.

- **Props**
  - `open` (boolean) – controls visibility; when `false`, component returns `null`.
  - `onClose` (function) – called after successful creation or Cancel.
  - `requestId` (string) – foreign key to `mentorship_requests.id`.

- **State**
  - `start`, `end` – ISO-local datetime strings bound to `<input type="datetime-local">` controls.
  - `meetingUrl` – explicit meeting URL typed by the user.
  - `notes` – freeform text.
  - `loading` – disables actions while saving.
  - `defaultLink` – pre-filled meeting link from mentor’s profile.

- **Default meeting link resolution** (`useEffect` on `open`)
  1. When `open` becomes true:
     - Fetch current auth user via `supabase.auth.getUser()` and get `uid`.
  2. Try `mentor_profiles` first:
     - Select `default_meeting_link` by `user_id = uid`.
  3. If empty, fall back to `profiles.default_meeting_link` for the same user.
  4. Save into `defaultLink` and pre-fill `meetingUrl` only if the field is currently empty.

- **Validation helpers**
  - `validHttpUrl(url)` – ensures URL, if present, has `http`/`https` protocol.

- **Submit flow** (`handleCreate`)
  1. Guard: `requestId` must be provided.
  2. Require `start` and `end` to be non-empty.
  3. Enforce `start < end` (based on `Date` comparisons).
  4. Validate `meetingUrl || defaultLink` using `validHttpUrl`.
  5. Build `meeting_url` from trimmed `meetingUrl` or fallback `defaultLink` (or `null`).
  6. Construct payload:
     - `mentorship_request_id: requestId`.
     - `start_time`, `end_time` as ISO strings.
     - `meeting_url`.
     - `notes` (trimmed, nullable).
     - `status: 'scheduled'`.
  7. Insert into `mentorship_sessions`.
  8. Error handling:
     - If 401/403 or RLS text → toast: permission/ownership problem.
     - Otherwise → show server error message or generic fallback.
  9. On success:
     - Toast "Session scheduled".
     - Call `onClose()`.
     - Reset all form state.

- **UI elements**
  - Centered modal with title "Schedule Session" and helper text.
  - Fields:
    - **Start** datetime.
    - **End** datetime.
    - **Meeting Link** (URL, with placeholder = `defaultLink` if present).
    - **Notes (optional)** textarea.
  - Buttons:
    - **Cancel** → `onClose`, disabled when `loading`.
    - **Create Session** → submits form; label becomes "Saving..." when loading.

- **Supabase tables**
  - `mentor_profiles`, `profiles` – read `default_meeting_link`.
  - `mentorship_sessions` – insert scheduled session.

#### 4.6.4 Status chips (`statusChips.tsx`)

**File**: `frontend/src/lib/statusChips.tsx`

- **Purpose**
  - Shared visual components for **approval and status badges** across mentorship and admin UIs.

- **Components**
  - `ApprovalChip` – base chip for general approval states:
    - `approved` → green.
    - `pending` → yellow.
    - `rejected` → red.
    - `deleted` → gray.
  - `MentorStatusChip` – thin wrapper around `ApprovalChip` used for mentor approval status.
  - `RequestStatusChip` – used in mentorship request lists:
    - `pending` → yellow.
    - `accepted` → green.
    - `rejected` → red.
    - `cancelled_by_user`, `cancelled_by_system` → gray.
  - `RelationshipStatusChip` – used for longer-running mentorship relationships:
    - `active` → green.
    - `completed` → blue.
    - `terminated_by_user`, `terminated_by_system` → gray.

- **Usage in Mentorship flows**
  - `RequestStatusChip` appears in:
    - `Mentorship.js` under both **My Requests** and **Requests Received** lists.
    - `MyMentorship.js` as `statusChip(status)` helper.
  - `MentorStatusChip` and `RelationshipStatusChip` are primarily surfaced in admin/overview screens but share the same color/label semantics.

#### 4.6.5 Query helpers (`lib/queries/mentorship.js`)

**File**: `frontend/src/lib/queries/mentorship.js`

- **Purpose**
  - Encapsulate common Supabase queries for mentorship lists.

- **Functions**
  - `fetchMenteeRequests(userId, opt)`
    - Selects `id, mentor_id, mentee_id, status, message, goals, created_at` from `mentorship_requests`.
    - Filters by `mentee_id = userId`.
    - Applies optional `opt.status` (single value or array via `.eq` / `.in`).
    - Orders by `created_at` (descending by default).
  - `fetchMentorRequests(userId, opt)`
    - Same columns, but filtered by `mentor_id = userId`.
    - Used by mentor dashboards to load incoming requests.
  - `fetchMentorsAdmin(opt)`
    - Selects mentors plus joined applicant profile data from `profiles`.
    - Supports `opt.status` filter (e.g., pending/approved) and sorts by `created_at`.

---

## 5. Events – Browse, Attend, Create, Moderate, Feedback

Events let the community discover upcoming activities, RSVP, give feedback, and let admins/organizers manage and moderate submissions.

### 5.1 Routing shell – `EventsPage`

**File**: `frontend/src/pages/EventsPage.js`

- Routes under `/events/*`:
  - `/events` (`path="/"`) → `EventsList isAdmin={isAdmin}`.
  - `/events/new` → `CreateEvent` but only when `isAdmin` is true; otherwise redirects back to `/events` with an error state.
  - `/events/:id` → `EventDetail isAdmin={isAdmin}`.
  - `/events/:id/edit` → `EditEvent` for admins only; non-admins are redirected to `/events` with an error message.
  - `/events/:id/feedback` → `EventFeedback` when `user` is logged in; otherwise redirects to `/login` with `from` set to current path.
  - `/events/:id/feedback-dashboard` → `EventFeedbackDashboard` when `user` is logged in; otherwise same `/login` redirect.

At the top level, `App.js` further wraps `/events/*` in:

- `RequireCompleteProfile` and `ProtectedRoute requiredPermission="access:events"`.

So access is limited to authenticated, complete-profile users with `access:events`, with additional admin-only features (create/edit, moderation, feedback dashboard) inside.

### 5.2 Events listing – `EventsList`

**File**: `frontend/src/components/Events/EventsList.js`

- **Purpose**
  - Main hub for `/events`.
  - Shows:
    - Priority strip of featured events.
    - Search + sort controls.
    - Grid/list/calendar views of events.
    - Create Event CTA for users with permission.

- **Key state**
  - `events` – full list with `attendees_count` attached.
  - `featuredEvents`, `featuredLoading` – for PriorityStrip.
  - `calendarEvents` – normalized objects for `EventCalendar`.
  - `loading`, `error` – main list fetch state.
  - `searchTerm` – client-side search term.
  - `sortBy` – `'upcoming' | 'closed' | 'oldest'`.
  - `viewMode` – `'grid' | 'list' | 'calendar'`.

- **Permissions & role gating**
  - `useAuth()` → `hasPermission`.
  - `canCreate = hasPermission('events:create')` toggles the **Create Event** button.
  - `isAdmin` prop determines whether unapproved/unpublished events are visible:
    - Non-admins only see events where `is_published = true` and `approval_status = 'approved'`.

- **Data loading**
  - `fetchEvents()`:
    - Base query: `supabase.from('events').select('*')`.
    - Role filter:
      - If not admin → `.eq('is_published', true).eq('approval_status', 'approved')`.
    - Sort modes:
      - `upcoming`:
        - `gt('start_date', nowIso)`.
        - `order('start_date', { ascending: true })`.
      - `closed`:
        - Uses `.or()` to capture events whose end has passed.
        - Orders by `end_date` desc (nulls first) then `start_date` desc.
      - `oldest`:
        - Simple ascending `start_date`.
    - For loaded event IDs, tries to enrich with attendee counts:
      1. RPC `get_event_attendance_counts(p_event_ids)`.
      2. Fallback: `event_rsvps` table with `attendance_status` in `going/attending/checked_in/attended`.
      3. Fallback: `event_attendees` table with same status bucket.
    - Builds `eventsWithCounts` and corresponding `calendarEvents` normalized for `EventCalendar` (IST conversion, type, category, location, attendees counts).
  - `fetchFeaturedEvents()`:
    - Selects up to 8 events where `is_featured = true`.
    - If not admin, also requires `is_published` and `approval_status = 'approved'`.
  - Effects:
    - On mount: calls `fetchEvents()` and `fetchFeaturedEvents()`.
    - On `sortBy`/`isAdmin` changes: re-fetch events.
    - Subscribes to realtime via `onPostgresChangesOnce` on:
      - `events` – any change triggers `fetchEvents()` + `fetchFeaturedEvents()`.
      - `event_attendees` and `event_rsvps` – trigger `fetchEvents()` to update counts.

- **Search & sort pipeline**
  - `processedEvents`:
    - Filters `events` by `searchTerm` (title, description, venue, address case-insensitive substring).
    - Sorts by `start_date` asc (upcoming/oldest) or computed "effective end" date for closed events.

- **UI layout**
  - Header row:
    - Title "Events".
    - View mode toggles (grid/list/calendar) via `ToggleButtonGroup`.
    - **Create Event** button (visible only when `canCreate`).
  - Priority strip:
    - `<PriorityStrip events={featuredEvents} loading={featuredLoading} />`.
  - Filter/search bar:
    - `TextField` search input with `SearchIcon` adornment.
    - "Sort By" `<Select>`: oldest, upcoming, closed.
  - Main content:
    - Empty state card if `processedEvents.length === 0` with clear filters button.
    - If `viewMode === 'grid'`:
      - `Grid` of `Card`s showing image, type chip, status chip, date/time (converted to IST), short details, attendee count (`PeopleIcon`), and **View Details** button linking to `/events/{id}`.
    - If `viewMode === 'list'`:
      - MUI `List` of list items with avatar/icon, title, date/time, location, statuses.
    - If `viewMode === 'calendar'`:
      - `<EventCalendar events={calendarEvents} />` to visualize events over a month/week view.

- **Supabase tables & RPCs**
  - `events` – main events table.
  - `event_rsvps`, `event_attendees` – attendance and RSVP status.
  - RPC `get_event_attendance_counts` – (optional) aggregated counts per event.

### 5.3 Event detail – `EventDetail`

**File**: `frontend/src/components/Events/EventDetail.js`

- **Purpose**
  - Detailed page for a single event at `/events/:id`.
  - Shows hero image, rich description, organizer information.
  - Handles RSVP flows and inline feedback submission after the event.

- **Key data & hooks**
  - Route/context:
    - `useParams()` → `id`.
    - `useNavigate()`.
    - `useAuth()` → `user`, `isAdmin`.
  - Event & related data via custom hooks:
    - `useEvent(id)` → core `event` object; provides `isLoading`.
    - `useMyRsvp(id)` → current user’s RSVP row; refetchable via `refetchRsvp`.
    - `useMyFeedback(id)` → whether user has submitted feedback.
    - `useOrganizer(id)` → organizer profile (avatar, name, alumni details).
    - `useEventComputedFlags(event)` → `startISO`, `endISO`, `eventStarted`, `eventEnded`.
  - Local state:
    - `error`, `rsvpLoading`, `loading` (for destructive actions), `showRsvpSuccess`, `showLoginPrompt`.
    - `feedbackRating`, `feedbackComment`, `feedbackSubmitted`.
    - `attendees`, `attendeesOpen`, `rsvpBanner`.

- **Realtime & attendees**
  - Subscribes to `event_attendees` changes for this event:
    - Channel `event_attendees:${id}:${user.id}` invalidates the `myRsvp` query on any change.
    - Separate channel `event-attendees-{id}` reloads the attendees list and refetches RSVP.
  - `fetchAttendees()`:
    - Selects from `event_attendees` joined to `profiles` for display.
    - Ensures missing profile rows are filled by an extra `profiles` query.

- **RSVP flows**
  - `handleAttend()`:
    - Requires `user`; otherwise triggers login prompt.
    - Upserts into `event_attendees` with `attendance_status='going'`.
    - Shows success banner and refetches RSVP.
  - `updateRsvpStatus(status)` and `handleRsvp(status)`:
    - For `status='going'` – identical upsert path.
    - For cancellation – deletes the `event_attendees` row.
    - Controls `showRsvpSuccess` and `rsvpBanner` booleans.

- **Feedback flows (inline)**
  - `canShowFeedback = eventEnded && iAmAttendee && !myFeedback`.
  - `handleFeedbackSubmit(e)` and `submitFeedback({ rating, comment })`:
    - Require login; redirect to login if unauthenticated (through `showLoginPrompt`).
    - Force integer rating via `Math.round(Number(feedbackRating))`.
    - Upsert semantics in `event_feedback`:
      - First query existing feedback for `(event_id, user_id)`.
      - If exists → `update` rating & comments.
      - Else → `insert` payload.
    - On success, resets form, marks `feedbackSubmitted`, and refetches `myFeedback`.

- **UI layout**
  - Hero image via `ImageWithFallback`.
  - Header: title, short description, organizer name, status chip (upcoming / ongoing / past).
  - Left column:
    - Long description, date/time (converted to IST), venue/virtual link, category, tags list linking to filtered `/events?tag=...`.
  - Right column:
    - Organizer card with avatar, name, company, location, batch year, and contact links.
    - RSVP card: shows current status, confirmation banners, **Going / Cancel** buttons and disabled states when event ended.
    - Feedback CTA or banner depending on `canShowFeedback` and `myFeedback`.

- **Supabase tables**
  - `events`, `event_attendees`, `event_feedback`, `profiles`.

### 5.4 Create event – `CreateEvent`

**File**: `frontend/src/components/Events/CreateEvent.js`

- **Purpose**
  - Form for admins/authorized users to create a new event.
  - Builds `events` row and optionally uploads an image to Supabase Storage.

- **Form model**
  - `formData` includes:
    - Basic info: `title`, `description` (short), `longDescription`.
    - Classification: `category`, `type` (`in-person` | `virtual`).
    - Schedule: `date`, `startTime`, `endTime`.
    - Location/virtual: `venue`, `address`, `virtualLink`.
    - Capacity & pricing: `maxAttendees`, `price`, `priceType` (`free` | `paid`).
    - Organizer: `organizerName`, `organizerEmail`, `organizerPhone`.
    - Image file: `image`.
    - Extras: `tags` (comma-separated string), `agenda` (array of `{ time, activity }`), `requirements`, `amenities`.

- **Validation (`validateForm`)**
  - Required fields: title, description, date, startTime, endTime, organizerName, organizerEmail.
  - For `type='in-person'`: venue and address are required.
  - For `type='virtual'`: virtualLink is required.
  - `maxAttendees` must be integer ≥ 1.
  - When `priceType='paid'`, `price` must be numeric ≥ 0.
  - Date cannot be in the past; ensures `eventDate >= today`.
  - End time must be after start time.

- **Submit flow (`handleSubmit`)**
  1. Require logged-in `user`; else show toast.
  2. Run `validateForm()`; if invalid, show toast and abort.
  3. Merge date + time fields into `start_date` and `end_date` (local → ISO UTC).
  4. Build `eventData` payload:
     - Fields such as `title`, `description`, `category` (employers forced to `recruitment`), `event_type`, `start_date`, `end_date`, `venue`, `address`, `virtual_link`, `max_attendees`, `cost`, `tags[]`, `agenda` (JSON string), `is_published: true`, `user_id`, `organizer_id`.
  5. Insert into `events` with `.insert([eventData]).select('id, featured_image_path').single()`.
  6. If image file provided:
     - Call `saveEventImage({ supabase, eventId, file, oldPath })` to upload to storage and update `featured_image_url` + `featured_image_path`.
  7. On any error, log and show toast.
  8. On success, toast "Event created successfully!" and navigate back to `/events`.

- **UI layout**
  - Multiple "glass-card" sections: Basic Info, Date & Time, Location, Attendance & Pricing, Agenda, Organizer Details, Image upload, Requirements & Amenities.
  - Errors displayed inline under each field.

- **Supabase tables / storage**
  - `events` table for main record.
  - Storage bucket for event images (via `saveEventImage`).

### 5.5 Edit event – `EditEvent`

**File**: `frontend/src/components/Events/EditEvent.js`

- **Purpose**
  - Admin-only form to edit an existing event’s metadata, schedule, and image.

- **Loading existing event**
  - On mount:
    - If `!isAdmin`, navigate back to `/events` with an error state.
    - Else `fetchEvent()`:
      - `supabase.from('events').select('*').eq('id', id).single()`.
      - Maps database row to `formData`:
        - Converts `start_date`/`end_date` UTC to local/IST date + time strings via `formatInIST`.
        - Normalizes tags array into comma-separated string.
        - Populates agenda array.
      - Sets `previewImage` from `featured_image_url`.

- **Validation & submit**
  - `validateForm()` broadly mirrors `CreateEvent` checks (required fields, type-specific fields, email format, paid price > 0).
  - On submit:
    1. Run validation; show toast on failure.
    2. Build `eventData` payload, using `mergeAndConvertToUTC` to construct UTC `start_date`/`end_date`.
    3. Normalize tags, agenda, and optional fields.
    4. Filter payload through `filterValidFields()` to keep only schema columns.
    5. `update` `events` row by id.
    6. If a new `image` file was selected:
       - Upload to `event-images` bucket.
       - Update `featured_image_url`/`featured_image_path` on the event.
       - Best-effort delete of the old image.
    7. On success, toast "Event updated successfully!" and navigate to `/events/{id}`.

- **Supabase tables / storage**
  - `events` table.
  - Storage bucket `event-images` for featured images.

### 5.6 Standalone feedback form – `EventFeedback`

**File**: `frontend/src/components/Events/EventFeedback.js`

- **Purpose**
  - Dedicated route `/events/:id/feedback` for attendees to submit/update feedback.
  - Uses MUI form controls for rating and comments.

- **Flow**
  - On mount:
    - Fetch event details (`events` table) for context.
    - `supabase.auth.getUser()` → if not logged in, redirect to `/login` with `from` set to this feedback route.
    - If logged in, `fetchUserFeedback(user.id)` loads any existing `event_feedback` row for `(event_id, user_id)` and pre-fills form.
  - Submit:
    - Requires `rating > 0`.
    - Ensures integer rating via `Math.round(Number(rating))`.
    - If `userFeedback` exists → `update` row.
    - Else → `insert` new row into `event_feedback`.
    - Shows Snackbar success and navigates back to `/events/{id}` after a short delay.

- **Supabase tables**
  - `events`, `event_feedback`.

### 5.7 Feedback dashboard – `EventFeedbackDashboard`

**File**: `frontend/src/components/Events/EventFeedbackDashboard.js`

- **Purpose**
  - Organizer/admin-only analytics view for a single event’s feedback at `/events/:id/feedback-dashboard`.

- **Access control**
  - Uses `useAuth()` for `user`, `isAdmin`.
  - On load:
    - Fetches `events` row by id.
    - If not admin and `event.organizer_id !== user.id`:
      - Navigate back to `/events` with a permission error.

- **Feedback data & stats**
  - Fetches from `event_feedback` with joined `profiles` (for avatar and name).
  - Computes:
    - `averageRating` (mean of all ratings).
    - `totalResponses` (count of feedback rows).
    - `commentsCount` (rows with non-empty `comments`).
  - Shows key metrics in three cards: average rating (with star icon and big number), total responses, comments count.

- **CSV export**
  - `exportFeedbackCSV()`:
    - Builds CSV with columns: Submitted At, Full Name, Rating, Comments.
    - Uses `formatInIST` for timestamp.
    - Triggers a download via a temporary `<a>` link.

- **Feedback list UI**
  - MUI `List` of items:
    - Avatar + name.
    - Rating stars.
    - Comment text and timestamp.

### 5.8 Event moderation – `EventModerationPanel`

**File**: `frontend/src/components/Events/EventModerationPanel.jsx`

- **Purpose**
  - Admin-only panel at `/admin/events/moderation` to approve or reject events submitted by users.

- **Data loading**
  - `fetchPendingEvents()` (from `utils/moderationApi`) loads pending events.
  - On load failure, shows toast and keeps list empty.

- **Actions**
  - `onApprove(ev)`:
    - Calls `approveEvent(ev.id, user.id)`.
    - Shows success toast and removes event from list.
  - `onReject(ev)`:
    - Uses `rejecting` state to capture an optional reason.
    - Calls `rejectEvent(ev.id, user.id, reason)`.
    - Shows success toast (including reason when present) and removes event from list.

- **UI**
  - List of pending events with:
    - Title.
    - `StatusBadge` (pending/approved/rejected) based on `approval_status`.
    - Short description and created_at timestamp.
  - Per-event actions:
    - Approve button (with loading state per event).
    - Reject flow toggling a textarea for reason + Confirm Reject button.

- **Supabase / APIs**
  - `fetchPendingEvents`, `approveEvent`, `rejectEvent` utilities; these operate on the `events` table’s approval fields.

## 6. Groups – Create → Approve → Join → Manage

Groups features use dedicated **Groups** components for public-facing discovery, detail views, creation, and admin management, backed by Supabase tables (`groups`, `group_members`, `group_memberships`, `group_posts`, `group_comments`) and SECURITY DEFINER RPCs (e.g. `create_group_and_add_admin`, `join_group_v2`, `list_pending_members`, `set_member_role`).

### 6.1 Groups routing & discovery (`/groups` → `GroupsPage` + `GroupsList`)

**Files**:

- `frontend/src/pages/GroupsPage.jsx`
- `frontend/src/components/Groups/GroupsList.js`

**Purpose**:

- Main entry for browsing networking groups at `/groups`.
- Allows alumni/students to:
  - Discover public groups by name, tags, and privacy.
  - Filter to groups they joined or created.
  - Request to join private groups.
  - Create new groups when permitted.

**Routing & permissions**:

- `GroupsPage` mounts `GroupsList` under `/groups`.
- `useAuth()` provides `user`, `userRole`, `isAdmin`, `hasPermission`.
- `canCreateGroup(userRole)` (from `utils/acl`) gates the **Create Group** CTA:
  - Allowed: `alumni`, `admin`, `super_admin`.
  - Employers are blocked from creating groups.

**Core data & state in `GroupsList`**:

- `groups` – array of group rows from `fetchGroups` (`utils/supabase`).
- `userMemberships` – IDs of groups where current user is a member.
- `membershipMap` – fine-grained map per group `{ isMember, isAdmin }` from `fetchMembershipMap` (`utils/memberships`).
- `loading`, `error` – loading/error flags.
- Search & filters:
  - `searchQuery` – free-text filter on name.
  - `selectedTags` – multi-select tag filter.
  - `filter` – `'all' | 'joined' | 'created'`.
  - `privacyFilter` – `'all' | 'public' | 'private'`.

**Data loading flow (`useEffect`)**:

1. Calls `fetchGroups({ searchQuery, tags, isAdmin: canManageAllGroups, currentUserId: user?.id, userRole })`.
   - Internally:
     - For admins: returns all non-archived groups with optional name/tags filters.
     - For non-admins:
       - Returns public, approved, non-archived groups.
       - Plus private/member-only groups where the user is a member (via `group_members`).
2. Applies client-side filters:
   - Membership filter:
     - `joined` → groups with `is_member === true`.
     - `created` → groups where `created_by === user.id`.
   - Privacy filter:
     - `public` → `is_private === false`.
     - `private` → `is_private === true`.
3. Builds `userMemberships` from groups where `is_member === true`.
4. Computes `membershipMap` for visible group IDs using `fetchMembershipMap(supabase, ids)` to drive accurate CTAs (join/leave/manage).

**Group cards – `GroupCard`**:

- Shows:
  - Cover image: `group.group_avatar_url` (`group_avatars` bucket) with cache-busting.
  - Name (link to `/groups/{id}`), description snippet, tags (first 3 + "+N more").
  - Badges:
    - `Members` label.
    - `Admin-only Posts` (if `is_admin_only_posts`).
    - `Archived` flag.
    - Privacy chip: **Public** vs **Private**.
    - Moderation chip for creators/admins: **Approved / Pending / Rejected** (via `is_approved`, `approval_status`, `is_rejected`).
  - Created date.

- CTA buttons (per card):
  - **Join** – visible when:
    - User is not an employer.
    - Group is not archived.
    - User is not a member.
    - Group is public & approved.
  - **Leave** – visible when:
    - User is a member.
    - Group is not archived.
    - User is not a group admin or site admin (admins use Manage UI instead).
  - **Request to join** – visible when:
    - Group is private.
    - User is not a member, not site admin, not creator.
  - **Manage Group** link → `/groups/{id}/manage` for group admins or site admins.

**Join / Leave / Request flow (`handleJoinLeave`)**:

- If `!user` → redirect to `/login?redirect=/groups`.
- Private groups (non-admin path):
  - Calls `requestGroupMembership(groupId)` (from `utils/supabase`).
  - Handles duplicates (`23505`/409), permission (`42501`), generic errors with human-readable messages.
- Public groups:
  - If already member → calls `leaveGroup(groupId, user.id)` from `utils/supabase`.
    - For admins, first ensures there is at least one other admin left (`group_members` count query).
  - If not member → calls `joinGroup(groupId)` (RPC-backed helper) to add membership.
  - Updates `userMemberships` locally and shows toasts.

### 6.2 Group detail – `GroupDetail` (`/groups/:id`)

**File**: `frontend/src/components/Groups/GroupDetail.js`

**Purpose**:

- Detailed page for a single group at `/groups/:id`.
- Shows group avatar, name, description, creator identity, privacy/approval status, members count, and posts.
- Provides join/leave actions and post browsing/composer for eligible members.

**Data loading (`loadGroupData`)**:

1. Fetch core group record via `fetchGroupDetails(id)` (`utils/supabase`):
   - Loads `groups` row (including `created_by`, `is_private`, `is_archived`, `group_avatar_url`).
   - Resolves creator identity from `alumni_directory_public` into `group.creator`.
   - Optionally attaches `members` list (role + profile) using `fetchGroupMembers`.
2. Determine membership/admin flags:
   - `checkMemberPresence(supabase, id, user.id)` → boolean member presence from `group_memberships` / `group_members`.
   - `getMyMembership(supabase, id)` → membership row with `role` from `group_members`.
   - `isMember` and `isAdmin` derived from these plus `profile.is_admin`.
3. Member count:
   - Head-only `group_members` query with `{ count: 'exact', head: true }` → `memberCount`.
4. Posts:
   - If user is a member or group is public, calls `fetchGroupPosts(id, { limit: 10 })`.
   - Stores `posts` and `hasMore` (when exactly 10 posts returned).

**Avatar & header**:

- Avatar computed from `group.group_avatar_url` with cache-busting query param based on `updated_at`.
- Header region typically shows:
  - Group name, description.
  - Privacy chip (Public/Private).
  - Approval/archived state (Approved/Pending/Archived).
  - Member count and creator display.

**Join/Leave actions**:

- Mirrors the semantics of `GroupsList` but scoped to a single group.
- Uses helpers from `utils/supabase` / `utils/memberships` to:
  - Join public group or request private membership.
  - Leave group, with safeguards for last-admin scenarios.
- Error handling distinguishes between:
  - Group not found / pending / archived (`JSON object requested, multiple (or no) rows returned`).
  - RLS/permission errors.

**Posts & comments**:

- Uses `group_posts` as canonical posts table and optionally `group_comments` for replies (via `api/groups` / `utils/supabase` helpers):
  - `fetchGroupPosts`, `fetchPostComments` for listing.
  - `createGroupPost`, `updateGroupPost`, `deleteGroupPost` for CRUD.
  - `createComment`, `updateComment`, `deleteComment` for comments.
- Composer and actions are only available when:
  - User is a member, and
  - Group is not archived, and
  - For admin-only posts, user is site admin or group admin.

**Members panel**:

- Shows member cards using `group_members` joined to `profiles`:
  - Avatar, full name.
  - Role label from `ROLE_LABELS[m.user.role] || 'Alumni'` plus group role (`Group Admin` vs `Member`).
  - This mirrors the cards used in `GroupManage` but read-only for regular viewers.

### 6.3 Creating a group – `CreateGroup` (`/groups/new`)

**File**: `frontend/src/components/Groups/CreateGroup.js`

**Entry point & gating**:

- Accessed via **Create Group** button in `GroupsList` when:
  - User is logged in.
  - `canCreateGroup(userRole)` returns true (alumni/admin roles).
- Employers are blocked via `guardEmployers()` in the underlying Supabase helpers.

**Form fields**:

- `name` – required group name.
- `description` – longer text describing the community.
- `tagsInput` – comma-separated tags (later split into array).
- `isPrivate` – toggle between Public/Private.
- `avatarFile` – optional group avatar image.

**Submit handler (`handleSubmit`)**:

1. Prevents default and clears prior errors.
2. Validates:
   - Non-empty `name`.
3. Calls `createGroup({ name, description, isPrivate, tags })` from `api/groups` / `utils/supabase`:
   - RPC `create_group_and_add_admin` inserts a `groups` row and auto-adds creator as admin in `group_members`.
4. Optional avatar upload:
   - Validates image type (`image/jpeg` or `image/png`) and max size (2 MB).
   - Uploads to `storage.from('group_avatars')` at `${groupId}/avatar.jpg` with `upsert: true`.
   - Derives public URL via `.getPublicUrl()` and updates `groups.group_avatar_url` + `updated_at`.
5. On success:
   - Shows `toast.success('Group created successfully!')`.
   - Navigates to `/groups/${id}/manage` for immediate configuration.
6. On error:
   - Handles "JSON object requested, multiple (or no) rows returned" as "created but pending review / not visible yet".
   - Distinguishes permission (`42501`) and generic errors, surfacing friendly toasts.

### 6.4 Group admin – `GroupManage` + `RequireGroupAdmin` (`/groups/:id/manage`)

**Route**: `/groups/:id/manage` → `frontend/src/pages/GroupManage.jsx` wrapped in `RequireGroupAdmin`.

**Guards**:

- `RequireGroupAdmin` (route wrapper):
  - Uses `useParams()` to get `id` and `useAuth()` for `profile`.
  - Via React Query, loads current user's `group_members` row for this group.
  - Allows access only if:
    - `profile.is_admin === true` (site admin), or
    - Membership `role === 'admin'`.
  - Otherwise, redirects back to `/groups/:id`.

**Purpose of `GroupManage`**:

- Admin console for:
  - Updating group basics (name, description, tags, privacy).
  - Toggling approval (site admin only).
  - Reviewing and deciding on join requests.
  - Inviting members by email.
  - Promoting/demoting/removing members.
  - Archiving the group or leaving as admin.

**Key data & helpers**:

- Supabase helpers (`utils/supabase`):
  - `fetchGroupDetails`, `updateGroupDetails`, `fetchGroupMembers`, `getMyGroupMembership`.
- RPC/API layer (`api/groups`):
  - `listPendingMembers`, `approveGroupMember`, `rejectGroupMember`.
  - `setMemberRoleRpc`, `removeMemberRpc`.
  - `inviteMemberByEmail`, `leaveGroupRpc`.
- ACL helpers (`utils/acl`):
  - `canManageGroup(isSiteAdminFlag, isCreator, membership)` to compute `authorized`.

**Sections in the UI**:

- **Basics**:
  - Editable `name`, `description`, `tags` (comma-separated → array).
  - **Save** button → `saveBasics()` → `updateGroupDetails(id, payload)`.

- **Privacy**:
  - `isPrivate` checkbox and **Save** button → `savePrivacy()`.

- **Approval** (site admins only):
  - Shows chip **Approved** vs **Pending** (from `is_approved`).
  - Button toggles approval via `toggleApproval()` → `updateGroupDetails(id, { is_approved: !isApproved })`.
  - Handles edge case where JSON-single-row errors indicate visibility changes.

- **Pending Requests** (site admin or group admin):
  - Renders list from `listPendingMembers(id)`.
  - Each row shows user id (and basic info) plus requested_at.
  - Actions:
    - **Approve** → `approveGroupMember(id, user_id)`.
    - **Reject** → `rejectGroupMember(id, user_id)`.
  - After each action, calls `load()` to refresh.

- **Members**:
  - Grid of member cards from `fetchGroupMembers(id, 200, 0)`.
  - Each card:
    - Avatar, `full_name`, role label (`ROLE_LABELS[user.role]` + group role).
    - If admin:
      - Badge with shield icon.
    - Actions for admins/site admins:
      - **Promote** non-admins → `setMemberRoleRpc(id, user.id, 'admin')`.
      - **Demote** admins → `setMemberRoleRpc(id, user.id, 'member')` but only if another admin exists (`ensureAnotherAdminExists`).
      - **Remove** non-admin members → `removeMemberRpc`.

- **Invite by email** (admins only):
  - `inviteEmail` text field.
  - **Send Invite** → `inviteMemberByEmail(id, inviteEmail)`.
  - Shows specific error if employers are invited (not allowed), otherwise generic error via `getFriendlyErrorMessage`.

- **Danger Zone**:
  - **Archive Group** → `archiveGroup()`:
    - Calls `updateGroupDetails(id, { is_archived: true, is_approved: false })`.
    - Navigates back to `/groups` and may show special message when JSON-object errors indicate hiding.
  - **Leave Group** → `leaveGroup()`:
    - Calls `leaveGroupRpc(id)` and navigates back to `/groups/:id`.
    - Disabled while `leaving` is true.

### 6.5 Groups API & ACL helpers – `api/groups*`, `utils/acl.js`, `utils/supabase.js`

**Supabase tables & buckets involved**:

- `groups` – core group metadata (name, description, tags, privacy, approval, archived state, avatar URL, creator).
- `group_members` – active members with `role` and `status` (`admin` vs `member`).
- `group_memberships` – membership requests and invites (`status` like `pending`, `approved`, `rejected`).
- `group_posts` – posts within groups.
- `group_comments` – comments on posts.
- Storage bucket `group_avatars` – group cover/avatar images.

**API helpers (`frontend/src/api/groups.{js,ts}`)**:

- Creation & approval:
  - `createGroup` → RPC `create_group_and_add_admin` for secure creation + auto-admin membership.
  - `approveGroup` → sets `is_approved=true, approval_status='approved'` on `groups`.
- Membership workflows:
  - `joinPublicGroup`, `joinGroupV2` – join a public group (RLS + triggers infer role and status; V2 returns `'active' | 'pending'`).
  - `requestJoinPrivateGroup` / `requestGroupMembership` – create pending membership in `group_memberships`.
  - `decideJoinRequest` – approve/reject a request.
  - `addMember`, `addGroupMember` – invite/add directly into `group_members`.
  - `leaveGroup` / `leaveGroupRpc` – self-leave with safeguards against removing last admin.
  - `setMemberRole`, `setMemberRoleRpc` – promote/demote members.
  - `setAdminOnlyPosts`, `setArchived` – toggle admin-only posting and archive state.
  - `removeMemberRpc`, `removeGroupMember` – remove a member completely.
- Posts & comments:
  - `createPost`, `updatePost`, `deletePost` – `group_posts` CRUD.
  - `createComment`, `updateComment`, `deleteComment` – `group_comments` CRUD.

**ACL helpers (`frontend/src/utils/acl.js`)**:

- `canCreateGroup(role)` – restricts creation to alumni/admin roles.
- `isSiteAdmin(role)` – `admin` or `super_admin`.
- `isGroupAdmin(membership)` – membership is active + role in `['admin', 'owner']`.
- `canManageGroup(isSiteAdminFlag, isCreator, membership)` – single source of truth for admin console access.
- `canPostToGroup(group, isSiteAdminFlag, membership)` – ensures:
  - Archived groups cannot be posted to.
  - Admin-only posts require admin or site admin.
  - Otherwise, members can post.
- `canCommentOnGroup(group, role, isMember)` – enforces:
  - No comments from unauthenticated or employer roles.
  - Admins can always comment.
  - For private groups, only members; for public groups, alumni.

**Supabase convenience helpers (`frontend/src/utils/supabase.js`)**:

- `fetchGroups` – shared query used by `GroupsList`:
  - Handles admin vs non-admin vs employer visibility.
  - Merges public groups with member-only groups for the current user.
- `fetchGroupDetails`, `fetchGroupMembers`, `getMyGroupMembership` – used by `GroupDetail` and `GroupManage`.
  - `joinGroup`, `leaveGroup`, `requestGroupMembership`, `addGroupMember`, `createGroupPost`, `deleteGroupPost`, `updateGroupPost`, `fetchGroupPosts`, `fetchPostComments`, `reportGroupPost` – end-to-end helpers for the group lifecycle.
 
---

## 7. Messages – Inbox, Chats, Connections

The Messages module provides a unified place for 1:1 direct messages (DMs) between alumni/employers, tied to the **Connections** graph and surfaced via `/messages`.

### 7.1 Routing shell – `Messages` & `MessagingSystem` (`/messages`)

**Files**:

- `frontend/src/components/Messages/Messages.js`
- `frontend/src/components/Messages/MessagingSystem.js`

**Purpose**:

- Route `/messages` is the main hub for:
  - **Chats** – DM threads for all peers (`v_my_dm_threads`).
  - **Connections** – pending/accepted connection edges (requests, approvals, disconnect).
- Integrates with other modules via deep links such as:
  - `/messages?tab=chats&peer=<userId>` from Mentorship, Directory, Jobs, and Groups CTAs.

**Auth & tracking**:

- On mount, `MessagingSystem`:
  - Uses `supabase.auth.getSession()` and `profiles` lookup to derive `currentUser`.
  - Logs page view via `logActivity({ action: 'messages_page_view', route: '/messages' })`.
  - Handles auth failure with toasts and a generic “Failed to load user profile” error state.

**Tabs & query params**:

- `activeTab` is derived from `tab` query param (`chats` | `connections`, default `chats`).
- `setTab(tab)`:
  - Normalizes to `chats` or `connections`.
  - Updates `window.location.search` (`?tab=...`) via `history.replaceState`.
- The component also re-reads `tab` when `window.location.search` changes so links like `/messages?tab=connections` open the Connections view directly.

**Thread loading – `v_my_dm_threads`**:

- `threads` state holds DM thread summaries for the current user.
- `fetchUserThreads()`:
  - Guards against rapid re-entry using `fetchingConvsRef` + `lastFetchAtRef` (500ms throttle).
  - Queries `supabase.from('v_my_dm_threads').select('*').order('thread_id', { ascending: false })`.
  - Writes to `threads` and logs `dm_threads_list_load` activity with count.
  - Sets `error` + toast when DM threads cannot be loaded.
- Called:
  - After `currentUser` is resolved.
  - On window focus (to catch mobile resume).
  - Via debounced refresh after messages are sent or realtime changes arrive.

**Realtime subscriptions**:

- For each batch of up to 20 `threadIds`, MessagingSystem:
  - Creates a Supabase channel `dm-inbox:<userId>:<batchIndex>:<effectId>`.
  - Subscribes to:
    - `INSERT` on `dm_messages` with `thread_id in (<batchIds>)`.
    - `UPDATE` on `dm_threads` with `id in (<batchIds>)`.
  - On change, triggers the debounced `fetchUserThreads()`.
- Separate channel `dm-participation:<userId>:<effectId>`:
  - Listens to `INSERT` on `dm_participants` for this user and refreshes thread list.

**Deep linking via `thread` and `peer` query params**:

- Effect reads `thread` and `peer` from `location.search`:
  - If `thread` is present:
    - Looks up that thread in `v_my_dm_threads`; if found, selects it and normalizes URL to `?thread=<id>` (removing `peer`).
  - Else, if `peer` is present:
    - Searches for an existing DM with that peer (`v_my_dm_threads` by `other_user_id`).
    - If found, selects it and rewrites URL to `?thread=<id>`.
    - If not found, calls `handleCreateConversation(peer)` (see below) and keeps a stub `{ other_user_id: peer }` selected.

**Selecting or starting a conversation**:

- `handleSelectThread(thread)`:
  - If `thread.thread_id` exists:
    - Sets `thread` in URL query (`?thread=<id>`), removes `peer`, and resolves from current `threads` list.
  - If only `other_user_id` is present:
    - Updates URL with `?peer=<other_user_id>`, sets a stub selectedThread, and fires `handleCreateConversation(other_user_id)`.
  - Logs `dm_open_thread` activity with `threadId`.
- `handleCreateConversation(targetUserId)`:
  - Requires `currentUser`; if missing, shows “You must be logged in to start a conversation.”
  - Calls `ensureDmThreadWith(targetUserId)` (RPC `get_or_create_dm_thread`) to ensure a DM thread exists.
  - Refreshes `threads` and tries to:
    - Load the new thread from `v_my_dm_threads` by id or `other_user_id`.
    - Show “Conversation ready.” on success.
    - Otherwise inform the user that the thread will appear shortly.

**Layout**:

- Header:
  - Title “Messages” with a badge showing pending connection requests `counts.received`.
  - Tab buttons: **Chats** and **Connections (N)** using `counts.received`.
- Content:
  - If `activeTab === 'connections'` → `ConnectionsPanel currentUserId={currentUser?.id}`.
  - Else → split view:
    - Left: `ConversationList` (hidden on small screens when a thread is open).
    - Right: `ChatWindow` for the selected thread, with `onMessageSent={debouncedRefresh}`.

### 7.2 Conversation list – `ConversationList`

**File**: `frontend/src/components/Messages/ConversationList.js`

- Displays all DM threads (`threads`) in a searchable, sorted list:
  - Each `ThreadRow` shows:
    - Avatar (from `useProfileById(thread.other_user_id)` or default initial chip).
    - Name (`other_user_name` / profile), role/company/title summary.
    - Unread indicator when `thread.unread_count > 0`.
    - Presence-like dot when `thread.can_send` is true.
- `searchQuery` filters by `other_user_name` (case-insensitive).
- Threads sorted by most recent activity using the first defined of:
  - `last_message_at`, `latest_message_at`, `last_dm_at`, `updated_at`, `created_at`.
- Handles loading skeletons, “no conversations found” empty state, and generic empty state when there are no threads at all.

### 7.3 Chat threads – `ChatWindow`

**File**: `frontend/src/components/Messages/ChatWindow.js`

**Purpose**:

- Show a single DM thread and allow sending messages when connection rules permit.
- Provide rich context:
  - Other user’s alumni/company info from `alumni_directory_public`.
  - Optional job/event context chips (when opened from Jobs or Events).
  - Connection status banners (pending, disconnected, etc.).

**Thread resolution & message loading**:

- Keeps `activeThread` in local state:
  - If `thread.thread_id` is present:
    - Verifies the thread exists in `dm_threads`.
    - Falls back to `v_my_dm_threads` lookup by `other_user_id` when needed.
  - If only `other_user_id` provided (deep link), ensures a thread via `createThread`/`ensureDmThreadWith` and resolves it from `v_my_dm_threads`.
- When `activeThread.thread_id` is known:
  - Loads other user’s public profile from `alumni_directory_public`.
  - Loads messages from `dm_messages`:
    - For the last ~30 days via `created_at >= sinceISO`.
    - Ordered ascending by `created_at`.
  - Stores messages in `messages` and sets `otherProfile`.
- `useDmRealtime(threadId, onInsert)`:
  - Subscribes to `INSERT` on `dm_messages` for this thread and appends or merges the new row (by `id`/`client_id`).

**Connection gating for messaging**:

- Uses `checkConnectionStatus(currentUser.id, other_user_id)` and `getLatestEdge` to determine if the two users are connected.
- Maintains:
  - `edge` – latest connection edge (pending/accepted/removed/declined).
  - `isConnected`, `checkingConnection`, `isReconnecting`.
  - Client-side cooldown via `getDisconnectCooldown` / `setDisconnectCooldown` / `formatCooldownTime`.
- `canSendDerived` is true only when:
  - Thread is sendable (`thread.can_send`) **or** connection edge is accepted (or has been accepted locally), **and**
  - `isConnected` is true.
- Header + banners communicate:
  - Pending incoming requests (Accept/Reject buttons).
  - Pending outgoing requests (Cancel Request).
  - Disconnected history (read-only messages with Reconnect button and optional cooldown).
  - Generic “Connection required to send messages” with a **Request Connection** action.

**Sending messages**:

- `handleSendMessage(e)`:
  1. Prevents default, checks `newMessage.trim()` and `currentUser`, requires `activeThread.thread_id` and `canSendDerived`.
  2. Clears the input immediately; relies on realtime to render the new message.
  3. Calls `sendDmMessage(activeThread.thread_id, body)` (RPC `send_dm_message`).
  4. If RPC returns “Not a participant”:
     - Attempts `ensureDmThreadWith(activeThread.other_user_id)` to repair membership.
     - Retries `sendDmMessage` with the repaired thread id.
  5. On success, triggers `onMessageSent()` to refresh threads list.
  6. On failure, shows `toast.error('Failed to send message.')`.

**Header & context**:

- Shows other user’s avatar/name, role/company summary, and quick links:
  - “View Profile” or “View Company” button depending on `other_user_role`.
  - Chips for `Job: {jobId}` and `Event: {eventId}` when `?job=` or `?event=` appear in query string; clicking navigates back to those entities.

### 7.4 Connections view – `ConnectionsPanel` + `useConnectionsPanel`

**Files**:

- `frontend/src/components/Messages/ConnectionsPanel.jsx`
- `frontend/src/hooks/useConnectionsPanel.js`

**Purpose**:

- Show and manage connection edges that back messaging eligibility:
  - **Received** requests.
  - **Sent** pending requests.
  - **Accepted** (connected) edges.
- Provide a safe disconnect flow that surfaces its impact across **Mentorship**, **Jobs**, **Events**, and **Messages**.

**Data loading & realtime (`useConnectionsPanel`)**:

- Fetches all `connections` rows where current user is requester or recipient.
- Derives:
  - `received` – pending requests where `recipient_id = currentUserId`.
  - `sent` – pending requests where `requester_id = currentUserId`.
  - `accepted` – edges with `status='accepted'`.
- Hydrates peer profiles from `profiles` in a single batch and maps edges to items with embedded profile data.
- Maintains `lists` and `counts` (used for the Messages header badge).
- Subscribes to `connections` changes via `onPostgresChangesOnce` for both requester and recipient filters so UI stays fresh without manual refresh.

**Actions**:

- `accept(peerId)` – updates `connections.status='accepted'` for incoming request.
- `reject(peerId)` – sets status to `declined` / removes row.
- `cancel(peerId)` – deletes outgoing pending request.
- `disconnect(peerId)` – deletes accepted edge after confirmation.

**Disconnect impact analysis (`ConnectionsPanel`)**:

- Before disconnecting, `checkDisconnectImpact(peerId)` queries:
  - `mentorship_relationships` for active mentorships between the two users.
  - `job_applications` + joined `jobs.posted_by` for active applications between the parties.
  - `event_rsvps` + joined `events` in the next 30 days for upcoming shared events.
  - `v_my_dm_threads` + `dm_messages` for DM message count.
- The impact summary is shown in a confirmation dialog so users understand the consequences.
- On confirm, `actions.disconnect(peerId)` is called; a 24h cooldown is set so reconnect attempts are throttled.
- Logs activity via `logActivity` with route `/messages?tab=connections`.

### 7.5 DM APIs & realtime helpers – `api/dm.js`, `useDmRealtime`

**File**: `frontend/src/api/dm.js`

- `ensureDmThreadWith(otherUserId)`:
  - Validates auth and `otherUserId` (UUID checks, no self-DM).
  - Calls `supabase.rpc('get_or_create_dm_thread', { p_user1, p_user2 })`.
  - Retries once on 400/404 or "not found" errors, then returns `thread_id`.
  - Deduplicates concurrent calls using an `inflight` map.
- `sendDmMessage(threadId, body, repair?)`:
  - Calls `supabase.rpc('send_dm_message', { p_thread_id, p_body })`.
  - On success, returns new message id.
  - On "Not a participant" and provided `repair` callback, will repair the thread once and retry.
- `fetchMyThreads()` – convenience wrapper around `v_my_dm_threads`.
- `fetchThreadMessages(threadId)` – reads messages from `dm_messages` ordered by `created_at`.

**Hook**: `frontend/src/hooks/useDmRealtime.js`

- `useDmRealtime(threadId, onInsert)`:
  - Creates a Supabase channel `dm:<threadId>:<timestamp>`.
  - Subscribes to `INSERT` on `dm_messages` filtered by `thread_id=eq.<threadId>`.
  - On each payload, calls `onInsert(payload.new)` if `thread_id` matches.
  - Unsubscribes on unmount but leaves channel instance management to Supabase client.

---

## 8. Summary

This document focused on the **interactive flows** and **role-based visibility** for:

- Navigation & Header (menu contents, admin-only items, profile menu)
- Dashboard (main widgets, quick actions, and role nuances)
- Alumni Directory (directory discovery, profile views, and connections)
- Events (listing, detail, RSVP, feedback, and moderation)
- Jobs (from search and apply to posting and managing applications)
- Mentorship (becoming a mentor/mentee, directory, and request life cycle)
- Groups (creating groups, viewing them, membership, and admin management)
- Messages (DM inbox, chat threads, and connection-backed messaging)

Route-level gating is enforced via `ProtectedRoute`, `ApprovedGuard`, `RequireGroupAdmin`, and Messages-specific auth checks, while fine-grained permissions come from `AuthContext` and the backend (Supabase RLS + triggers). All the flows described above ultimately rely on Supabase tables and RPCs as the single source of truth.
