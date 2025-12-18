#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${CONNECTION_STRING:-}" ]]; then
  echo "CONNECTION_STRING is not set."
  echo "Example: export CONNECTION_STRING='postgresql://postgres:[PASSWORD]@db.gvbtfolcizkzihforqte.supabase.co:5432/postgres?sslmode=require'"
  exit 1
fi

OUT_DIR="${OUT_DIR:-./_db_dumps/amet-ams_modules_schema_only}"
mkdir -p "$OUT_DIR"

pg_dump "$CONNECTION_STRING" --schema-only --no-owner \
  --table=public.events \
  --table=public.event_rsvps \
  --table=public.event_attendees \
  --table=public.event_feedback \
  --table=public.event_groups \
  --file "$OUT_DIR/events_schema.sql"

echo "Wrote: $OUT_DIR/events_schema.sql"

pg_dump "$CONNECTION_STRING" --schema-only --no-owner \
  --table=public.jobs \
  --table=public.job_applications \
  --table=public.job_application_audit \
  --table=public.job_bookmarks \
  --table=public.job_alerts \
  --file "$OUT_DIR/jobs_schema.sql"

echo "Wrote: $OUT_DIR/jobs_schema.sql"

pg_dump "$CONNECTION_STRING" --schema-only --no-owner \
  --table=public.groups \
  --table=public.group_members \
  --table=public.group_memberships \
  --table=public.group_membership_audit \
  --table=public.group_posts \
  --table=public.group_comments \
  --table=public.group_post_reports \
  --table=public.group_invitations \
  --table=public.group_audit_log \
  --table=public.group_rate_limits \
  --table=public.group_documents \
  --table=public.group_document_pins \
  --table=public.group_polls \
  --table=public.group_poll_options \
  --table=public.group_poll_votes \
  --file "$OUT_DIR/groups_schema.sql"

echo "Wrote: $OUT_DIR/groups_schema.sql"

pg_dump "$CONNECTION_STRING" --schema-only --no-owner \
  --table=public.mentors \
  --table=public.mentor_profiles \
  --table=public.mentor_availability \
  --table=public.mentorship_requests \
  --table=public.mentorship_relationships \
  --table=public.mentorship_sessions \
  --table=public.mentorship_appointments \
  --table=public.mentorship_feedback \
  --table=public.mentorship_programs \
  --table=public.mentorships \
  --table=public.mentorship_messages \
  --file "$OUT_DIR/mentorship_schema.sql"

echo "Wrote: $OUT_DIR/mentorship_schema.sql"

pg_dump "$CONNECTION_STRING" --schema-only --no-owner \
  --table=public.conversations \
  --table=public.conversation_members \
  --table=public.conversation_participants \
  --table=public.messages \
  --table=public.dm_threads \
  --table=public.dm_participants \
  --table=public.dm_messages \
  --file "$OUT_DIR/messaging_schema.sql"

echo "Wrote: $OUT_DIR/messaging_schema.sql"

echo "Done. Dump files are in: $OUT_DIR"
