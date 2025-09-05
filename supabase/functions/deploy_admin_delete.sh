#!/bin/bash

# Deploy the admin-delete-user function
echo "Deploying admin-delete-user function..."
cd "$(dirname "$0")" # Move to functions directory
supabase functions deploy admin-delete-user

# Remind about setting secrets if not already set
echo ""
echo "IMPORTANT: Make sure your function has the following secrets set:"
echo "- SUPABASE_URL         (your Supabase project URL)"
echo "- SUPABASE_ANON_KEY    (your Supabase anonymous key)"
echo "- SUPABASE_SERVICE_ROLE_KEY  (your Supabase service role key)"
echo ""
echo "You can set these using:"
echo "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
echo ""
echo "Or through the Supabase Dashboard:"
echo "Project Settings → Functions → Secrets"
