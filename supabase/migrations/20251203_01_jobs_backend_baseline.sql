-- Jobs backend baseline migration (idempotent)
-- Consolidates uniqueness, index cleanup, and RLS for job_applications / job_bookmarks / job_alerts

BEGIN;

------------------------------------------------------------
-- 1) Uniqueness constraints
------------------------------------------------------------

-- 1.1 job_alerts: canonical UNIQUE (user_id, alert_name)
DO $$
BEGIN
  -- Drop redundant legacy constraint, if present
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_alerts_user_name_unique'
      AND conrelid = 'public.job_alerts'::regclass
  ) THEN
    ALTER TABLE public.job_alerts
      DROP CONSTRAINT job_alerts_user_name_unique;
  END IF;

  -- Ensure canonical constraint exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_alerts_user_alert_name_key'
      AND conrelid = 'public.job_alerts'::regclass
  ) THEN
    ALTER TABLE public.job_alerts
      ADD CONSTRAINT job_alerts_user_alert_name_key
      UNIQUE (user_id, alert_name);
  END IF;
END $$;

-- 1.2 job_applications: UNIQUE (job_id, applicant_id)
DO $$
BEGIN
  -- Ensure canonical constraint exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_applications_job_id_applicant_id_key'
      AND conrelid = 'public.job_applications'::regclass
  ) THEN
    ALTER TABLE public.job_applications
      ADD CONSTRAINT job_applications_job_id_applicant_id_key
      UNIQUE (job_id, applicant_id);
  END IF;

  -- Drop any older duplicate constraint on (job_id, applicant_id)
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_applications_job_applicant_uniq'
      AND conrelid = 'public.job_applications'::regclass
  ) THEN
    ALTER TABLE public.job_applications
      DROP CONSTRAINT job_applications_job_applicant_uniq;
  END IF;
END $$;

-- 1.3 job_bookmarks: UNIQUE (job_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_bookmarks_job_id_user_id_key'
      AND conrelid = 'public.job_bookmarks'::regclass
  ) THEN
    ALTER TABLE public.job_bookmarks
      ADD CONSTRAINT job_bookmarks_job_id_user_id_key
      UNIQUE (job_id, user_id);
  END IF;
END $$;


------------------------------------------------------------
-- 2) Index cleanup: job_applications
------------------------------------------------------------

DO $$
BEGIN
  -- Redundant single-column applicant_id indexes
  IF to_regclass('public.idx_job_applications_applicant') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_applicant;
  END IF;

  IF to_regclass('public.idx_job_applications_applicant_id') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_applicant_id;
  END IF;

  -- Composite applicant_id + job_id (duplicated by UNIQUE(job_id, applicant_id))
  IF to_regclass('public.idx_job_applications_applicant_job') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_applicant_job;
  END IF;

  IF to_regclass('public.job_applications_job_applicant_idx') IS NOT NULL THEN
    DROP INDEX public.job_applications_job_applicant_idx;
  END IF;

  -- Redundant single-column job_id indexes
  IF to_regclass('public.idx_job_applications_job') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_job;
  END IF;

  IF to_regclass('public.idx_job_applications_job_id') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_job_id;
  END IF;

  IF to_regclass('public.idx_job_apps_job_id') IS NOT NULL THEN
    DROP INDEX public.idx_job_apps_job_id;
  END IF;

  IF to_regclass('public.job_applications_job_idx') IS NOT NULL THEN
    DROP INDEX public.job_applications_job_idx;
  END IF;

  -- job_id + created_at: keep only canonical DESC index (idx_ja_job_created_at)
  IF to_regclass('public.idx_job_applications_job_created') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_job_created;
  END IF;

  IF to_regclass('public.idx_job_applications_job_created_at') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_job_created_at;
  END IF;

  -- applicant_id + created_at: keep only canonical DESC index (idx_ja_applicant_created_at)
  IF to_regclass('public.idx_job_applications_user_created') IS NOT NULL THEN
    DROP INDEX public.idx_job_applications_user_created;
  END IF;

  -- NOTE: We intentionally KEEP these indexes (do not drop):
  --   idx_ja_applicant_created_at (applicant_id, created_at DESC)
  --   idx_ja_job_created_at       (job_id, created_at DESC)
  --   idx_job_applications_status (status)
  --   job_applications_job_id_applicant_id_key (UNIQUE)
END $$;


------------------------------------------------------------
-- 3) Index cleanup: job_bookmarks
------------------------------------------------------------

DO $$
BEGIN
  -- Drop extra user_id index (we keep idx_job_bookmarks_user and composite index)
  IF to_regclass('public.idx_job_bookmarks_user_id') IS NOT NULL THEN
    DROP INDEX public.idx_job_bookmarks_user_id;
  END IF;

  -- Drop extra job_id index if there were multiple variants
  IF to_regclass('public.idx_job_bookmarks_job') IS NOT NULL THEN
    DROP INDEX public.idx_job_bookmarks_job;
  END IF;

  -- NOTE: We intentionally KEEP these indexes (do not drop):
  --   idx_job_bookmarks_job_id    (job_id)
  --   idx_job_bookmarks_user      (user_id)
  --   idx_job_bookmarks_user_job  (user_id, job_id)
  --   job_bookmarks_job_id_user_id_key (UNIQUE)
END $$;


------------------------------------------------------------
-- 4) RLS for job_applications
------------------------------------------------------------

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.job_applications
  ENABLE ROW LEVEL SECURITY;

-- Drop any old policies we might conflict with (safe if they don't exist)
DROP POLICY IF EXISTS job_applications_select ON public.job_applications;
DROP POLICY IF EXISTS job_applications_insert ON public.job_applications;
DROP POLICY IF EXISTS job_applications_update ON public.job_applications;
DROP POLICY IF EXISTS job_applications_delete ON public.job_applications;

DROP POLICY IF EXISTS job_applications_select_self ON public.job_applications;
DROP POLICY IF EXISTS job_applications_insert_self ON public.job_applications;
DROP POLICY IF EXISTS job_applications_update_self ON public.job_applications;
DROP POLICY IF EXISTS job_applications_delete_self ON public.job_applications;
DROP POLICY IF EXISTS job_applications_select_job_owner ON public.job_applications;

-- 4.1 Applicant: can SELECT only their own applications
CREATE POLICY job_applications_select_self
ON public.job_applications
FOR SELECT
USING (
  applicant_id = auth.uid()
);

-- 4.2 Applicant: can INSERT only their own applications (or let DB default applicant_id)
CREATE POLICY job_applications_insert_self
ON public.job_applications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    applicant_id = auth.uid()
    OR applicant_id IS NULL
  )
);

-- 4.3 Applicant: can UPDATE only their own applications
CREATE POLICY job_applications_update_self
ON public.job_applications
FOR UPDATE
USING (
  applicant_id = auth.uid()
)
WITH CHECK (
  applicant_id = auth.uid()
);

-- 4.4 Applicant: can DELETE only their own applications
CREATE POLICY job_applications_delete_self
ON public.job_applications
FOR DELETE
USING (
  applicant_id = auth.uid()
);

-- 4.5 Employer / job owner: can SEE applications for their jobs
CREATE POLICY job_applications_select_job_owner
ON public.job_applications
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_applications.job_id
      AND auth.uid() IN (j.created_by, j.posted_by, j.user_id)
  )
);

COMMIT;
