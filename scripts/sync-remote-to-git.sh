#!/bin/bash

set -euo pipefail

# Verify link
npx supabase projects list | grep gvbtfolcizkzihforqte || npx supabase link --project-ref gvbtfolcizkzihforqte

# Ensure directories exist
mkdir -p supabase/migrations supabase/seeds supabase/functions supabase/types supabase/storage supabase/secrets

# Ensure baseline migration exists (one-time) so local resets have full schema
if ! ls supabase/migrations/*baseline_remote_schema.sql >/dev/null 2>&1; then
  echo "No baseline migration found. Pulling full remote schema as baseline..."
  npx supabase db pull --linked || true
  latest_schema=$(ls -t supabase/migrations/*_remote_schema.sql 2>/dev/null | head -1 || true)
  if [ -n "$latest_schema" ]; then
    mv "$latest_schema" supabase/migrations/00000000000000_baseline_remote_schema.sql
    echo "Baseline created at supabase/migrations/00000000000000_baseline_remote_schema.sql"
  else
    echo "WARN: Could not locate a generated *_remote_schema.sql to use as baseline. Falling back to db dump..."
    npx supabase db dump --linked \
      --schema public,auth,storage,realtime,graphql_public,cron,vault \
      -f supabase/migrations/00000000000000_baseline_remote_schema.sql || true
    if [ -s supabase/migrations/00000000000000_baseline_remote_schema.sql ]; then
      echo "Baseline created via db dump at supabase/migrations/00000000000000_baseline_remote_schema.sql"
    else
      echo "WARN: Baseline dump failed; proceeding without baseline. Local db reset may fail until baseline exists."
    fi
  fi
fi

# Run schema diff (inline date expression per request)
file="supabase/migrations/$(date +%Y%m%d%H%M%S)_remote_delta.sql"
npx supabase db diff --linked \
  --schema public,auth,storage,realtime,graphql_public,cron,vault \
  --file "$file" | cat || true

# Derive TS from the generated file name for subsequent steps
ts=$(basename "$file" | cut -d'_' -f1)

# If diff produced nothing, create a no-op migration so we can mark applied
if [ ! -f "$file" ] || [ ! -s "$file" ]; then
  echo "-- No schema changes detected at ${ts}" > "$file"
fi

# Call sanitizer (best-effort)
node scripts/sanitize-migration.js "$file" || true

# Dump data-only seeds
npx supabase db dump --linked --data-only --schema storage -x storage.objects -x storage.s3_multipart_uploads -f "supabase/seeds/${ts}_storage_buckets.sql" || true
npx supabase db dump --linked --data-only --schema cron -f "supabase/seeds/${ts}_cron.sql" || true

# Custom roles (may not be permitted on hosted; ignore failure)
npx supabase db dump --linked --role-only -f supabase/roles.sql || true

# Edge Functions export
npx supabase functions list -o json > /tmp/functions.json || echo '[]' > /tmp/functions.json
parsed_names=$(jq -r '.[]? | .name // .slug // empty' /tmp/functions.json || echo "")
fallback_names=("event-reminders" "mentor-matching" "send-feedback-notification" "admin-delete-user")

for name in $parsed_names; do
  rm -rf "supabase/functions/$name"
  npx supabase functions download "$name" -f "supabase/functions/$name" || true
done

for name in "${fallback_names[@]}"; do
  rm -rf "supabase/functions/$name"
  npx supabase functions download "$name" -f "supabase/functions/$name" || true
done

# Secrets (names only)
npx supabase secrets list -o json | jq -r '[ .[]? | .name ]' > supabase/secrets/SECRETS.json || echo '[]' > supabase/secrets/SECRETS.json

# Generate .env.example (overwrite, names only, no values)
rm -f .env.example
jq -r '.[]' supabase/secrets/SECRETS.json | while read -r key; do
  echo "$key=" >> .env.example
done

# Config-as-code: CLI does not support config pull reliably; ensure config exists
if [ ! -f supabase/config.toml ]; then
  npx supabase init || true
fi

# Type generation (TS defs)
npx supabase gen types typescript --linked --schema public,auth,storage,realtime,graphql_public,cron,vault > supabase/types/database.types.ts

# Validate migrations locally (optional; gated by RUN_DB_RESET=1)
if [ "${RUN_DB_RESET:-}" = "1" ]; then
  npx supabase db reset || echo "db reset failed, please review the latest migration order/dependencies"
else
  echo "Skipping local db reset (set RUN_DB_RESET=1 to enable)"
fi

# Git commit & push
git add -A
git commit -m "chore(db): sync remote -> git (${ts}), export seeds/functions/secrets/config/types" || echo "Nothing to commit"
git push origin main || true

# Mark the new migration as applied on prod (avoid re-apply)
npx supabase migration repair --status applied "${ts}" || true

# Echo success summary
echo "Sync completed. Generated migration: $file"
echo "Seeds: supabase/seeds/${ts}_storage_buckets.sql, supabase/seeds/${ts}_cron.sql"
echo "Types: supabase/types/database.types.ts"
echo "Secrets listed in: supabase/secrets/SECRETS.json and placeholders in .env.example"
