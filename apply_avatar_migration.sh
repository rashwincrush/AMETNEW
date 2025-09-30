#!/bin/bash

# Apply the avatar migration to add avatar_url to v_my_dm_threads view
# Run this from the project root

echo "Applying migration to add avatar_url to v_my_dm_threads view..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI not found. Please install it first."
    echo "Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Apply the migration
supabase db push

echo "Migration applied successfully!"
echo ""
echo "The v_my_dm_threads view now includes:"
echo "  - other_user_avatar_url (profile picture)"
echo ""
echo "This will fix:"
echo "  ✓ Missing avatars in Chats tab"
echo "  ✓ Conversation list will show profile pictures"
echo ""
echo "Please refresh your browser to see the changes."
