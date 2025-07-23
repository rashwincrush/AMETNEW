# Alumni Management System — Project Plan & Structure

## Overview

This document outlines the structure and implementation plan for the Alumni Management System using Supabase and React. The system aims to create a comprehensive platform for alumni networking, event management, job opportunities, and mentorship programs.

## Technology Stack

- **Frontend**: React.js with modern hooks and functional components
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **Styling**: Tailwind CSS for responsive design
- **Deployment**: Netlify/Vercel for frontend, Supabase cloud for backend
- **Optional**: PostHog for analytics

## Database Schema & Implementation Plan

### 1. User Management & Profiles

#### 1.1 Database Tables

**profiles**
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  graduation_year INTEGER,
  degree TEXT,
  program TEXT,
  student_id TEXT,
  current_city TEXT,
  current_country TEXT,
  job_title TEXT,
  company TEXT,
  industry TEXT,
  experience_years INTEGER,
  bio TEXT,
  profile_image_url TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  privacy_settings JSONB DEFAULT '{"email": false, "phone": false, "job": true, "education": true}',
  is_verified BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'alumni',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**education_history**
```sql
CREATE TABLE education_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_year INTEGER,
  end_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**achievements**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  achievement_type TEXT NOT NULL, -- 'award', 'publication', 'certification', 'patent'
  year INTEGER,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.2 React Components

- `AuthPages/`: Registration, Login, PasswordReset, TwoFactorAuth
- `ProfileComponents/`: ProfileForm, ProfileView, PrivacySettings, AchievementForm
- `AdminComponents/`: UserManagement, VerificationWorkflow

#### 1.3 Implementation Notes

- Use Supabase Auth for user authentication and session management
- Implement Row Level Security (RLS) policies for data access control
- Create storage buckets for profile images with appropriate access rules
- Develop verification workflow for admin approval of profiles

### 2. Alumni Directory & Search

#### 2.1 Database Views

```sql
CREATE VIEW public_alumni_directory AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.graduation_year,
  p.degree,
  p.program,
  p.current_city,
  p.current_country,
  p.job_title,
  p.company,
  p.industry,
  p.profile_image_url,
  p.linkedin_url,
  CASE WHEN p.privacy_settings->>'email' = 'true' THEN p.email ELSE NULL END as email,
  CASE WHEN p.privacy_settings->>'phone' = 'true' THEN p.phone ELSE NULL END as phone
FROM profiles p
WHERE p.is_verified = true;
```

#### 2.2 React Components

- `DirectoryComponents/`: DirectoryList, AlumniCard, SearchFilters, BatchView
- `SearchComponents/`: AdvancedSearch, FilterPanel, SearchResults

#### 2.3 Implementation Notes

- Implement full-text search using Supabase's built-in search capabilities
- Create efficient filtering mechanisms for large datasets
- Design responsive grid/list views for directory display
- Implement pagination for performance optimization

### 3. Event Management

#### 3.1 Database Tables

**events**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'in-person', 'virtual', 'hybrid'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  venue TEXT,
  address TEXT,
  virtual_link TEXT,
  max_attendees INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  requires_approval BOOLEAN DEFAULT false,
  tags TEXT[],
  organizer_name TEXT NOT NULL,
  organizer_email TEXT NOT NULL,
  organizer_phone TEXT,
  agenda JSONB[], -- Array of {time, activity}
  featured_image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);
```

**event_registrations**
```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'waitlisted', 'cancelled'
  guest_count INTEGER DEFAULT 0,
  dietary_requirements TEXT,
  accommodation_needs TEXT,
  volunteer_interest BOOLEAN DEFAULT false,
  attendance_confirmed BOOLEAN DEFAULT false,
  feedback_submitted BOOLEAN DEFAULT false,
  UNIQUE(event_id, profile_id)
);
```

**event_feedback**
```sql
CREATE TABLE event_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  suggestions TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, profile_id)
);
```

#### 3.2 React Components

- `EventComponents/`: EventForm, EventCard, EventDetails, EventCalendar
- `RSVPComponents/`: RSVPForm, AttendeeList, CheckInSystem
- `FeedbackComponents/`: FeedbackForm, FeedbackReport

#### 3.3 Implementation Notes

- Implement event reminder system using scheduled functions
- Create calendar view with filtering options
- Design mobile-friendly RSVP process
- Develop feedback collection and reporting system

### 4. Job Portal

#### 4.1 Database Tables

**jobs**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL, -- 'full-time', 'part-time', 'contract', 'internship'
  experience_required TEXT,
  education_required TEXT,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  salary_currency TEXT DEFAULT 'USD',
  application_deadline DATE,
  description TEXT NOT NULL,
  required_skills TEXT[],
  application_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_approved BOOLEAN DEFAULT false,
  posted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**job_applications**
