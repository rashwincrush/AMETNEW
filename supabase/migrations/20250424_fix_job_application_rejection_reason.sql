-- GAP 1: Job Application Rejection Reason
-- Adds rejection_reason and employer_internal_notes columns to job_applications
-- Updates set_application_status RPC to accept and store these values
-- Adds notification trigger for rejected applications with reason

-- Step 1: Add new columns to job_applications table
ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS employer_internal_notes TEXT;

COMMENT ON COLUMN public.job_applications.rejection_reason IS 'Reason provided by employer when rejecting an application. Visible to the applicant.';
COMMENT ON COLUMN public.job_applications.employer_internal_notes IS 'Private notes for employer use only. Never shown to applicants.';

-- Step 2: Create index for faster queries on rejection_reason
CREATE INDEX IF NOT EXISTS idx_job_applications_rejection_reason 
  ON public.job_applications(rejection_reason) 
  WHERE rejection_reason IS NOT NULL;

-- Step 3: Update set_application_status RPC to accept and store rejection reason and internal notes
CREATE OR REPLACE FUNCTION public.set_application_status(
  p_application_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL,
  p_internal_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid          uuid := auth.uid();
  v_role         text := public.get_user_role(v_uid);
  v_old_status   text;
  v_job_id       uuid;
  v_applicant_id uuid;
  v_is_owner     boolean;
  v_job_title    text;
BEGIN
  -- Validate canonical status
  IF NOT public.is_valid_application_status(p_status) THEN
    RAISE EXCEPTION 'Invalid application status: %', p_status
      USING ERRCODE = 'P0001';
  END IF;

  -- Lock and fetch current state
  SELECT status, job_id, applicant_id
  INTO v_old_status, v_job_id, v_applicant_id
  FROM public.job_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0001';
  END IF;

  -- Get job title for notification
  SELECT title INTO v_job_title
  FROM public.jobs
  WHERE id = v_job_id;

  -- Ownership check for employers; admins bypass
  SELECT (v_uid IN (j.created_by, j.posted_by, j.user_id))
  INTO v_is_owner
  FROM public.jobs j
  WHERE j.id = v_job_id;

  IF v_role NOT IN ('admin','super_admin') AND NOT COALESCE(v_is_owner, false) THEN
    RAISE EXCEPTION 'Not authorized to change this application status'
      USING ERRCODE = '42501';
  END IF;

  -- Apply update with new columns
  UPDATE public.job_applications
  SET status = p_status,
      -- Only store rejection_reason if status is rejected
      rejection_reason = CASE 
        WHEN p_status = 'rejected' THEN p_rejection_reason 
        ELSE NULL 
      END,
      -- Store internal notes (only for employer view)
      employer_internal_notes = p_internal_notes,
      updated_at = NOW()
  WHERE id = p_application_id;

  -- Send notification if rejected with a reason
  IF p_status = 'rejected' AND p_rejection_reason IS NOT NULL AND p_rejection_reason <> '' THEN
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      link,
      metadata
    ) VALUES (
      v_applicant_id,
      v_uid,
      'job_application_rejected',
      'Application Rejected: ' || COALESCE(v_job_title, 'Position'),
      'Your application was not selected. Feedback: ' || LEFT(p_rejection_reason, 100) || 
        CASE WHEN LENGTH(p_rejection_reason) > 100 THEN '...' ELSE '' END,
      '/jobs/my-applications',
      jsonb_build_object(
        'application_id', p_application_id,
        'job_id', v_job_id,
        'job_title', v_job_title,
        'rejection_reason', p_rejection_reason,
        'old_status', v_old_status,
        'new_status', p_status
      )
    );
  END IF;

  -- Audit
  INSERT INTO public.job_application_audit (
    application_id,
    job_id,
    applicant_id,
    actor_id,
    actor_role,
    source,
    old_status,
    new_status,
    reason,
    metadata
  ) VALUES (
    p_application_id,
    v_job_id,
    v_applicant_id,
    v_uid,
    v_role,
    CASE WHEN v_role IN ('admin','super_admin') THEN 'admin' ELSE 'employer' END,
    v_old_status,
    p_status,
    COALESCE(p_notes, p_rejection_reason),
    jsonb_build_object(
      'origin', 'set_application_status',
      'rejection_reason', p_rejection_reason,
      'internal_notes', p_internal_notes
    )
  );
