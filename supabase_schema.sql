-- AMET Alumni Database Schema - Consolidated
-- This file represents the single source of truth for the database schema.

-- =================================================================
-- Table Definitions
-- =================================================================

-- Profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
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
    role TEXT DEFAULT 'alumni' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Roles table (for user roles)
CREATE TABLE IF NOT EXISTS public.roles (
    role_name TEXT PRIMARY KEY,
    description TEXT
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
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    attendee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    attendance_status TEXT DEFAULT 'registered', -- registered, attended, canceled
    UNIQUE (event_id, attendee_id)
);

-- Event Feedback table
CREATE TABLE IF NOT EXISTS public.event_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    would_recommend TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(event_id, user_id)
);

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Jobs table (job portal)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    location TEXT,
    description TEXT,
    requirements TEXT,
    salary_range TEXT,
    job_type TEXT, -- full-time, part-time, contract, etc.
    application_url TEXT,
    deadline DATE,
    user_id UUID REFERENCES public.profiles(id), -- Standardized from posted_by
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE, -- For admin moderation
    is_verified BOOLEAN DEFAULT FALSE, -- For job verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Job bookmarks
CREATE TABLE IF NOT EXISTS public.job_bookmarks (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (user_id, job_id)
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

-- User Resumes table
CREATE TABLE IF NOT EXISTS public.user_resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- =================================================================
-- Networking: Groups
-- =================================================================

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- e.g., 'member', 'admin'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (group_id, user_id)
);

-- Group posts table
CREATE TABLE IF NOT EXISTS public.group_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
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

-- Job Alerts table
CREATE TABLE IF NOT EXISTS public.job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    alert_name TEXT NOT NULL,
    keywords TEXT[],
    location TEXT,
    job_type TEXT,
    experience_level TEXT,
    min_salary INTEGER,
    max_salary INTEGER,
    frequency TEXT NOT NULL, -- e.g., 'daily', 'weekly'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, alert_name)
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


-- =================================================================
-- Enable Row Level Security (RLS)
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;


-- =================================================================
-- Row Level Security (RLS) Policies
-- =================================================================

-- -----------------------------------------------------------------
-- Policies for: profiles
-- -----------------------------------------------------------------
-- First, drop all existing policies on the profiles table
DO $$
DECLARE
   policy_rec RECORD;
BEGIN
   FOR policy_rec IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
   LOOP
      EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.profiles', policy_rec.policyname);
   END LOOP;
END
$$;

-- Re-create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- -----------------------------------------------------------------
-- Policies for: roles
-- -----------------------------------------------------------------
-- First, drop all existing policies on the roles table
DO $$
DECLARE
   policy_rec RECORD;
BEGIN
   FOR policy_rec IN (SELECT policyname FROM pg_policies WHERE tablename = 'roles' AND schemaname = 'public')
   LOOP
      EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.roles', policy_rec.policyname);
   END LOOP;
END
$$;

-- Re-create policies for roles
CREATE POLICY "Roles are viewable by everyone" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Super admins can create roles" ON public.roles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admins can update roles" ON public.roles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admins can delete roles" ON public.roles FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- -----------------------------------------------------------------
-- Policies for: events
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Events are editable by organizer" ON public.events;
CREATE POLICY "Events are editable by organizer" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Events can be created by authenticated users" ON public.events;
CREATE POLICY "Events can be created by authenticated users" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------
-- Policies for: event_attendees
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON public.event_attendees;
CREATE POLICY "Event registrations are viewable by everyone" ON public.event_attendees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can register for events" ON public.event_attendees;
CREATE POLICY "Users can register for events" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() = attendee_id);

DROP POLICY IF EXISTS "Users can cancel their own registrations" ON public.event_attendees;
CREATE POLICY "Users can cancel their own registrations" ON public.event_attendees FOR DELETE USING (auth.uid() = attendee_id);

-- -----------------------------------------------------------------
-- Policies for: event_feedback
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.event_feedback;
CREATE POLICY "Users can view their own feedback" ON public.event_feedback FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers can view event feedback" ON public.event_feedback;
CREATE POLICY "Organizers can view event feedback" ON public.event_feedback FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()));

DROP POLICY IF EXISTS "Users can submit feedback" ON public.event_feedback;
CREATE POLICY "Users can submit feedback" ON public.event_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own feedback" ON public.event_feedback;
CREATE POLICY "Users can update their own feedback" ON public.event_feedback FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------
-- Policies for: jobs
-- -----------------------------------------------------------------
-- RLS Policies for 'jobs' table (Corrected and Consolidated)

-- 1. READ: Public can view active and approved jobs
DROP POLICY IF EXISTS "Public can view active jobs" ON public.jobs;
CREATE POLICY "Public can view active jobs" ON public.jobs FOR SELECT USING (is_active = true AND is_approved = true);

