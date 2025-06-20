-- Migration for Admin Settings, Roles, and Permissions
-- Created: 2025-06-19

-- Create app_settings table for system-wide settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.app_settings IS 'System-wide application settings';

-- Create custom_roles table for role management
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.custom_roles IS 'Custom user roles for the application';

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  is_system_permission BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.permissions IS 'Available permissions in the system';

-- Create role_permissions join table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);
COMMENT ON TABLE public.role_permissions IS 'Junction table linking roles and permissions';

-- Create user_roles join table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_id)
);
COMMENT ON TABLE public.user_roles IS 'Junction table linking users and roles';

-- Create function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id UUID, p_permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.name = p_permission_name
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS SETOF public.permissions AS $$
BEGIN
  RETURN QUERY
    SELECT DISTINCT p.*
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add a role to a user
CREATE OR REPLACE FUNCTION public.assign_role_to_user(p_user_id UUID, p_role_name VARCHAR, p_admin_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Get the role ID
  SELECT id INTO v_role_id
  FROM public.custom_roles
  WHERE name = p_role_name;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role % does not exist', p_role_name;
  END IF;
  
  -- Insert the user role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role_id, created_by)
  VALUES (p_user_id, v_role_id, p_admin_user_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get a system setting
CREATE OR REPLACE FUNCTION public.get_app_setting(p_key VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM public.app_settings
  WHERE key = p_key;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update a system setting
CREATE OR REPLACE FUNCTION public.update_app_setting(p_key VARCHAR, p_value JSONB, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.app_settings (key, value, updated_by)
  VALUES (p_key, p_value, p_user_id)
  ON CONFLICT (key) DO UPDATE
    SET value = p_value, 
        updated_at = NOW(),
        updated_by = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system roles
INSERT INTO public.custom_roles (name, description, is_system_role)
VALUES 
  ('super_admin', 'Super Administrator with full system access', TRUE),
  ('admin', 'Administrator with management capabilities', TRUE),
  ('alumni', 'Regular alumni user', TRUE),
  ('employer', 'Employer account for job postings', TRUE),
  ('moderator', 'Content moderator', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (name, description, category, is_system_permission)
VALUES
  ('manage_users', 'Create, update, and delete users', 'user_management', TRUE),
  ('view_users', 'View user details', 'user_management', TRUE),
  ('manage_roles', 'Assign and manage user roles', 'user_management', TRUE),
  ('manage_permissions', 'Configure and assign permissions', 'security', TRUE),
  ('manage_settings', 'Configure application settings', 'system', TRUE),
  ('approve_content', 'Approve or reject user-generated content', 'moderation', TRUE),
  ('manage_events', 'Create and manage events', 'events', TRUE),
  ('manage_jobs', 'Create and manage job listings', 'jobs', TRUE),
  ('manage_mentorship', 'Configure mentorship program settings', 'mentorship', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Add default permissions for super_admin role
DO $$
DECLARE
  v_super_admin_id UUID;
  v_permission_id UUID;
  v_permissions VARCHAR[] := ARRAY[
    'manage_users', 'view_users', 'manage_roles', 
    'manage_permissions', 'manage_settings', 'approve_content',
    'manage_events', 'manage_jobs', 'manage_mentorship'
  ];
BEGIN
  -- Get super_admin role ID
  SELECT id INTO v_super_admin_id FROM public.custom_roles WHERE name = 'super_admin';
  
  -- Add all permissions to super_admin
  FOREACH v_permission_name IN ARRAY v_permissions LOOP
    SELECT id INTO v_permission_id FROM public.permissions WHERE name = v_permission_name;
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_super_admin_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  
  -- Add limited permissions to admin role
  SELECT id INTO v_admin_id FROM public.custom_roles WHERE name = 'admin';
  
  v_permissions := ARRAY['manage_users', 'view_users', 'approve_content', 'manage_events', 'manage_jobs'];
  
  FOREACH v_permission_name IN ARRAY v_permissions LOOP
    SELECT id INTO v_permission_id FROM public.permissions WHERE name = v_permission_name;
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_admin_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  
  -- Add limited permissions to moderator role
  SELECT id INTO v_moderator_id FROM public.custom_roles WHERE name = 'moderator';
  
  v_permissions := ARRAY['view_users', 'approve_content'];
  
  FOREACH v_permission_name IN ARRAY v_permissions LOOP
    SELECT id INTO v_permission_id FROM public.permissions WHERE name = v_permission_name;
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_moderator_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
END $$;

-- Enable RLS on all admin tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_settings
CREATE POLICY "Admins can read app settings"
  ON public.app_settings FOR SELECT
  USING (auth.uid() IN (
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.custom_roles cr ON ur.role_id = cr.id
    WHERE cr.name IN ('super_admin', 'admin')
  ));

CREATE POLICY "Super admins can manage app settings"
  ON public.app_settings FOR ALL
  USING (auth.uid() IN (
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.custom_roles cr ON ur.role_id = cr.id
    WHERE cr.name = 'super_admin'
  ));

-- Create RLS policies for roles and permissions
CREATE POLICY "Admins can view roles and permissions"
  ON public.custom_roles FOR SELECT
  USING (auth.uid() IN (
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.custom_roles cr ON ur.role_id = cr.id
    WHERE cr.name IN ('super_admin', 'admin')
  ));

CREATE POLICY "Super admins can manage roles"
  ON public.custom_roles FOR ALL
  USING (auth.uid() IN (
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.custom_roles cr ON ur.role_id = cr.id
    WHERE cr.name = 'super_admin'
  ));

-- Add app settings to Supabase Realtime
BEGIN;
  INSERT INTO supabase_realtime.subscription (name, schema, table, service, claims, filters, created_at)
  VALUES ('admin_settings', 'public', 'app_settings', 'postgres', NULL, NULL, NOW())
  ON CONFLICT (name) DO NOTHING;
COMMIT;
