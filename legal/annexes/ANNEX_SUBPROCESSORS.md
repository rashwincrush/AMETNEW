# Annex — Subprocessors

All claims split into OWNER-PROVIDED FACTS vs REPO-EVIDENCED FACTS. Keys/tokens redacted as `<REDACTED>`. PostHog confirmed absent (no snippet/domains/keys found across frontend). 

## PROD-ACTUAL
| Subprocessor | Purpose | Data Types | Region | Evidence |
| --- | --- | --- | --- | --- |
| Supabase (DB/Auth/Storage/Edge) | Primary managed Postgres, Auth, Storage, Edge runtime; frontend uses Supabase URL/anon key | Identity (email, password hash), profiles, jobs/events/groups data, messages, storage objects (avatars, event images, resumes) | OWNER-PROVIDED: ap-south-1 (Mumbai) — needs dashboard confirmation. REPO-EVIDENCED: region not stated. | @vercel.json#1-38 (Supabase URL + anon key <REDACTED>) · @supabase/config.toml#91-132 (auth/storage) · @supabase/config.toml#308-324 (analytics/optional S3) |
| Vercel | Static hosting/CDN for React SPA; serves built assets only | Public web assets; no server-side data processing | OWNER-PROVIDED: regions via x-vercel-id/x-vercel-cache headers (not captured here). REPO-EVIDENCED: hosting config only. | @vercel.json#1-33 (static build + routes) |

## OPTIONAL (env-gated)
| Service | Purpose | Data Types | Region | Evidence |
| --- | --- | --- | --- | --- |
| AWS S3 (experimental OrioleDB backend) | Optional storage backend via env `S3_HOST`/`S3_REGION`; default empty | Files if enabled | Region from env (not set) | @supabase/config.toml#314-324 |
| Twilio SMS | SMS/OTP provider config present but disabled | None (disabled) | N/A | @supabase/config.toml#188-224 |

## DEV-ONLY
| Service | Purpose | Data Types | Region | Evidence |
| --- | --- | --- | --- | --- |
| Inbucket | Dev email catcher | Test emails only | Local dev | @supabase/config.toml#79-88 |

## DEPENDENCY-ONLY (libraries present; no runtime use observed)
| Package/Service | Notes | Evidence |
| --- | --- | --- |
| Redis, boto3, google-cloud-pubsub, kubernetes, paramiko, ghapi | Listed in backend requirements; no usage shown in active app paths | @archive/docs/security_architecture_audit.md#361-373 |

## Open Questions
- Provide Supabase dashboard screenshot/log confirming ap-south-1 (Mumbai) region.
- Provide Vercel response headers (x-vercel-id, x-vercel-cache) for region/CDN evidence.
- Clarify if AWS S3 backend is enabled in prod and which bucket/region/policies apply.
- Confirm any non-Supabase email/SMS providers used in prod. 
