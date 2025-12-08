# Groups Module – OPIB-∞ Full Analysis Report

> Scope: Analyze and harden the **Groups** module based on the “FINAL GROUPS MODULE REQUIREMENTS (Updated & Correct Version)” you provided.
> Mode: **Tighten / Fix / Harden / Complete only** – no new sub-features beyond the spec.

---

## 0. 10-LINE EXECUTIVE SUMMARY (CEO)

Problem → Alumni and students need safe, moderated topic-based communities without employers mixing into peer spaces.  
Users → Alumni, students, and platform staff (admin/super_admin) managing group visibility, safety, and abuse.  
Need → Clear rules for group creation, visibility, invites, and moderation with strict employer exclusion and role-aware UX.  
Why Now → Existing implementation is partial: invites work locally, notifications/RLS/employer isolation are not fully wired.  
Solution → A hardened Groups module with role- and visibility-aware FE, RPC-backed membership + invites, and strict Supabase RLS.  
Architecture → React frontend + Supabase RPCs + groups/members/invitations tables, with enum-driven status/visibility and bell notifications.  
Value → Safe communities, predictable moderation, no employer cross-contamination, and auditability for admins.  
Risks → RLS gaps, incorrect role checks, private-group leaks, employer exposure, and broken last-admin or delete flows.  
Metrics → Group creation approvals, join/participation rates, invite acceptance, private-group leak incidents, abuse reports, and admin actions.  
Next Steps → Implement RPCs, enforce RLS + employer exclusion, wire all bell notifications, and align FE flows/UI states with the final spec.

---

## 1. MULTI-PERSONA DEEP SCAN (14+ LENSES)

### 1.1 Product Manager
- **What they see**: Clear spec with strong role separation, public/private semantics, alumni-only rule, and admin hierarchy.  
- **What breaks**: If FE/BE diverge from rules (e.g., students creating groups, employers visible in search, private groups leaked).  
- **Concerns**: Spec drift, inconsistent behaviors across surfaces (directory vs direct link vs notifications), lack of metrics.  
- **Must-not-fail**: Employer exclusion; private-group invisibility; alumni-only enforcement; admin seeing everything.

### 1.2 Business / Monetization
- **What they see**: Engagement driver (groups) and brand risk surface (abuse, spam, employer confusion).  
- **What breaks**: If employers accidentally access groups, or moderation is too weak/too strong causing churn.  
- **Concerns**: Legal/compliance for content, reputational harm from unmoderated posts, friction on approvals.  
- **Must-not-fail**: No employer in groups; admin tools sufficient to act quickly.

### 1.3 UX Designer
- **What they see**: Well-defined flows: discovery, join, invite, view-only public, private 403, admin console.  
- **What breaks**: Confusing states (e.g., join disabled but no explanation, invite actions hidden, 403 with no context).  
- **Concerns**: Role-based differences being surprising (student vs alumni vs employer), clarity on alumni-only chips and disabled CTAs.  
- **Must-not-fail**: Clear messaging for every disabled action; graceful 403/404; no dead-ends.

### 1.4 UX Writer
- **What they see**: Several key texts: “Join the group to participate”, private-group 403, alumni-only restriction, invite notifications.  
- **What breaks**: Inconsistent wording across pages (Groups home vs Notifications vs group detail), techy 403 errors not localized.  
- **Concerns**: Messages must be clear, short, and role-aware (e.g., “This group is only for alumni.”).  
- **Must-not-fail**: No ambiguous or misleading copy when actions are blocked.

### 1.5 Frontend Lead
- **What they see**: Multiple surfaces: directory, detail page, notifications, invites tab, admin groups list, role gating for employers.  
- **What breaks**: FE trusting local role or tags instead of backend; missing loading/empty/error states; direct .insert/.update bypassing RPCs.  
- **Concerns**: Keeping all role-visibility rules in shared helpers; removing every employer-facing Groups UI; avoiding inconsistent state.  
- **Must-not-fail**: FE never shows Groups to employers; FE does not expose private groups via search/URL.

