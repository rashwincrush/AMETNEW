-- Create content_approvals table for managing content moderation
CREATE TABLE IF NOT EXISTS public.content_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'event', 'job', 'profile', 'image')),
  content_id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  creator_id UUID REFERENCES public.profiles(id),
  reviewer_id UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Add RLS policies
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

-- Allow admin and moderators to read all content approvals
CREATE POLICY "Admins and moderators can view all content approvals" 
  ON public.content_approvals
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Allow content creators to read their own content approvals
CREATE POLICY "Users can view their own content approvals" 
  ON public.content_approvals
  FOR SELECT 
  USING (auth.uid() = creator_id);

-- Allow all authenticated users to create content approval requests
CREATE POLICY "Users can create content approval requests" 
  ON public.content_approvals
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);
  
-- Allow admins and moderators to update content approval status
CREATE POLICY "Admins and moderators can update content approval status" 
  ON public.content_approvals
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Add is_verified, verified_at, verified_by fields to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified_at') THEN
    ALTER TABLE public.profiles ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified_by') THEN
    ALTER TABLE public.profiles ADD COLUMN verified_by UUID REFERENCES public.profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_rejected') THEN
    ALTER TABLE public.profiles ADD COLUMN is_rejected BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.profiles ADD COLUMN rejection_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rejected_at') THEN
    ALTER TABLE public.profiles ADD COLUMN rejected_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rejected_by') THEN
    ALTER TABLE public.profiles ADD COLUMN rejected_by UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role_permissions junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Insert default roles if they don't exist
INSERT INTO public.roles (name, description) 
VALUES 
  ('super_admin', 'Super Administrator'),
  ('admin', 'Administrator'),
  ('moderator', 'Content Moderator'),
  ('employer', 'Employer'),
  ('alumni', 'AMET Alumni'),
  ('student', 'Current Student'),
  ('user', 'Standard User')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (name, description)
VALUES
  ('manage_roles', 'Assign and manage user roles'),
  ('manage_permissions', 'Configure role permissions'),
  ('manage_settings', 'Change system-wide settings'),
  ('approve_users', 'Approve or reject user registrations'),
  ('approve_content', 'Moderate and approve user-generated content'),
  ('create_events', 'Create and publish events'),
  ('manage_jobs', 'Manage job listings'),
  ('view_analytics', 'View system analytics and reports')
ON CONFLICT (name) DO NOTHING;

-- Assign default permissions to roles
DO $$
DECLARE
  super_admin_id UUID;
  admin_id UUID;
  moderator_id UUID;
  permission_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'super_admin';
  SELECT id INTO admin_id FROM public.roles WHERE name = 'admin';
  SELECT id INTO moderator_id FROM public.roles WHERE name = 'moderator';
  
  -- Assign all permissions to super_admin
  FOR permission_id IN SELECT id FROM public.permissions LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (super_admin_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  
  -- Assign selected permissions to admin
  FOR permission_id IN SELECT id FROM public.permissions WHERE name IN ('manage_roles', 'approve_users', 'approve_content', 'view_analytics') LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (admin_id, permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  
  -- Assign content moderation permission to moderator
  SELECT id INTO permission_id FROM public.permissions WHERE name = 'approve_content';
  INSERT INTO public.role_permissions (role_id, permission_id)
  VALUES (moderator_id, permission_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role = r.name
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE p.id = user_id AND perm.name = permission_name
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
