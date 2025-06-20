-- AMET Alumni Database Schema

-- Profiles table (likely already exists from Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    graduation_year INTEGER,
    degree TEXT,
    major TEXT,
    location TEXT,
    company TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    bio TEXT,
    is_mentor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    organizer_id UUID REFERENCES public.profiles(id),
    image_url TEXT,
    capacity INTEGER,
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Event attendees (for event registration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'event_attendees' AND schemaname = 'public') THEN
        CREATE TABLE public.event_attendees (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
            attendee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            attendance_status TEXT DEFAULT 'registered', -- registered, attended, canceled
            UNIQUE(event_id, attendee_id)
        );
    END IF;
END$$;

-- Jobs table (job portal)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT,
    requirements TEXT,
    salary_range TEXT,
    job_type TEXT, -- full-time, part-time, contract, etc.
    contact_email TEXT,
    application_url TEXT,
    posted_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Job applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    resume_url TEXT,
    cover_letter TEXT,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    status TEXT DEFAULT 'submitted', -- submitted, reviewed, interview, accepted, rejected
    UNIQUE(job_id, applicant_id)
);

-- Messages table (for direct messaging)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Networking connections (for alumni networking)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(requester_id, recipient_id)
);

-- Mentors table (extension of profiles for those who are mentors)
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    expertise TEXT[] NOT NULL,
    experience_years INTEGER,
    mentorship_areas TEXT,
    availability TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    max_mentees INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Mentorship requests
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_message TEXT NOT NULL,
    goals TEXT,
    duration TEXT, -- e.g., '3 months', '6 months', etc.
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(mentee_id, mentor_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for each table (these are basic policies, you may want to customize)
-- Profiles: visible to all authenticated users, editable by the owner
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles are viewable by everyone' AND tablename = 'profiles') THEN
        EXECUTE 'CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
        EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)';
    END IF;
END
$$;

-- Events: visible to all, editable by organizer
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Events are viewable by everyone' AND tablename = 'events') THEN
        EXECUTE 'CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Events are editable by organizer' AND tablename = 'events') THEN
        EXECUTE 'CREATE POLICY "Events are editable by organizer" ON public.events FOR UPDATE USING (auth.uid() = organizer_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Events can be created by authenticated users' AND tablename = 'events') THEN
        EXECUTE 'CREATE POLICY "Events can be created by authenticated users" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
    END IF;
END
$$;

-- Event Attendees: visible to all, insertable by authenticated users
DO $$ 
DECLARE
    user_column_name text;
BEGIN
    -- First check which column name is used for the user ID in the table
    -- It might be 'attendee_id', 'user_id' or something else
    SELECT column_name INTO user_column_name
    FROM information_schema.columns 
    WHERE table_name = 'event_attendees' 
    AND table_schema = 'public'
    AND (column_name = 'attendee_id' OR column_name = 'user_id');
    
    IF user_column_name IS NULL THEN
        -- Fallback to using attendee_id if we can't find either column
        user_column_name := 'attendee_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Event registrations are viewable by everyone' AND tablename = 'event_attendees') THEN
        EXECUTE 'CREATE POLICY "Event registrations are viewable by everyone" ON public.event_attendees FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can register for events' AND tablename = 'event_attendees') THEN
        EXECUTE 'CREATE POLICY "Users can register for events" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can cancel their own registrations' AND tablename = 'event_attendees') THEN
        EXECUTE format('CREATE POLICY "Users can cancel their own registrations" ON public.event_attendees FOR DELETE USING (auth.uid() = %I)', user_column_name);
    END IF;
END
$$;

-- Jobs: visible to all, editable by poster
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Jobs are viewable by everyone' AND tablename = 'jobs') THEN
        EXECUTE 'CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Jobs are editable by poster' AND tablename = 'jobs') THEN
        EXECUTE 'CREATE POLICY "Jobs are editable by poster" ON public.jobs FOR UPDATE USING (auth.uid() = posted_by)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Jobs can be posted by authenticated users' AND tablename = 'jobs') THEN
        EXECUTE 'CREATE POLICY "Jobs can be posted by authenticated users" ON public.jobs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
    END IF;
END
$$;

-- Job Applications: visible to job poster and applicant, insertable by authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own applications' AND tablename = 'job_applications') THEN
        EXECUTE 'CREATE POLICY "Users can view their own applications" ON public.job_applications 
            FOR SELECT USING (auth.uid() = applicant_id OR auth.uid() IN (SELECT posted_by FROM public.jobs WHERE id = job_id))';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can apply to jobs' AND tablename = 'job_applications') THEN
        EXECUTE 'CREATE POLICY "Users can apply to jobs" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id)';
    END IF;
END
$$;

-- Messages: visible to sender and recipient
-- Policy: Users can view their own messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own messages' AND tablename = 'messages') THEN
        EXECUTE 'CREATE POLICY "Users can view their own messages" ON public.messages 
            FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id)';
    END IF;
END
$$;

-- Policy: Users can send messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send messages' AND tablename = 'messages') THEN
        EXECUTE 'CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id)';
    END IF;
END
$$;

-- Policy: Recipients can update messages they've received
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recipients can update messages' AND tablename = 'messages') THEN
        EXECUTE 'CREATE POLICY "Recipients can update messages" ON public.messages 
            FOR UPDATE USING (auth.uid() = recipient_id)';
    END IF;
END
$$;

-- Connections: visible to both parties
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own connections' AND tablename = 'connections') THEN
        EXECUTE 'CREATE POLICY "Users can view their own connections" ON public.connections 
            FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can request connections' AND tablename = 'connections') THEN
        EXECUTE 'CREATE POLICY "Users can request connections" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can accept/reject connection requests' AND tablename = 'connections') THEN
        EXECUTE 'CREATE POLICY "Users can accept/reject connection requests" ON public.connections 
            FOR UPDATE USING (auth.uid() = recipient_id) WITH CHECK (status <> ''pending'')';
    END IF;
END
$$;

-- Mentors: visible to all, editable by the mentor
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mentors are viewable by everyone' AND tablename = 'mentors') THEN
        EXECUTE 'CREATE POLICY "Mentors are viewable by everyone" ON public.mentors FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mentors can update their own info' AND tablename = 'mentors') THEN
        EXECUTE 'CREATE POLICY "Mentors can update their own info" ON public.mentors FOR UPDATE USING (auth.uid() = id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can become mentors' AND tablename = 'mentors') THEN
        EXECUTE 'CREATE POLICY "Users can become mentors" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = id)';
    END IF;
END
$$;

-- Mentorship Requests: visible to mentor and mentee
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their mentor/mentee requests' AND tablename = 'mentorship_requests') THEN
        EXECUTE 'CREATE POLICY "Users can view their mentor/mentee requests" ON public.mentorship_requests 
            FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() = mentor_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can request mentorship' AND tablename = 'mentorship_requests') THEN
        EXECUTE 'CREATE POLICY "Users can request mentorship" ON public.mentorship_requests FOR INSERT WITH CHECK (auth.uid() = mentee_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mentors can respond to requests' AND tablename = 'mentorship_requests') THEN
        EXECUTE 'CREATE POLICY "Mentors can respond to requests" ON public.mentorship_requests 
            FOR UPDATE USING (auth.uid() = mentor_id) WITH CHECK (status <> ''pending'')';
    END IF;
END
$$;
