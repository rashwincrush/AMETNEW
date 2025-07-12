-- Create a storage bucket for profile avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (name) do nothing;

-- Set up access controls for avatars
create policy "Public Access"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "User can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "User can update their own avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars')
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatars
create policy "User can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);
