-- GAP 2: Offer Letter Backend
-- Creates offer_letters table, storage bucket policies, and RPCs

-- Step 1: Create offer_letters table
CREATE TABLE IF NOT EXISTS public.offer_letters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT,
  notes TEXT,
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','viewed','accepted','declined')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offer_letters_application_id ON public.offer_letters(application_id);
CREATE INDEX IF NOT EXISTS idx_offer_letters_job_id ON public.offer_letters(job_id);
CREATE INDEX IF NOT EXISTS idx_offer_letters_sent_by ON public.offer_letters(sent_by);

-- Comments
COMMENT ON TABLE public.offer_letters IS 'Stores offer letters sent by employers to job applicants';
COMMENT ON COLUMN public.offer_letters.file_path IS 'Storage path in offer-letters bucket';
COMMENT ON COLUMN public.offer_letters.status IS 'pending=just sent, viewed=opened by applicant, accepted=applicant accepted, declined=applicant declined';

-- Step 2: RLS Policies for offer_letters table
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;

-- Employers can insert their own offer letters (must own the job)
CREATE POLICY IF NOT EXISTS "offer_letters_insert_by_job_owner"
  ON public.offer_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sent_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND (j.created_by = auth.uid() OR j.posted_by = auth.uid() OR j.user_id = auth.uid())
    )
  );

-- Employers can view their own offer letters
CREATE POLICY IF NOT EXISTS "offer_letters_select_by_sender"
  ON public.offer_letters
  FOR SELECT
  TO authenticated
  USING (sent_by = auth.uid());

-- Applicants can view their own offer letters
CREATE POLICY IF NOT EXISTS "offer_letters_select_by_applicant"
  ON public.offer_letters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = application_id AND ja.applicant_id = auth.uid()
    )
  );

-- Applicants can update status (accept/decline)
CREATE POLICY IF NOT EXISTS "offer_letters_update_by_applicant"
  ON public.offer_letters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = application_id AND ja.applicant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = application_id AND ja.applicant_id = auth.uid()
    )
  );

-- Step 3: RPC to send offer letter
CREATE OR REPLACE FUNCTION public.send_offer_letter(
  p_application_id UUID,
  p_file_path TEXT,
  p_file_name TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job_id UUID;
  v_applicant_id UUID;
  v_employer_id UUID := auth.uid();
  v_offer_id UUID;
  v_job_title TEXT;
  v_is_owner BOOLEAN;
BEGIN
  -- Get job and applicant info from the application
  SELECT ja.job_id, ja.applicant_id, j.title
  INTO v_job_id, v_applicant_id, v_job_title
  FROM public.job_applications ja
  JOIN public.jobs j ON j.id = ja.job_id
  WHERE ja.id = p_application_id;

  IF v_job_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  -- Verify the caller owns the job
  SELECT (v_employer_id IN (j.created_by, j.posted_by, j.user_id))
  INTO v_is_owner
  FROM public.jobs j
  WHERE j.id = v_job_id;

  IF NOT v_is_owner AND NOT public.is_site_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the job owner can send offer letters');
  END IF;

  -- Check if an offer letter already exists for this application
  SELECT id INTO v_offer_id
  FROM public.offer_letters
  WHERE application_id = p_application_id
    AND status IN ('pending', 'viewed');

  IF v_offer_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'An active offer letter already exists for this application');
  END IF;

  -- Insert offer letter record
  INSERT INTO public.offer_letters (
    application_id,
    job_id,
    file_path,
    file_name,
    notes,
    sent_by,
    status
  ) VALUES (
    p_application_id,
    v_job_id,
    p_file_path,
    p_file_name,
    p_notes,
    v_employer_id,
    'pending'
  )
  RETURNING id INTO v_offer_id;

  -- Update application status to 'offered'
  UPDATE public.job_applications
  SET status = 'offered', updated_at = NOW()
  WHERE id = p_application_id;

  -- Send notification to applicant
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
    v_employer_id,
    'job_offer_received',
    'You have received a job offer!',
    'An offer letter is waiting for you for: ' || COALESCE(v_job_title, 'a position'),
    '/jobs/my-applications',
    jsonb_build_object(
      'offer_id', v_offer_id,
      'application_id', p_application_id,
      'job_id', v_job_id,
      'job_title', v_job_title
    )
  );

  -- Log activity
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (v_employer_id, 'offer_sent', jsonb_build_object(
    'offer_id', v_offer_id,
    'application_id', p_application_id,
    'applicant_id', v_applicant_id,
    'job_id', v_job_id
  ));

  RETURN jsonb_build_object(
    'success', true,
    'offer_id', v_offer_id,
    'message', 'Offer letter sent successfully'
  );
END;
$$;

