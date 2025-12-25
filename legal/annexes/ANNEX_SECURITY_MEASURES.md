# Annex — Security Measures (Annex-II style)

OWNER-PROVIDED FACTS vs REPO-EVIDENCED FACTS. PostHog absent (no snippet/domains/keys). Status legend: **Implemented**, **Missing**, **Planned/Optional**.

## Access Control & Authentication
- **Implemented (repo)**: Email/password auth via Supabase; signup enabled; refresh rotation; anon sign-ins disabled; OAuth absent. @supabase/config.toml#106-148
- **Implemented (repo)**: Frontend route gating (`ProtectedRoute`, role/permission tokens, verified email gating). @frontend/FRONTEND_BOOK.md#130-177
- **Implemented (repo)**: Admin ops via role checks + SECURITY DEFINER RPCs. @archive/docs/SECURITY.md#14-38
- **Missing (repo)**: MFA (TOTP/phone) disabled; SMS signup disabled. @supabase/config.toml#188-235
- **Missing (repo)**: Session inactivity/timebox commented out. @supabase/config.toml#202-208

## Authorization & RLS
- **Implemented (repo)**: RLS on profiles, events, jobs, job_applications, groups, messages, notifications; admin overrides via RPCs. @archive/docs/SECURITY.md#29-38
- **Implemented (repo)**: Storage policies: private by default; event-images conditional public read; resumes private. @archive/docs/SECURITY.md#18-27 · @supabase/config.toml#91-104
- **Missing (repo)**: Formal tenant isolation (single-tenant SaaS).

## Data Protection (Transport & Storage)
- **Implemented (repo)**: Supabase URL implies TLS in transit. @vercel.json#1-36
- **Implemented (repo)**: Storage MIME/size limits 50MiB; buckets private by default. @supabase/config.toml#91-104
- **Missing (repo)**: Explicit encryption-at-rest statement (assumed Supabase default).
- **Missing (repo)**: CSP/clickjacking headers not documented.

## Logging & Monitoring
- **Implemented (repo)**: Frontend redacting logger; prod console silenced. @archive/docs/SECURITY.md#5-11
- **Implemented (repo)**: DB activity logs (IDs/actions). @archive/docs/security_architecture_audit.md#329-337
- **Missing (repo)**: Centralized log shipping/alerting; Prometheus not wired; no SLO/SLI. @archive/docs/security_architecture_audit.md#337-342

## Rate Limiting & Abuse Prevention
- **Implemented (repo)**: Auth rate limits (email/SMS/token refresh/sign-in). @supabase/config.toml#133-148
- **Missing (repo)**: App-layer rate limits; captcha providers disabled. @supabase/config.toml#150-155

## Backup & Recovery
- **Implemented (repo)**: Backups directory guidance. @archive/docs/SECURITY.md#45-48
- **Missing (repo)**: Backup retention/rotation; restore testing runbooks. @archive/docs/security_architecture_audit.md#343-348

## Change Management / Edge Functions
- **Implemented (repo)**: Edge function `admin-delete-user` requires admin/super_admin; service role key secret. @supabase/functions/README.md#1-44
- **Missing (repo)**: Formal CI/CD approvals, secret scanning not documented.

## Privacy & Data Governance
- **Implemented (repo)**: No payment data collected; PII categories cataloged. @CONTRACT_PACK_INPUTS_DOSSIER.md#20-36
- **Missing (repo)**: Documented data retention schedules; breach/incident response process. @CONTRACT_PACK_INPUTS_DOSSIER.md#66-68 · @archive/docs/security_architecture_audit.md#349-353

## Physical & Infrastructure
- **Implemented (repo)**: Managed Supabase/Vercel infra (implicit). @vercel.json#1-36
- **Owner-provided**: Supabase region ap-south-1 (Mumbai) — needs dashboard evidence.
- **Missing (repo)**: Region/data residency confirmation for Supabase/Vercel.

## Summary of Gaps (actionable)
- Enable MFA and session inactivity/timebox.
- Add CSP and clickjacking headers.
- Add centralized logging/alerting; wire metrics; define SLO/SLI.
- Define/publish retention schedules and deletion propagation (DB, storage, backups).
- Confirm hosting regions; document encryption at rest/key management.
- Add captcha/app-layer rate limits; document admin audit cadence.

## Open Questions
- Provide Supabase dashboard evidence for ap-south-1 (Mumbai).
- Provide Vercel header evidence (x-vercel-id/x-vercel-cache) for region/CDN.
- Backup retention duration and restore testing cadence.
- CSP/frame-ancestors policy for production.
- Any additional email/SMS providers in production?