### 1.6 Backend/API Lead
- **What they see**: RPC set (join_group_public, invite_member_to_group, accept_group_invite, reject_group_invite, approve_group, reject_group, archive_group, delete_group).  
- **What breaks**: Client bypassing RPC; missing ownership checks; weak enums/constraints; ambiguous error codes.  
- **Concerns**: Ensuring each RPC validates role, group visibility, alumni-only, and membership status; avoiding race conditions.  
- **Must-not-fail**: All writes go through RPCs with strict validation and consistent 4xx/5xx responses.

### 1.7 DB / Supabase / Postgres Architect
- **What they see**: Tables: groups, group_members, group_invitations, posts/comments (or equivalent), enums for visibility/status/types.  
- **What breaks**: Missing NOT NULLs, missing FKs, lack of composite uniques (e.g., one membership per user/group), no ON DELETE behavior.  
- **Concerns**: Orphaned members/invites on group delete; mismatched tenant/role policies; missing indexes on group_id+user_id.  
- **Must-not-fail**: Strong relational integrity; safe cascade behavior; clear status enums.

### 1.8 RLS / Security Engineer
- **What they see**: Complex RLS: public vs private groups; admins vs members; employer exclusion; notifications access.  
- **What breaks**: Private groups accidentally visible; invites readable by non-invitees; group posts readable by employers/admin bypass errors.  
- **Concerns**: `auth.role()` vs profile-based roles; mapping of admin/super_admin; ensuring RLS matches spec exactly.  
- **Must-not-fail**: No data leak from private groups; employers blocked at every table.

### 1.9 QA / SDET
- **What they see**: Many combinations: role × group type × membership × alumni-only flag × status × direct URL vs navigation.  
- **What breaks**: Edge-case leaks (direct URL to private group, old invite after role change, last-admin leaving).  
- **Concerns**: Regression risk across modules (notifications, directory, profile); test coverage across RPC and RLS.  
- **Must-not-fail**: Comprehensive test matrix including employers and partial states.

### 1.10 AppSec Analyst
- **What they see**: High-risk surfaces: content, membership, invites, admin actions, RLS.  
- **What breaks**: IDOR on group_id, invite_id, membership_id; CSRF assumptions; token misuse; unbounded lists.  
- **Concerns**: Abuse via spam invites, scraping public groups, privilege escalation via RPCs.  
- **Must-not-fail**: Strong authN/authZ, rate-limited RPCs, no direct DB writes from untrusted FE.

### 1.11 DevOps / SRE
- **What they see**: Potential hotspots (groups feed, search, notifications, admin views), plus backup/restore for deletion/archive.  
- **What breaks**: Slow queries on groups/members/posts; noisy logs; unmonitored spikes in invites or abuse reports.  
- **Concerns**: Indexing on common patterns; resilience to partial Supabase outages; monitoring group operations.  
- **Must-not-fail**: No timeouts or degraded UX for core group flows.

### 1.12 Support / Success
- **What they see**: Tickets around “can’t join group”, “why can’t I see this group”, “employer got invited by mistake”, etc.  
- **What breaks**: No internal tooling to see group state, membership, and invites; confusing errors for end users.  
- **Concerns**: Ability to impersonate or view as user (without breaching privacy); clear admin logs.  
- **Must-not-fail**: Support can answer “why” for any access outcome.

### 1.13 Sales / Marketing
- **What they see**: Groups as proof of community health that can be showcased to institutions.  
- **What breaks**: Negative PR if employers leak into student/alumni spaces or private groups become searchable.  
- **Concerns**: Messaging alignment (“safe alumni-only communities”) with actual technical enforcement.  
- **Must-not-fail**: No contradiction between sales pitch and security reality.

### 1.14 Novice User (Student / Alumni)
- **What they see**: Simple “Groups” tab, list of public groups, alumni-only badges, join buttons, invites.  
- **What breaks**: Hidden logic (alumni-only) not clearly explained, random 403s, invites that don’t work or disappear.  
- **Concerns**: Understandable error messages; minimal friction to join correct groups.  
- **Must-not-fail**: Transparent reasons for disabled joins or invisible groups.

