-- ==========================================
-- Migration: Directory and Logging Fixes (2025-09-08)
-- Purpose:
--  1) Make education_history queriable by profile_id as used by the frontend
--  2) Make user_activity_logs accept columns: route, meta, ua as used by the frontend
--  3) Keep existing columns (metadata, user_agent) in sync for compatibility
-- ==========================================

-- 1) education_history: add profile_id (alias for user_id), FK + index, backfill
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_history' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE public.education_history
      ADD COLUMN profile_id uuid;

    -- Backfill: in this schema profiles.id equals the auth/user id; user_id here refers to profiles.id
    UPDATE public.education_history
      SET profile_id = user_id
      WHERE profile_id IS NULL;

    -- Add FK constraint (set null on profile deletion)
    ALTER TABLE public.education_history
      ADD CONSTRAINT education_history_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

    -- Helpful index for lookups by profile_id
    CREATE INDEX IF NOT EXISTS idx_education_history_profile_id
      ON public.education_history (profile_id);
  END IF;
END$$;


-- 2) user_activity_logs: add columns expected by frontend: route, meta, ua
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_activity_logs' AND column_name = 'route'
  ) THEN
    ALTER TABLE public.user_activity_logs ADD COLUMN route text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_activity_logs' AND column_name = 'meta'
  ) THEN
    ALTER TABLE public.user_activity_logs ADD COLUMN meta jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_activity_logs' AND column_name = 'ua'
  ) THEN
    ALTER TABLE public.user_activity_logs ADD COLUMN ua text;
  END IF;
END$$;

-- Keep values in sync between alias columns (meta, ua) and existing columns (metadata, user_agent)
CREATE OR REPLACE FUNCTION public.user_activity_logs_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- When alias values provided, copy into the canonical columns
  IF NEW.meta IS NOT NULL THEN
    NEW.metadata := NEW.meta;
  END IF;
  IF NEW.ua IS NOT NULL THEN
    NEW.user_agent := NEW.ua;
  END IF;

  -- When alias values are NULL but canonical present, mirror into alias for readbacks
  IF NEW.meta IS NULL AND NEW.metadata IS NOT NULL THEN
    NEW.meta := NEW.metadata;
  END IF;
  IF NEW.ua IS NULL AND NEW.user_agent IS NOT NULL THEN
    NEW.ua := NEW.user_agent;
  END IF;

  RETURN NEW;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_activity_logs_sync'
  ) THEN
    CREATE TRIGGER trg_user_activity_logs_sync
    BEFORE INSERT OR UPDATE ON public.user_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.user_activity_logs_sync();
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ual_created_at ON public.user_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ual_action ON public.user_activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_ual_user ON public.user_activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ual_route ON public.user_activity_logs (route);
