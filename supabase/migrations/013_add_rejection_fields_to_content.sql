-- Add is_rejected and rejection_reason columns to the jobs, events, and groups tables

-- Add columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.jobs.is_rejected IS 'Flag to mark a job post as rejected by an admin.';
COMMENT ON COLUMN public.jobs.rejection_reason IS 'Reason provided by the admin for rejecting a job post.';

-- Add columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.events.is_rejected IS 'Flag to mark an event as rejected by an admin.';
COMMENT ON COLUMN public.events.rejection_reason IS 'Reason provided by the admin for rejecting an event.';

-- Add columns to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.groups.is_rejected IS 'Flag to mark a group as rejected by an admin.';
COMMENT ON COLUMN public.groups.rejection_reason IS 'Reason provided by the admin for rejecting a group.';

-- Note: Policies for these tables might need to be updated to allow admins to modify these new columns.
-- The existing policies might be sufficient, but review them if you encounter permission issues.