### 1.15 Power User (Community Leader)
- **What they see**: Group creation, admin tools (member management), invite flows, alumni-only semantics.  
- **What breaks**: Weak admin console, inability to moderate, poor feedback on archive/suspend.  
- **Concerns**: Reliability of notifications and membership; clarity on what admin vs platform admin can do.  
- **Must-not-fail**: Admin tools must be reliable and intuitive.

### 1.16 Platform Admin / Super Admin
- **What they see**: Global Groups overview; approvals, archive/suspend, and delete flows.  
- **What breaks**: Missing filters, inability to see private groups, or accidental permanent delete by non-super_admin.  
- **Concerns**: Last-super_admin safeguards, auditability of actions, performance of global lists.  
- **Must-not-fail**: Correct enforcement of actions per role; no lockout of all admins.

### 1.17 Founder
- **What they see**: Key retention feature with reputational and legal risk.  
- **What breaks**: Silent security gaps, unmoderated abuse, employers mixing into closed communities.  
- **Concerns**: Time-to-implement vs robustness; avoiding rework; auditability for institutions.  
- **Must-not-fail**: Build once correctly; no “rewrite groups” later due to foundational flaws.

---

## 2. GAP MATRIX (Logic / UX / FE / BE / DB / RLS / Security / Architecture)

> Note: This is relative to the **final spec vs a typical partially-implemented system** (your notes mention: invites working locally, notifications not wired, etc.).

| Layer        | Gaps Found (Likely / To Confirm)                                                                                                                      | Severity | Immediate Fix                                                                                             |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|----------|------------------------------------------------------------------------------------------------------------|
| Logic/PM    | Employer exclusion not enforced everywhere; alumni-only semantics possibly only tag-based; missing global admin listing and filters.                  | High     | Centralize role rules and alumni-only rules; design explicit admin Groups overview with filters.          |
| UX          | Incomplete states for: non-member public view, private 403, invites tab, employer-hidden UI, admin views.                                              | High     | Define and implement all state-specific UIs and messages per role and group type.                         |
| Frontend    | Local invite updates; possible direct Supabase inserts; role-based conditionals scattered; incomplete employer hiding.                                 | High     | Route all writes via RPC helpers; add shared role/visibility helpers; gate employer UI at layout level.  |
| Backend/API | Missing or partial RPCs (join_group_public, invite_member_to_group, etc.); weak validation on role/group visibility/alumni-only; inconsistent errors. | High     | Implement all RPCs with strict validation and consistent 400/401/403/409/500 semantics.                  |
| DB          | Potential missing NOT NULL, FKs, unique constraints on memberships/invites; unclear enums for status/visibility.                                      | High     | Add constraints, FKs, enums, and composite uniques; validate existing data prior to tightening.           |
| RLS         | Private-group visibility and employer exclusion not fully encoded; admin/super_admin bypass patterns unclear.                                         | Critical | Implement and test RLS policies per table per role; ensure employers have no access to groups data.       |
| Security    | Risk of IDOR on group_id/invite_id; potential info leak via search or 403 differences; no rate limiting on invites/joins.                             | High     | Enforce ownership in RPCs; normalize error messages; implement basic rate-limiting at API layer.         |
| QA          | No explicit test matrix for role × type × status; limited RLS integration tests; no regression coverage for notifications.                             | High     | Create detailed QA checklist and automated tests for core flows including negative cases.                 |
| Architecture| Tight coupling between FE and direct Supabase tables; no dedicated groups service module; notifications hard-wired per module.                         | Medium   | Introduce a Groups service layer (FE + BE) and standardized notification helper tied to `module: groups`. |

---

## 3. PRODUCT MANAGER (PM) LOGIC MAP

### 3.1 Rules & Roles

- **Core Rule**: Groups exist only for **alumni and students**. Employers are completely excluded at all levels.  
- **Group Types**: `public` and `private`.  
- **Statuses**: At least `pending_approval`, `approved`, `rejected`, `archived/suspended`.  
- **Roles inside Groups**: `owner`, `admin`, `member`.  
- **Platform Roles**: `alumni`, `student`, `employer`, `admin`, `super_admin` (from auth/profile).

