# AMET Alumni — Security Hardening Summary

This document summarizes the security posture applied to the AMET Alumni web app.

## Logging & Console Hygiene
- Centralized redacting logger in `frontend/src/utils/logger.js`.
- Production: all console output is silenced; logger becomes a no-op.
- Redaction patterns: Supabase keys, Authorization headers, UUIDs, emails.
- No network/body dumps in prod; error messages capped to 256 chars in toasts and logs.
- ESLint rule `no-console` enforced (logger allowed only in logger.js).

## Frontend Guards
- `ProtectedRoute` supports `requireVerifiedEmail` to gate email-verified users only.
- Admin-only operations guarded through role checks and `PermissionGate`.
- Social sharing buttons gated via `SOCIAL_ENABLED` and `ENABLE_PLATFORMS` constants.
- Admin Security Self-Check at `Admin > Security Check` validates key toggles at runtime.

## Storage Buckets
- Event images (bucket: `event-images`):
  - Upload path: `${eventId}-${timestamp}.{ext}`.
  - Content-type validated by client; strong cache-control headers.
  - Old blob best-effort cleanup after successful DB update.
  - Policies (see SQL): owner/organizer write; public read only if event is approved or public.
- Resumes (bucket: `resumes`):
  - Private by default.
  - Read: owner and admin; employers can read resumes for applications to their jobs.
  - No public read.

## RLS & Admin-Only Operations (Selected Tables)
- `profiles`: users can read/update only their own rows; admins can read all.
- `events`: public read after approval; updates restricted to creator/organizer/admin.
- `event_feedback`: insert allowed only after event end; enforced via DB guards.
- `jobs`: public read for active+approved; edit restricted to poster/admin.
- `job_applications`: applicant reads own; employer can read applications for their jobs; admin reads all.
- `groups` and `group_memberships`: membership and visibility per role; admin overrides.
- `messages`/`conversations`: participants-only read; admin via dedicated RPCs.
- `notifications`: per-recipient visibility only.
- Admin RPCs/analytics: SECURITY DEFINER with explicit admin checks; access denied for non-admins.

## Idempotent SQL Policies
- Use `DROP POLICY IF EXISTS ...` then `CREATE POLICY ...` or wrap `CREATE POLICY` in `DO $$ ... $$` blocks checking `pg_policies`.
- RLS enabled by default on user-facing tables.
- Publications and triggers created idempotently.

## Backups
- Store snapshots in `supabase/backups/` (e.g., `backup_YYYY-MM-DD_HHMM.sql`).
- Keep sensitive data secure; do not commit secrets. Follow Supabase backup best practices.

## Activity Logs
- DB triggers write minimal activity logs (IDs + safe descriptors only).
- No payload dumps/PII in log messages.

## Social Media Integration
- Link-based sharing only (Twitter, Facebook, LinkedIn).
- No tokens stored; no auto-posting.

## How To Validate Locally
- Build the app in production mode and open the browser console: no logs should appear.
- Visit Admin > Security Check for a quick green/red check.
- Run the SQL in `scripts/sql/security_hardening.sql` against your database after verifying bucket names and table names match your environment.
