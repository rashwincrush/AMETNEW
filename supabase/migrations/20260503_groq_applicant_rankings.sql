-- Migration: groq_applicant_rankings table and supporting RPCs
-- Used by ManageJobApplications.js for AI-powered applicant ranking via Groq

begin;

-- ──────────────────────────────────────────────────────────
-- 1. Table
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groq_applicant_rankings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  summary         TEXT,
  ranked_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_groq_rankings_job_id       ON public.groq_applicant_rankings(job_id);
CREATE INDEX IF NOT EXISTS idx_groq_rankings_applicant_id ON public.groq_applicant_rankings(applicant_id);
CREATE INDEX IF NOT EXISTS idx_groq_rankings_score        ON public.groq_applicant_rankings(job_id, score DESC);

COMMENT ON TABLE public.groq_applicant_rankings IS 'AI-generated applicant rankings per job, generated via Groq llama3-70b-8192';

-- ──────────────────────────────────────────────────────────
-- 2. RLS
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.groq_applicant_rankings ENABLE ROW LEVEL SECURITY;

-- Employers can read rankings for their own jobs
CREATE POLICY IF NOT EXISTS "rankings_select_by_job_owner"
  ON public.groq_applicant_rankings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = groq_applicant_rankings.job_id
        AND j.posted_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- Employers can insert/update rankings for their own jobs (done via upsert RPC below)
CREATE POLICY IF NOT EXISTS "rankings_insert_by_job_owner"
  ON public.groq_applicant_rankings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = groq_applicant_rankings.job_id
        AND j.posted_by = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "rankings_update_by_job_owner"
  ON public.groq_applicant_rankings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = groq_applicant_rankings.job_id
        AND j.posted_by = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "rankings_delete_by_job_owner"
  ON public.groq_applicant_rankings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = groq_applicant_rankings.job_id
        AND j.posted_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- ──────────────────────────────────────────────────────────
-- 3. RPC: get_applicant_rankings_for_job
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_applicant_rankings_for_job(p_job_id UUID)
RETURNS TABLE (
  applicant_id    UUID,
  application_id  UUID,
  score           INTEGER,
  summary         TEXT,
  ranked_at       TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.applicant_id,
    r.application_id,
    r.score,
    r.summary,
    r.ranked_at
  FROM public.groq_applicant_rankings r
  WHERE r.job_id = p_job_id
  ORDER BY r.score DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_applicant_rankings_for_job(UUID) TO authenticated;

-- ──────────────────────────────────────────────────────────
-- 4. RPC: upsert_applicant_ranking
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_applicant_ranking(
  p_job_id        UUID,
  p_applicant_id  UUID,
  p_application_id UUID,
  p_score         INTEGER,
  p_summary       TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
BEGIN
  -- Verify caller owns the job or is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = p_job_id
      AND j.posted_by = v_caller_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_caller_id
      AND p.role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO public.groq_applicant_rankings
    (job_id, applicant_id, application_id, score, summary, ranked_at)
  VALUES
    (p_job_id, p_applicant_id, p_application_id, p_score, p_summary, now())
  ON CONFLICT (job_id, applicant_id)
  DO UPDATE SET
    score          = EXCLUDED.score,
    summary        = EXCLUDED.summary,
    ranked_at      = now(),
    application_id = EXCLUDED.application_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_applicant_ranking(UUID, UUID, UUID, INTEGER, TEXT) TO authenticated;

-- ──────────────────────────────────────────────────────────
-- 5. RPC: clear_applicant_rankings
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clear_applicant_rankings(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
BEGIN
  -- Verify caller owns the job or is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = p_job_id
      AND j.posted_by = v_caller_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_caller_id
      AND p.role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  DELETE FROM public.groq_applicant_rankings
  WHERE job_id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_applicant_rankings(UUID) TO authenticated;

commit;
