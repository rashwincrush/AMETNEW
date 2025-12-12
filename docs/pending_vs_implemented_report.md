# Backend vs Frontend Implementation Status (Grounded in Repo)

## Completed (Backend)
- **Security questions**: Tables/RPCs present in migrations (hashed answers via pgcrypto, search_path fixed).
- **Profile degrees**: `profile_degrees` table/RPCs exist.
- **Achievements (single list)**: `profile_achievements` table/RPCs exist; `upsert_my_achievement` signature now matches frontend (`issuer`/`date_awarded` mapped to `organization`/`year`).

## Completed (Frontend)
- **Security question UI**: `SecurityQuestionForm` wired into Forgot/Update Password and Profile security section.
- **Additional degrees UI**: `AdditionalDegreesForm` add/edit/delete in Profile edit.
- **Achievements UI**: `ProfessionalAchievementsForm` add/edit/delete; read-only summary shows title + issuer + date + description + URL; uses `useProfileAchievements` hook aligned with RPC.

## Pending on Frontend Only
- **Degrees in directory/profile header**: Header chips still show only primary degree; no “+N more” summary.
- **Achievements UX parity**: No four distinct subsections (Awards/Publications/Patents/Certifications) or per-type link labels; public/compact view not differentiated.

## Pending on Both Backend and Frontend (not found in codebase)
- **Admin Users pagination RPCs/UI**: No verified implementations of `admin_list_profiles_for_approval` / `admin_count_profiles_for_approval` wiring.
- **Jobs extras**: `education_requirements`, `contact_name/email/phone` fields (schema + forms + detail display) absent.
- **Events extras**: `registration_deadline`, `sponsor_name`, `has_cost`, `wants_to_volunteer` (and volunteers CSV) absent in schema and UI/RSVP flows.
- **Event feedback (attendee)**: No attendee-facing form or `event_feedback` storage/RPC hookup; admin report not wired to such table.
- **CSV import validation/duplicate strategy**: No schema columns or UI controls for validation mode / duplicate strategy.
- **Admin data validation tools**: No RPCs or UI for run/inspect validation runs.

## Net
Only security questions, additional degrees, and a consolidated achievements module are implemented. All jobs/events/feedback/admin-data tools and nuanced achievements presentation remain to be built. The report in `full_session_implementation_report_v2.md` overstates coverage for those areas.***
