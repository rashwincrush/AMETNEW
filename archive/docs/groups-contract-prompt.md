# Prompt: Groups/Chapters Contract Spec

```text
You are my product+engineering spec assistant for this codebase.

Task: For the feature/module **Groups/Chapters** (entry points: `frontend/src/components/Groups/GroupsList.js`, `GroupDetail.js`, `CreateGroup.js`, plus any supporting widgets like `MyGroupsWidget`), produce a **single Markdown spec** at the same depth and structure as `archive/docs/dashboard-contract.md`.

Follow this structure exactly:

0. **Scope & Overview**
   - What Groups/Chapters do: discover groups/chapters, request to join, accept/decline invitations, view group details and members, post/engage (if supported), admin/moderation behavior for groups.
   - Where it lives (main list/detail/create components and routes like `/groups`, `/groups/:id`, `/groups/create`).
   - Which user roles it affects: student, alumni, employer, admin, super_admin.

1. **Section / Unit Matrix (Canonical Contract)**
   - Identify major UI/flow parts: groups list, filters, create-group form, group detail header, membership state indicators (public/private, invitation pending, archived), membership actions (join, accept/decline invite), any content/feed sections, admin controls.
   - For each section, create a row with:
     - ID (S1, S2, …)
     - Section name
     - Description / purpose
     - Frontend data source (hooks, context, props)
     - Backend objects / RPCs / tables (e.g., `groups`, `group_members`, any group-invite or approval tables/RPCs)
     - Primary routes
     - Role gating (who can see/create/approve/manage groups by role).

2. **Role Views**
   - For `student`, `alumni`, `employer`, `admin_or_super_admin`:
     - What they see in Groups/Chapters.
     - What they can do: explore groups, request join, accept/decline invitations, leave groups, create groups/chapters, approve groups/members, archive groups, etc.
     - Specific role constraints (e.g., employers might be read-only or limited; admins/super_admin can approve/archive).

3. **Alumni – Desired vs Current Behavior**
   - Focus the gap analysis on **alumni**.
   - 3.1 **Desired behavior** for alumni:
     - Visibility: see public groups and relevant private groups/invites, see their joined groups, clearly see membership state (active, pending, archived).
     - Actions: request to join groups, accept/decline invitations, leave groups, possibly create new groups/chapters (if allowed), interact with group content.
     - Constraints: approval status, group visibility (public/private), invite only groups, RLS expectations on `groups` and `group_members`.
   - 3.2 **Current implementation**:
     - What the actual Groups components and related RPCs do for alumni today.
   - 3.3 **Alignment**:
     - Where current behavior matches the desired alumni groups contract.
   - 3.4 **Open questions / gaps**:
     - E.g., duplicate join requests, handling of archived groups, invitation flows, whether RLS correctly restricts group membership and visibility.

4. **How to Use This Document**
   - Notes for Product/UX, Frontend, Backend/RLS, QA on treating this as the canonical Groups/Chapters contract.

Constraints / style:
- Only use real code as ground truth.
- Be explicit about `groups`, `group_members`, and any invite/approval logic and RLS.
- Make role-based and membership-state-based gating explicit.
- Output as a single Markdown file for `archive/docs/groups-contract.md`.
```
