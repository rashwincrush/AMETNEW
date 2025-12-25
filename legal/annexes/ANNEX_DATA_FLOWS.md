# Annex — Data Flows

OWNER-PROVIDED FACTS are annotated; REPO-EVIDENCED FACTS cite paths/lines. PostHog confirmed absent (no snippet/domains/keys).

## Diagram (text)
Browser (React SPA on Vercel CDN)  
→ Supabase Auth (email/password)  
→ Supabase PostgREST/RPC (profiles, jobs, events, groups, mentorship, messaging, notifications)  
→ Supabase Storage (avatars/images/resumes) via signed URLs + RLS  
↔ Supabase Edge Functions (admin-delete-user; service role key)  
→ Supabase Analytics (Postgres backend enabled)  
Optional: experimental S3 backend (env-gated, default off)  

## Narrative by tier
- **Browser (Vercel-hosted SPA)**: Uses Supabase JS client with anon key; client-side role/approval gates; no SSR. REPO-EVIDENCED @vercel.json#1-36 · @frontend/FRONTEND_BOOK.md#130-177
- **Vercel CDN**: Static build served globally; regions evidenced by `x-vercel-id` and cache state via `x-vercel-cache` in runtime responses (OWNER-PROVIDED placeholder; not in repo). REPO-EVIDENCED config only @vercel.json#1-33
- **Auth**: Supabase email/password; OAuth disabled; refresh rotation enabled; SMS/TOTP MFA disabled; min password length 6. REPO-EVIDENCED @supabase/config.toml#106-148 · @supabase/config.toml#188-235
- **Database (PostgREST/RPC)**: SPA calls directly; RLS and SECURITY DEFINER RPCs for admin ops. REPO-EVIDENCED @archive/docs/SECURITY.md#29-38 · @archive/docs/system-architecture-book.md#19-34
- **Storage**: Buckets private by default; images bucket private; resumes private; event-images conditional public read; MIME/size limits 50MiB. REPO-EVIDENCED @supabase/config.toml#91-104 · @archive/docs/SECURITY.md#18-27
- **Edge Functions**: `admin-delete-user` requires admin/super_admin; uses service role key set as secret. REPO-EVIDENCED @supabase/functions/README.md#1-44
- **Analytics**: Supabase analytics enabled with Postgres backend. REPO-EVIDENCED @supabase/config.toml#308-313
- **Optional S3 backend**: OrioleDB/S3 settings env-gated, default empty. REPO-EVIDENCED @supabase/config.toml#314-324
- **Legacy backend (non-prod)**: FastAPI+Nginx described; treated as archived. REPO-EVIDENCED @CONTRACT_PACK_INPUTS_DOSSIER.md#11-13

## Data categories and paths
- Identity/auth: email, password hash, sessions → Supabase Auth DB. REPO-EVIDENCED @supabase/config.toml#106-148
- Profiles & directory: PII (name, phone, role, education, job info) → PostgREST/RPC with RLS. REPO-EVIDENCED @CONTRACT_PACK_INPUTS_DOSSIER.md#24-26
- Jobs/applications: postings, applications, statuses, resumes (file refs) → Postgres + Storage `resumes`; employer/admin scoped reads. REPO-EVIDENCED @archive/docs/SECURITY.md#24-35
- Events: details, registrations, feedback, images → Postgres + Storage `event-images` (conditional public read). REPO-EVIDENCED @archive/docs/SECURITY.md#18-27 · @supabase/config.toml#91-104
- Mentorship & groups: mentor profiles, requests, group posts/memberships → Postgres with RLS/role gates. REPO-EVIDENCED @archive/docs/SECURITY.md#29-36
- Messaging/notifications: DMs and notifications → Postgres with participant/recipient RLS; admin via RPC. REPO-EVIDENCED @archive/docs/SECURITY.md#35-37
- Logs/analytics: activity logs (IDs/metadata) in DB; Supabase analytics backend enabled. REPO-EVIDENCED @archive/docs/security_architecture_audit.md#329-347 · @supabase/config.toml#308-313

## Open Questions
- Provide Vercel response headers (x-vercel-id, x-vercel-cache) to evidence CDN region/cache in prod.
- Confirm Supabase region ap-south-1 via dashboard screenshot/log.
- Confirm whether any production Node/FastAPI API remains active.
- Clarify if S3 backend is enabled outside dev/experimental and its bucket/region/policies.
- Confirm any third-party email/SMS providers beyond Supabase defaults.
