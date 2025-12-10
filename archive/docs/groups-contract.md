# Groups/Chapters Contract (Canonical Spec)

_Last updated: 2025-12-10_

## 0. Scope & Overview

This document defines the **canonical contract** for the Groups/Chapters feature implemented primarily by:

- **List / discovery**: `frontend/src/components/Groups/GroupsList.js`
- **Detail (member view)**: `frontend/src/components/Groups/GroupDetail.js`
- **Creation**: `frontend/src/components/Groups/CreateGroup.js`
- **Dashboard widget**: `frontend/src/components/Dashboard/MyGroupsWidget.jsx`
- **Admin control plane**: `frontend/src/pages/AdminGroupsPage.jsx`
- **Group management (admin view)**: `frontend/src/pages/GroupManage.jsx` (uses the same data model and RPC layer)

**Primary routes:**

- `/groups` – main Groups/Chapters discovery list
- `/groups/new` – create a new group/chapter
- `/groups/:id` – group detail (posts, members, about)
- `/groups/:id/manage` – group admin/manage view
- `/admin/groups` – platform admin Groups/Chapters control plane

**Backend & data model (as seen in code + migrations):**

- Tables:
  - `public.groups`
  - `public.group_members`
  - `public.group_memberships` (join requests/invitations, with `status`)
  - `public.group_posts`
  - `public.group_comments`
  - `public.alumni_directory_public` (for creator identity)
- Key RPCs (from `frontend/src/api/groups.ts`):
  - `create_group_and_add_admin`
  - `list_groups_for_current_user_paged`
  - `join_group`
  - `leave_group`
  - `invite_member_by_email`
  - `list_pending_members`
  - `approve_group_member`, `reject_group_member`
  - `set_member_role`, `remove_member`
  - `approve_group`, `reject_group`, `archive_group`, `delete_group_secure`
- RLS consolidation for the module is defined in
  `supabase/migrations/20241209_groups_clean_slate_rls.sql`, which standardizes policies on:
  - `groups`, `group_members`, `group_memberships`, `group_posts`, `group_comments`.

This file is the **source of truth** for:

- Groups/Chapters **sections / screens** and responsibilities
- **Data sources** (frontend hooks + RPCs/tables)
- **Navigation targets** (routes)
- **Role gating rules** (Student, Alumni, Employer, Admin/Super Admin)
- An **Alumni "desired vs current" diff** for auditing behavior

---

## 1. Sections / Units (Canonical Contract)

The table below defines the main UI units and flows in the Groups/Chapters module, as they should behave conceptually.

### 1.1 Section matrix

