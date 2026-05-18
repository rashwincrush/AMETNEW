-- ============================================================================
-- STORAGE BUCKET: offer-letters
-- Description: Private storage bucket for employer-uploaded offer letter PDFs
-- Requirements: Run as superuser or via Supabase dashboard SQL editor
-- ============================================================================

-- Create the storage bucket (private — files accessed via signed URLs only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-letters',
  'offer-letters',
  false,   -- PRIVATE: employer uploads, applicant downloads via signed URL
  10485760, -- 10MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- Enable RLS on storage.objects (idempotent)
alter table storage.objects enable row level security;

-- Drop old policies to allow clean re-runs
drop policy if exists "offer-letters_select_employer" on storage.objects;
drop policy if exists "offer-letters_select_applicant" on storage.objects;
drop policy if exists "offer-letters_insert_employer" on storage.objects;
drop policy if exists "offer-letters_delete_employer" on storage.objects;

-- Employers can upload to their own folder (employer_id/...)
create policy "offer-letters_insert_employer"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'offer-letters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Employers can read files they uploaded
create policy "offer-letters_select_employer"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'offer-letters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Applicants can read offer letters addressed to them
-- File path convention: {employer_id}/{applicant_id}/{filename}
create policy "offer-letters_select_applicant"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'offer-letters'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Employers can delete their own files
create policy "offer-letters_delete_employer"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'offer-letters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- USAGE NOTES:
-- 1. Bucket is PRIVATE — never expose public URLs
-- 2. Use supabase.storage.from('offer-letters').createSignedUrl(path, 3600)
--    to generate temporary download URLs for applicants
-- 3. Upload path convention: {employer_user_id}/{applicant_user_id}/{uuid}-{filename}
-- 4. The offer_letters table (job_applications related) stores the file_path
-- ============================================================================
