# CONTRACT PACK INPUTS DOSSIER

## Parties & Contacts
- Customer: UNKNOWN – NEED CONFIRMATION
- Vendor: AMET Alumni platform (working name) – contacts UNKNOWN – NEED CONFIRMATION
- DPO/Security contact: UNKNOWN – NEED CONFIRMATION

## System Overview
- SaaS web app with modules: Dashboard, Directory, Jobs, Events, Mentorship, Groups, Messages, Admin (RBAC-driven). @frontend/FRONTEND_BOOK.md#366-577
- Auth via Supabase (email/password; OAuth disabled). @supabase/config.toml#106-190
- Frontend built with React, hosted via Vercel static build (uses Supabase anon key). @vercel.json#1-38
- Backend: FastAPI + Supabase client; containerized with Nginx serving built frontend + Python backend. @Dockerfile#1-39 @requirements.txt#1-34

## Hosting / Regions
- Primary DB/Auth/Storage: Supabase managed project `gvbtfolcizkzihforqte` (region not specified) – CONFIRM REGION. Supabase URL present in Vercel env. @vercel.json#1-38
- Optional/experimental S3 integration via env `S3_HOST`, `S3_REGION`. Region not set → CONFIRM before use. @supabase/config.toml#314-324
- Frontend hosting/CDN: Vercel static build. @vercel.json#1-33
- Dev/local: Supabase local config (ports 54321/54322/54323) with inbucket email catcher enabled. @supabase/config.toml#7-88

## Data Inventory (indicative)
| Category | Fields/Examples | Purpose | Access/Controls | Retention |
| --- | --- | --- | --- | --- |
| Identity & Auth | email, password hash (Supabase), session tokens | Login, account access | Supabase Auth; password policy min length 6; refresh rotation enabled; rate limits for auth events. @supabase/config.toml#106-148 @supabase/config.toml#133-148 | UNKNOWN – NEED CONFIRMATION |
| Profile | id, email, full_name, first_name, last_name, phone, graduation_year/expected_graduation_year, degree_code, department_id, company_name, current_job_title, location, avatar_url, industry, company_size, company_website, role | Account profile, directory display | RLS: users edit own; admins can read all (per security doc). @frontend/FRONTEND_BOOK.md#214-224 @archive/docs/SECURITY.md#29-37 | UNKNOWN – NEED CONFIRMATION |
| Directory/Connections | Connection status (sent/received/connected), alumni directory data | Networking between users | RLS-enforced per user/role; employers redirected from directory. @frontend/FRONTEND_BOOK.md#410-417 @archive/docs/role-module-action-matrix.md#35-43 | UNKNOWN – NEED CONFIRMATION |
| Jobs | Job posts, applications, statuses (submitted→hired), resumes (private bucket) | Job board, applications | RLS: posters/admins manage; applicants see own. Resumes private; employers for their jobs; admin override. @frontend/FRONTEND_BOOK.md#420-449 @archive/docs/SECURITY.md#24-37 | UNKNOWN – NEED CONFIRMATION |
| Events | Event details, registrations, feedback | Event discovery/RSVP | RLS: public read after approval; create/edit admin-only. @frontend/FRONTEND_BOOK.md#452-474 @archive/docs/SECURITY.md#31-33 | UNKNOWN – NEED CONFIRMATION |
| Mentorship | Mentor profiles, requests, capacity, statuses | Mentor/mentee matching | Access controlled by role/approval; admin approvals. @frontend/FRONTEND_BOOK.md#476-509 | UNKNOWN – NEED CONFIRMATION |
| Groups | Group details, memberships, posts/comments | Community groups | Role/approval checks; employer blocked; RLS for membership visibility. @frontend/FRONTEND_BOOK.md#512-529 @archive/docs/role-module-action-matrix.md#100-116 | UNKNOWN – NEED CONFIRMATION |
| Messaging | Conversations, messages, connection gating | Direct messaging between connections | Participants-only read; admin via dedicated RPCs. @archive/docs/SECURITY.md#35-37 | UNKNOWN – NEED CONFIRMATION |
| Notifications | In-app notifications | User alerts | Per-recipient visibility only. @archive/docs/SECURITY.md#35-38 | UNKNOWN – NEED CONFIRMATION |
| Media/Files | Avatars, event images (private), resumes (private) | UX, hiring flows | Storage buckets: images (private), event-images, resumes; MIME/size limits 50MiB; private by default. @supabase/config.toml#91-104 @archive/docs/SECURITY.md#18-27 | UNKNOWN – NEED CONFIRMATION |
| Logs/Analytics | Minimal activity logs (IDs/descriptors), optional Supabase analytics backend | Monitoring/debug | Payload redaction; no PII in logs. @archive/docs/SECURITY.md#5-11 @archive/docs/SECURITY.md#49-52 @supabase/config.toml#308-313 | UNKNOWN – NEED CONFIRMATION |
| Payment/Billing | None observed | — | — | Not collected |
| Special/Sensitive Data | None observed (no health/biometric/gov-ID) | — | — | Not collected |