```sql
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  desired_roles TEXT[],
  desired_industries TEXT[],
  desired_locations TEXT[],
  relocation_willingness BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'submitted', -- 'submitted', 'reviewed', 'shortlisted', 'rejected', 'hired'
  application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, profile_id)
);
```

**employer_profiles**
```sql
CREATE TABLE employer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_description TEXT,
  company_logo_url TEXT,
  industry TEXT,
  company_size TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4.2 React Components

- `JobComponents/`: JobPostingForm, JobCard, JobDetails, JobSearch
- `ApplicationComponents/`: ResumeUpload, ApplicationForm, ApplicationStatus
- `EmployerComponents/`: EmployerDashboard, ApplicationReview

#### 4.3 Implementation Notes

- Implement secure file storage for resumes
- Create job alert system based on preferences
- Design application tracking system for employers
- Develop approval workflow for job listings

### 5. Networking & Mentorship

#### 5.1 Database Tables

**mentor_profiles**
```sql
CREATE TABLE mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expertise_areas TEXT[],
  availability JSONB, -- {days: [], times: []}
  max_mentees INTEGER DEFAULT 3,
  experience TEXT,
  statement TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**mentee_profiles**
```sql
CREATE TABLE mentee_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  career_goals TEXT,
  skills_to_develop TEXT[],
  preferred_mentor_type TEXT,
  communication_preference TEXT,
  time_commitment TEXT,
  expectation_statement TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**mentorship_matches**
```sql
CREATE TABLE mentorship_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES mentee_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'declined'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  match_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_id)
);
```

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5.2 React Components

- `MentorshipComponents/`: MentorForm, MenteeForm, MentorshipDashboard
- `MatchingComponents/`: MatchingAlgorithm, MatchProposalView
- `MessagingComponents/`: MessageList, MessageComposer, Conversation

#### 5.3 Implementation Notes

- Develop matching algorithm based on skills and preferences
- Implement real-time messaging using Supabase Realtime
- Create mentorship progress tracking system
- Design networking groups with discussion capabilities

### 6. Administration Tools

#### 6.1 Database Tables

**import_logs**
```sql
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  import_type TEXT NOT NULL, -- 'users', 'events', 'jobs'
  record_count INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  error_details JSONB,
  imported_by UUID REFERENCES profiles(id),
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**content_blocks**
```sql
CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  page TEXT NOT NULL,
  position INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**user_logs**
```sql
CREATE TABLE user_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6.2 React Components

- `AdminComponents/`: AdminDashboard, ImportExportTool, UserManagement
- `ReportingComponents/`: ReportBuilder, ChartGenerator, DataExport
- `ContentComponents/`: ContentEditor, FAQManager, PageBuilder

#### 6.3 Implementation Notes

- Implement CSV import/export with validation
- Create flexible reporting system with visualization
- Design content management system for static pages
- Develop comprehensive admin dashboard with metrics

### 7. UI/UX & Accessibility

#### 7.1 Implementation Notes

- Use Tailwind CSS for responsive design
- Implement ARIA attributes for accessibility
- Create consistent component library
- Design mobile-first interfaces
- Implement dark mode support
- Ensure keyboard navigation support

### 8. Social Media Integration

#### 8.1 Implementation Notes

- Create shareable links for events and jobs
- Implement WhatsApp notification system
- Design social sharing buttons
- Develop manual sharing functionality

## Development Phases

### Phase 1: Core Infrastructure

1. Set up Supabase project and database schema
2. Implement authentication system
3. Create basic profile management
4. Develop admin dashboard foundation

### Phase 2: Alumni Directory & Profiles

1. Complete profile management system
2. Implement alumni directory with search
3. Create privacy controls
4. Develop verification workflow

### Phase 3: Event Management

1. Build event creation and management
2. Implement RSVP system
3. Create event calendar
4. Develop feedback collection

### Phase 4: Job Portal

1. Build job posting system
2. Implement application process
3. Create employer profiles
4. Develop job search and filtering

### Phase 5: Mentorship & Networking

1. Build mentor/mentee registration
2. Implement matching algorithm
3. Create messaging system
4. Develop networking groups

### Phase 6: Advanced Features & Refinement

1. Implement reporting and analytics
2. Create import/export tools
3. Refine UI/UX across all modules
4. Implement social sharing features

## Conclusion

This project plan outlines a comprehensive approach to building the Alumni Management System using Supabase and React. The modular structure allows for phased development and easy maintenance. The system will provide alumni with valuable networking, career, and mentorship opportunities while giving administrators powerful tools to manage the community.