| ID | Section | Description / Purpose | Frontend data source | Backend objects / RPCs / tables | Primary routes | Role gating (visibility & actions) |
|----|---------|-----------------------|----------------------|----------------------------------|----------------|-------------------------------------|
| S1 | **Groups List** | Main discovery list of networking groups/chapters, with search and alphabetical sort; surfaces membership CTAs (Join / Request to Join / Manage / Joined / Approval required). | `GroupsList` component using `useAuth`, `useApproval`, `fetchGroupsPagedRpc`, `fetchMembershipMap`, `canJoinGroup`, `getGroupStatus`. | RPC: `list_groups_for_current_user_paged`; tables: `groups`, `group_members`; helper RLS functions (e.g. `is_employer`, `fc_is_fully_approved`). | `/groups` | **Students/Alumni**: full access to list and CTAs, subject to account approval and group-level rules. **Employers**: explicitly blocked with an "Access Denied" card. **Admins/Super Admins**: see same list, with extra management affordances via `canManageAllGroups`. |
| S2 | **My Groups Strip** | Highlight strip at top of list showing up to 3 groups current user belongs to, with quick chips (Public/Private, Admin). | `GroupsList` `myGroups` slice derived from paged results + `membershipMap`. | `groups`, `group_members`; same RPCs as S1. | `/groups` | **Signed-in users (non-employer)**: see their first few groups. Employers are blocked from the list page entirely, so they do not see this strip there. |
| S3 | **Create Group/Chapter Form** | Form to create a new group/chapter with name, description, tags, privacy (Public/Private), and optional avatar upload. | `CreateGroup` component; uses `useAuth`, `canCreateGroup`, `createGroup` (API), direct `supabase.storage` and `supabase.from('groups').update` for avatar URL. | RPC: `create_group_and_add_admin`; tables: `groups`, `group_members`, storage bucket `group_avatars`. | `/groups/new` | **Alumni/Admin/Super Admin**: allowed by `canCreateGroup(userRole)`. **Students/Employers**: redirected back to `/groups` with an error message. Actual insert is still guarded by RLS + `create_group_and_add_admin`. |
| S4 | **Group Detail – Header** | Group hero header showing name, description, privacy (Public/Private), Alumni-only, Archived, approval state (Pending/Approved/Rejected) for creator/admin, and avatar. Shows role-derived CTAs: Join Group, Request to Join, Leave Group, Manage Group, Delete Group (super_admin only). | `GroupDetail` top section; uses `fetchGroupDetails`, `getMyMembership`, `checkMemberPresence`, `canJoinGroup`, `joinGroupRpc`, `leaveGroupRpc`, `withdrawJoinRequest`, `deleteGroupRpc`, `useApproval`, `ROLE_LABELS`. | Tables: `groups`, `group_members`, `group_memberships`; RPCs: `join_group`, `leave_group`, `delete_group_secure`; helper functions `is_group_admin`, `is_platform_admin` (via RLS). | `/groups/:id` | **Students/Alumni**: can view public, approved, non-archived groups. Private groups require membership (non-admins are blocked with access-denied card). Join/Leave CTAs obey approval, privacy, alumni_only, and last-admin rules. **Employers**: can be blocked by `canJoinGroup` and by RLS; UI uses `isEmployer` to prevent join. **Admins/Super Admins**: always see header; Admins see Manage; Super Admins additionally see Delete. |
| S5 | **Group Posts Tab** | Timeline of posts in the group plus composer; posting ability depends on membership, Admin-only posts flag, archived state, and role. Comments per post handled via `CommentsThread`. | `GroupDetail` `posts` tab; uses `fetchGroupPosts`, `createGroupPost`, `updateGroupPost`, `deleteGroupPost`, `reportGroupPost` (via utils + API), `canPostToGroup`, `canCommentOnGroup`. | Tables: `group_posts`, `group_comments`, `group_members`; RPCs: `fetchGroupPosts` (JS wrapper over `group_posts`), group comment helpers; RLS from `gp_*` and `gc_*` policies. | `/groups/:id` (tab `posts`) | **Members (Student/Alumni)**: can read posts if the group is public & approved or they are members; posting depends on `is_admin_only_posts` and `is_archived`. **Non-members**: cannot view posts for private groups; public groups may still show posts if approved. **Admins/Super Admins**: can moderate posts (edit/delete) regardless of membership, per RLS. |
| S6 | **Group Members Tab** | Grid of members (avatar, name, role) plus admin actions to promote/demote and remove members. Only visible to group/site admins. | `GroupDetail` `members` tab; uses `fetchGroupMembers`, `setMemberRole`, `removeGroupMember`/`removeMemberRpc`, `ROLE_LABELS`. | Tables: `group_members`, `profiles`; RPCs: `set_member_role`, `remove_member`; RLS: `gm_select_group_admin`, `gm_delete_admin`. | `/groups/:id` (tab `members`), `/groups/:id/manage` for more advanced tools. | **Group admins + platform admins**: can see full member list and perform role changes/removals. Non-admin members and non-members do **not** see this tab content. |
| S7 | **Group About Tab** | Read-only about section with privacy, created-at date, tags, and description. | `GroupDetail` `about` tab; uses `group` object loaded via `fetchGroupDetails`. | `groups` | `/groups/:id` (tab `about`) | **All roles** with read access to the group row via RLS. For private groups, only members/admins see it. |
| S8 | **My Groups Widget (Dashboard)** | Compact widget on the dashboard showing up to three groups the user belongs to or has pending invitations to, with inline Accept/Decline for invitations. | `MyGroupsWidget` using `useAuth`, `fetchMyGroupsSummary`, realtime channel on `group_members`, `acceptGroupInvite`, `rejectGroupInvite`. | Tables: `group_members`, `groups`, `group_memberships`; RPCs: summary RPC + `acceptGroupInvite` / `rejectGroupInvite`. | Embedded in dashboard (`/dashboard`), links to `/groups` and `/groups/:id`. | **All signed-in roles**: widget renders if `user.id` exists. Group visibility and actionability (Accept/Decline) are still constrained by RLS and RPC guards (e.g., `guardEmployers`). |
| S9 | **Group Manage Page** | Rich admin view with stats, settings (name, description, tags, privacy, alumni_only), member grid with filters and pagination, pending requests queue, invite-by-email, archive/leave controls, and danger zone. | `GroupManage` page; uses `fetchGroupDetails`, `fetchGroupMembers`, `getMyGroupMembership`, `listPendingMembers`, `approveGroupMember`, `rejectGroupMember`, `setMemberRoleRpc`, `removeMemberRpc`, `leaveGroupRpc`, `approveGroupRpc`, `rejectGroupRpc`, `archiveGroupRpc`, `setAlumniOnly`. | Tables: `groups`, `group_members`, `group_memberships`, `profiles`; RPCs: `list_pending_members`, `approve_group_member`, `reject_group_member`, `set_member_role`, `remove_member`, `leave_group`, `approve_group`, `reject_group`, `archive_group`, `setAlumniOnly` update. | `/groups/:id/manage` | **Group admins & platform admins** only, per `canManageGroup` (site admin or creator or membership role `admin`). Non-admins are redirected back to `/groups/:id`.
| S10 | **Admin Groups/Chapters Page** | Platform-wide listing and moderation of all groups with filters, stats, and actions to approve/reject, archive, or delete groups. | `AdminGroupsPage`; uses direct `supabase.from('groups')` with `group_members(count)`, `approveGroupRpc`, `rejectGroupRpc`, `archiveGroupRpc`, `deleteGroupRpc`. | Tables: `groups`, `group_members`; RPCs: `approve_group`, `reject_group`, `archive_group`, `delete_group_secure`. | `/admin/groups` | **Admin/Super Admin** only. `isSuperAdmin` additionally controls visibility of hard delete action. |

