# Prompt: Messages Contract Spec

```text
You are my product+engineering spec assistant for this codebase.

Task: For the feature/module **Messages** (entry points: `frontend/src/components/Messages/Messages.js` and related message/conversation components), produce a **single Markdown spec** at the same depth and structure as `archive/docs/dashboard-contract.md`.

Follow this structure exactly:

0. **Scope & Overview**
   - What the Messages feature does: 1:1 or group messaging between users, conversation list, message view, composing/sending, read-only vs writable states, lockouts.
   - Where it lives (components under `frontend/src/components/Messages/*`, any shared messaging utilities/hooks, routes like `/messages`, `/messages/:conversationId`).
   - Which user roles it affects: student, alumni, employer, admin, super_admin.

1. **Section / Unit Matrix (Canonical Contract)**
   - Treat each key messaging piece as a section: conversations list, search/filter, active conversation header, message list, message composer, empty states, lock banners (e.g., when messaging is disabled), role-based restrictions (mentorship-only, connection-only, etc.).
   - For each section, create a row with:
     - ID (S1, S2, …)
     - Section name
     - Description / purpose
     - Frontend data source (hooks, context, props, Supabase realtime usage)
     - Backend objects / RPCs / tables (e.g., `conversations`, `conversation_participants`, `messages`, any RPCs for creating conversations or sending messages)
     - Primary routes
     - Role gating (who can start conversations, who can reply, any special rules for employers/admins).

2. **Role Views**
   - For `student`, `alumni`, `employer`, `admin_or_super_admin`:
     - What they see in Messages.
     - What they can do: start conversations, reply, see message history, message mentors/employers, close/archive conversations, see system/notification threads.
     - Special constraints: e.g., whether messaging is allowed only after being connected, whether employers can message students freely, whether admins can see/moderate messages (and how RLS enforces privacy).

3. **Alumni – Desired vs Current Behavior**
   - Focus the gap analysis on **alumni**.
   - 3.1 **Desired behavior** for alumni:
     - Visibility: see conversations they participate in, see counterpart identity correctly, clearly see if messaging is locked (e.g., blocked, closed, or read-only mentorship chat).
     - Actions: start new conversations where allowed, reply, see read-only state where appropriate (e.g. closed mentorship), no access to messages between other users.
     - Constraints: connection/relationship requirements, mentorship constraints, RLS that strictly scopes messages/conversations by participant.
   - 3.2 **Current implementation**:
     - What the Messages components and Supabase utilities actually do for alumni today (conversation fetching, sending, realtime, permission checks).
   - 3.3 **Alignment**:
     - Where current behavior matches the desired alumni messaging contract.
   - 3.4 **Open questions / gaps**:
     - E.g., what prevents users from messaging arbitrary users (IDOR risks), how blocked users are handled, how mentorship chat is restricted, how admin access is safely implemented.

4. **How to Use This Document**
   - Notes for Product/UX, Frontend, Backend/RLS, QA on treating this as the canonical Messages contract.

Constraints / style:
- Base everything on real code and existing schema/RPCs.
- Be explicit about `conversations`, `conversation_participants`, and `messages` tables/RPCs and RLS.
- Highlight security/privacy expectations clearly (no unauthorized message access, no leaking of other users' conversations).
- Output as a single Markdown file for `archive/docs/messages-contract.md`.
```
