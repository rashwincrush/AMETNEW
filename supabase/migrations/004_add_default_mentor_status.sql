-- Add a default value to the status column in the mentors table.
-- This ensures that new mentor profiles are created with a 'pending' status by default,
-- preventing violations of the mentors_status_check constraint.
ALTER TABLE public.mentors
  ALTER COLUMN status SET DEFAULT 'pending';