## Subprocessors (observed / potential)
| Subprocessor | Purpose | Data Types | Region | Evidence/Config |
| --- | --- | --- | --- | --- |
| Supabase (DB/Auth/Storage/Edge) | Auth, Postgres DB, Storage buckets, Edge functions | Identity, profiles, jobs/events/groups data, messages, files | Region UNKNOWN – NEED CONFIRMATION | @vercel.json#1-38 @supabase/config.toml#7-325 |
| Vercel | Static hosting/CDN for frontend | Public app assets; browser connects to Supabase directly | Region depends on Vercel deploy (UNKNOWN) | @vercel.json#1-33 |
| AWS S3 (optional) | Possible storage backend via env `S3_HOST`/`S3_REGION` | Files if enabled | Region depends on env (UNKNOWN – disabled by default) | @supabase/config.toml#314-324 |
| Inbucket (dev only) | Dev email capture (non-prod) | Test emails | Localhost dev only | @supabase/config.toml#79-88 |
| Twilio SMS (disabled) | Placeholder for SMS OTP | N/A (disabled) | N/A | @supabase/config.toml#188-224 |
| Redis (dependency) | Potential cache/queue (usage not shown) | Session/cache data if used | UNKNOWN | @requirements.txt#1-34 |
| Google Cloud Pub/Sub (dependency) | Potential messaging (usage not shown) | UNKNOWN | UNKNOWN | @requirements.txt#1-34 |
| AWS (boto3 dependency) | Potential storage/queue (usage not shown) | UNKNOWN | UNKNOWN | @requirements.txt#1-34 |

## Security Controls (current signals)
- Auth: Supabase email/password; refresh rotation; email rate limits; SMS signup disabled; OAuth providers disabled. @supabase/config.toml#106-190
- RBAC/Permissions: Roles (alumni, student, employer, admin, super_admin) with permission matrices and guards. @frontend/FRONTEND_BOOK.md#241-299 @archive/docs/role-module-action-matrix.md#1-120
- RLS: Enabled on user-facing tables; per-table policies for profiles, events, jobs, job_applications, groups, messages, notifications; admin RPCs gated. @archive/docs/SECURITY.md#29-38
- Storage: Buckets private by default; event images and resumes with MIME/size limits (50MiB). @supabase/config.toml#91-104 @archive/docs/SECURITY.md#18-27
- Logging: Redacting logger; no console in prod; no payload/PII in logs. @archive/docs/SECURITY.md#5-11 @archive/docs/SECURITY.md#49-52
- Rate limiting: Auth email/SMS/token refresh/sign-in throttles configured. @supabase/config.toml#133-148
- Backups: Snapshot guidance under `supabase/backups/`. @archive/docs/SECURITY.md#45-48
- Edge Functions: Admin delete user requires admin/super_admin with service role key; secrets set via Supabase dashboard. @supabase/functions/README.md#1-44
- MFA: Disabled by default (totp/phone/web_authn false). @supabase/config.toml#227-244
- CAPTCHA: Disabled by default (providers commented). @supabase/config.toml#150-155

## Retention & Deletion
- Backups stored under `supabase/backups/` (policy details not specified). @archive/docs/SECURITY.md#45-48
- No explicit retention schedules for user data/logs observed → UNKNOWN – NEED CONFIRMATION.
- User deletion: Admin delete user edge function exists; broader data retention impact not documented. @supabase/functions/README.md#1-44

## Incident / Breach Process
- No documented incident response/on-call/breach notification steps found → UNKNOWN – NEED CONFIRMATION.
- Logging/audit present but alerting/on-call not specified → UNKNOWN – NEED CONFIRMATION.

## Support / SLA Assumptions
- Support channels, hours, severity definitions, response targets not documented → UNKNOWN – NEED CONFIRMATION.

## SOW Inputs (Deliverables, Milestones, Acceptance)
- Deliverables (modules): Dashboard, Directory, Jobs, Events, Mentorship, Groups, Messages, Admin. @frontend/FRONTEND_BOOK.md#366-577
- Acceptance criteria hints: Route/role QA matrix defines expected access behaviors (200 vs redirect/access denied) per route/role. @frontend/FRONTEND_BOOK.md#908-955
- Environments: Dev/local Supabase; Vercel frontend; Supabase managed backend. @supabase/config.toml#7-325 @vercel.json#1-33
- Rollout plan, training, documentation: Not specified → UNKNOWN – NEED CONFIRMATION.

## EU/UK Transfers & TRA Notes
- Data stored in Supabase (region not stated). Need confirmation of Supabase region and any S3 region for transfers.
- International transfers likely (frontend on Vercel + Supabase managed). Need SCC/IDTA addendum with Supabase as subprocessor and any optional S3.
- TRA inputs missing: hosting region, subprocessors’ regions, categories of data per flow, backup/retention locations → UNKNOWN – NEED CONFIRMATION.

## Parties & Contacts (Next Steps)
- Populate legal entity names, addresses, DPO/security contacts, and support contacts.
- Confirm hosting regions (Supabase project, Vercel deployment, any S3 buckets) and production email/SMS providers.
- Confirm retention schedules and incident-response obligations.

*Secrets have been redacted where present.*
