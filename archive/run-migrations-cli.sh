#!/bin/bash

# Run migrations using supabase CLI
# This script applies SQL migrations to the Supabase project

# Source environment variables from .env file
if [ -f ".env" ]; then
    echo "Loading environment variables from .env"
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Will rely on Supabase CLI's login state."
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI not found. Please install it first."
    echo "Follow installation instructions at: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Run migrations using the Supabase CLI
echo "Running migrations using Supabase CLI..."
supabase db push

# Check if the command was successful
if [ $? -ne 0 ]; then
    echo "Error running migrations with the Supabase CLI."
    exit 1
fi

echo "Migrations completed successfully."
