#!/bin/bash

# Source .env file if it exists in the frontend directory
FRONTEND_DIR="$(dirname "$0")/frontend"
if [ -f "$FRONTEND_DIR/.env" ]; then
  echo "Sourcing environment variables from .env file."
  set -a # automatically export all variables
  source "$FRONTEND_DIR/.env"
  set +a
fi

# Check if REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY are in the environment
if [ -z "$REACT_APP_SUPABASE_URL" ] || [ -z "$REACT_APP_SUPABASE_KEY" ]; then
  echo "Supabase environment variables not found in the environment."
  echo "Please enter the required information:"
  
  # Ask for Supabase URL if not provided
  if [ -z "$REACT_APP_SUPABASE_URL" ]; then
    read -p "Enter your Supabase URL: " REACT_APP_SUPABASE_URL
    export REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
  fi
  
  # Ask for Supabase Key if not provided
  if [ -z "$REACT_APP_SUPABASE_KEY" ]; then
    read -p "Enter your Supabase API Key: " REACT_APP_SUPABASE_KEY
    export REACT_APP_SUPABASE_KEY=$REACT_APP_SUPABASE_KEY
  fi
fi

# Change directory to frontend and start the app with the specified port
cd "$(dirname "$0")/frontend"
PORT=3000 npm start