### 3.2 Jobs To Be Done (JTBD)

- **Alumni**: Discover relevant communities; create and manage groups; mentor students; network.  
- **Students**: Join relevant groups; learn from alumni; read content (especially public alumni-only).  
- **Admin/Super Admin**: Approve/reject groups; moderate content; ensure safety; act on abuse.  
- **System**: Enforce visibility/role rules consistently; prevent employer intrusion.

### 3.3 Flow: Entry → Goal → Exit

1. **Group Discovery (Public)**  
   - Entry: User clicks `Groups` tab.  
   - Goal: See list of public groups (filtered by role/alumni-only rules).  
   - Exit: User joins group or bookmarks it.

2. **Group Creation (Alumni Only)**  
   - Entry: Alumni clicks `Create Group`.  
   - Goal: Submit group with name, description, visibility, tags, cover; status `pending_approval`.  
   - Exit: Confirmation + bell notification when group is approved/rejected.

3. **Invite Flow**  
   - Entry: Group member or admin clicks `Invite`.  
   - Goal: Invite alumni/students to group; they receive bell notification and can accept/reject.  
   - Exit: Invitee becomes member or permanently rejects.

4. **Join Public Group (Non-member)**  
   - Entry: User on public group detail page.  
   - Goal: Click `Join`; become member instantly if role allowed.  
   - Exit: UI updates to member view with posting enabled.

5. **Private Group Access**  
   - Entry: Invite link or notification.  
   - Goal: Accept invite to gain full access; or reject.  
   - Exit: Membership created or invite marked rejected; direct URL 403 for non-members.

6. **Admin Moderation**  
   - Entry: Admin `Groups` tab.  
   - Goal: Review pending groups, statuses, visibility, and take actions.  
   - Exit: Groups are approved/rejected/archived with clear logs.

### 3.4 Constraints (Must / Should / Could)

| Area                     | Must                                                                                                  | Should                                                                                  | Could (not now)                          |
|--------------------------|-------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|------------------------------------------|
| Employer Exclusion       | Employers never see or access any groups UI or data.                                                 | Employer directory search excludes groups entirely.                                    | N/A                                      |
| Private Group Visibility | Private groups never appear in discovery/search; only via invite or membership.                      | Error messages for 403 are friendly and localized.                                     | N/A                                      |
| Alumni-only Rule         | Students cannot join alumni-only groups; may read public alumni-only groups; no access to private.   | Clear badge and tooltip explain alumni-only behavior.                                  | More granular rules by batch/role.       |
| Group Creation           | Only alumni can create; pending approval; only admin/super_admin approve/reject.                     | Creator notified on decision.                                                          | Multi-owner from day one.                |
| Membership               | Exactly one membership per user/group; last admin cannot leave.                                      | UI gently guides admin to assign new admin before leaving.                             | Bulk membership uploads (future).        |
| Invites & Notifications  | Invites recorded in `group_invitations` and bell notifications always created.                       | Optional notification on acceptance to inviter/admin.                                  | Digest emails (future).                  |
| Admin Visibility         | Admin/super_admin see all groups, members, invites, posts (for moderation).                          | Filters and search in admin UI.                                                        | Export CSV (future).                     |
| Recent Activity          | Groups must NOT appear in "Recent Activity".                                                        | N/A                                                                                     | N/A                                      |

---

## 4. UX/UI AUDIT

### 4.1 User Journeys & Drop-offs

- **Discovery**: Students/alumni must clearly see which groups they can join vs read-only vs hidden.  
- **Creation**: Alumni-only CTA; explicit note that group needs admin approval.  
- **Invites**: Bell notifications + Groups “Invitations” tab; must prevent confusion about status (pending/accepted/rejected/expired).  
- **Private Groups**: Only appear via invite or membership; direct 403 with helpful copy.

### 4.2 Navigation & States

- **Tabs/Pages**:  
  - Groups home (list).  
  - Group detail page (public/private).  
  - Invitations subview/tab.  
  - Admin Groups dashboard.  
- **Back/Cancel**: Group creation/edit flows must have clear cancel/back; invites acceptance can go back to group list or dashboard.

