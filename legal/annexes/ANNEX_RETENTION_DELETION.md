# Annex — Retention & Deletion

OWNER-PROVIDED FACTS vs REPO-EVIDENCED FACTS. PostHog absent (no tracker impact on logs). Keys/tokens redacted as `<REDACTED>`.

## What exists (REPO-EVIDENCED)
- Backups: Supabase backups directory guidance (no schedule/expiry). @archive/docs/SECURITY.md#45-48 · @archive/docs/security_architecture_audit.md#343-348
- User deletion: Edge function `admin-delete-user` deletes Auth user via service role; cascade scope not documented. @supabase/functions/README.md#1-44
- Logs: Activity log tables capture actions; no retention windows stated. @archive/docs/security_architecture_audit.md#329-347

## OWNER-PROVIDED FACTS
- None supplied for retention/deletion; awaiting owner input.

## Gaps
- No defined retention periods for: profiles/directory, messages, mentorship, groups, jobs/applications, storage objects (avatars/event images/resumes), activity/audit logs, Supabase analytics data.
- No documented deletion propagation to backups/archives.
- No policy for soft-delete vs hard-delete across modules.
- No lifecycle/expiry for signed URLs or storage objects.

## Recommended defaults (proposed; need owner approval)
- Profiles & directory: retain while account active; delete/anon within 30 days of confirmed account deletion.
- Messages/DMs: delete/anon within 30 days of account deletion or participant request (unless legal hold).
- Jobs & applications: retain 1 year post-closure; anonymize applicant IDs after 1 year; purge resumes/cover letters accordingly.
- Events & feedback: retain event records; anonymize feedback within 180 days; purge attendance PII after 1 year.
- Mentorship & groups: remove personal identifiers within 180 days of relationship end; keep aggregates only.
- Storage objects: auto-expire orphaned avatars/resumes/event images within 30–90 days after record deletion.
- Logs/analytics: retain auth/access/activity logs 180 days; redact PII; enable deletion-on-request where feasible.
- Backups: 30–90 day rolling retention; define how deletion requests propagate (periodic rebuild/re-encryption) or document DPA exception.

## Open Questions
- Confirm legal/regulatory retention requirements (GDPR/local) and contractual SLAs.
- Decide soft-delete vs hard-delete per module and cascade rules to storage/analytics.
- Provide policy for backup retention and restore testing cadence.
- Confirm Supabase analytics retention controls and whether external storage (S3) is used with lifecycle policies.
