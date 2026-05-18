-- ============================================================================
-- STORAGE BUCKET: message-attachments
-- Description: Storage bucket for DM message attachments
-- Requirements: Run this as a superuser or via Supabase dashboard SQL editor
-- ============================================================================

-- Create the storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  true,
  10485760, -- 10MB in bytes
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

-- Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Drop existing policies if they exist (to avoid conflicts during re-runs)
drop policy if exists "message-attachments_select" on storage.objects;
drop policy if exists "message-attachments_insert" on storage.objects;
drop policy if exists "message-attachments_delete" on storage.objects;

-- Policy: Anyone can read attachments (files are public)
create policy "message-attachments_select"
  on storage.objects for select
  using (bucket_id = 'message-attachments');

-- Policy: Authenticated users can upload to their own folder
create policy "message-attachments_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can only delete their own files
create policy "message-attachments_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- USAGE NOTES:
-- 1. File size limit is enforced at the bucket level (10MB)
-- 2. MIME type restrictions are enforced at the bucket level
-- 3. Users can only upload to their own folder (user_id/thread_id/filename)
-- 4. Users can only delete their own files
-- 5. Files are publicly readable (needed for message display)
-- ============================================================================
