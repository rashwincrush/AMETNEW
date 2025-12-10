# Prompt: Events Contract Spec

```text
You are my product+engineering spec assistant for this codebase.

Task: For the feature/module **Events** (entry point: `frontend/src/components/Events/Events.js` and related event detail/create/edit components), produce a **single Markdown spec** at the same depth and structure as `archive/docs/dashboard-contract.md`.

Follow this structure exactly:

0. **Scope & Overview**
   - What the Events feature does (browse events, view details, RSVP, create/edit/manage events, feedback, moderation).
   - Where it lives (files, routes, main components/hooks like `Events.js`, `EventDetail(s).js`, `CreateEvent.js`, `EditEvent.js`, `EventFeedback*`, `EventModerationPanel.jsx`).
   - Which user roles it affects: student, alumni, employer, admin, super_admin.

1. **Section / Unit Matrix (Canonical Contract)**
   - Treat each distinct UI/flow piece as a section: events listing, filters, event detail header, schedule info, RSVP actions, feedback forms, admin moderation panels, etc.
   - For each section, build a table row with:
     - ID (S1, S2, …)
     - Section name
     - Description / purpose
     - Frontend data source (hooks, context, props)
     - Backend objects / RPCs / tables (e.g., `events`, `event_attendees`, feedback tables, moderation views/RPCs)
     - Primary routes it links to (e.g., `/events`, `/events/:id`, `/events/create`, `/events/:id/edit`, feedback dashboards)
     - Role gating (student / alumni / employer / admin / super_admin – who sees/uses what).

2. **Role Views**
   - For `student`, `alumni`, `employer`, `admin_or_super_admin`:
     - What sections they see in Events.
     - What they can do: RSVP, cancel RSVP, view event details, leave feedback, create events, edit/cancel events, moderate events, see feedback dashboards, etc.
     - Key per-role constraints (e.g., students cannot create events; employers may host specific types; admins/super_admin can moderate/close events).

3. **Alumni – Desired vs Current Behavior**
   - Focus the gap analysis on the **alumni** role (primary user for Events).
   - 3.1 **Desired behavior** for alumni:
     - Which event sections they should see and in which states (upcoming, past, cancelled).
     - What event actions they should have: RSVP, cancel, view event details, leave feedback, maybe create events if approved.
     - Constraints: approval state, capacity limits, RSVP windows, RLS expectations on `events` and `event_attendees`.
   - 3.2 **Current implementation**:
     - What the code currently does for alumni based on Events components and RPCs.
   - 3.3 **Alignment**:
     - Where current matches desired.
   - 3.4 **Open questions / gaps**:
     - E.g., RSVP double-submits, capacity overflows, RLS correctness (user can only see events they should), event visibility for pending/rejected users.

4. **How to Use This Document**
   - Notes for Product/UX, Frontend, Backend/RLS, QA on treating this as the canonical Events contract.

Constraints / style:
- Use only real code from this repo as ground truth.
- Be explicit about RPCs and tables (`events`, `event_attendees`, feedback/moderation tables).
- Call out all role-based differences (especially who can create/edit/moderate events).
- Output as a single Markdown file suited for `archive/docs/events-contract.md`.
```