END;
$$;

-- Step 4: Grant permissions on the updated function
GRANT ALL ON FUNCTION public.set_application_status(UUID, TEXT, TEXT, TEXT, TEXT) TO "anon";
GRANT ALL ON FUNCTION public.set_application_status(UUID, TEXT, TEXT, TEXT, TEXT) TO "authenticated";
GRANT ALL ON FUNCTION public.set_application_status(UUID, TEXT, TEXT, TEXT, TEXT) TO "service_role";

-- Step 5: Update RLS policy to ensure applicants can read their own rejection_reason
-- (Standard RLS on job_applications should already allow this, but ensuring it's clear)
DO $$
BEGIN
  -- Check if the policy exists and update if needed
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'job_applications' 
    AND policyname = 'job_applications_select'
  ) THEN
    -- Policy exists, no changes needed as applicants should already see their own applications
    RAISE NOTICE 'RLS policy job_applications_select exists - applicants can already read their own data';
  END IF;
END $$;

-- Step 6: Create helper function to get application with rejection details for applicant view
CREATE OR REPLACE FUNCTION public.get_application_with_feedback(p_application_id UUID)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  applicant_id UUID,
  status TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    ja.id,
    ja.job_id,
    ja.applicant_id,
    ja.status,
    ja.rejection_reason,
    ja.created_at,
    ja.updated_at
  FROM public.job_applications ja
  WHERE ja.id = p_application_id
    AND ja.applicant_id = auth.uid()
    AND ja.status = 'rejected';
$$;

GRANT ALL ON FUNCTION public.get_application_with_feedback(UUID) TO "authenticated";

-- Step 7: Update get_applications_for_job_v2 RPC to include rejection_reason and employer_internal_notes
-- This is needed so employers can see the rejection reasons they provided
CREATE OR REPLACE FUNCTION public.get_applications_for_job_v2(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  applicant_id UUID,
  job_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  applicant_name TEXT,
  applicant_email TEXT,
  resume_url TEXT,
  rejection_reason TEXT,
  employer_internal_notes TEXT,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  with role_name as (
    select coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'alumni'
    ) as r
  ),
  owner_ok as (
    select 1
    from public.jobs j, role_name rn
    where j.id = p_job_id
      and (
        rn.r in ('admin','super_admin')
        or j.created_by = auth.uid()
        or j.posted_by  = auth.uid()
        or j.user_id    = auth.uid()
      )
  ),
  base as (
    select
      a.id, a.applicant_id, a.job_id, a.status, a.created_at, a.resume_url,
      a.rejection_reason,  -- NEW COLUMN
      a.employer_internal_notes,  -- NEW COLUMN
      coalesce(p.full_name, concat_ws(' ', p.first_name, p.last_name)) as applicant_name,
      p.email as applicant_email
    from public.job_applications a
    join owner_ok ok on true
    left join public.profiles p on p.id = a.applicant_id
    where a.job_id = p_job_id
  )
  select
    b.id, b.applicant_id, b.job_id, b.status, b.created_at,
    b.applicant_name, b.applicant_email, b.resume_url,
    b.rejection_reason, b.employer_internal_notes,  -- NEW COLUMNS
    count(*) over() as total_count
  from base b
  order by b.created_at desc
  limit greatest(p_limit,0) offset greatest(p_offset,0);
$$;

-- Grant permissions on updated function
GRANT ALL ON FUNCTION public.get_applications_for_job_v2(UUID, INTEGER, INTEGER) TO "anon";
GRANT ALL ON FUNCTION public.get_applications_for_job_v2(UUID, INTEGER, INTEGER) TO "authenticated";
GRANT ALL ON FUNCTION public.get_applications_for_job_v2(UUID, INTEGER, INTEGER) TO "service_role";

-- Migration complete
