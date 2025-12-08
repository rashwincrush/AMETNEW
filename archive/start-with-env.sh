#!/bin/bash

# Define the Supabase URL and Key
# NOTE: For the API key, you need the "anon" or "public" key, not the "service_role" key
SUPABASE_URL="https://gvbtfolcizkzihforqte.supabase.co"
# Replace this with your actual anon/public key (not service_role key)
SUPABASE_KEY=""

# Display instructions
echo "========================================================"
echo "Supabase Configuration"
echo "========================================================"
echo "1. You need to use the 'anon' key or 'public' key from your Supabase project"
echo "2. NOT the 'service_role' key (which is more restricted)"
echo "3. Get your keys from: Project Settings > API in Supabase dashboard"
echo "========================================================"
echo ""

# Prompt for API key if not set
if [ -z "$SUPABASE_KEY" ]; then
  read -p "Enter your Supabase anon/public API key: " SUPABASE_KEY
fi

# Verify that key was provided
if [ -z "$SUPABASE_KEY" ]; then
  echo "Error: No API key provided. Exiting."
  exit 1
fi

echo "Starting React app with Supabase configuration..."
echo "URL: $SUPABASE_URL"
echo "Key: ${SUPABASE_KEY:0:5}..."  # Only show first 5 chars for security

# Change to frontend directory and start with environment variables
cd "$(dirname "$0")/frontend"

# Export the environment variables and start the app
REACT_APP_SUPABASE_URL="$SUPABASE_URL" REACT_APP_SUPABASE_KEY="$SUPABASE_KEY" PORT=3000 npm start
