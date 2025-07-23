-- Migration to update events table with additional fields
-- Run this in your Supabase SQL editor

-- Add missing fields to events table
ALTER TABLE public.events 
  -- Organization info
  ADD COLUMN IF NOT EXISTS organizer_name TEXT,
  ADD COLUMN IF NOT EXISTS organizer_email TEXT,
  ADD COLUMN IF NOT EXISTS organizer_phone TEXT,
  
  -- Event categorization
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  
  -- Location details
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  
  -- Additional event metadata
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
  
-- Update RLS policies to allow these new fields
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
CREATE POLICY "Authenticated users can insert events" 
  ON public.events 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Event creators can update their events" ON public.events;
CREATE POLICY "Event creators can update their events" 
  ON public.events 
  FOR UPDATE 
  USING (auth.uid() = organizer_id);