### 4.3 CTAs & Messages (Key Ones)

- **Public non-member**:  
  - CTA: `Join group`.  
  - Message: `Join the group to participate.`; composer disabled; reactions/comments disabled.  
- **Alumni-only public for students**:  
  - Disabled `Join` with message: `This group is only for alumni.`  
- **Private unauthorized**:  
  - Page: `You don’t have access to this group.` (403), no extra metadata leakage.  
- **Employers**: No Groups tab; no related CTAs.

### 4.4 UI State Completeness

For each major view (directory, detail, invitations, admin list), ensure:

- **Loading**: Skeleton/spinner.  
- **Empty**: Friendly `No groups yet` / `No invitations` states.  
- **Error**: Short message + retry.  
- **Role-based**: Different empty states for employers (should be full suppression, not empty state).

### 4.5 Accessibility & Mobile

- Use semantic headings and ARIA labels for group cards and invites.  
- Ensure all CTAs are accessible via keyboard and screen readers.  
- Make disabled-but-visible CTAs clearly disabled, with accessible explanation (e.g., tooltip or aria-describedby).  
- Feed and admin views must be mobile-friendly (single-column, sticky joins/filters where needed).

---

## 5. FRONTEND ENGINEERING AUDIT

### 5.1 Unsafe Writes & Direct Inserts

- **Risk**: Components using `supabase.from('group_members').insert(...)` or similar direct writes.  
- **Action**:  
  - Introduce a centralized `groups` API client (e.g., `frontend/src/api/groups.js`) that only calls RPCs.  
  - Replace all direct inserts/updates (create group, join, invite, accept/reject, archive/delete) with RPC calls.

### 5.2 Role & Visibility Logic

- **Risk**: Role checks scattered: `if (user.role === 'alumni')` vs `profile.is_employer`, etc.  
- **Action**:  
  - Create shared helpers: `isAlumni`, `isStudent`, `isEmployer`, `isAdmin`, `isSuperAdmin`, `canSeeGroups`, `canCreateGroups`, `canJoinGroup`.  
  - Apply them consistently in Groups UI and navigation.

### 5.3 Stale State / useEffect

- Ensure subscription and fetch hooks (e.g., useGroupsList, useGroupDetails, useGroupInvites) correctly specify deps.  
- Avoid updating local state optimistically without confirming RPC success, especially for membership/invite status.

### 5.4 UI States & Error Handling

- All actions (join, invite, accept, reject, admin actions) should show **loading indicators**, handle **error messages**, and **retry** options.  
- Error surfaces should be user-friendly while logging enough technical details for debugging (without PII).

### 5.5 Employer UI Exclusion

- At layout/router level, hide `Groups` navigation entirely for employers.  
- Guard any deep links (e.g., if employer manually types `/groups`) to redirect or show simple `Groups are only available to alumni and students` page, without loading sensitive data.

### 5.6 Realtime / Staleness

- Optionally, use realtime subscriptions on `group_members` and `group_invitations` to update membership count and invite lists.  
- Ensure unsubscribes are correct; stale subscriptions should not leak data or cause memory leaks.

---

## 6. BACKEND/API AUDIT

### 6.1 Required RPCs (Behavioral Summary)

- `join_group_public(group_id)`  
  - Auth required.  
  - Validates: user is alumni or student; group is public & approved; not alumni-only for students; not already member.  
  - Inserts into `group_members`.  
  - Returns 200-equivalent with membership data; 403 on role/visibility violation; 409 on already member.

- `invite_member_to_group(group_id, target_user_id)`  
  - Auth required; caller must be current member (alumni/student) or group owner/admin.  
  - Validates: target is alumni/student; not employer; not already member; no duplicate pending invite.  
  - Inserts invite + creates `group_invite_received` notification.

- `accept_group_invite(invite_id)`  
  - Auth required; invitee must match.  
  - Validates invite status; group still active; role eligibility.  
  - Creates membership; marks invite accepted; optional `group_invite_accepted` notification.

- `reject_group_invite(invite_id)`  
  - Auth required; invitee must match.  
  - Marks invite rejected; no membership created.

