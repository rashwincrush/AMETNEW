#!/bin/bash

# Run migrations for Alumni Management System
# This script applies SQL migrations to the Supabase database

# Display migration start
echo "Starting Supabase migrations..."

# Source environment variables from .env file
if [ -f ".env" ]; then
    echo "Loading environment variables from .env"
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Please create one with SUPABASE_URL and SUPABASE_KEY variables."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set."
    exit 1
fi

# Directory containing migration files
MIGRATIONS_DIR="./supabase/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Error: Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# Function to run a SQL migration file
run_migration() {
    local file="$1"
    echo "Applying migration: $file"
    
    # Read SQL file content
    SQL=$(cat "$file")
    
    # Execute SQL using Supabase REST API
    curl -X POST \
         -H "apikey: $SUPABASE_KEY" \
         -H "Authorization: Bearer $SUPABASE_KEY" \
         -H "Content-Type: application/json" \
         -d "{\"query\": \"$SQL\"}" \
         "$SUPABASE_URL/rest/v1/rpc/exec_sql" 
    
    local result=$?
    if [ $result -ne 0 ]; then
        echo "Failed to apply migration: $file"
        return 1
    fi
    
    echo "Migration applied successfully: $file"
    return 0
}

# Process each migration file in order
echo "Finding migration files..."
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)

if [ -z "$MIGRATION_FILES" ]; then
    echo "No migration files found in $MIGRATIONS_DIR"
    exit 1
fi

echo "Found $(echo "$MIGRATION_FILES" | wc -l) migration files to apply."

# Run each migration
success=true
for file in $MIGRATION_FILES; do
    run_migration "$file"
    if [ $? -ne 0 ]; then
        success=false
        echo "Migration failed: $file"
        # Continue with other migrations
    fi
done

if [ "$success" = true ]; then
    echo "All migrations applied successfully!"
else
    echo "Some migrations failed. Check the logs above for details."
    exit 1
fi

echo "Migration process completed."
