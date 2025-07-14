-- This migration adds a user_id column to the jobs and events tables to track record creators.

-- Step 1: Add user_id to the jobs table
-- This column will reference the user who created the job posting.
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Add user_id to the events table
-- This column will reference the user who created the event.
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- Note: We are not backfilling the user_id for existing records as the creator is unknown.
-- All new jobs and events created after this migration will have the user_id populated.