- `approve_group(group_id)` / `reject_group(group_id)`  
  - **Admin-only RPCs**; enforces platform role.  
  - Updates status; triggers `group_approved` or `group_rejected` notification to creator.

- `archive_group(group_id)`  
  - Admin-only; marks group archived and potentially soft-hides from standard lists.  

- `delete_group(group_id)`  
  - Super_admin-only.  
  - Performs controlled cascade deletes and storage cleanup consistent with legal/retention requirements.

### 6.2 Validation & Errors

- Use **consistent patterns**:  
  - 400: malformed input.  
  - 401: unauthenticated.  
  - 403: role/visibility violation (employer, alumni-only, private access).  
  - 404: group/invite not found or not visible.  
  - 409: conflict (already member, duplicate invite; last-admin leaving).  
  - 500: unexpected server error.

---

## 7. DATABASE + SUPABASE RLS SCAN

### 7.1 Schema Integrity

- **Groups Table**  
  - Must have: `id`, `name`, `description`, `visibility (enum: public/private)`, `status (enum)`, `owner_id`, `created_at`, `updated_at`, optional `cover_image_url`, `tags`, `alumni_only (bool)` if coded explicitly.  
  - Constraints: `name` NOT NULL; `visibility` NOT NULL; `status` NOT NULL; `owner_id` FK → profiles/users.

- **Group Members**  
  - Must have: `id`, `group_id`, `user_id`, `role (enum: owner/admin/member)`, `created_at`.  
  - Constraints: FKs on `group_id` and `user_id`; **UNIQUE (group_id, user_id)**; CHECK role in enum.

- **Group Invitations**  
  - Must have: `id`, `group_id`, `inviter_id`, `invitee_id`, `status (pending/accepted/rejected/cancelled)`, `created_at`.  
  - Constraints: FKs; UNIQUE partial on `(group_id, invitee_id)` where status = 'pending'.

- **Notifications**  
  - `module` enum must include `groups`; payload JSON must be validated at least structurally at FE.

### 7.2 RLS Policies

- **Groups**  
  - Public groups: SELECT allowed for authenticated alumni/students.  
  - Private groups: SELECT only if user is member OR admin/super_admin.  
  - Employers: SELECT denied across the board.  
  - Admin/super_admin: bypass policies with dedicated role or `is_admin` flag.

- **Group Members**  
  - SELECT: allowed to group members; admin/super_admin global.  
  - INSERT/UPDATE/DELETE: disabled for anon; allowed only via RPCs (policies reference `auth.uid()` and function context).  

- **Group Invitations**  
  - SELECT:  
    - Invitee can see invites where `invitee_id = auth.uid()`.  
    - Group admins/owner can see invites for their group.  
  - INSERT: only for existing members (alumni/student) or group admins, with employer exclusion in policy/functions.  

- **Notifications**  
  - SELECT: `receiver_id = auth.uid()` or admin context where needed.  

### 7.3 Admin Bypass & Last Super Admin

- Use either:  
  - A dedicated `role` column on profiles or  
  - Supabase auth roles, plus RLS referencing a `is_admin`/`is_super_admin` boolean.  
- Ensure **last super_admin cannot be demoted or deleted** via general flows; treat outside Groups scope but critical for admin actions.

---

## 8. SECURITY & ABUSE ANALYSIS

### 8.1 Top Threats

- **IDOR**: Changing `group_id`/`invite_id` in URLs or RPC payloads to access other groups.  
- **Private Group Leaks**: Search index or notifications revealing titles/descriptions of private groups to non-members.  
- **Employer Data Access**: Misconfigured RLS letting employers query groups/posts.  
- **Spam Invites**: High-volume invites to many users; potential harassment.  
- **Abusive Content**: Posts/comments violating community rules with insufficient admin tooling.

### 8.2 Mitigations

- Enforce **ownership checks** in RPCs and RLS (always cross-check user_id and membership).  
- Normalize error messages; for sensitive resources use generic 404/403 without confirming existence of group.  
- Implement **rate-limiting** on invites and joins at API level (or via middleware / edge functions).  
- Provide robust admin tools for removal, archive, and delete actions with audit logging.