-- 2. CREATE: Authenticated users can create jobs
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.jobs;
CREATE POLICY "Authenticated users can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own jobs
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
CREATE POLICY "Users can update their own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: Users can delete their own jobs
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
CREATE POLICY "Users can delete their own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------
-- Policies for: job_bookmarks
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.job_bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON public.job_bookmarks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create bookmarks" ON public.job_bookmarks;
CREATE POLICY "Users can create bookmarks" ON public.job_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.job_bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.job_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------
-- Policies for: job_applications
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
CREATE POLICY "Users can view their own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND posted_by = auth.uid()));

DROP POLICY IF EXISTS "Users can apply to jobs" ON public.job_applications;
CREATE POLICY "Users can apply to jobs" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- -----------------------------------------------------------------
-- -----------------------------------------------------------------
-- Policies for: job_alerts
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own job alerts" ON public.job_alerts;
CREATE POLICY "Users can manage their own job alerts"
ON public.job_alerts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------
-- Policies for: user_resumes
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.user_resumes;
CREATE POLICY "Users can view their own resumes" ON public.user_resumes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.user_resumes;
CREATE POLICY "Users can insert their own resumes" ON public.user_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resumes" ON public.user_resumes;
CREATE POLICY "Users can update their own resumes" ON public.user_resumes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.user_resumes;
CREATE POLICY "Users can delete their own resumes" ON public.user_resumes FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------
-- Policies for: messages
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Recipients can update messages" ON public.messages;
CREATE POLICY "Recipients can update messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- -----------------------------------------------------------------
-- Policies for: connections
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
CREATE POLICY "Users can view their own connections" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can request connections" ON public.connections;
CREATE POLICY "Users can request connections" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can accept/reject connection requests" ON public.connections;
CREATE POLICY "Users can accept/reject connection requests" ON public.connections FOR UPDATE USING (auth.uid() = recipient_id) WITH CHECK (status <> 'pending');

-- -----------------------------------------------------------------
-- Policies for: mentors
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Mentors are viewable by everyone" ON public.mentors;
CREATE POLICY "Mentors are viewable by everyone" ON public.mentors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Mentors can update their own info" ON public.mentors;
CREATE POLICY "Mentors can update their own info" ON public.mentors FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can become mentors" ON public.mentors;
CREATE POLICY "Users can become mentors" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------
-- Policies for: mentorship_requests
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their mentor/mentee requests" ON public.mentorship_requests;
CREATE POLICY "Users can view their mentor/mentee requests" ON public.mentorship_requests FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Users can request mentorship" ON public.mentorship_requests;
CREATE POLICY "Users can request mentorship" ON public.mentorship_requests FOR INSERT WITH CHECK (auth.uid() = mentee_id);

DROP POLICY IF EXISTS "Mentors can respond to requests" ON public.mentorship_requests;
CREATE POLICY "Mentors can respond to requests" ON public.mentorship_requests FOR UPDATE USING (auth.uid() = mentor_id) WITH CHECK (status <> 'pending');

-- -----------------------------------------------------------------
-- Policies for: groups
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Public groups are viewable by everyone." ON public.groups;
CREATE POLICY "Public groups are viewable by everyone." ON public.groups FOR SELECT USING (is_private = false);

DROP POLICY IF EXISTS "Private groups are viewable by members." ON public.groups;
CREATE POLICY "Private groups are viewable by members." ON public.groups FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create groups." ON public.groups;
CREATE POLICY "Users can create groups." ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group creators can update their groups." ON public.groups;
CREATE POLICY "Group creators can update their groups." ON public.groups FOR UPDATE USING (auth.uid() = created_by);

-- -----------------------------------------------------------------
-- Policies for: group_members
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Group members are viewable by other members." ON public.group_members;
CREATE POLICY "Group members are viewable by other members." ON public.group_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_members.group_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can join public groups." ON public.group_members;
CREATE POLICY "Users can join public groups." ON public.group_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND is_private = false AND auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can leave groups." ON public.group_members;
CREATE POLICY "Users can leave groups." ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------
-- Policies for: group_posts
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Group posts are viewable by group members." ON public.group_posts;
CREATE POLICY "Group posts are viewable by group members." ON public.group_posts FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_posts.group_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Group members can create posts." ON public.group_posts;
CREATE POLICY "Group members can create posts." ON public.group_posts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_posts.group_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own posts." ON public.group_posts;
CREATE POLICY "Users can delete their own posts." ON public.group_posts FOR DELETE USING (auth.uid() = user_id);


-- =================================================================
-- Analyze tables to refresh statistics
-- =================================================================

ANALYZE public.profiles;
ANALYZE public.roles;