---

## 2. Role Views (Canonical "What Each Role Sees")

### 2.1 Student

- **Visibility:**
  - Can access `/groups` list (S1, S2) and public group details (S4, S5, S7) where RLS permits.
  - Private group details (S4–S7) are blocked unless the student is a member; UI shows an access-denied card for private, non-member groups.
  - Does **not** see Create Group CTA (S3) because `canCreateGroup('student') === false`.
  - My Groups Widget (S8) shows any groups the student is already a member of (subject to RLS).

- **Actions:**
  - Can **join** or **request to join** groups where `canJoinGroup(group, 'student', isMember)` returns allowed and RLS/`join_group` permit it. Alumni-only groups explicitly block students at the ACL level.
  - Can **leave** groups via `leaveGroupRpc`, subject to last-admin safeguards in DB logic.
  - Cannot modify group settings or members unless elevated to group admin via admin tools.
  - Cannot create groups/chapters via UI; any attempt to reach `/groups/new` redirects back.

- **Constraints:**
  - `gm_insert_self_public` RLS policy requires that the student be fully approved (`fc_is_fully_approved`) for self-joins into public, approved, non-archived groups.
  - Employers are blocked separately; students are allowed but can be blocked by alumni_only flag and group approval/archived state.

### 2.2 Alumni

- **Visibility:**
  - Same base access to `/groups` and group details as students, but **allowed** to join alumni_only groups.
  - See Create Group CTA (S3) because `canCreateGroup('alumni') === true`.
  - See My Groups strip (S2) and My Groups Widget (S8) for their memberships.
  - As group admins (or creators) they additionally see S6 (Members tab content) and have access to S9 (Group Manage page).

- **Actions:**
  - Can create groups/chapters via `create_group_and_add_admin` (S3); the creator is automatically added as group admin by the RPC.
  - Can join public, approved, non-archived groups, and can be invited into private groups (invites handled via `group_memberships` + RPCs).
  - As group admins they can:
    - Approve/reject join requests (`list_pending_members`, `approve_group_member`, `reject_group_member`).
    - Invite members by email (`invite_member_by_email`).
    - Toggle Alumni-only flag via `setAlumniOnly`.
    - Archive the group (if given admin permissions) via `archive_group`.