### 8.3 Early Warning Signals

- Spikes in invite volume per user/group.  
- Unusual query or error patterns against groups/notifications endpoints.  
- Multiple 403/404s from a single IP/tenant probing group IDs.

---

## 9. QA / SDET EDGE CASE SWEEP

Test combinations:

- **Roles**: alumni, student, employer, admin, super_admin.  
- **Group Types**: public vs private; alumni-only vs general.  
- **Statuses**: pending, approved, rejected, archived.  
- **Membership**: non-member, invited, member, admin, owner.

Key edge cases:

- Direct URL to private group by non-member.  
- Student trying to join alumni-only public group.  
- Employer trying any `/groups` route manually.  
- Invite accepted after group is archived or rejected.  
- Last admin attempting to leave group.  
- Notifications when group is approved/rejected while user offline.  
- Slow network during join or invite actions (duplicate submissions).  
- Expired tokens when accepting invite.

---

## 10. ARCHITECTURE & SRE REVIEW

- **Bottlenecks**: group directory queries, group feed queries, admin global list; must be paginated and indexed.  
- **Tight Coupling**: FE directly calling Supabase tables; needs abstraction via `groups` API helper and server-side RPC design.  
- **Modularity Risks**: Groups logic bleeding into unrelated modules (notifications, directory) without clear boundaries.  
- **Autoscaling/Logging**: Ensure RPC logs and errors are captured; monitor group-related events and failures.

---

## 11. SECURITY / PRIVACY / COMPLIANCE AUDIT

- **Access Control**: Strict employer ban; private groups protected by RLS + RPCs; admin/super_admin actions guarded by secure roles.  
- **Data Exposure**: No leakage of private group names or descriptions outside membership/invite/admin.  
- **Storage**: Group cover images in private/public buckets consistent with visibility; URLs signed where necessary.  
- **Tokens**: No group secrets or admin tokens exposed in frontend; Supabase service keys server-side only.  
- **GDPR / India DPDP 2023**:
  - Ability to delete or anonymize user data; group membership and posts might need anonymization flows (future).  
  - Ensure retention policies for logs and deleted groups are documented.  
- **Logging**: Avoid logging sensitive payloads; log IDs and role info only where necessary.

---

## 12. FIX LIST: SHIP / DON’T SHIP GATE

**Must Do Before Shipping**

1. Implement and enforce all required RPCs with strict role & visibility checks.  
2. Refactor FE to use only RPC-based helpers for groups, members, and invites.  
3. Implement full RLS policies on `groups`, `group_members`, `group_invitations`, and `notifications` to enforce employer exclusion and private-group rules.  
4. Implement full bell notification flows for `group_invite_received`, `group_invite_accepted (optional)`, `group_approved`, `group_rejected`.  
5. Hide all Groups UI for employers at navigation and route level.  
6. Ensure alumni-only rule is enforced across FE, RPCs, and RLS.  
7. Build and verify admin/super_admin Groups dashboard with full visibility and guardrails.  
8. Add core indexes, NOT NULLs, FKs, and UNIQUE constraints for groups, members, and invitations.  
9. Complete QA matrix and automated tests for all major flows and negative cases.  
10. Run a security/RLS test suite to confirm no private-group or employer leaks.

**Ship Gate**: Only ship when all above are DONE and validated in staging against the live schema.

---

## 13. 5 FOLLOW-UP TASK PROMPTS

1. **Gap Implementation Plan**  
   “Use OPIB-∞. Fix gaps in: Groups RPC layer and Supabase RLS policies.”

2. **Frontend Refactor**  
   “Use OPIB-∞. Fix gaps in: React Groups UI for role-based visibility and state handling.”

3. **Admin Console Hardening**  
   “Use OPIB-∞. Analyze: Admin & Super Admin Groups dashboard and moderation flows.”

4. **Security & Abuse Testing**  
   “Use OPIB-∞. Security scan for: Groups invitations, membership, and notifications abuse vectors.”

5. **End-to-End Verification**  
   “Use OPIB-∞. Audit end-to-end for: Groups lifecycle from creation → approval → membership → archive/delete.”
