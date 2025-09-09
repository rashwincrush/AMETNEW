-- Groups, Group Posts, Group Members RLS adjustments for Archived behavior and CTA parity
-- Date: 2025-09-09

-- Ensure column exists (harmless if already added)
ALTER TABLE IF EXISTS public.groups
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_groups_archived_created
  ON public.groups (is_archived, created_at DESC);

-- Enable RLS (safe if already enabled)
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_post_reports ENABLE ROW LEVEL SECURITY;

-- Drop permissive dev policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='groups' AND policyname='dev_groups_select'
  ) THEN
    DROP POLICY "dev_groups_select" ON public.groups;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_members' AND policyname='dev_group_members_select'
  ) THEN
    DROP POLICY "dev_group_members_select" ON public.group_members;
  END IF;
  -- Replace group_posts_select with archived-aware variant if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_posts' AND policyname='group_posts_select'
  ) THEN
    DROP POLICY "group_posts_select" ON public.group_posts;
  END IF;
  -- Replace group_posts_insert with archived-aware variant if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_posts' AND policyname='group_posts_insert'
  ) THEN
    DROP POLICY "group_posts_insert" ON public.group_posts;
  END IF;
END$$;

-- Select on groups: Non-admins cannot see archived groups; admins and group-admins can see all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='groups' AND policyname='groups_select_archived'
  ) THEN
    CREATE POLICY "groups_select_archived" ON public.groups
      FOR SELECT TO authenticated
      USING (
        -- Site admins can read any group
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
        )
        OR
        -- Group admins can read their group
        EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
        )
        OR
        -- Everyone else: only non-archived groups
        (groups.is_archived = false)
      );
  END IF;
END$$;

-- Select on group_posts:
--  - Admins or group-admins can read regardless of archived
--  - Others can read only when group is NOT archived and (public & approved) OR member
CREATE POLICY "group_posts_select_archived" ON public.group_posts
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id
        AND (
          -- Site admins
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
          )
          OR
          -- Group admins
          EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = g.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
          )
          OR
          -- Public & approved and not archived
          (
            g.is_archived = false
            AND (
              (g.is_private = false AND g.is_approved = true)
              OR EXISTS (
                SELECT 1 FROM public.group_members gm2
                WHERE gm2.group_id = g.id AND gm2.user_id = auth.uid()
              )
            )
          )
        )
    )
  );

-- Insert on group_posts:
--  - Block inserts if the group is archived, even for admins (UI also blocks)
--  - Require membership; if g.is_admin_only_posts then require group admin role
CREATE POLICY "group_posts_insert_archived" ON public.group_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id
        AND g.is_archived = false
        AND (
          (g.is_admin_only_posts = true AND EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = g.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
          ))
          OR
          (g.is_admin_only_posts = false AND EXISTS (
            SELECT 1 FROM public.group_members gm2
            WHERE gm2.group_id = g.id AND gm2.user_id = auth.uid()
          ))
        )
    )
  );

-- Self-join policy for public groups only when approved and not archived
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_members' AND policyname='group_members_self_join_public'
  ) THEN
    DROP POLICY "group_members_self_join_public" ON public.group_members;
  END IF;
  CREATE POLICY "group_members_self_join_public" ON public.group_members
    FOR INSERT TO authenticated
    WITH CHECK (
      group_members.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members.group_id
          AND g.is_private = false
          AND g.is_approved = true
          AND g.is_archived = false
      )
    );
END$$;

-- Admins and group-admins can add members (e.g., invite to private groups)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_members' AND policyname='group_members_admin_add'
  ) THEN
    DROP POLICY "group_members_admin_add" ON public.group_members;
  END IF;
  CREATE POLICY "group_members_admin_add" ON public.group_members
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
      )
    );
END$$;

-- Reporting table RLS (admins only for reading/updating; any authenticated can file a report)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_post_reports' AND policyname='gpr_insert_own'
  ) THEN
    CREATE POLICY "gpr_insert_own" ON public.group_post_reports
      FOR INSERT TO authenticated
      WITH CHECK (reporter_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_post_reports' AND policyname='gpr_select_admins'
  ) THEN
    CREATE POLICY "gpr_select_admins" ON public.group_post_reports
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='group_post_reports' AND policyname='gpr_update_admins'
  ) THEN
    CREATE POLICY "gpr_update_admins" ON public.group_post_reports
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
        )
      );
  END IF;
END$$;
