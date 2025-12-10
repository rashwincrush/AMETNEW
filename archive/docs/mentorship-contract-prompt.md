# Prompt: Mentorship Contract Spec

```text
You are my product+engineering spec assistant for this codebase.

Task: For the feature/module **Mentorship** (entry points: `frontend/src/components/Mentorship/Mentorship.js`, `MentorshipHub.jsx`, `MentorshipDashboard.js`, `MentorshipDirectory.js`, `MentorshipRequestsDashboard.js`, `MentorshipChat.js`, etc.), produce a **single Markdown spec** at the same depth and structure as `archive/docs/dashboard-contract.md`.

Follow this structure exactly:

0. **Scope & Overview**
   - What the Mentorship feature does: discover mentors, request mentorship, manage mentor/mentee relationships, chat, manage availability and capacity, handle approvals.
   - Where it lives (key components, routes such as `/mentorship`, `/mentorship/requests`, `/mentorship/chat/:id`, etc.).
   - Which user roles it affects: student, alumni, employer, admin, super_admin (with alumni as primary mentors/mentees).

1. **Section / Unit Matrix (Canonical Contract)**
   - Identify key mentorship UI/flow sections: status banners, find mentors panel, mentor directory cards, mentorship requests list, active relationships list, mentorship chat, settings/availability, admin approvals, etc.
   - For each section, build a row with:
     - ID (S1, S2, …)
     - Section name
     - Description / purpose
     - Frontend data source (hooks, context, props)
     - Backend objects / RPCs / tables (e.g., `mentorship_requests`, `mentorship_relationships`, any mentorship views/RPCs, `profiles` fields like `is_available_for_mentorship`)
     - Primary routes it links to
     - Role gating (student / alumni / employer / admin / super_admin – who can see/use it).

2. **Role Views**
   - For `student`, `alumni`, `employer`, `admin_or_super_admin`:
     - What Mentorship sections they see.
     - What they can do: request mentorship, accept/decline requests, manage capacity, toggle availability, chat, view history, moderate/report issues, approve mentors, etc.
     - How approval state and profile fields (e.g., `is_available_for_mentorship`) influence what they can do.

3. **Alumni – Desired vs Current Behavior**
   - Focus the gap analysis on **alumni** (key mentor persona, possibly mentee too).
   - 3.1 **Desired behavior** for alumni:
     - Visibility: see mentorship hub, status banners, settings, and their relationships/requests appropriately.
     - Actions: become a mentor, toggle availability, accept/decline mentee requests, manage mentee list, chat with active mentees, request mentorship from other mentors (where allowed).
     - Constraints: capacity, approval status, RLS expectations (only see their own mentees/requests, not others').
   - 3.2 **Current implementation**:
     - What the code currently does for alumni across the mentorship components and related RPCs.
   - 3.3 **Alignment**:
     - Where current behavior matches the desired alumni mentorship contract.
   - 3.4 **Open questions / gaps**:
     - E.g., enforcement of capacity limits, double requests, chat write permissions when relationships are closed/pending, admin override paths.

4. **How to Use This Document**
   - Notes for Product/UX, Frontend, Backend/RLS, QA on treating this as the canonical Mentorship contract.

Constraints / style:
- Ground everything in actual code.
- Be explicit about mentorship-related tables/RPCs (`mentorship_requests`, `mentorship_relationships`, status fields, RLS expectations).
- Call out role and state-based gating clearly (pending vs approved, mentor vs mentee).
- Output as a single Markdown file for `archive/docs/mentorship-contract.md`.
```
