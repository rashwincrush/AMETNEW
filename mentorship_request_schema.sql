-- Create the mentorship_requests table
CREATE TABLE public.mentorship_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    mentor_id uuid NOT NULL,
    mentee_id uuid NOT NULL,
    request_message text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text, -- pending, accepted, rejected, withdrawn
    response_message text,
    CONSTRAINT mentorship_requests_pkey PRIMARY KEY (id),
    CONSTRAINT mentorship_requests_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT mentorship_requests_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT mentorship_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text])))
);

-- Add comments to the table and columns
COMMENT ON TABLE public.mentorship_requests IS 'Stores mentorship requests from mentees to mentors.';
COMMENT ON COLUMN public.mentorship_requests.status IS 'The current status of the mentorship request (pending, accepted, rejected, withdrawn).';

-- Enable Row Level Security
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- Create the handle_updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to automatically update updated_at
CREATE TRIGGER on_mentorship_requests_updated
BEFORE UPDATE ON public.mentorship_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for mentorship_requests

-- 1. Mentees can create requests for any mentor (but not for themselves).
CREATE POLICY "Mentees can create their own mentorship requests" ON public.mentorship_requests
FOR INSERT WITH CHECK (auth.uid() = mentee_id AND auth.uid() <> mentor_id);

-- 2. Users can see requests they have sent or received.
CREATE POLICY "Users can view their own mentorship requests" ON public.mentorship_requests
FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

-- 3. Mentees can update their request only to withdraw it.
CREATE POLICY "Mentees can withdraw their requests" ON public.mentorship_requests
FOR UPDATE USING (auth.uid() = mentee_id)
WITH CHECK (status = 'withdrawn'::text);

-- 4. Mentors can update requests sent to them to accept or reject.
CREATE POLICY "Mentors can accept or reject requests" ON public.mentorship_requests
FOR UPDATE USING (auth.uid() = mentor_id)
WITH CHECK (status = ANY (ARRAY['accepted'::text, 'rejected'::text]));

-- 5. Admin users have full access (assuming you have a custom 'is_admin' claim or similar).
-- This requires a helper function to check for admin role. If you don't have one, you might need to create it.
-- For now, we'll rely on service_role key for admin actions from the backend.
-- If you need a policy for admins, it would look something like this:
-- CREATE POLICY "Admins have full access" ON public.mentorship_requests
-- FOR ALL USING (is_admin(auth.uid()));


-- Create a unique index to prevent duplicate pending requests
CREATE UNIQUE INDEX mentorship_requests_unique_pending_request_idx
ON public.mentorship_requests (mentor_id, mentee_id)
WHERE (status = 'pending');