- **Constraints:**
  - RLS on `group_members` and `group_memberships` enforces that only group admins/platform admins can manage memberships beyond their own.
  - Alumni are still subject to `fc_is_fully_approved` for self-joins into public groups via RLS.

### 2.3 Employer

- **Visibility:**
  - `/groups` list explicitly renders an **Access Denied** card for `userRole === 'employer'`; no groups are fetched or displayed there.
  - My Groups Widget (S8) does not explicitly gate by role; in practice, `guardEmployers` at the RPC layer and RLS on `group_members`/`group_memberships` make employer membership rare/controlled.
  - Group detail pages are not an explicit target for employers; access via direct URL is further constrained by RLS and `canJoinGroup` (which blocks employers from joining).

- **Actions:**
  - Cannot create groups/chapters: blocked by `canCreateGroup('employer') === false` and `guardEmployers` in `create_group` RPC.
  - Cannot join groups: `canJoinGroup` returns `allowed: false, reason: 'Employers cannot join groups.'`, and `join_group` RPC is guarded by `guardEmployers`.

- **Constraints:**
  - Employers are systematically excluded from group creation and joining by both front-end ACL and backend helpers/RLS.

### 2.4 Admin / Super Admin

- **Visibility:**
  - Can access `/groups` as normal users plus with elevated manage affordances (e.g., Manage CTA in S1, S4).
  - Can access `/groups/:id/manage` (S9) via `canManageGroup` which treats site admins and creators as managers.
  - Can access `/admin/groups` (S10) where all groups are visible regardless of approval, privacy, or archive state.

- **Actions:**
  - **Admin:**
    - Approve/reject groups (S9, S10) via `approve_group` / `reject_group`.
    - Archive/unarchive groups via `archive_group`.
    - Manage memberships (pending queue, promote/demote, remove) via membership RPCs and `gm_*` policies.
  - **Super Admin:**
    - All of the above, plus permanent deletion via `delete_group_secure`.

- **Constraints:**
  - RLS policies such as `groups_delete_super_admin_only` and `gm_delete_admin` ensure that only platform admins or group admins can perform sensitive operations.

---

## 3. Alumni – Desired vs Current Behavior

This section focuses on **Alumni** to compare intended contract vs what the current implementation actually does.

### 3.1 Desired behavior (Alumni)

For a user whose effective role is `alumni`:

- **D1 – Visibility**
  - D1.1: On `/groups`, sees:
    - All **public, approved, non-archived** groups the RLS layer exposes.
    - Any private groups where they are already a member.
    - Clear visual chips for: Public/Private, Alumni only, Archived, Approval status (for creators/admins).
  - D1.2: On `/groups/:id`, can view:
    - Any public, approved, non-archived group.
    - Private groups only if they are a member (or site admin).
  - D1.3: On dashboard, My Groups Widget (S8) and My Groups strip (S2) clearly separate **Active**, **Pending invitation**, and **Archived** states.

- **D2 – Actions**
  - D2.1: Join flows:
    - Can **Join** public, approved, non-archived groups where `alumni_only` is either false or true (alumni allowed in both).
    - For private groups, either:
      - **Request to Join** (creating a `group_memberships` row with `status = 'pending'`), or
      - Accept an explicit **Invitation** (also from `group_memberships` → `group_members`).
  - D2.2: Manage flows (for alumni who are group admins or creators):
    - Approve/reject join requests from `group_memberships`.
    - Invite members by email (RPC-based, with RLS ensuring they target valid users only).
    - Toggle Alumni-only and privacy, respecting that alumni-only groups exclude students from joining.
    - Archive groups they manage, but **not** hard delete (reserved for platform-level roles).
  - D2.3: Account approval constraint:
    - Alumni whose profiles are **not yet fully approved** can browse groups but cannot create or join; server-side RLS (e.g., `fc_is_fully_approved`) enforces this regardless of UI.

