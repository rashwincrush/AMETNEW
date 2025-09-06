#!/bin/bash

# Apply the get_pending_content function fix to Supabase
# This runs the SQL directly in the Supabase SQL Editor via their REST API

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
  echo -e "${BLUE}Loading environment variables from .env file...${NC}"
  source .env
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] && [ -z "$REACT_APP_SUPABASE_URL" ]; then
  echo -e "${RED}Error: SUPABASE_URL or REACT_APP_SUPABASE_URL environment variable is required${NC}"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ] && [ -z "$SUPABASE_KEY" ] && [ -z "$REACT_APP_SUPABASE_KEY" ] && [ -z "$REACT_APP_SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}Error: SUPABASE_SERVICE_KEY or REACT_APP_SUPABASE_KEY environment variable is required${NC}"
  exit 1
fi

# Use available environment variables
SUPABASE_URL=${SUPABASE_URL:-$REACT_APP_SUPABASE_URL}
SERVICE_KEY=${SUPABASE_SERVICE_KEY:-${SUPABASE_KEY:-${REACT_APP_SUPABASE_SERVICE_KEY:-$REACT_APP_SUPABASE_KEY}}}

echo -e "${BLUE}Using Supabase URL: $SUPABASE_URL${NC}"

# Read the SQL file
SQL_CONTENT=$(cat fix_get_pending_content.sql)
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Could not read fix_get_pending_content.sql${NC}"
  exit 1
fi

echo -e "${BLUE}Applying fix to get_pending_content function...${NC}"

# Execute the SQL via Supabase REST API
curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo $SQL_CONTENT | jq -Rs .)}" \
  > /dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Fix applied successfully!${NC}"
  echo -e "Refresh your admin dashboard to see if the error is resolved."
  echo -e "${BLUE}If you still see errors, try clearing your browser cache or opening the dashboard in an incognito window.${NC}"
else
  echo -e "${RED}❌ Error applying fix.${NC}"
  echo -e "Please run the SQL in the Supabase Dashboard SQL Editor manually:"
  echo -e "${BLUE}1. Go to https://app.supabase.com/project/_/sql${NC}"
  echo -e "${BLUE}2. Copy the contents of fix_get_pending_content.sql${NC}"
  echo -e "${BLUE}3. Paste into the SQL Editor and run${NC}"
fi
