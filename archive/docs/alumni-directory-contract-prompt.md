# Prompt: Alumni Directory Contract Spec

```text
You are my product+engineering spec assistant for this codebase.

Task: For the feature/module **Alumni Directory** (entry point: `frontend/src/components/Directory/DirectoryPage.jsx` and `frontend/src/components/Directory/AlumniDirectory.js`), produce a **single Markdown spec** at the same depth and structure as `archive/docs/dashboard-contract.md`.

Follow this structure exactly:

0. **Scope & Overview**
   - What this feature does in plain language.
   - Where it lives (files, routes, main components/hooks).
   - Which user roles it affects: student, alumni, employer, admin, super_admin.

1. **Section / Unit Matrix (Canonical Contract)**
   - Treat each visually or logically distinct block of the Alumni Directory experience as a section.
     - Examples: filters/search bar, results grid, directory cards, profile preview, pagination/empty state, role-specific banners, etc.
   - For each section, build a table with **one row per section** and at least these columns:
     - ID (S1, S2, …)
     - Section name
     - Description / purpose
     - Frontend data source (hooks, context, props)
     - Backend objects / RPCs / tables it touches (e.g., `profiles`, any views, search RPCs)
     - Primary routes it links to (if any)
     - Role gating (who sees it: student / alumni / employer / admin / super_admin).

2. **Role Views**
   - For each relevant role (at minimum: `student`, `alumni`, `employer`, `admin_or_super_admin`):
     - What sections they see (mapping to S1, S2, …).
     - What they can do from Alumni Directory (navigation + actions: searching, filtering, viewing profiles, sending connection requests, messaging, etc.).
     - Any important differences vs other roles (visibility, capabilities, constraints, data they can or cannot see).

3. **Student – Desired vs Current Behavior**
   - Focus the gap analysis on the **student** role.
   - 3.1 **Desired behavior** for students in Alumni Directory:
     - Visibility (which sections they should see & when).
     - Actions (what they should be able to do end-to-end: search, view limited profile fields, request connections, etc.).
     - Constraints (approval state, privacy expectations, security/RLS expectations: which profile fields are visible to students, which are hidden).
   - 3.2 **Current implementation**:
     - What the code actually does today for students (based on real components, hooks, RPCs, RLS assumptions).
   - 3.3 **Alignment**:
     - Where current behavior matches the desired contract.
   - 3.4 **Open questions / gaps**:
     - Specific questions or risks to validate (e.g., profile visibility by role, RLS scope on `profiles` or directory views, safe search parameters, pagination limits).
     - Phrase them like G1, G2, … with concrete follow-up actions.

4. **How to Use This Document**
   - Short notes for Product/UX, Frontend, Backend/RLS, and QA on how to treat this as the Alumni Directory contract.

Constraints / style:
- Work **only from the actual code in this repo**, not generic assumptions.
- Be explicit about **data sources and backend dependencies** (RPC names, table/view names, any search indexes).
- Make role gating and permissions **very concrete**, especially around profile visibility and contact actions.
- Output should be a single Markdown document I can drop into `archive/docs/alumni-directory-contract.md` without further editing.
```