- **D3 – Constraints & safety**
  - D3.1: Employers are never allowed to join groups; any employer-specific members are added only via admin pathways and enforced by RPC guards.
  - D3.2: Last-admin safety: a group should always have at least one admin; leaving/removal operations must be blocked if they would remove the final admin.
  - D3.3: All membership writes go through RPCs (`join_group`, `approve_group_member`, `remove_member`, `leave_group` etc.), not direct `INSERT`/`UPDATE` from the client.

### 3.2 Current implementation (from code)

Based on:

- `frontend/src/components/Groups/GroupsList.js`
- `frontend/src/components/Groups/GroupDetail.js`
- `frontend/src/components/Groups/CreateGroup.js`
- `frontend/src/components/Dashboard/MyGroupsWidget.jsx`
- `frontend/src/pages/GroupManage.jsx`
- `frontend/src/pages/AdminGroupsPage.jsx`
- `frontend/src/utils/acl.js`, `frontend/src/utils/supabase.js`, `frontend/src/api/groups.ts`
- `supabase/migrations/20241209_groups_clean_slate_rls.sql`

**C1 – Visibility logic**

- C1.1: List visibility is driven by `list_groups_for_current_user_paged` RPC; fallback query reads from `groups` with filters on `is_approved`, `is_archived`, `is_private`. Employers are blocked at the UI level from `/groups`.
- C1.2: GroupDetail fetches a single `groups` row plus creator profile and separately counts members via `group_members` and `group_memberships` helpers.
- C1.3: Private groups in `GroupDetail` are explicitly blocked for non-members (except site admins), via a guard that returns an Access Denied card.
- C1.4: Alumni-only groups are surfaced via `group.alumni_only === true` or `tags` containing `'alumni-only'`, and enforced client-side in `canJoinGroup` (students blocked, alumni allowed).

**C2 – Join / membership logic**

- C2.1: `canJoinGroup(group, role, isMember)` prevents joining when:
  - Already a member.
  - Role is employer.
  - Group is archived.
  - Group is rejected or not yet approved.
  - Group is alumni_only and role is student.
- C2.2: In `GroupsList`, the CTA state for each group is computed from:
  - `isMember` and `isGroupAdmin` from `membershipMap`.
  - `hasPendingRequest` from membership map flags.
  - `isUserApproved` from `useApproval` (marked as "Approval required" when false).
  - `getGroupStatus(group)` to surface pending/approved/rejected/archived chips.
- C2.3: `handleJoinLeave` in `GroupsList` always uses `joinGroupRpc` (which calls `join_group`) and `leaveGroupRpc` (which calls `leave_group`); it also updates local membership state and shows feedback banners.
- C2.4: In `GroupDetail`, membership actions go through:
  - `joinGroupRpc` to join a group (public; private join attempts for non-members are rejected with a clear message about invite-only).
  - `leaveGroupRpc` with a **pre-check** for last-admin safety via a `group_members` count query.
  - `withdrawJoinRequest` for pending join requests in `group_memberships`.

**C3 – Creation & admin logic**

- C3.1: `CreateGroup` uses `canCreateGroup(userRole)` to gate the UI and relies on `createGroup` RPC (`create_group_and_add_admin`) plus `guardEmployers` to enforce server-side constraints.
- C3.2: `GroupManage` and `AdminGroupsPage` use RPCs (`approve_group`, `reject_group`, `archive_group`, `delete_group_secure`) to mutate group status and rely on the RLS rules summarized in `20241209_groups_clean_slate_rls.sql`.
- C3.3: Membership admin flows (approve/reject pending, invite by email, promote/demote, remove) are fully RPC-based and do not write to `group_members` / `group_memberships` directly from the frontend.

**C4 – Account approval integration**

- C4.1: `GroupsList` uses `useApproval()` to compute `isUserApproved`; when `false`, the CTA label becomes **Approval required** and the button is disabled.
- C4.2: `GroupDetail` checks `!isUserApproved` before allowing a non-member to join, returning a descriptive error.
- C4.3: `CreateGroup` currently does **not** consult `useApproval`; it only checks `canCreateGroup(userRole)`. Any approval gating for creation is expected to be enforced in `g_insert_creator` RLS or `create_group_and_add_admin`.

### 3.3 Alignment (Alumni: desired vs current)

