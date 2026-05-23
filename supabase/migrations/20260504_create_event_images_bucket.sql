-- Migration: Create event-images storage bucket with RLS policies
-- Created: 2026-05-04
-- Purpose: Fix storage RLS for event image uploads

-- Step 1: Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,  -- Public bucket for event cover images
  5242880,  -- 5MB max file size
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for event-images bucket

-- Policy 1: Allow authenticated users to upload event images
CREATE POLICY "event_images_upload_own" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'event-images' 
  AND (
    -- User is creating an event (check via events table ownership)
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE creator_id = auth.uid() 
      AND id::text = (storage.objects.name)::text 
    )
    OR 
    -- Allow upload for any authenticated user (fallback for new events)
    -- The image path should contain the user ID for ownership
    (storage.objects.name)::text LIKE '%' || auth.uid()::text || '%'
  )
);

-- Policy 2: Allow users to update their own event images
CREATE POLICY "event_images_update_own" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'event-images' 
  AND (storage.objects.name)::text LIKE '%' || auth.uid()::text || '%'
)
WITH CHECK (
  bucket_id = 'event-images'
);

-- Policy 3: Allow users to delete their own event images
CREATE POLICY "event_images_delete_own" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'event-images' 
  AND (storage.objects.name)::text LIKE '%' || auth.uid()::text || '%'
);

-- Policy 4: Allow anyone to view event images (public access for viewing)
CREATE POLICY "event_images_select_public" 
ON storage.objects 
FOR SELECT 
TO public 
USING (
  bucket_id = 'event-images'
);

-- Policy 5: Allow admins to manage all event images
CREATE POLICY "event_images_admin_all" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (
  bucket_id = 'event-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR role IN ('admin', 'super_admin'))
  )
);

-- Step 4: Add helpful comments
COMMENT ON POLICY "event_images_upload_own" ON storage.objects IS 'Allow authenticated users to upload event images they own';
COMMENT ON POLICY "event_images_update_own" ON storage.objects IS 'Allow users to update their own event images';
COMMENT ON POLICY "event_images_delete_own" ON storage.objects IS 'Allow users to delete their own event images';
COMMENT ON POLICY "event_images_select_public" ON storage.objects IS 'Allow public access to view event images';
COMMENT ON POLICY "event_images_admin_all" ON storage.objects IS 'Allow admins to manage all event images';
