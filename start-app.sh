#!/bin/bash

# Kill any existing process on port 3000
echo "Stopping any existing process on port 3000..."
lsof -ti:3000 | xargs kill 2>/dev/null || true

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Set up environment variables
echo "Setting up Supabase environment variables..."

# The URL should be without quotes
export REACT_APP_SUPABASE_URL="https://gvbtfolcizkzihforqte.supabase.co"

# Prompt for API key
echo "Enter your Supabase anon/public API key (not the service_role key):"
read -r SUPABASE_KEY

# Validate input
if [ -z "$SUPABASE_KEY" ]; then
  echo "Error: API key is required. Exiting."
  exit 1
fi

# Export the key exactly as entered without any additional formatting
export REACT_APP_SUPABASE_KEY="$SUPABASE_KEY"

# Show confirmation
echo "Starting React app with:"
echo "URL: $REACT_APP_SUPABASE_URL"
echo "API Key: ${REACT_APP_SUPABASE_KEY:0:5}..." # Only show first 5 chars for security

# Start the application with the environment variables
echo "Starting application on port 3000..."
PORT=3000 npm start
