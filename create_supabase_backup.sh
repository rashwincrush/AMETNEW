#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Your Supabase project reference ID
PROJECT_REF="gvbtfolcizkzihforqte"

# Get the current date and time to create a unique backup folder
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_ROOT_DIR="supabase/backups"
BACKUP_DIR="$BACKUP_ROOT_DIR/$TIMESTAMP"

# --- Main Script ---

echo "Starting Supabase backup for project: $PROJECT_REF"
echo "Backup will be saved to: $BACKUP_DIR"

# 1. Verify Authentication
echo -e "\nStep 1: Verifying Supabase authentication..."
# We will run a command that requires auth. If it fails, the script will stop.
supabase projects list > /dev/null || {
    echo -e "\n❌ Authentication check failed."
    echo "Please make sure you are logged in by running 'supabase login' and try again."
    exit 1
}
echo "Authentication successful."

# 2. Create the backup directory
echo -e "\nStep 2: Creating backup directory..."
mkdir -p "$BACKUP_DIR/storage"
echo "Directory '$BACKUP_DIR' created."

# 3. Dump the database schema# 3. Backup Database
DB_BACKUP_FILE="$BACKUP_DIR/database_dump.sql"
echo -e "\nStep 3: Dumping database to $DB_BACKUP_FILE..."

# Prompt for the database password securely and construct the connection string
echo -n "Enter your Supabase database password: "
read -s DB_PASSWORD
echo "" # Move to the next line after password input

DB_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Dump the database using the connection string
supabase db dump --db-url "$DB_URL" -f "$DB_BACKUP_FILE"
if [ $? -eq 0 ]; then
    echo "Database dump complete."
else
    echo "Database dump failed. Please check your password and network connection."
    exit 1
fi

# 4. Backup Storage
echo -e "\nStep 4: Backing up Supabase Storage..."
# Get all bucket names, skipping the header line
BUCKETS=$(supabase storage ls | awk 'NR>1 {print $2}')

if [ -z "$BUCKETS" ]; then
    echo "No storage buckets found."
else
    for BUCKET in $BUCKETS; do
        echo "  - Backing up bucket: $BUCKET"
        # Use recursive copy to download the entire bucket
        supabase storage cp -r "$BUCKET" "$BACKUP_DIR/storage/"
        echo "    ...done."
    done
fi
echo "Storage backup complete."

# --- Completion ---
echo -e "\n----------------------------------------"
echo "✅ Supabase backup completed successfully!"
echo "Backup files are located in: $BACKUP_DIR"
echo "----------------------------------------"
echo -e "\n⚠️ IMPORTANT SECURITY WARNING ⚠️"
echo "The backup files contain sensitive data. DO NOT commit them to your Git repository."
echo "Make sure the path '$BACKUP_ROOT_DIR' is included in your .gitignore file."
