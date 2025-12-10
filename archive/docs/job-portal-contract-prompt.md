# Prompt: Job Portal Contract Spec

```text
You are my product+engineering spec assistant for this codebase.

Task: For the feature/module **Job Portal** (entry points: `frontend/src/components/Jobs/JobListingsPage.js`, `JobsList.js`, `JobDetail(s).js`, `PostJob.js`, `JobApplicationStatus.js`, etc.), produce a **single Markdown spec** at the same depth and structure as `archive/docs/dashboard-contract.md`.

Follow this structure exactly:

0. **Scope & Overview**
   - What the Job Portal does: browse/search jobs, view job details, apply to jobs, manage applications, post/manage jobs (for employers/admin), admin verification/review flows.
   - Where it lives (main list/detail/apply/post components, admin job review components, key routes like `/jobs`, `/jobs/:id`, `/jobs/post`, `/my-applications`).
   - Which user roles it affects: student, alumni, employer, admin, super_admin.

1. **Section / Unit Matrix (Canonical Contract)**
   - Identify key UI/flow sections: search + filters, job cards list, job detail view, apply form, applications list, employer posting form, employer job management, admin verification dashboards, etc.
   - For each section, create a row with:
     - ID (S1, S2, …)
     - Section name
     - Description / purpose
     - Frontend data source (hooks, context, props)
     - Backend objects / RPCs / tables (e.g., `jobs`, `job_applications`, any search or recommendation RPCs, admin review tables)
     - Primary routes it links to
     - Role gating (student / alumni / employer / admin / super_admin – who sees which sections and actions).

2. **Role Views**
   - For `student`, `alumni`, `employer`, `admin_or_super_admin`:
     - What Job Portal sections they see.
     - What actions they can take: search, bookmark, apply, withdraw, post jobs, edit/close jobs, view applicants, review/verify jobs, etc.
     - Differences in data visibility (e.g., salary ranges, applicant details) and who can see/manage what.

3. **Student – Desired vs Current Behavior**
   - Focus the gap analysis on **student** (primary job seeker persona).
   - 3.1 **Desired behavior** for students:
     - Visibility: they should see public/eligible jobs, their own applications, and appropriate status; not see employer-only/internal fields.
     - Actions: search/filter jobs, open a job, apply, view/update their applications, bookmark jobs (if supported).
     - Constraints: approval state; limits (e.g., cannot apply to closed jobs or duplicate-apply without clear behavior); RLS expectations on `jobs` and `job_applications`.
   - 3.2 **Current implementation**:
     - What the current code does for students across list/detail/apply/applications views and any recommendation logic.
   - 3.3 **Alignment**:
     - Where current behavior matches the desired student contract.
   - 3.4 **Open questions / gaps**:
     - E.g., handling of withdrawn/duplicate applications, expired jobs, visibility of employer contact details, recommendation scoping, rate limiting.

4. **How to Use This Document**
   - Notes for Product/UX, Frontend, Backend/RLS, QA on treating this as the canonical Job Portal contract.

Constraints / style:
- Use actual repo code only.
- Be explicit about `jobs`, `job_applications`, and any supporting tables/RPCs.
- Make role-based permissions very explicit (especially employer vs student/alumni vs admin).
- Output as a single Markdown file for `archive/docs/job-portal-contract.md`.
```
