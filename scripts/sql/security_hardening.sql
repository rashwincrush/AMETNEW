-- SECURITY HARDENING BUNDLE (idempotent style)
-- NOTE: Review bucket names/table names match your environment before applying.

BEGIN;

-- Helpers
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid DEFAULT auth.uid())
  RETURNS boolean
  LANGUAGE sql STABLE
  SECURITY INVOKER
  SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = p_user_id AND (p.role IN ('admin','super_admin') OR COALESCE(p.is_admin, false) = true)
    );
  $$;
END $$;

-- Example: ensure RLS ON for selected tables (adjust list)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy style examples (drop-then-create). Adjust columns and predicates to match schema.
-- PROFILES: owner read/update; admin read all
DROP POLICY IF EXISTS profiles_owner_select ON public.profiles;
CREATE POLICY profiles_owner_select ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
CREATE POLICY profiles_owner_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- EVENTS: public read if approved or is_public; edit by creator/admin
DROP POLICY IF EXISTS events_public_read ON public.events;
CREATE POLICY events_public_read ON public.events
  FOR SELECT USING ((approval_status = 'approved') OR COALESCE(is_public, false) = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS events_edit_own ON public.events;
CREATE POLICY events_edit_own ON public.events
  FOR UPDATE USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

-- JOBS: public read active+approved; edit by poster/admin
DROP POLICY IF EXISTS jobs_public_read ON public.jobs;
CREATE POLICY jobs_public_read ON public.jobs
  FOR SELECT USING ((is_active = true AND is_approved = true) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS jobs_edit_own ON public.jobs;
CREATE POLICY jobs_edit_own ON public.jobs
  FOR UPDATE USING (posted_by = auth.uid() OR public.is_admin(auth.uid()));

-- JOB APPLICATIONS: owner read; employer reads for their jobs; admin reads all
DROP POLICY IF EXISTS job_apps_owner_select ON public.job_applications;
CREATE POLICY job_apps_owner_select ON public.job_applications
  FOR SELECT USING (applicant_id = auth.uid() OR public.is_admin(auth.uid()));

-- Example employer-side read (requires FK job_id -> jobs.posted_by)
DROP POLICY IF EXISTS job_apps_employer_read ON public.job_applications;
CREATE POLICY job_apps_employer_read ON public.job_applications
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid()
    )
  );

-- GROUPS: public read approved; members see their private groups; admin overrides
DROP POLICY IF EXISTS groups_public_read ON public.groups;
CREATE POLICY groups_public_read ON public.groups
  FOR SELECT USING (is_approved = true OR public.is_admin(auth.uid()));

-- MESSAGES/CONVERSATIONS: participants-only reads
DROP POLICY IF EXISTS conversations_participant_read ON public.conversations;
CREATE POLICY conversations_participant_read ON public.conversations
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_participant_read ON public.messages;
CREATE POLICY messages_participant_read ON public.messages
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
  );

-- STORAGE: bucket policy examples (event-images, resumes)
-- These are conceptual; adapt to your storage policies tables if using PostgREST storage policies.
-- Event images: public read only for approved/public events
-- Resumes: private by default; owner/admin read; employers via job relationship.

COMMIT;