GRANT ALL ON FUNCTION public.send_offer_letter(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Step 4: RPC to get offer letter for applicant
CREATE OR REPLACE FUNCTION public.get_offer_letter_for_applicant(
  p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offer RECORD;
  v_is_applicant BOOLEAN;
BEGIN
  -- Verify the caller is the applicant
  SELECT EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.id = p_application_id AND ja.applicant_id = auth.uid()
  ) INTO v_is_applicant;

  IF NOT v_is_applicant AND NOT public.is_site_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Get the offer letter
  SELECT 
    ol.id,
    ol.file_path,
    ol.file_name,
    ol.notes,
    ol.status,
    ol.sent_at,
    ol.responded_at,
    j.title as job_title,
    j.company_name
  INTO v_offer
  FROM public.offer_letters ol
  JOIN public.jobs j ON j.id = ol.job_id
  WHERE ol.application_id = p_application_id
  ORDER BY ol.sent_at DESC
  LIMIT 1;

  IF v_offer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No offer letter found');
  END IF;

  -- If status is pending, update to viewed
  IF v_offer.status = 'pending' THEN
    UPDATE public.offer_letters
    SET status = 'viewed'
    WHERE id = v_offer.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'offer', jsonb_build_object(
      'id', v_offer.id,
      'file_path', v_offer.file_path,
      'file_name', v_offer.file_name,
      'notes', v_offer.notes,
      'status', CASE WHEN v_offer.status = 'pending' THEN 'viewed' ELSE v_offer.status END,
      'sent_at', v_offer.sent_at,
      'responded_at', v_offer.responded_at,
      'job_title', v_offer.job_title,
      'company_name', v_offer.company_name
    )
  );
END;
$$;

GRANT ALL ON FUNCTION public.get_offer_letter_for_applicant(UUID) TO authenticated;

-- Step 5: RPC to respond to offer (accept or decline)
CREATE OR REPLACE FUNCTION public.respond_to_offer(
  p_offer_id UUID,
  p_response TEXT  -- 'accepted' or 'declined'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offer RECORD;
  v_application_id UUID;
  v_is_applicant BOOLEAN;
  v_new_status TEXT;
  v_message TEXT;
BEGIN
  -- Validate response
  IF p_response NOT IN ('accepted', 'declined') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid response. Must be accepted or declined');
  END IF;

  -- Get offer details
  SELECT ol.id, ol.application_id, ol.job_id, ol.sent_by, ol.status, j.title
  INTO v_offer
  FROM public.offer_letters ol
  JOIN public.jobs j ON j.id = ol.job_id
  WHERE ol.id = p_offer_id;

  IF v_offer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
  END IF;

  -- Verify the caller is the applicant
  SELECT EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.id = v_offer.application_id AND ja.applicant_id = auth.uid()
  ) INTO v_is_applicant;

  IF NOT v_is_applicant AND NOT public.is_site_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the applicant can respond to offers');
  END IF;

  -- Check if already responded
  IF v_offer.status IN ('accepted', 'declined') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer has already been responded to');
  END IF;

  -- Set new application status based on response
  IF p_response = 'accepted' THEN
    v_new_status := 'hired';
    v_message := 'Congratulations! You have accepted the offer.';
  ELSE
    v_new_status := 'rejected';
    v_message := 'You have declined the offer.';
  END IF;

  -- Update offer letter status
  UPDATE public.offer_letters
  SET status = p_response,
      responded_at = NOW()
  WHERE id = p_offer_id;

  -- Update application status
  UPDATE public.job_applications
  SET status = v_new_status,
      updated_at = NOW()
  WHERE id = v_offer.application_id;

  -- Send notification to employer
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    type,
    title,
    message,
    link,
    metadata
  ) VALUES (
    v_offer.sent_by,
    auth.uid(),
    'job_offer_response',
    'Offer ' || CASE p_response WHEN 'accepted' THEN 'Accepted' ELSE 'Declined' END || ': ' || v_offer.title,
    CASE 
      WHEN p_response = 'accepted' THEN 'The applicant has accepted your offer!'
      ELSE 'The applicant has declined your offer.'
    END,
    '/jobs/' || v_offer.job_id || '/applications',
    jsonb_build_object(
      'offer_id', p_offer_id,
      'application_id', v_offer.application_id,
      'job_id', v_offer.job_id,
      'response', p_response
    )
  );

  -- Log activity
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (auth.uid(), 'offer_' || p_response, jsonb_build_object(
    'offer_id', p_offer_id,
    'application_id', v_offer.application_id,
    'job_id', v_offer.job_id
  ));

  RETURN jsonb_build_object(
    'success', true,
    'new_status', v_new_status,
    'message', v_message
  );
END;
$$;

GRANT ALL ON FUNCTION public.respond_to_offer(UUID, TEXT) TO authenticated;

-- Step 6: Storage bucket policies for offer-letters (if bucket exists)
-- Note: The bucket must be created via Supabase dashboard or storage API
-- These policies assume the bucket 'offer-letters' exists

DO $$
BEGIN
  -- Check if bucket exists, if not we can't create policies (bucket must be created via dashboard)
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'offer-letters'
  ) THEN
    -- Employers can upload to their own folder
    CREATE POLICY IF NOT EXISTS "offer_letters_storage_upload"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'offer-letters'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- Employers can read their own uploads
    CREATE POLICY IF NOT EXISTS "offer_letters_storage_select_sender"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'offer-letters'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- Applicants can read files in their application folder
    -- This requires a specific path structure: employerId/applicationId/filename
    CREATE POLICY IF NOT EXISTS "offer_letters_storage_select_applicant"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'offer-letters'
        AND EXISTS (
          SELECT 1 FROM public.job_applications ja
          JOIN public.offer_letters ol ON ol.application_id = ja.id
          WHERE ja.applicant_id = auth.uid()
            AND ol.file_path = name
        )
      );

    RAISE NOTICE 'Storage policies created for offer-letters bucket';
  ELSE
    RAISE NOTICE 'offer-letters bucket does not exist. Please create it via Supabase dashboard.';
  END IF;
END $$;

-- Migration complete