- **A1 – Visibility**
  - A1.1: Alumni see public, approved, non-archived groups from the RPC, plus any groups where they are members; private groups remain hidden until they join. This matches D1.1/D1.2 at a high level.
  - A1.2: Alumni-only flag is surfaced via `alumni_only` column and tags, and enforced at join-time via `canJoinGroup`, matching D1.1 (students are blocked; alumni are allowed).

- **A2 – Actions**
  - A2.1: All stateful membership changes (join, leave, approve, reject, invite) go through RPCs and are protected by RLS, aligning with D2.3 and D3.3.
  - A2.2: Group admins and site admins can approve/reject groups and archive them using admin pages, matching D2.2 for admin-level alumni.
  - A2.3: Last-admin safety is checked client-side in `GroupDetail` before calling `leaveGroupRpc`, and the DB-level `leave_group` logic also enforces constraints; this aligns with D3.2.

- **A3 – Account approval**
  - A3.1: Join CTAs in both `GroupsList` and `GroupDetail` respect `isUserApproved` and block unapproved alumni from joining groups, aligning with D3.1.

### 3.4 Open questions / potential gaps

These are **not confirmed bugs**, but areas to validate against the contract and DB/RLS.

- **G1 – Creation vs approval**
  - Observation: `CreateGroup` gates only on `canCreateGroup(userRole)` and not on `isUserApproved`.
  - Question: Should unapproved alumni be permitted to create groups, or should creation also require full approval (like `gm_insert_self_public` demands for joining)?
  - Action: Confirm `g_insert_creator` and/or `create_group_and_add_admin` behavior; if they already require `fc_is_fully_approved`, the frontend is just optimistic UI.

- **G2 – Private group join UX**
  - Observation: `GroupsList` uses a **Request to Join** label for private groups but still routes through the same `joinGroupRpc` path; `GroupDetail` is more explicit about private groups being invite-only.
  - Question: Is `join_group` intended to create a pending `group_memberships` row for private groups and never auto-activate membership? If so, ensure the My Groups Widget and membership map distinguish clearly between **pending request** and **invitation pending** for alumni.

- **G3 – Employer edge cases**
  - Observation: Employers are blocked from `/groups` and from calling membership RPCs via `guardEmployers`, but admin flows (e.g., `invite_member_by_email`) can theoretically add any user, including an employer, into `group_members`.
  - Question: Is it acceptable for employers to appear as group members under controlled admin actions, or should `invite_member_by_email` enforce role checks server-side?

- **G4 – Alumni-only enforcement depth**
  - Observation: Alumni-only is enforced in `canJoinGroup` and surfaced in UI; the RLS comment in `gm_insert_self_public` mentions `fc_is_fully_approved` but not explicitly alumni-only.
  - Action: Confirm that `join_group` and `gm_insert_*` policies also enforce alumni-only at the DB level and do not rely solely on the frontend ACL helper.

---

## 4. How to Use This Document

- **Product & UX:**
  - Treat sections 1–2 as the canonical definition of how Groups/Chapters should behave per role, including what states (public/private, alumni-only, archived, pending) are visible and what CTAs appear.
  - Use section 3 as a focused checklist when refining the Alumni experience before launch.

- **Frontend:**
  - When refactoring `GroupsList`, `GroupDetail`, `CreateGroup`, `MyGroupsWidget`, or `GroupManage`, keep this spec in sync. All membership mutations should continue to flow through RPCs, not direct table writes.
  - Ensure that account approval (`useApproval`) and `canJoinGroup` remain the single sources of truth for CTA enablement, and avoid duplicating join rules in multiple places.

- **Backend & RLS:**
  - Use the data sources and listed RPCs to audit the SQL definitions of `join_group`, `leave_group`, `create_group_and_add_admin`, membership approval RPCs, and the RLS policies summarized in `20241209_groups_clean_slate_rls.sql`.
  - Validate that alumni-only, employer blocking, full-approval checks, and last-admin safety are all enforced at the database layer, not just in JS.

- **QA:**
  - Use section 3 (Alumni desired vs current) as the starting point for role-based test plans of the Groups/Chapters module.
  - Add analogous checklists for Students, Employers, and Admin/Super Admin once Alumni behavior is stable, mirroring the structure here (Visibility, Actions, Constraints).
