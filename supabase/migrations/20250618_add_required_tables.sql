-- Required database tables for AMET Alumni System

-- 1. Real-time Messaging System tables
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES profiles(id),
  participant_2 UUID REFERENCES profiles(id),
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enhanced Event Management tables
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  registration_date TIMESTAMP DEFAULT NOW(),
  attendance_status VARCHAR(20) DEFAULT 'registered',
  qr_code VARCHAR(255) UNIQUE,
  checked_in_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  reminder_time INTERVAL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
  organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
  comments TEXT,
  suggestions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Alumni Achievements
CREATE TABLE IF NOT EXISTS public.alumni_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achievement_type VARCHAR(50),
  date_achieved DATE,
  organization VARCHAR(255),
  url VARCHAR(500),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Enhanced Job Portal 
CREATE TABLE IF NOT EXISTS public.job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  keywords TEXT[],
  location VARCHAR(255),
  job_type VARCHAR(50),
  salary_min INTEGER,
  industry VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  company_name VARCHAR(255) NOT NULL,
  company_description TEXT,
  industry VARCHAR(100),
  company_size VARCHAR(50),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Networking Groups
CREATE TABLE IF NOT EXISTS public.networking_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  creator_id UUID REFERENCES profiles(id),
  privacy VARCHAR(20) DEFAULT 'public',
  max_members INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES networking_groups(id),
  user_id UUID REFERENCES profiles(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW()
);

-- 6. User Activity & Analytics
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  feedback_type VARCHAR(20),
  severity VARCHAR(20),
  description TEXT,
  page VARCHAR(255),
  browser TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add Row Level Security Policies

-- Conversations policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Event attendees policies
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event attendees"
  ON public.event_attendees FOR SELECT
  USING (true);

CREATE POLICY "Users can register for events"
  ON public.event_attendees FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own registrations"
  ON public.event_attendees FOR UPDATE
  USING (user_id = auth.uid());

-- Event reminders policies
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their event reminders"
  ON public.event_reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create event reminders"
  ON public.event_reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their event reminders"
  ON public.event_reminders FOR UPDATE
  USING (user_id = auth.uid());

-- Event feedback policies
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event feedback"
  ON public.event_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Event organizers can view event feedback"
  ON public.event_feedback FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  ));

CREATE POLICY "Users can submit event feedback"
  ON public.event_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Alumni achievements policies
ALTER TABLE public.alumni_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified achievements"
  ON public.alumni_achievements FOR SELECT
  USING (verified = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own achievements"
  ON public.alumni_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own achievements"
  ON public.alumni_achievements FOR UPDATE
  USING (user_id = auth.uid());

-- Add policies for the rest of the tables (job alerts, employer profiles, networking groups)
-- following the pattern above

-- Create needed indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON public.event_attendees (user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_achievements_user_id ON public.alumni_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON public.job_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members (user_id);
