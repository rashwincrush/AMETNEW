-- 012_add_event_groups_table.sql
-- Purpose: Create event_groups table for event-group associations

-- Create event_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  group_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(event_id, group_id)
);

-- Add RLS policy for event_groups
ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Users can read event groups" ON public.event_groups
  FOR SELECT USING (auth.role() = 'authenticated');
  
-- Allow insert/update/delete for admins only
CREATE POLICY "Admins can manage event groups" ON public.event_groups
  FOR ALL USING (auth.role() = 'authenticated' AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  ));
