# Transfer Pack Inputs

OWNER-PROVIDED FACTS are flagged; REPO-EVIDENCED FACTS cite paths/lines. Secrets redacted as `<REDACTED>`.

## A) EU SCC (2021) — Annex I Inputs
### Parties & Roles
- Controller: Customer (OWNER-PROVIDED; specify legal entity).
- Processor: Forgecircle Alumni platform (Supabase-backed app) (REPO-EVIDENCED hosting stack). @CONTRACT_PACK_INPUTS_DOSSIER.md#9-18 · @vercel.json#1-38

### Categories of Data Subjects
- End users: alumni, students, employers, admins. @CONTRACT_PACK_INPUTS_DOSSIER.md#20-36

### Categories of Personal Data
- Identity/auth: email, password hash (Supabase Auth). @supabase/config.toml#106-148
- Profile/education/employment data (names, phone, graduation year, degree, job title/company). @CONTRACT_PACK_INPUTS_DOSSIER.md#24-26
- Jobs/applications (application content, statuses, resumes/cover letters). @archive/docs/SECURITY.md#24-35
- Events/feedback (event details, registrations, feedback). @archive/docs/SECURITY.md#18-33
- Mentorship/groups (requests, posts, memberships). @archive/docs/SECURITY.md#29-36
- Messaging/notifications (DM content, notification payloads). @archive/docs/SECURITY.md#35-37
- Media: avatars, event images, resumes (storage objects). @supabase/config.toml#91-104

### Processing Purposes
- Provide SaaS features: directory, jobs, events, mentorship, messaging, admin. @CONTRACT_PACK_INPUTS_DOSSIER.md#9-36

### Frequency & Nature of Transfers
- Continuous, on-demand application use; browser ↔ Supabase (Auth/PostgREST/RPC/Storage/Edge). @ANNEX_DATA_FLOWS.md#5-33

### Subprocessors + Locations
- Supabase (DB/Auth/Storage/Edge) — OWNER-PROVIDED region ap-south-1 (Mumbai) pending screenshot. @ANNEX_SUBPROCESSORS.md#5-31
- Vercel (static hosting/CDN) — region evidenced via `x-vercel-id`/`x-vercel-cache` headers (owner capture pending). @ANNEX_SUBPROCESSORS.md#5-31 · @VERCEL_REGION_EVIDENCE.md#1-25
- Optional/env-gated: AWS S3 (region via env), Twilio SMS (disabled), dev Inbucket; dependency-only libs (no runtime use). @ANNEX_SUBPROCESSORS.md#11-31

## B) Annex II Inputs (Technical & Organisational Measures)
- Summaries mapped to `ANNEX_SECURITY_MEASURES.md`: auth/route gating, RLS/storage policies, logging, rate limits, backups, edge function controls, gaps (MFA, CSP, app-layer rate limits, retention). @ANNEX_SECURITY_MEASURES.md#5-63

## C) UK Transfers
- UK restricted transfers require UK IDTA or UK Addendum to EU SCCs. (Statement)
- Owner decisions needed:
  - Choose instrument (UK IDTA vs UK Addendum).
  - Confirm Supabase and Vercel regions acceptable for UK data.
  - Confirm if separate UK-specific TRA is required.

## D) TRA Checklist (facts to gather)
- Hosting regions: Supabase region evidence (ap-south-1 Mumbai, owner screenshot), Vercel header evidence. @SUPABASE_REGION_EVIDENCE.md#1-11 · @VERCEL_REGION_EVIDENCE.md#1-25
- Subprocessors and locations: Supabase, Vercel, optional AWS S3/Twilio/Inbucket. @ANNEX_SUBPROCESSORS.md#5-31
- Encryption & access controls: Supabase-managed TLS, RLS, role/permission gating, storage policies, auth settings. @ANNEX_SECURITY_MEASURES.md#5-38
- Incident process & logging: limited activity logs; no documented incident playbook (gap). @ANNEX_SECURITY_MEASURES.md#23-43
- Retention/deletion posture: gaps and proposed defaults. @ANNEX_RETENTION_DELETION.md#3-34
