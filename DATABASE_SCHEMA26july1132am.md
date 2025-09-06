# Database Schema Documentation

This document provides a comprehensive overview of the database tables and their structures in the AMET Alumni Portal.

## Table of Contents
- [Achievements](#achievements)
- [Activity Logs](#activity_logs)
- [Admin Actions](#admin_actions)
- [Bookmarked Jobs](#bookmarked_jobs)
- [Companies](#companies)
- [Connections](#connections)
- [Content Approvals](#content_approvals)
- [Content Moderation](#content_moderation)
- [Conversations](#conversations)
- [Education History](#education_history)
- [Event Management](#event-management)
  - [Events](#events)
  - [Event Attendees](#event_attendees)
  - [Event RSVPs](#event_rsvps)
  - [Event Feedback](#event_feedback)
- [Groups](#groups)
- [Job Management](#job-management)
  - [Jobs](#jobs)
  - [Job Applications](#job_applications)
  - [Job Bookmarks](#job_bookmarks)
  - [Job Alerts](#job_alerts)
- [Mentorship](#mentorship)
  - [Mentee Profiles](#mentee_profiles)
  - [Mentor Availability](#mentor_availability)
  - [Mentor Profiles](#mentor_profiles)
  - [Mentorship Matches](#mentorship_matches)
  - [Mentorship Sessions](#mentorship_sessions)
- [User Management](#user-management)
  - [Profiles](#profiles)
  - [User Roles](#user_roles)
  - [User Settings](#user_settings)

## Tables

### achievements
Stores user achievements and certifications.
- `id` (uuid) - Primary key
- `profile_id` (uuid) - Reference to user profile
- `title` (text) - Achievement title
- `description` (text) - Achievement description
- `year` (integer) - Year achieved
- `url` (text) - Optional URL for certificate
- `achievement_type` (text) - Type of achievement
- `created_at` (timestamp) - Record creation timestamp
- `updated_at` (timestamp) - Record update timestamp

### activity_logs
Tracks user activities within the system.
- `id` (uuid) - Primary key
- `profile_id` (uuid) - Reference to user profile
- `action` (text) - Action performed
- `entity_type` (text) - Type of entity affected
- `entity_id` (text) - ID of affected entity
- `details` (jsonb) - Additional action details
- `created_at` (timestamp) - Action timestamp

### admin_actions
Logs administrative actions.
- `id` (uuid) - Primary key
- `admin_id` (uuid) - Admin user ID
- `action_type` (text) - Type of admin action
- `target_type` (text) - Type of target entity
- `target_id` (uuid) - ID of target entity
- `description` (text) - Action description
- `metadata` (jsonb) - Additional metadata
- `created_at` (timestamp) - Action timestamp

### bookmarked_jobs
Tracks jobs bookmarked by users.
- `id` (bigint) - Primary key
- `user_id` (uuid) - User who bookmarked
- `job_id` (uuid) - Bookmarked job
- `created_at` (timestamp) - Bookmark timestamp

### companies
Stores company information.
- `id` (uuid) - Primary key
- `name` (text) - Company name
- `logo_url` (text) - URL to company logo
- `created_at` (timestamp) - Record creation timestamp
- `updated_at` (timestamp) - Record update timestamp

### connections
Manages user connections and networking.
- `id` (uuid) - Primary key
- `requester_id` (uuid) - Connection requester
- `recipient_id` (uuid) - Connection recipient
- `status` (text) - Connection status (pending/accepted/declined)
- `created_at` (timestamp) - Request timestamp
- `updated_at` (timestamp) - Last update timestamp

### event_attendees
Tracks event attendance.
- `id` (uuid) - Primary key
- `event_id` (uuid) - Reference to event
- `user_id` (uuid) - Attendee user ID
- `attendance_status` (text) - Attendance status
- `check_in_time` (timestamp) - Check-in timestamp
- `registration_date` (timestamp) - Registration timestamp

### event_rsvps
Manages event RSVPs.
- `id` (uuid) - Primary key
- `event_id` (uuid) - Reference to event
- `user_id` (uuid) - Attendee user ID
- `attendance_status` (text) - RSVP status
- `created_at` (timestamp) - RSVP timestamp

### jobs
Stores job listings.
- `id` (uuid) - Primary key
- `title` (text) - Job title
- `company_name` (text) - Company name
- `location` (text) - Job location
- `job_type` (text) - Type of employment
- `description` (text) - Job description
- `requirements` (text) - Job requirements
- `salary_min` (numeric) - Minimum salary
- `salary_max` (numeric) - Maximum salary
- `is_active` (boolean) - Whether job is active
- `created_at` (timestamp) - Listing creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `is_verified` (boolean) - Whether job is verified

### job_applications
Tracks job applications.
- `id` (uuid) - Primary key
- `job_id` (uuid) - Reference to job
- `applicant_id` (uuid) - Applicant user ID
- `resume_url` (text) - URL to resume
- `cover_letter` (text) - Cover letter text
- `status` (text) - Application status
- `created_at` (timestamp) - Application timestamp
- `updated_at` (timestamp) - Last update timestamp

### job_bookmarks
Tracks user's bookmarked jobs.
- `id` (uuid) - Primary key
- `job_id` (uuid) - Bookmarked job
- `user_id` (uuid) - User who bookmarked
- `created_at` (timestamp) - Bookmark timestamp

### job_pins
Tracks user-pinned jobs for priority display.
- `id` (uuid) - Primary key
- `user_id` (uuid) - User who pinned
- `job_id` (uuid) - Pinned job
- `created_at` (timestamp) - Pin timestamp

### profiles
Stores user profile information.
- `id` (uuid) - Primary key, references auth.users
- `full_name` (text) - User's full name
- `avatar_url` (text) - URL to profile picture
- `headline` (text) - Professional headline
- `bio` (text) - Personal biography
- `location` (text) - Current location
- `website` (text) - Personal website
- `created_at` (timestamp) - Profile creation timestamp
- `updated_at` (timestamp) - Last update timestamp

### user_roles
Manages user roles and permissions.
- `user_id` (uuid) - Reference to user
- `role` (text) - Assigned role
- `created_at` (timestamp) - Assignment timestamp

## Key Relationships

- `profiles` is the central table that connects to most other user-related tables
- `events` and `jobs` are major content types with related tables for RSVPs, applications, etc.
- `connections` manages the social graph between users
- `mentorship_*` tables support the mentorship program functionality
- `content_*` tables handle moderation and approval workflows

## Indexes

Primary and foreign key indexes are automatically created. Additional indexes should be added based on query patterns, particularly for:
- Frequently filtered columns
- Columns used in JOIN conditions
- Columns used in WHERE clauses with high selectivity

## Security

Row Level Security (RLS) is implemented on all tables to ensure users can only access data they're authorized to see. Policies are defined to control:
- Read access to user data
- Write access to owned resources
- Administrative overrides

## Maintenance

Consider implementing:
- Regular backups
- Index maintenance
- Query performance monitoring
- Vacuum and analyze operations




| table_name                    | column_name                        | data_type                | is_nullable | column_default               |
| ----------------------------- | ---------------------------------- | ------------------------ | ----------- | ---------------------------- |
| achievements                  | id                                 | uuid                     | NO          | gen_random_uuid()            |
| achievements                  | profile_id                         | uuid                     | YES         | null                         |
| achievements                  | title                              | text                     | NO          | null                         |
| achievements                  | description                        | text                     | YES         | null                         |
| achievements                  | year                               | integer                  | YES         | null                         |
| achievements                  | url                                | text                     | YES         | null                         |
| achievements                  | achievement_type                   | text                     | YES         | null                         |
| achievements                  | created_at                         | timestamp with time zone | YES         | now()                        |
| achievements                  | updated_at                         | timestamp with time zone | YES         | now()                        |
| activity_logs                 | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| activity_logs                 | profile_id                         | uuid                     | YES         | null                         |
| activity_logs                 | action                             | text                     | NO          | null                         |
| activity_logs                 | entity_type                        | text                     | NO          | null                         |
| activity_logs                 | entity_id                          | text                     | NO          | null                         |
| activity_logs                 | details                            | jsonb                    | YES         | null                         |
| activity_logs                 | created_at                         | timestamp with time zone | YES         | now()                        |
| admin_actions                 | id                                 | uuid                     | NO          | gen_random_uuid()            |
| admin_actions                 | admin_id                           | uuid                     | YES         | null                         |
| admin_actions                 | action_type                        | text                     | NO          | null                         |
| admin_actions                 | target_type                        | text                     | NO          | null                         |
| admin_actions                 | target_id                          | uuid                     | YES         | null                         |
| admin_actions                 | description                        | text                     | YES         | null                         |
| admin_actions                 | metadata                           | jsonb                    | YES         | '{}'::jsonb                  |
| admin_actions                 | created_at                         | timestamp with time zone | YES         | now()                        |
| bookmarked_jobs               | id                                 | bigint                   | NO          | null                         |
| bookmarked_jobs               | user_id                            | uuid                     | NO          | null                         |
| bookmarked_jobs               | job_id                             | uuid                     | NO          | null                         |
| bookmarked_jobs               | created_at                         | timestamp with time zone | NO          | now()                        |
| companies                     | id                                 | uuid                     | NO          | gen_random_uuid()            |
| companies                     | name                               | text                     | NO          | null                         |
| companies                     | logo_url                           | text                     | YES         | null                         |
| companies                     | created_at                         | timestamp with time zone | NO          | now()                        |
| companies                     | updated_at                         | timestamp with time zone | NO          | now()                        |
| connections                   | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| connections                   | requester_id                       | uuid                     | YES         | null                         |
| connections                   | recipient_id                       | uuid                     | YES         | null                         |
| connections                   | status                             | text                     | YES         | 'pending'::text              |
| connections                   | created_at                         | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| connections                   | updated_at                         | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| content_approvals             | id                                 | bigint                   | NO          | null                         |
| content_approvals             | created_at                         | timestamp with time zone | YES         | now()                        |
| content_approvals             | content_type                       | text                     | NO          | null                         |
| content_approvals             | content_data                       | jsonb                    | YES         | null                         |
| content_approvals             | creator_id                         | uuid                     | NO          | null                         |
| content_approvals             | reviewer_id                        | uuid                     | YES         | null                         |
| content_approvals             | status                             | text                     | NO          | 'pending'::text              |
| content_approvals             | reviewed_at                        | timestamp with time zone | YES         | null                         |
| content_approvals             | rejection_reason                   | text                     | YES         | null                         |
| content_moderation            | id                                 | uuid                     | NO          | gen_random_uuid()            |
| content_moderation            | content_type                       | text                     | NO          | null                         |
| content_moderation            | content_id                         | uuid                     | NO          | null                         |
| content_moderation            | moderator_id                       | uuid                     | YES         | null                         |
| content_moderation            | status                             | text                     | NO          | 'pending'::text              |
| content_moderation            | review_notes                       | text                     | YES         | null                         |
| content_moderation            | reviewed_at                        | timestamp with time zone | YES         | null                         |
| content_moderation            | created_at                         | timestamp with time zone | YES         | now()                        |
| conversation_participants     | conversation_id                    | uuid                     | NO          | null                         |
| conversation_participants     | user_id                            | uuid                     | NO          | null                         |
| conversation_participants     | joined_at                          | timestamp with time zone | NO          | now()                        |
| conversations                 | id                                 | uuid                     | NO          | gen_random_uuid()            |
| conversations                 | created_at                         | timestamp with time zone | NO          | now()                        |
| conversations                 | updated_at                         | timestamp with time zone | NO          | now()                        |
| conversations                 | last_message_at                    | timestamp with time zone | YES         | now()                        |
| detailed_event_feedback       | feedback_id                        | uuid                     | YES         | null                         |
| detailed_event_feedback       | rating                             | integer                  | YES         | null                         |
| detailed_event_feedback       | comments                           | text                     | YES         | null                         |
| detailed_event_feedback       | feedback_submitted_at              | timestamp with time zone | YES         | null                         |
| detailed_event_feedback       | event_id                           | uuid                     | YES         | null                         |
| detailed_event_feedback       | event_title                        | text                     | YES         | null                         |
| detailed_event_feedback       | user_id                            | uuid                     | YES         | null                         |
| detailed_event_feedback       | full_name                          | text                     | YES         | null                         |
| detailed_event_feedback       | avatar_url                         | text                     | YES         | null                         |
| education_history             | id                                 | uuid                     | NO          | gen_random_uuid()            |
| education_history             | user_id                            | uuid                     | YES         | null                         |
| education_history             | institution_name                   | text                     | NO          | null                         |
| education_history             | degree_type                        | text                     | NO          | null                         |
| education_history             | major                              | text                     | YES         | null                         |
| education_history             | graduation_year                    | integer                  | YES         | null                         |
| education_history             | gpa                                | numeric                  | YES         | null                         |
| education_history             | honors                             | text                     | YES         | null                         |
| education_history             | notable_achievements               | text                     | YES         | null                         |
| education_history             | created_at                         | timestamp with time zone | YES         | now()                        |
| event_attendees               | id                                 | uuid                     | NO          | gen_random_uuid()            |
| event_attendees               | created_at                         | timestamp with time zone | NO          | now()                        |
| event_attendees               | updated_at                         | timestamp with time zone | YES         | now()                        |
| event_attendees               | event_id                           | uuid                     | NO          | null                         |
| event_attendees               | user_id                            | uuid                     | NO          | null                         |
| event_attendees               | attendance_status                  | text                     | NO          | 'registered'::text           |
| event_attendees               | check_in_time                      | timestamp with time zone | YES         | null                         |
| event_attendees               | attendee_id                        | uuid                     | YES         | null                         |
| event_attendees               | registration_date                  | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| event_attendees_with_profiles | id                                 | uuid                     | YES         | null                         |
| event_attendees_with_profiles | created_at                         | timestamp with time zone | YES         | null                         |
| event_attendees_with_profiles | event_id                           | uuid                     | YES         | null                         |
| event_attendees_with_profiles | user_id                            | uuid                     | YES         | null                         |
| event_attendees_with_profiles | status                             | text                     | YES         | null                         |
| event_attendees_with_profiles | check_in_time                      | timestamp with time zone | YES         | null                         |
| event_attendees_with_profiles | profile_id                         | uuid                     | YES         | null                         |
| event_attendees_with_profiles | full_name                          | text                     | YES         | null                         |
| event_attendees_with_profiles | avatar_url                         | text                     | YES         | null                         |
| event_attendees_with_profiles | event_title                        | text                     | YES         | null                         |
| event_attendees_with_profiles | event_start_date                   | timestamp with time zone | YES         | null                         |
| event_feedback                | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| event_feedback                | event_id                           | uuid                     | YES         | null                         |
| event_feedback                | user_id                            | uuid                     | YES         | null                         |
| event_feedback                | rating                             | integer                  | YES         | null                         |
| event_feedback                | comments                           | text                     | YES         | null                         |
| event_feedback                | submitted_at                       | timestamp with time zone | YES         | now()                        |
| event_feedback                | created_at                         | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| event_feedback                | comment                            | text                     | YES         | null                         |
| event_feedback                | rsvp_status                        | text                     | YES         | null                         |
| event_rsvps                   | id                                 | uuid                     | NO          | gen_random_uuid()            |
| event_rsvps                   | created_at                         | timestamp with time zone | NO          | now()                        |
| event_rsvps                   | event_id                           | uuid                     | NO          | null                         |
| event_rsvps                   | user_id                            | uuid                     | NO          | null                         |
| event_rsvps                   | attendance_status                  | text                     | YES         | null                         |
| event_stats                   | event_id                           | uuid                     | YES         | null                         |
| event_stats                   | title                              | text                     | YES         | null                         |
| event_stats                   | start_date                         | timestamp with time zone | YES         | null                         |
| event_stats                   | end_date                           | timestamp with time zone | YES         | null                         |
| event_stats                   | location                           | text                     | YES         | null                         |
| event_stats                   | is_virtual                         | boolean                  | YES         | null                         |
| event_stats                   | category                           | text                     | YES         | null                         |
| event_stats                   | is_featured                        | boolean                  | YES         | null                         |
| event_stats                   | is_published                       | boolean                  | YES         | null                         |
| event_stats                   | max_attendees                      | integer                  | YES         | null                         |
| event_stats                   | organizer_id                       | uuid                     | YES         | null                         |
| event_stats                   | organizer_name                     | text                     | YES         | null                         |
| event_stats                   | attendee_count                     | bigint                   | YES         | null                         |
| event_stats                   | spots_remaining                    | bigint                   | YES         | null                         |
| events                        | id                                 | uuid                     | NO          | gen_random_uuid()            |
| events                        | created_at                         | timestamp with time zone | NO          | now()                        |
| events                        | updated_at                         | timestamp with time zone | YES         | now()                        |
| events                        | title                              | text                     | NO          | null                         |
| events                        | description                        | text                     | NO          | null                         |
| events                        | start_date                         | timestamp with time zone | NO          | null                         |
| events                        | end_date                           | timestamp with time zone | NO          | null                         |
| events                        | venue                              | text                     | YES         | null                         |
| events                        | is_virtual                         | boolean                  | YES         | false                        |
| events                        | virtual_link                       | text                     | YES         | null                         |
| events                        | organizer_id                       | uuid                     | NO          | null                         |
| events                        | featured_image_url                 | text                     | YES         | null                         |
| events                        | is_featured                        | boolean                  | YES         | false                        |
| events                        | category                           | text                     | NO          | 'General'::text              |
| events                        | max_attendees                      | integer                  | YES         | null                         |
| events                        | is_published                       | boolean                  | YES         | false                        |
| events                        | tags                               | ARRAY                    | YES         | null                         |
| events                        | slug                               | text                     | YES         | null                         |
| events                        | agenda                             | jsonb                    | YES         | null                         |
| events                        | event_type                         | text                     | YES         | 'networking'::text           |
| events                        | cost                               | text                     | YES         | null                         |
| events                        | sponsors                           | text                     | YES         | null                         |
| events                        | registration_url                   | text                     | YES         | null                         |
| events                        | registration_deadline              | timestamp with time zone | YES         | null                         |
| events                        | created_by                         | uuid                     | YES         | null                         |
| events                        | creator_id                         | uuid                     | YES         | null                         |
| events                        | virtual_meeting_link               | text                     | YES         | null                         |
| events                        | user_id                            | uuid                     | YES         | null                         |
| events                        | is_approved                        | boolean                  | YES         | false                        |
| events                        | reminder_sent                      | boolean                  | YES         | false                        |
| events                        | address                            | text                     | YES         | null                         |
| events                        | organizer_email                    | text                     | YES         | null                         |
| events                        | organizer_name                     | text                     | YES         | null                         |
| events                        | organizer_phone                    | text                     | YES         | null                         |
| events                        | price                              | numeric                  | YES         | null                         |
| events                        | price_type                         | text                     | YES         | null                         |
| events                        | long_description                   | text                     | YES         | null                         |
| events                        | requirements                       | ARRAY                    | YES         | null                         |
| events                        | amenities                          | ARRAY                    | YES         | null                         |
| events                        | gallery                            | ARRAY                    | YES         | null                         |
| events                        | status                             | text                     | YES         | 'upcoming'::text             |
| events                        | additional_info                    | text                     | YES         | null                         |
| events                        | requires_approval                  | boolean                  | YES         | false                        |
| events                        | is_public                          | boolean                  | YES         | true                         |
| events                        | registration_required              | boolean                  | YES         | true                         |
| events                        | updated_by                         | uuid                     | YES         | null                         |
| group_members                 | group_id                           | uuid                     | NO          | null                         |
| group_members                 | user_id                            | uuid                     | NO          | null                         |
| group_members                 | role                               | text                     | NO          | 'member'::text               |
| group_members                 | joined_at                          | timestamp with time zone | YES         | now()                        |
| group_posts                   | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| group_posts                   | group_id                           | uuid                     | NO          | null                         |
| group_posts                   | user_id                            | uuid                     | NO          | null                         |
| group_posts                   | parent_post_id                     | uuid                     | YES         | null                         |
| group_posts                   | content                            | text                     | NO          | null                         |
| group_posts                   | created_at                         | timestamp with time zone | YES         | now()                        |
| group_posts                   | updated_at                         | timestamp with time zone | YES         | now()                        |
| groups                        | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| groups                        | name                               | text                     | NO          | null                         |
| groups                        | description                        | text                     | YES         | null                         |
| groups                        | created_by                         | uuid                     | YES         | null                         |
| groups                        | created_at                         | timestamp with time zone | YES         | now()                        |
| groups                        | updated_at                         | timestamp with time zone | YES         | now()                        |
| groups                        | is_private                         | boolean                  | NO          | false                        |
| groups                        | group_avatar_url                   | text                     | YES         | null                         |
| groups                        | tags                               | ARRAY                    | YES         | null                         |
| job_alert_notifications       | id                                 | uuid                     | NO          | gen_random_uuid()            |
| job_alert_notifications       | job_id                             | uuid                     | NO          | null                         |
| job_alert_notifications       | alert_id                           | uuid                     | NO          | null                         |
| job_alert_notifications       | user_id                            | uuid                     | NO          | null                         |
| job_alert_notifications       | sent_at                            | timestamp with time zone | YES         | now()                        |
| job_alerts                    | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| job_alerts                    | user_id                            | uuid                     | YES         | null                         |
| job_alerts                    | alert_name                         | text                     | NO          | null                         |
| job_alerts                    | job_titles                         | ARRAY                    | YES         | null                         |
| job_alerts                    | industries                         | ARRAY                    | YES         | null                         |
| job_alerts                    | locations                          | ARRAY                    | YES         | null                         |
| job_alerts                    | job_types                          | ARRAY                    | YES         | null                         |
| job_alerts                    | min_salary                         | integer                  | YES         | null                         |
| job_alerts                    | keywords                           | ARRAY                    | YES         | null                         |
| job_alerts                    | frequency                          | text                     | YES         | null                         |
| job_alerts                    | is_active                          | boolean                  | YES         | true                         |
| job_alerts                    | created_at                         | timestamp with time zone | YES         | now()                        |
| job_alerts                    | updated_at                         | timestamp with time zone | YES         | now()                        |
| job_alerts                    | job_type                           | text                     | YES         | null                         |
| job_alerts                    | location                           | text                     | YES         | null                         |
| job_alerts                    | max_salary                         | integer                  | YES         | null                         |
| job_alerts                    | experience_level                   | text                     | YES         | null                         |
| job_alerts                    | desired_roles                      | ARRAY                    | YES         | null                         |
| job_alerts                    | desired_industries                 | ARRAY                    | YES         | null                         |
| job_alerts                    | alert_frequency                    | text                     | YES         | null                         |
| job_alerts                    | name                               | text                     | YES         | null                         |
| job_applications              | id                                 | uuid                     | NO          | gen_random_uuid()            |
| job_applications              | job_id                             | uuid                     | YES         | null                         |
| job_applications              | applicant_id                       | uuid                     | YES         | null                         |
| job_applications              | resume_url                         | text                     | YES         | null                         |
| job_applications              | cover_letter                       | text                     | YES         | null                         |
| job_applications              | status                             | text                     | YES         | 'submitted'::text            |
| job_applications              | created_at                         | timestamp with time zone | YES         | now()                        |
| job_applications              | updated_at                         | timestamp with time zone | YES         | now()                        |
| job_applications              | submitted_at                       | timestamp with time zone | YES         | now()                        |
| job_bookmarks                 | id                                 | uuid                     | NO          | gen_random_uuid()            |
| job_bookmarks                 | created_at                         | timestamp with time zone | NO          | now()                        |
| job_bookmarks                 | job_id                             | uuid                     | NO          | null                         |
| job_bookmarks                 | user_id                            | uuid                     | NO          | null                         |
| job_listings                  | id                                 | uuid                     | NO          | gen_random_uuid()            |
| job_listings                  | creator_id                         | uuid                     | YES         | null                         |
| job_listings                  | company_name                       | text                     | NO          | null                         |
| job_listings                  | title                              | text                     | NO          | null                         |
| job_listings                  | description                        | text                     | NO          | null                         |
| job_listings                  | location                           | text                     | YES         | null                         |
| job_listings                  | is_remote                          | boolean                  | YES         | false                        |
| job_listings                  | job_type                           | text                     | YES         | null                         |
| job_listings                  | salary_min                         | numeric                  | YES         | null                         |
| job_listings                  | salary_max                         | numeric                  | YES         | null                         |
| job_listings                  | application_url                    | text                     | YES         | null                         |
| job_listings                  | contact_email                      | text                     | YES         | null                         |
| job_listings                  | is_published                       | boolean                  | YES         | false                        |
| job_listings                  | expires_at                         | timestamp with time zone | YES         | null                         |
| job_listings                  | created_at                         | timestamp with time zone | YES         | now()                        |
| job_listings                  | updated_at                         | timestamp with time zone | YES         | now()                        |
| jobs                          | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| jobs                          | title                              | text                     | NO          | null                         |
| jobs                          | company_name                       | text                     | NO          | null                         |
| jobs                          | location                           | text                     | YES         | null                         |
| jobs                          | job_type                           | text                     | YES         | null                         |
| jobs                          | description                        | text                     | YES         | null                         |
| jobs                          | requirements                       | text                     | YES         | null                         |
| jobs                          | salary_range                       | text                     | YES         | null                         |
| jobs                          | application_url                    | text                     | YES         | null                         |
| jobs                          | contact_email                      | text                     | YES         | null                         |
| jobs                          | expires_at                         | timestamp with time zone | YES         | null                         |
| jobs                          | posted_by                          | uuid                     | YES         | null                         |
| jobs                          | is_active                          | boolean                  | YES         | true                         |
| jobs                          | created_at                         | timestamp with time zone | YES         | now()                        |
| jobs                          | updated_at                         | timestamp with time zone | YES         | now()                        |
| jobs                          | education_required                 | text                     | YES         | null                         |
| jobs                          | required_skills                    | text                     | YES         | null                         |
| jobs                          | deadline                           | timestamp with time zone | YES         | null                         |
| jobs                          | experience_required                | text                     | YES         | null                         |
| jobs                          | education_level                    | text                     | YES         | null                         |
| jobs                          | external_url                       | text                     | YES         | null                         |
| jobs                          | industry                           | text                     | YES         | null                         |
| jobs                          | application_instructions           | text                     | YES         | null                         |
| jobs                          | user_id                            | uuid                     | YES         | null                         |
| jobs                          | is_approved                        | boolean                  | YES         | false                        |
| jobs                          | company_id                         | uuid                     | YES         | null                         |
| jobs                          | apply_url                          | text                     | YES         | null                         |
| jobs                          | is_verified                        | boolean                  | NO          | false                        |
| jobs                          | created_by                         | uuid                     | YES         | null                         |
| mentee_profiles               | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| mentee_profiles               | user_id                            | uuid                     | NO          | null                         |
| mentee_profiles               | career_goals                       | text                     | YES         | null                         |
| mentee_profiles               | areas_seeking_mentorship           | ARRAY                    | YES         | null                         |
| mentee_profiles               | specific_skills_to_develop         | ARRAY                    | YES         | null                         |
| mentee_profiles               | preferred_mentor_characteristics   | ARRAY                    | YES         | null                         |
| mentee_profiles               | time_commitment_available          | text                     | YES         | null                         |
| mentee_profiles               | preferred_communication_method     | ARRAY                    | YES         | null                         |
| mentee_profiles               | statement_of_expectations          | text                     | YES         | null                         |
| mentee_profiles               | created_at                         | timestamp with time zone | YES         | now()                        |
| mentee_profiles               | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentees                       | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| mentees                       | user_id                            | uuid                     | YES         | null                         |
| mentees                       | status                             | text                     | YES         | 'pending'::text              |
| mentees                       | career_goals                       | text                     | YES         | null                         |
| mentees                       | preferred_industry                 | ARRAY                    | YES         | null                         |
| mentees                       | created_at                         | timestamp with time zone | YES         | now()                        |
| mentees                       | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentor_availability           | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| mentor_availability           | mentor_id                          | uuid                     | YES         | null                         |
| mentor_availability           | date                               | date                     | NO          | null                         |
| mentor_availability           | start_time                         | time without time zone   | NO          | null                         |
| mentor_availability           | end_time                           | time without time zone   | NO          | null                         |
| mentor_availability           | is_booked                          | boolean                  | YES         | false                        |
| mentor_availability           | created_at                         | timestamp with time zone | YES         | now()                        |
| mentor_availability           | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentor_profiles               | id                                 | uuid                     | NO          | gen_random_uuid()            |
| mentor_profiles               | user_id                            | uuid                     | YES         | null                         |
| mentor_profiles               | mentoring_capacity_hours           | integer                  | YES         | 2                            |
| mentor_profiles               | areas_of_expertise                 | ARRAY                    | YES         | null                         |
| mentor_profiles               | mentoring_preferences              | text                     | YES         | null                         |
| mentor_profiles               | mentoring_experience               | text                     | YES         | null                         |
| mentor_profiles               | mentoring_statement                | text                     | YES         | null                         |
| mentor_profiles               | max_mentees                        | integer                  | YES         | 3                            |
| mentor_profiles               | is_accepting_mentees               | boolean                  | YES         | true                         |
| mentor_profiles               | created_at                         | timestamp with time zone | YES         | now()                        |
| mentor_profiles               | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentors                       | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| mentors                       | user_id                            | uuid                     | YES         | null                         |
| mentors                       | status                             | text                     | YES         | 'pending'::text              |
| mentors                       | expertise                          | ARRAY                    | YES         | null                         |
| mentors                       | mentoring_experience_years         | integer                  | YES         | null                         |
| mentors                       | max_mentees                        | integer                  | YES         | 5                            |
| mentors                       | created_at                         | timestamp with time zone | YES         | now()                        |
| mentors                       | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentors                       | mentoring_capacity_hours_per_month | integer                  | YES         | null                         |
| mentors                       | mentoring_preferences              | jsonb                    | YES         | null                         |
| mentors                       | mentoring_statement                | text                     | YES         | null                         |
| mentors                       | mentoring_experience_description   | text                     | YES         | null                         |
| mentorship_appointments       | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| mentorship_appointments       | availability_id                    | uuid                     | YES         | null                         |
| mentorship_appointments       | mentee_id                          | uuid                     | YES         | null                         |
| mentorship_appointments       | topic                              | text                     | NO          | null                         |
| mentorship_appointments       | notes                              | text                     | YES         | null                         |
| mentorship_appointments       | status                             | text                     | YES         | 'scheduled'::text            |
| mentorship_appointments       | feedback_provided                  | boolean                  | YES         | false                        |
| mentorship_appointments       | created_at                         | timestamp with time zone | YES         | now()                        |
| mentorship_appointments       | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentorship_programs           | id                                 | uuid                     | NO          | gen_random_uuid()            |
| mentorship_programs           | title                              | text                     | NO          | null                         |
| mentorship_programs           | description                        | text                     | YES         | null                         |
| mentorship_programs           | start_date                         | timestamp with time zone | YES         | null                         |
| mentorship_programs           | end_date                           | timestamp with time zone | YES         | null                         |
| mentorship_programs           | is_active                          | boolean                  | YES         | true                         |
| mentorship_programs           | created_at                         | timestamp with time zone | YES         | now()                        |
| mentorship_programs           | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentorship_relationships      | id                                 | uuid                     | NO          | gen_random_uuid()            |
| mentorship_relationships      | program_id                         | uuid                     | YES         | null                         |
| mentorship_relationships      | mentor_id                          | uuid                     | YES         | null                         |
| mentorship_relationships      | mentee_id                          | uuid                     | YES         | null                         |
| mentorship_relationships      | status                             | text                     | YES         | 'pending'::text              |
| mentorship_relationships      | created_at                         | timestamp with time zone | YES         | now()                        |
| mentorship_relationships      | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentorship_requests           | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| mentorship_requests           | mentee_id                          | uuid                     | YES         | null                         |
| mentorship_requests           | mentor_id                          | uuid                     | YES         | null                         |
| mentorship_requests           | status                             | text                     | YES         | null                         |
| mentorship_requests           | message                            | text                     | YES         | null                         |
| mentorship_requests           | goals                              | text                     | YES         | null                         |
| mentorship_requests           | created_at                         | timestamp with time zone | YES         | now()                        |
| mentorship_requests           | updated_at                         | timestamp with time zone | YES         | now()                        |
| mentorships                   | id                                 | uuid                     | NO          | gen_random_uuid()            |
| mentorships                   | created_at                         | timestamp with time zone | NO          | now()                        |
| mentorships                   | mentor_id                          | uuid                     | NO          | null                         |
| mentorships                   | mentee_id                          | uuid                     | NO          | null                         |
| mentorships                   | status                             | text                     | NO          | 'requested'::text            |
| mentorships                   | goals                              | text                     | YES         | null                         |
| messages                      | id                                 | uuid                     | NO          | gen_random_uuid()            |
| messages                      | conversation_id                    | uuid                     | NO          | null                         |
| messages                      | sender_id                          | uuid                     | NO          | null                         |
| messages                      | content                            | text                     | NO          | null                         |
| messages                      | created_at                         | timestamp with time zone | NO          | now()                        |
| messages                      | read_at                            | timestamp with time zone | YES         | null                         |
| messages                      | recipient_id                       | uuid                     | YES         | null                         |
| networking_group_members      | id                                 | uuid                     | NO          | gen_random_uuid()            |
| networking_group_members      | group_id                           | uuid                     | YES         | null                         |
| networking_group_members      | user_id                            | uuid                     | YES         | null                         |
| networking_group_members      | role                               | text                     | YES         | 'member'::text               |
| networking_group_members      | joined_at                          | timestamp with time zone | YES         | now()                        |
| networking_groups             | id                                 | uuid                     | NO          | gen_random_uuid()            |
| networking_groups             | name                               | text                     | NO          | null                         |
| networking_groups             | description                        | text                     | YES         | null                         |
| networking_groups             | type                               | text                     | YES         | null                         |
| networking_groups             | image_url                          | text                     | YES         | null                         |
| networking_groups             | visibility                         | text                     | YES         | 'public'::text               |
| networking_groups             | admin_user_ids                     | ARRAY                    | YES         | null                         |
| networking_groups             | created_at                         | timestamp with time zone | YES         | now()                        |
| notification_preferences      | id                                 | uuid                     | NO          | gen_random_uuid()            |
| notification_preferences      | user_id                            | uuid                     | YES         | null                         |
| notification_preferences      | notification_type                  | text                     | NO          | null                         |
| notification_preferences      | email_enabled                      | boolean                  | YES         | true                         |
| notification_preferences      | push_enabled                       | boolean                  | YES         | true                         |
| notification_preferences      | in_app_enabled                     | boolean                  | YES         | true                         |
| notification_preferences      | created_at                         | timestamp with time zone | YES         | now()                        |
| notification_preferences      | updated_at                         | timestamp with time zone | YES         | now()                        |
| notifications                 | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| notifications                 | profile_id                         | uuid                     | NO          | null                         |
| notifications                 | title                              | text                     | NO          | null                         |
| notifications                 | message                            | text                     | NO          | null                         |
| notifications                 | link                               | text                     | YES         | null                         |
| notifications                 | is_read                            | boolean                  | YES         | false                        |
| notifications                 | created_at                         | timestamp with time zone | YES         | now()                        |
| notifications                 | updated_at                         | timestamp with time zone | YES         | now()                        |
| permissions                   | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| permissions                   | name                               | text                     | NO          | null                         |
| permissions                   | description                        | text                     | YES         | null                         |
| permissions                   | created_at                         | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| permissions                   | updated_at                         | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| profiles                      | id                                 | uuid                     | NO          | null                         |
| profiles                      | email                              | text                     | NO          | null                         |
| profiles                      | first_name                         | text                     | YES         | null                         |
| profiles                      | last_name                          | text                     | YES         | null                         |
| profiles                      | full_name                          | text                     | YES         | null                         |
| profiles                      | avatar_url                         | text                     | YES         | null                         |
| profiles                      | graduation_year                    | integer                  | YES         | null                         |
| profiles                      | degree                             | text                     | YES         | null                         |
| profiles                      | major                              | text                     | YES         | null                         |
| profiles                      | current_company                    | text                     | YES         | null                         |
| profiles                      | current_position                   | text                     | YES         | null                         |
| profiles                      | location                           | text                     | YES         | null                         |
| profiles                      | bio                                | text                     | YES         | null                         |
| profiles                      | linkedin_url                       | text                     | YES         | null                         |
| profiles                      | twitter_url                        | text                     | YES         | null                         |
| profiles                      | website_url                        | text                     | YES         | null                         |
| profiles                      | is_verified                        | boolean                  | YES         | false                        |
| profiles                      | is_mentor                          | boolean                  | YES         | false                        |
| profiles                      | created_at                         | timestamp with time zone | YES         | now()                        |
| profiles                      | updated_at                         | timestamp with time zone | YES         | now()                        |
| profiles                      | mentor_availability                | text                     | YES         | null                         |
| profiles                      | mentor_topics                      | ARRAY                    | YES         | null                         |
| profiles                      | mentor_status                      | text                     | YES         | 'pending'::text              |
| profiles                      | mentee_status                      | text                     | YES         | 'pending'::text              |
| profiles                      | alumni_verification_status         | text                     | YES         | 'pending'::text              |
| profiles                      | verification_document_url          | text                     | YES         | null                         |
| profiles                      | verification_notes                 | text                     | YES         | null                         |
| profiles                      | verification_reviewed_by           | uuid                     | YES         | null                         |
| profiles                      | verification_reviewed_at           | timestamp with time zone | YES         | null                         |
| profiles                      | department                         | text                     | YES         | null                         |
| profiles                      | phone                              | text                     | YES         | null                         |
| profiles                      | github_url                         | text                     | YES         | null                         |
| profiles                      | skills                             | ARRAY                    | YES         | null                         |
| profiles                      | account_type                       | text                     | YES         | null                         |
| profiles                      | student_id                         | text                     | YES         | null                         |
| profiles                      | is_employer                        | boolean                  | YES         | false                        |
| profiles                      | company_name                       | text                     | YES         | null                         |
| profiles                      | company_website                    | text                     | YES         | null                         |
| profiles                      | industry                           | text                     | YES         | null                         |
| profiles                      | phone_number                       | text                     | YES         | null                         |
| profiles                      | is_admin                           | boolean                  | YES         | false                        |
| profiles                      | role                               | text                     | YES         | 'user'::text                 |
| profiles                      | job_title                          | text                     | YES         | null                         |
| profiles                      | years_experience                   | integer                  | YES         | null                         |
| profiles                      | current_location                   | text                     | YES         | null                         |
| profiles                      | degree_program                     | text                     | YES         | null                         |
| profiles                      | current_job_title                  | text                     | YES         | null                         |
| profiles                      | major_specialization               | text                     | YES         | null                         |
| profiles                      | biography                          | text                     | YES         | null                         |
| profiles                      | privacy_level                      | text                     | YES         | 'public'::text               |
| profiles                      | is_online                          | boolean                  | YES         | false                        |
| profiles                      | last_seen                          | timestamp with time zone | YES         | null                         |
| profiles                      | username                           | text                     | YES         | null                         |
| profiles                      | about                              | text                     | YES         | null                         |
| profiles                      | headline                           | text                     | YES         | null                         |
| profiles                      | company                            | text                     | YES         | null                         |
| profiles                      | experience                         | text                     | YES         | null                         |
| profiles                      | specialization                     | text                     | YES         | null                         |
| profiles                      | achievements                       | ARRAY                    | YES         | '{}'::text[]                 |
| profiles                      | interests                          | ARRAY                    | YES         | '{}'::text[]                 |
| profiles                      | languages                          | ARRAY                    | YES         | '{}'::text[]                 |
| profiles                      | social_links                       | jsonb                    | YES         | '{}'::jsonb                  |
| profiles                      | verified                           | boolean                  | NO          | false                        |
| profiles                      | batch_year                         | integer                  | YES         | null                         |
| profiles                      | resume_url                         | text                     | YES         | null                         |
| profiles                      | wants_job_alerts                   | boolean                  | YES         | false                        |
| profiles                      | website                            | text                     | YES         | null                         |
| profiles                      | is_available_for_mentorship        | boolean                  | YES         | false                        |
| profiles                      | mentorship_topics                  | ARRAY                    | YES         | null                         |
| profiles                      | date_of_birth                      | date                     | YES         | null                         |
| resources                     | id                                 | uuid                     | NO          | gen_random_uuid()            |
| resources                     | created_at                         | timestamp with time zone | NO          | now()                        |
| resources                     | title                              | text                     | NO          | null                         |
| resources                     | description                        | text                     | YES         | null                         |
| resources                     | url                                | text                     | YES         | null                         |
| resources                     | resource_type                      | text                     | NO          | null                         |
| resources                     | created_by                         | uuid                     | YES         | null                         |
| resources                     | is_approved                        | boolean                  | NO          | false                        |
| resume_profiles               | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| resume_profiles               | user_id                            | uuid                     | NO          | null                         |
| resume_profiles               | resume_url                         | text                     | YES         | null                         |
| resume_profiles               | cover_letter_url                   | text                     | YES         | null                         |
| resume_profiles               | portfolio_link                     | text                     | YES         | null                         |
| resume_profiles               | linkedin_profile                   | text                     | YES         | null                         |
| resume_profiles               | desired_job_titles                 | ARRAY                    | YES         | null                         |
| resume_profiles               | desired_industries                 | ARRAY                    | YES         | null                         |
| resume_profiles               | preferred_locations                | ARRAY                    | YES         | null                         |
| resume_profiles               | willing_to_relocate                | boolean                  | YES         | false                        |
| resume_profiles               | job_alert_active                   | boolean                  | YES         | true                         |
| resume_profiles               | job_alert_frequency                | text                     | YES         | 'daily'::text                |
| resume_profiles               | job_alert_keywords                 | ARRAY                    | YES         | null                         |
| resume_profiles               | created_at                         | timestamp with time zone | YES         | now()                        |
| resume_profiles               | updated_at                         | timestamp with time zone | YES         | now()                        |
| role_permissions              | role_id                            | uuid                     | NO          | null                         |
| role_permissions              | permission_id                      | uuid                     | NO          | null                         |
| role_permissions              | created_at                         | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| roles                         | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| roles                         | name                               | text                     | NO          | null                         |
| roles                         | description                        | text                     | YES         | null                         |
| roles                         | permissions                        | jsonb                    | NO          | '{}'::jsonb                  |
| roles                         | created_at                         | timestamp with time zone | YES         | now()                        |
| roles                         | updated_at                         | timestamp with time zone | YES         | now()                        |
| system_alerts                 | id                                 | uuid                     | NO          | gen_random_uuid()            |
| system_alerts                 | alert_type                         | text                     | NO          | null                         |
| system_alerts                 | title                              | text                     | NO          | null                         |
| system_alerts                 | message                            | text                     | NO          | null                         |
| system_alerts                 | is_resolved                        | boolean                  | YES         | false                        |
| system_alerts                 | resolved_by                        | uuid                     | YES         | null                         |
| system_alerts                 | resolved_at                        | timestamp with time zone | YES         | null                         |
| system_alerts                 | metadata                           | jsonb                    | YES         | '{}'::jsonb                  |
| system_alerts                 | created_at                         | timestamp with time zone | YES         | now()                        |
| system_analytics              | id                                 | uuid                     | NO          | gen_random_uuid()            |
| system_analytics              | metric_name                        | text                     | NO          | null                         |
| system_analytics              | metric_value                       | numeric                  | YES         | null                         |
| system_analytics              | metric_type                        | text                     | YES         | null                         |
| system_analytics              | tags                               | jsonb                    | YES         | null                         |
| system_analytics              | recorded_at                        | timestamp with time zone | YES         | now()                        |
| user_activity_logs            | id                                 | uuid                     | NO          | gen_random_uuid()            |
| user_activity_logs            | user_id                            | uuid                     | YES         | null                         |
| user_activity_logs            | action                             | text                     | NO          | null                         |
| user_activity_logs            | resource_type                      | text                     | YES         | null                         |
| user_activity_logs            | resource_id                        | uuid                     | YES         | null                         |
| user_activity_logs            | metadata                           | jsonb                    | YES         | null                         |
| user_activity_logs            | ip_address                         | inet                     | YES         | null                         |
| user_activity_logs            | user_agent                         | text                     | YES         | null                         |
| user_activity_logs            | created_at                         | timestamp with time zone | YES         | now()                        |
| user_jobs_with_bookmark       | id                                 | uuid                     | YES         | null                         |
| user_jobs_with_bookmark       | title                              | text                     | YES         | null                         |
| user_jobs_with_bookmark       | company_name                       | text                     | YES         | null                         |
| user_jobs_with_bookmark       | location                           | text                     | YES         | null                         |
| user_jobs_with_bookmark       | job_type                           | text                     | YES         | null                         |
| user_jobs_with_bookmark       | description                        | text                     | YES         | null                         |
| user_jobs_with_bookmark       | requirements                       | text                     | YES         | null                         |
| user_jobs_with_bookmark       | salary_range                       | text                     | YES         | null                         |
| user_jobs_with_bookmark       | application_url                    | text                     | YES         | null                         |
| user_jobs_with_bookmark       | contact_email                      | text                     | YES         | null                         |
| user_jobs_with_bookmark       | expires_at                         | timestamp with time zone | YES         | null                         |
| user_jobs_with_bookmark       | posted_by                          | uuid                     | YES         | null                         |
| user_jobs_with_bookmark       | is_active                          | boolean                  | YES         | null                         |
| user_jobs_with_bookmark       | created_at                         | timestamp with time zone | YES         | null                         |
| user_jobs_with_bookmark       | updated_at                         | timestamp with time zone | YES         | null                         |
| user_jobs_with_bookmark       | education_required                 | text                     | YES         | null                         |
| user_jobs_with_bookmark       | required_skills                    | text                     | YES         | null                         |
| user_jobs_with_bookmark       | deadline                           | timestamp with time zone | YES         | null                         |
| user_jobs_with_bookmark       | experience_required                | text                     | YES         | null                         |
| user_jobs_with_bookmark       | education_level                    | text                     | YES         | null                         |
| user_jobs_with_bookmark       | external_url                       | text                     | YES         | null                         |
| user_jobs_with_bookmark       | industry                           | text                     | YES         | null                         |
| user_jobs_with_bookmark       | application_instructions           | text                     | YES         | null                         |
| user_jobs_with_bookmark       | user_id                            | uuid                     | YES         | null                         |
| user_jobs_with_bookmark       | is_approved                        | boolean                  | YES         | null                         |
| user_jobs_with_bookmark       | company_id                         | uuid                     | YES         | null                         |
| user_jobs_with_bookmark       | apply_url                          | text                     | YES         | null                         |
| user_jobs_with_bookmark       | is_verified                        | boolean                  | YES         | null                         |
| user_jobs_with_bookmark       | created_by                         | uuid                     | YES         | null                         |
| user_jobs_with_bookmark       | is_bookmarked                      | boolean                  | YES         | null                         |
| user_jobs_with_bookmark       | bookmarked_at                      | timestamp with time zone | YES         | null                         |
| user_jobs_with_bookmark       | bookmarked_by                      | uuid                     | YES         | null                         |
| user_resumes                  | id                                 | uuid                     | NO          | gen_random_uuid()            |
| user_resumes                  | user_id                            | uuid                     | YES         | null                         |
| user_resumes                  | filename                           | text                     | NO          | null                         |
| user_resumes                  | file_url                           | text                     | NO          | null                         |
| user_resumes                  | file_size                          | integer                  | YES         | null                         |
| user_resumes                  | is_primary                         | boolean                  | YES         | false                        |
| user_resumes                  | uploaded_at                        | timestamp with time zone | YES         | now()                        |
| user_roles                    | id                                 | uuid                     | NO          | uuid_generate_v4()           |
| user_roles                    | profile_id                         | uuid                     | NO          | null                         |
| user_roles                    | role_id                            | uuid                     | NO          | null                         |
| user_roles                    | assigned_by                        | uuid                     | YES         | null                         |
| user_roles                    | created_at                         | timestamp with time zone | YES         | now()                        |
| user_roles                    | updated_at                         | timestamp with time zone | YES         | now()                        |



| schemaname | tablename                 | policyname                                                      | permissive | roles           | cmd    | using_expression                                                                                                                                                                                                                                                                                                                      | with_check                                                                                                                                                                                                                  |
| ---------- | ------------------------- | --------------------------------------------------------------- | ---------- | --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | achievements              | Users can update their own achievements                         | PERMISSIVE | {public}        | ALL    | (auth.uid() = profile_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | achievements              | Anyone can view achievements                                    | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | admin_actions             | Admins can insert admin actions                                 | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                            |
| public     | admin_actions             | Admins can view all admin actions                               | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public     | bookmarked_jobs           | Allow users to delete their own bookmarks                       | PERMISSIVE | {authenticated} | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | bookmarked_jobs           | Allow users to insert their own bookmarks                       | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | bookmarked_jobs           | Allow users to view their own bookmarks                         | PERMISSIVE | {authenticated} | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | connections               | Users can delete their connection requests                      | PERMISSIVE | {public}        | DELETE | ((auth.uid() = requester_id) OR (auth.uid() = recipient_id))                                                                                                                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public     | connections               | Users can request connections                                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = requester_id)                                                                                                                                                                                                 |
| public     | connections               | Users can view their own connections                            | PERMISSIVE | {public}        | SELECT | ((auth.uid() = requester_id) OR (auth.uid() = recipient_id))                                                                                                                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public     | connections               | Users can update connection requests they received              | PERMISSIVE | {public}        | UPDATE | (auth.uid() = recipient_id)                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | connections               | Users can accept/reject connection requests                     | PERMISSIVE | {public}        | UPDATE | (auth.uid() = recipient_id)                                                                                                                                                                                                                                                                                                           | (status <> 'pending'::text)                                                                                                                                                                                                 |
| public     | content_approvals         | Admins can manage all content submissions                       | PERMISSIVE | {public}        | ALL    | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public     | content_approvals         | Creators can view their own content submissions                 | PERMISSIVE | {public}        | SELECT | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | content_moderation        | Admins can manage content moderation                            | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public     | conversation_participants | Users can insert their own participation                        | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (user_id = auth.uid())                                                                                                                                                                                                      |
| public     | conversation_participants | Users can view participants of their conversations              | PERMISSIVE | {public}        | SELECT | is_conversation_participant(conversation_id, auth.uid())                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | conversations             | Users can access conversations they participate in              | PERMISSIVE | {public}        | SELECT | is_conversation_participant(id, auth.uid())                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Users can cancel their own registrations                        | PERMISSIVE | {public}        | DELETE | (auth.uid() = attendee_id)                                                                                                                                                                                                                                                                                                            | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Users can cancel their own event registration                   | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Users can cancel their own registration                         | PERMISSIVE | {public}        | DELETE | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Enable users to delete their own RSVP                           | PERMISSIVE | {authenticated} | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Enable insert for users to RSVP for themselves                  | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | event_attendees           | Users can register for published events                         | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | ((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND (events.is_published = true)))))                                                                          |
| public     | event_attendees           | Authenticated users can register for events                     | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                       |
| public     | event_attendees           | Users can register for events                                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = attendee_id)                                                                                                                                                                                                  |
| public     | event_attendees           | Users can view their own event registrations                    | PERMISSIVE | {public}        | SELECT | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Enable read access for all authenticated users                  | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Enable read access for authenticated users                      | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Event attendees are viewable by everyone                        | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Event organizers can view registrations                         | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND (events.organizer_id = auth.uid()))))                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Event registrations are viewable by everyone                    | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Users can update their own registrations                        | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Enable update for users to change their own RSVP status         | PERMISSIVE | {authenticated} | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | event_attendees           | Users can update their own event registration                   | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_attendees           | Users can update their own registration                         | PERMISSIVE | {public}        | UPDATE | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_feedback            | Users can manage their own event feedback                       | PERMISSIVE | {public}        | ALL    | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | event_feedback            | Admins can delete any feedback                                  | PERMISSIVE | {authenticated} | DELETE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | event_feedback            | Users can create their own feedback                             | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | event_feedback            | Users can submit feedback                                       | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | event_feedback            | Organizers can view event feedback                              | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_feedback.event_id) AND (events.organizer_id = auth.uid()))))                                                                                                                                                                                                            | null                                                                                                                                                                                                                        |
| public     | event_feedback            | Admins can view all event feedback                              | PERMISSIVE | {public}        | SELECT | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| public     | event_feedback            | Users can view all feedback                                     | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | event_feedback            | Users can view their own feedback                               | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_feedback            | Users can update their own feedback                             | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | event_rsvps               | Users can manage their own RSVPs                                | PERMISSIVE | {public}        | ALL    | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | event_rsvps               | Allow authenticated users to view RSVPs                         | PERMISSIVE | {public}        | SELECT | (auth.role() = 'authenticated'::text)                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                        |
| public     | events                    | Allow admins to manage all events                               | PERMISSIVE | {public}        | ALL    | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                                                                                                                                                         | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                                               |
| public     | events                    | Admins can manage all events                                    | PERMISSIVE | {public}        | ALL    | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public     | events                    | Allow authorized users to delete events                         | PERMISSIVE | {public}        | DELETE | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | events                    | Organizers can delete their own events                          | PERMISSIVE | {public}        | DELETE | (organizer_id = auth.uid())                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | events                    | Users can delete their own events                               | PERMISSIVE | {public}        | DELETE | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | events                    | Events can be deleted by organizer                              | PERMISSIVE | {public}        | DELETE | ((auth.uid() = organizer_id) OR (auth.uid() = created_by) OR (auth.uid() = creator_id))                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public     | events                    | Events can be created by authenticated users                    | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() IS NOT NULL)                                                                                                                                                                                                    |
| public     | events                    | Allow admins to create events                                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]))                                                                                                                                               |
| public     | events                    | Authenticated users can create events                           | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                       |
| public     | events                    | Events are viewable by everyone when published                  | PERMISSIVE | {public}        | SELECT | (is_published = true)                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                        |
| public     | events                    | Events are viewable by everyone                                 | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | events                    | Organizers can view their own events                            | PERMISSIVE | {public}        | SELECT | (organizer_id = auth.uid())                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | events                    | Allow public read access to events                              | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | events                    | Organizers can update their own events                          | PERMISSIVE | {public}        | UPDATE | (organizer_id = auth.uid())                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | events                    | Events are editable by organizer                                | PERMISSIVE | {public}        | UPDATE | (auth.uid() = organizer_id)                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | events                    | Allow authorized users to update events                         | PERMISSIVE | {public}        | UPDATE | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | events                    | Users can update their own events                               | PERMISSIVE | {public}        | UPDATE | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | group_members             | Allow members to leave or be removed by admins                  | PERMISSIVE | {public}        | DELETE | ((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = auth.uid()) AND (gm.role = 'admin'::text)))))                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | group_members             | Users can leave groups.                                         | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | group_members             | Leave groups                                                    | PERMISSIVE | {public}        | DELETE | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | group_members             | Users can join public groups.                                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM groups
  WHERE ((groups.id = group_members.group_id) AND (groups.is_private = false) AND (auth.uid() = group_members.user_id))))                                                                 |
| public     | group_members             | Join public groups                                              | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM groups
  WHERE ((groups.id = group_members.group_id) AND (groups.is_private = false)))))                                                                             |
| public     | group_members             | Allow users to join groups                                      | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (( SELECT (NOT groups.is_private)
   FROM groups
  WHERE (groups.id = group_members.group_id)) OR (( SELECT groups.created_by
   FROM groups
  WHERE (groups.id = group_members.group_id)) = auth.uid()))                   |
| public     | group_members             | View own memberships                                            | PERMISSIVE | {public}        | SELECT | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | group_members             | Allow access if user is member of group                         | PERMISSIVE | {public}        | SELECT | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | group_posts               | Users can delete their own posts.                               | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | group_posts               | Group admins can delete any post in their group.                | PERMISSIVE | {public}        | DELETE | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public     | group_posts               | Group members can create posts.                                 | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))))                                                                               |
| public     | group_posts               | Group posts are viewable by group members.                      | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))))                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| public     | group_posts               | Group members can view posts.                                   | PERMISSIVE | {public}        | SELECT | (group_id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE (group_members.user_id = auth.uid())))                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public     | group_posts               | Users can update their own posts.                               | PERMISSIVE | {public}        | UPDATE | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | groups                    | Group admins can delete their group.                            | PERMISSIVE | {public}        | DELETE | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public     | groups                    | Authenticated users can create groups.                          | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.role() = 'authenticated'::text)                                                                                                                                                                                       |
| public     | groups                    | Users can create groups.                                        | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = created_by)                                                                                                                                                                                                   |
| public     | groups                    | Group creators can view their groups                            | PERMISSIVE | {public}        | SELECT | (created_by = auth.uid())                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | groups                    | Public groups are viewable by everyone.                         | PERMISSIVE | {public}        | SELECT | (is_private = false)                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | groups                    | Public groups are viewable by everyone                          | PERMISSIVE | {public}        | SELECT | (is_private = false)                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | groups                    | Allow read access to groups                                     | PERMISSIVE | {public}        | SELECT | ((is_private = false) OR is_member_of_group(id))                                                                                                                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public     | groups                    | Private groups are viewable by members                          | PERMISSIVE | {public}        | SELECT | (id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE (group_members.user_id = auth.uid())))                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | groups                    | Group admins can update their group.                            | PERMISSIVE | {public}        | UPDATE | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                                                                                                                                                          | null                                                                                                                                                                                                                        |
| public     | groups                    | Group creators can update their groups.                         | PERMISSIVE | {public}        | UPDATE | (auth.uid() = created_by)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | job_alerts                | Enable delete for users based on user_id                        | PERMISSIVE | {authenticated} | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | job_alerts                | Enable insert for users based on user_id                        | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | job_alerts                | Enable select for users based on user_id                        | PERMISSIVE | {authenticated} | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | job_alerts                | Enable update for users based on user_id                        | PERMISSIVE | {authenticated} | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | job_applications          | Users can manage their own job applications                     | PERMISSIVE | {public}        | ALL    | (auth.uid() = applicant_id)                                                                                                                                                                                                                                                                                                           | (auth.uid() = applicant_id)                                                                                                                                                                                                 |
| public     | job_applications          | Users can apply to jobs                                         | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = applicant_id)                                                                                                                                                                                                 |
| public     | job_applications          | Users can submit applications                                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = applicant_id)                                                                                                                                                                                                 |
| public     | job_applications          | Users can view applications for their jobs or their own applica | PERMISSIVE | {public}        | SELECT | ((auth.uid() = applicant_id) OR (auth.uid() IN ( SELECT jobs.posted_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id))))                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public     | job_applications          | Employers can view applications for their jobs                  | PERMISSIVE | {public}        | SELECT | (( SELECT jobs.created_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id)) = auth.uid())                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public     | job_applications          | Job creators can view applications                              | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM job_listings
  WHERE ((job_listings.id = job_applications.job_id) AND (job_listings.creator_id = auth.uid()))))                                                                                                                                                                                            | null                                                                                                                                                                                                                        |
| public     | job_applications          | Users can view their own applications                           | PERMISSIVE | {public}        | SELECT | ((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM jobs
  WHERE ((jobs.id = job_applications.job_id) AND (jobs.posted_by = auth.uid())))))                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public     | job_applications          | Job posters can update application status                       | PERMISSIVE | {public}        | UPDATE | (auth.uid() IN ( SELECT jobs.posted_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id)))                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public     | job_bookmarks             | Users can manage their own bookmarks                            | PERMISSIVE | {public}        | ALL    | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | job_bookmarks             | Users can manage their own job bookmarks                        | PERMISSIVE | {public}        | ALL    | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | job_bookmarks             | Users can delete their own bookmarks                            | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | job_bookmarks             | Users can create bookmarks                                      | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | job_bookmarks             | Users can view their own bookmarks                              | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | job_listings              | Creators can delete their own job listings                      | PERMISSIVE | {public}        | DELETE | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | job_listings              | Anyone can view published job listings                          | PERMISSIVE | {public}        | SELECT | (is_published = true)                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                        |
| public     | job_listings              | Creators can view their own job listings                        | PERMISSIVE | {public}        | SELECT | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | job_listings              | Creators can update their own job listings                      | PERMISSIVE | {public}        | UPDATE | (auth.uid() = creator_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | jobs                      | Admins can manage all jobs                                      | PERMISSIVE | {public}        | ALL    | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public     | jobs                      | Allow authorized users to delete jobs                           | PERMISSIVE | {public}        | DELETE | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | jobs                      | Jobs can be deleted by poster                                   | PERMISSIVE | {public}        | DELETE | (auth.uid() = posted_by)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | jobs                      | Users can delete their own jobs                                 | PERMISSIVE | {authenticated} | DELETE | (posted_by = auth.uid())                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | jobs                      | Allow authorized users to create jobs                           | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (get_user_role(auth.uid()) = ANY (ARRAY['employer'::text, 'admin'::text, 'super_admin'::text]))                                                                                                                             |
| public     | jobs                      | Logged-in can post jobs                                         | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | jobs                      | Jobs can be posted by authenticated users                       | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() IS NOT NULL)                                                                                                                                                                                                    |
| public     | jobs                      | Authenticated users can create jobs                             | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                                                                                                                                                                                                  | true                                                                                                                                                                                                                        |
| public     | jobs                      | Anyone can view active jobs                                     | PERMISSIVE | {public}        | SELECT | (is_active = true)                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public     | jobs                      | Public can view active jobs                                     | PERMISSIVE | {public}        | SELECT | ((is_active = true) AND (is_approved = true))                                                                                                                                                                                                                                                                                         | null                                                                                                                                                                                                                        |
| public     | jobs                      | Jobs are viewable by everyone                                   | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | jobs                      | Allow public read access to jobs                                | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | jobs                      | Allow authorized users to update jobs                           | PERMISSIVE | {public}        | UPDATE | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | jobs                      | Creator can edit their job                                      | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | jobs                      | Jobs are editable by poster                                     | PERMISSIVE | {public}        | UPDATE | (auth.uid() = posted_by)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | jobs                      | Users can update their own jobs                                 | PERMISSIVE | {authenticated} | UPDATE | (posted_by = auth.uid())                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentee_profiles           | Allow users to create their own mentee profile                  | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (user_id = auth.uid())                                                                                                                                                                                                      |
| public     | mentee_profiles           | Allow users and admins to view mentee profiles                  | PERMISSIVE | {public}        | SELECT | ((user_id = auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | mentee_profiles           | Allow users to update their own mentee profile                  | PERMISSIVE | {public}        | UPDATE | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentees                   | Users can manage their own mentee profile                       | PERMISSIVE | {public}        | ALL    | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentees                   | mentees_insert_policy                                           | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | mentees                   | Users can view mentees they are mentoring                       | PERMISSIVE | {public}        | SELECT | ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM mentorship_relationships
  WHERE ((mentorship_relationships.mentee_id = mentees.user_id) AND (mentorship_relationships.mentor_id = auth.uid())))))                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentees                   | mentees_select_policy                                           | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentees                   | mentees_update_policy                                           | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentor_availability       | Mentors can manage their own availability                       | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM mentors
  WHERE ((mentors.id = mentor_availability.mentor_id) AND (mentors.user_id = auth.uid()))))                                                                                                                                                                                                        | null                                                                                                                                                                                                                        |
| public     | mentor_availability       | mentor_availability_delete_policy                               | PERMISSIVE | {public}        | DELETE | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentor_availability       | mentor_availability_insert_policy                               | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = mentor_id)                                                                                                                                                                                                    |
| public     | mentor_availability       | mentor_availability_select_policy                               | PERMISSIVE | {public}        | SELECT | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentor_availability       | Anyone can view mentor availability                             | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM mentors
  WHERE ((mentors.id = mentor_availability.mentor_id) AND ((mentors.status = 'approved'::text) OR (mentors.user_id = auth.uid())))))                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public     | mentor_availability       | mentor_availability_select_mentee_policy                        | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | mentor_availability       | mentor_availability_update_policy                               | PERMISSIVE | {public}        | UPDATE | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentors                   | Users can manage their own mentor profile                       | PERMISSIVE | {public}        | ALL    | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentors                   | Mentors can delete their mentor profile                         | PERMISSIVE | {public}        | DELETE | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public     | mentors                   | mentors_insert_policy                                           | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | mentors                   | Users can become mentors                                        | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = id)                                                                                                                                                                                                           |
| public     | mentors                   | Allow individual user to create their own mentor profile        | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | mentors                   | Allow users to create their own mentor profile                  | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (user_id = auth.uid())                                                                                                                                                                                                      |
| public     | mentors                   | Users can view approved mentors                                 | PERMISSIVE | {public}        | SELECT | ((status = 'approved'::text) OR (auth.uid() = user_id))                                                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                        |
| public     | mentors                   | Mentors are viewable by everyone                                | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | mentors                   | mentors_select_policy                                           | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentors                   | Allow individual user to read their own mentor profile          | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentors                   | Allow authenticated users to view mentor profiles               | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | mentors                   | Allow users to update their own mentor profile                  | PERMISSIVE | {public}        | UPDATE | (user_id = auth.uid())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentors                   | Allow individual user to update their own mentor profile        | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | mentors                   | mentors_update_policy                                           | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentors                   | Mentors can update their own info                               | PERMISSIVE | {public}        | UPDATE | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public     | mentorship_appointments   | mentorship_appointments_delete_policy                           | PERMISSIVE | {public}        | DELETE | (auth.uid() = mentee_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentorship_appointments   | Mentees can create appointments                                 | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM mentees
  WHERE ((mentees.id = mentorship_appointments.mentee_id) AND (mentees.user_id = auth.uid()))))                                                                                          |
| public     | mentorship_appointments   | mentorship_appointments_insert_policy                           | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = mentee_id)                                                                                                                                                                                                    |
| public     | mentorship_appointments   | mentorship_appointments_select_policy                           | PERMISSIVE | {public}        | SELECT | (auth.uid() = mentee_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentorship_appointments   | Users can view their own appointments                           | PERMISSIVE | {public}        | SELECT | ((EXISTS ( SELECT 1
   FROM mentees
  WHERE ((mentees.id = mentorship_appointments.mentee_id) AND (mentees.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (mentor_availability ma
     JOIN mentors m ON ((ma.mentor_id = m.id)))
  WHERE ((ma.id = mentorship_appointments.availability_id) AND (m.user_id = auth.uid()))))) | null                                                                                                                                                                                                                        |
| public     | mentorship_appointments   | mentorship_appointments_update_policy                           | PERMISSIVE | {public}        | UPDATE | (auth.uid() = mentee_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | mentorship_appointments   | Users can manage their own appointments                         | PERMISSIVE | {public}        | UPDATE | ((EXISTS ( SELECT 1
   FROM mentees
  WHERE ((mentees.id = mentorship_appointments.mentee_id) AND (mentees.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (mentor_availability ma
     JOIN mentors m ON ((ma.mentor_id = m.id)))
  WHERE ((ma.id = mentorship_appointments.availability_id) AND (m.user_id = auth.uid()))))) | null                                                                                                                                                                                                                        |
| public     | mentorship_programs       | Anyone can view active mentorship programs                      | PERMISSIVE | {public}        | SELECT | (is_active = true)                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                        |
| public     | mentorship_relationships  | Users can view their own mentorship relationships               | PERMISSIVE | {public}        | SELECT | ((auth.uid() = mentor_id) OR (auth.uid() = mentee_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentorship_relationships  | Users can update their own mentorship relationships             | PERMISSIVE | {public}        | UPDATE | ((auth.uid() = mentor_id) OR (auth.uid() = mentee_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentorship_requests       | Users can delete their mentorship requests                      | PERMISSIVE | {public}        | DELETE | ((auth.uid() = mentee_id) OR (auth.uid() = mentor_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentorship_requests       | Users can request mentorship                                    | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = mentee_id)                                                                                                                                                                                                    |
| public     | mentorship_requests       | Users can view their mentor/mentee requests                     | PERMISSIVE | {public}        | SELECT | ((auth.uid() = mentee_id) OR (auth.uid() = mentor_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentorship_requests       | Mentors can respond to requests                                 | PERMISSIVE | {public}        | UPDATE | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | (status <> 'pending'::text)                                                                                                                                                                                                 |
| public     | mentorships               | Mentees can request mentorship                                  | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = mentee_id) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = mentorships.mentor_id) AND (profiles.is_available_for_mentorship = true)))))                                                      |
| public     | mentorships               | Users can view their own mentorships                            | PERMISSIVE | {public}        | SELECT | ((auth.uid() = mentor_id) OR (auth.uid() = mentee_id))                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | mentorships               | Mentors can update mentorship requests                          | PERMISSIVE | {public}        | UPDATE | (auth.uid() = mentor_id)                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | messages                  | Users can send messages                                         | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = sender_id)                                                                                                                                                                                                    |
| public     | messages                  | Users can insert messages in their conversations                | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (is_conversation_participant(conversation_id, auth.uid()) AND (sender_id = auth.uid()))                                                                                                                                     |
| public     | messages                  | Users can send messages in their conversations                  | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | ((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM conversation_participants
  WHERE ((conversation_participants.conversation_id = messages.conversation_id) AND (conversation_participants.user_id = auth.uid()))))) |
| public     | messages                  | Users can view their own messages                               | PERMISSIVE | {public}        | SELECT | ((auth.uid() = sender_id) OR (auth.uid() = recipient_id))                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | messages                  | Users can view messages in their conversations                  | PERMISSIVE | {public}        | SELECT | is_conversation_participant(conversation_id, auth.uid())                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                        |
| public     | messages                  | Recipients can update messages                                  | PERMISSIVE | {public}        | UPDATE | (auth.uid() = recipient_id)                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | notifications             | notifications_insert_policy                                     | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | true                                                                                                                                                                                                                        |
| public     | notifications             | notifications_select_policy                                     | PERMISSIVE | {public}        | SELECT | (auth.uid() = profile_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | notifications             | notifications_update_policy                                     | PERMISSIVE | {public}        | UPDATE | (auth.uid() = profile_id)                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |
| public     | profiles                  | Users can delete their own profile                              | PERMISSIVE | {public}        | DELETE | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | null                                                                                                                                                                                                                        |
| public     | profiles                  | Users can create their own profile                              | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = id)                                                                                                                                                                                                           |
| public     | profiles                  | Profiles are viewable by everyone                               | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | profiles                  | Users can update their own profile                              | PERMISSIVE | {public}        | UPDATE | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                     | (auth.uid() = id)                                                                                                                                                                                                           |
| public     | resources                 | Admins can manage all resources                                 | PERMISSIVE | {public}        | ALL    | (get_my_role() = 'admin'::text)                                                                                                                                                                                                                                                                                                       | (get_my_role() = 'admin'::text)                                                                                                                                                                                             |
| public     | resources                 | Users can create resources                                      | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = created_by)                                                                                                                                                                                                   |
| public     | resources                 | Public can view approved resources                              | PERMISSIVE | {public}        | SELECT | (is_approved = true)                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | resume_profiles           | Users can delete their own resume profile                       | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | resume_profiles           | Users can create their own resume profile                       | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | resume_profiles           | Users can create their own resumes                              | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | resume_profiles           | Resume profiles are viewable by everyone                        | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | resume_profiles           | Resumes are viewable by everyone                                | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | resume_profiles           | Users can update their own resume profile                       | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | resume_profiles           | Users can update their own resumes                              | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | roles                     | Super admins can delete roles                                   | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::text))))                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | roles                     | Super admins can create roles                                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::text))))                                                                                                        |
| public     | roles                     | Roles are viewable by everyone                                  | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | roles                     | Super admins can update roles                                   | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::text))))                                                                                                                                                                                                                  | null                                                                                                                                                                                                                        |
| public     | system_alerts             | Admins can manage system alerts                                 | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))                                                                                                                                                                                      | null                                                                                                                                                                                                                        |
| public     | user_resumes              | Users can delete their own resumes                              | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | user_resumes              | Users can insert their own resumes                              | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                                                                                                                                                                                                  | (auth.uid() = user_id)                                                                                                                                                                                                      |
| public     | user_resumes              | Users can view their own resumes                                | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | user_resumes              | Users can update their own resumes                              | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                        |
| public     | user_roles                | Admins can manage user roles                                    | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.profile_id = auth.uid()) AND (r.name = 'admin'::text))))                                                                                                                                                                           | null                                                                                                                                                                                                                        |
| public     | user_roles                | Users can view their own roles                                  | PERMISSIVE | {public}        | SELECT | (profile_id = auth.uid())                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                        |

| schema | function_name                              | function_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public | assign_role_bypass_rls                     | CREATE OR REPLACE FUNCTION public.assign_role_bypass_rls(profile_uuid uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_id_val UUID;
BEGIN
  -- Get role ID with fully qualified column names
  SELECT roles.id INTO role_id_val FROM roles WHERE roles.name = role_name;
  
  -- Check if role exists
  IF role_id_val IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Assign role to user with fully qualified column names
  INSERT INTO user_roles (profile_id, role_id)
  VALUES (profile_uuid, role_id_val)
  ON CONFLICT (profile_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public | assign_user_role                           | CREATE OR REPLACE FUNCTION public.assign_user_role(profile_uuid uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  
  -- Check if role exists
  IF role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Assign role to user
  INSERT INTO user_roles (profile_id, role_id)
  VALUES (profile_uuid, role_id)
  ON CONFLICT (profile_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | auto_confirm_email                         | CREATE OR REPLACE FUNCTION public.auto_confirm_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Set the email_confirmed_at timestamp to now for new users
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public | check_bookmark_limit                       | CREATE OR REPLACE FUNCTION public.check_bookmark_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (
    SELECT COUNT(*) FROM job_bookmarks WHERE user_id = NEW.user_id
  ) >= 3 THEN
    RAISE EXCEPTION 'You can only bookmark up to 3 jobs';
  END IF;
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| public | check_user_permission_bypass_rls           | CREATE OR REPLACE FUNCTION public.check_user_permission_bypass_rls(profile_uuid uuid, permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.profile_id = profile_uuid AND p.name = permission_name
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public | check_user_role_bypass_rls                 | CREATE OR REPLACE FUNCTION public.check_user_role_bypass_rls(profile_uuid uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.profile_id = profile_uuid AND r.name = role_name
  ) INTO has_role;
  
  RETURN has_role;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | create_event_with_agenda                   | CREATE OR REPLACE FUNCTION public.create_event_with_agenda(event_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_event_id UUID;
    result JSONB;
BEGIN
    -- First insert the event without the agenda
    INSERT INTO public.events (
        title,
        description,
        start_date,
        end_date,
        location,
        is_virtual,
        creator_id,
        organizer_id,
        is_published,
        created_at,
        updated_at
    ) VALUES (
        event_data->>'title',
        event_data->>'description',
        (event_data->>'start_date')::TIMESTAMP WITH TIME ZONE,
        (event_data->>'end_date')::TIMESTAMP WITH TIME ZONE,
        event_data->>'location',
        (event_data->>'is_virtual')::BOOLEAN,
        (event_data->>'creator_id')::UUID,
        (event_data->>'creator_id')::UUID,
        (event_data->>'is_published')::BOOLEAN,
        COALESCE((event_data->>'created_at')::TIMESTAMP WITH TIME ZONE, now()),
        now()
    ) RETURNING id INTO new_event_id;
    
    -- Then update the agenda separately
    IF event_data->>'agenda' IS NOT NULL THEN
        UPDATE public.events 
        SET agenda = event_data->>'agenda'
        WHERE id = new_event_id;
    END IF;
    
    -- Add other optional fields if present
    IF event_data->>'cost' IS NOT NULL THEN
        UPDATE public.events 
        SET cost = event_data->>'cost'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'sponsors' IS NOT NULL THEN
        UPDATE public.events 
        SET sponsors = event_data->>'sponsors'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'virtual_meeting_link' IS NOT NULL THEN
        UPDATE public.events 
        SET virtual_meeting_link = event_data->>'virtual_meeting_link'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'event_type' IS NOT NULL THEN
        UPDATE public.events 
        SET event_type = event_data->>'event_type'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'max_attendees' IS NOT NULL THEN
        UPDATE public.events 
        SET max_attendees = (event_data->>'max_attendees')::INTEGER
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'registration_deadline' IS NOT NULL THEN
        UPDATE public.events 
        SET registration_deadline = (event_data->>'registration_deadline')::TIMESTAMP WITH TIME ZONE
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'image_url' IS NOT NULL THEN
        UPDATE public.events 
        SET featured_image_url = event_data->>'image_url'
        WHERE id = new_event_id;
    END IF;
    
    -- Return the created event
    SELECT row_to_json(e)::jsonb INTO result
    FROM public.events e
    WHERE id = new_event_id;
    
    RETURN result;
END;
$function$
 |
| public | create_group_and_add_admin                 | CREATE OR REPLACE FUNCTION public.create_group_and_add_admin(group_name text, group_description text, group_is_private boolean, group_tags text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_group_id UUID;
    creator_id UUID := auth.uid();
BEGIN
    -- Insert the new group and get its ID
    INSERT INTO public.groups (name, description, is_private, tags, created_by)
    VALUES (group_name, group_description, group_is_private, group_tags, creator_id)
    RETURNING id INTO new_group_id;

    -- Add the creator as the first member with an 'admin' role
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (new_group_id, creator_id, 'admin');

    RETURN new_group_id;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | create_new_event                           | CREATE OR REPLACE FUNCTION public.create_new_event(event_data jsonb)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
    SELECT public.create_event_with_agenda(event_data);
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | create_notification                        | CREATE OR REPLACE FUNCTION public.create_notification(user_id uuid, notification_title text, notification_message text, notification_link text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (profile_id, title, message, link)
  VALUES (user_id, notification_title, notification_message, notification_link)
  RETURNING id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| public | drop_all_policies                          | CREATE OR REPLACE FUNCTION public.drop_all_policies(target_table text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = target_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, target_table);
  END LOOP;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| public | find_or_create_conversation                | CREATE OR REPLACE FUNCTION public.find_or_create_conversation(other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_conversation_id UUID;
  v_current_user_id UUID := auth.uid();
BEGIN
  IF v_current_user_id = other_user_id THEN
    RETURN NULL;
  END IF;

  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants AS cp1
  JOIN conversation_participants AS cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_current_user_id AND cp2.user_id = other_user_id
  AND (
    SELECT COUNT(*)
    FROM conversation_participants
    WHERE conversation_id = cp1.conversation_id
  ) = 2
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO v_conversation_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_current_user_id), (v_conversation_id, other_user_id);

  RETURN v_conversation_id;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | get_connections_count                      | CREATE OR REPLACE FUNCTION public.get_connections_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  connection_count INTEGER;
BEGIN
  -- Count connections where the user is either the requester or recipient
  -- and the connection status is 'accepted'
  SELECT COUNT(*) INTO connection_count
  FROM public.connections
  WHERE (requester_id = p_user_id OR recipient_id = p_user_id)
  AND status = 'accepted';
  
  RETURN connection_count;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | get_dashboard_stats                        | CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
    total_users INTEGER;
    active_jobs INTEGER;
    pending_applications INTEGER;
    total_applications INTEGER;
    messages_today INTEGER;
    users_by_role JSONB;
    recent_activity JSONB;
    pending_approvals INTEGER;
    system_health JSONB;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Get total users
    SELECT COUNT(*) INTO total_users FROM profiles;

    -- Get active jobs
    SELECT COUNT(*) INTO active_jobs 
    FROM jobs 
    WHERE is_active = true;

    -- Get pending applications
    SELECT COUNT(*) INTO pending_applications 
    FROM job_applications 
    WHERE status = 'pending';

    -- Get total applications
    SELECT COUNT(*) INTO total_applications FROM job_applications;

    -- Get messages today
    SELECT COUNT(*) INTO messages_today 
    FROM messages 
    WHERE created_at >= CURRENT_DATE;

    -- Get users by role
    SELECT jsonb_object_agg(
        COALESCE(role, 'unassigned'), 
        role_count
    ) INTO users_by_role
    FROM (
        SELECT 
            role,
            COUNT(*) as role_count
        FROM profiles 
        GROUP BY role
    ) role_stats;

    -- Get recent activity (last 10 admin actions)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'description', description,
            'activityType', action_type,
            'createdAt', created_at
        )
    ) INTO recent_activity
    FROM (
        SELECT * FROM admin_actions 
        ORDER BY created_at DESC 
        LIMIT 10
    ) recent;

    -- Get pending approvals count
    SELECT COUNT(*) INTO pending_approvals
    FROM content_moderation
    WHERE status = 'pending';

    -- Build system health metrics
    system_health := jsonb_build_object(
        'databaseConnections', 1,
        'storageUsage', 0,
        'apiResponseTime', 0
    );

    -- Build final result
    result := jsonb_build_object(
        'totalUsers', total_users,
        'activeJobs', active_jobs,
        'pendingApplications', pending_applications,
        'totalApplications', total_applications,
        'messagesToday', messages_today,
        'usersByRole', COALESCE(users_by_role, '{}'::jsonb),
        'recentActivity', COALESCE(recent_activity, '[]'::jsonb),
        'pendingApprovals', pending_approvals,
        'systemHealth', system_health,
        'lastUpdated', NOW()
    );

    RETURN result;
END;
$function$
                                                                                                |
| public | get_jobs_with_bookmarks                    | CREATE OR REPLACE FUNCTION public.get_jobs_with_bookmarks(p_search_query text, p_sort_by text, p_sort_order text, p_limit integer, p_offset integer)
 RETURNS TABLE(id uuid, title text, location text, description text, job_type text, experience_required text, salary_range text, created_at timestamp with time zone, company_id uuid, company_name text, company_logo_url text, is_bookmarked boolean, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH filtered_jobs AS (
        SELECT
            j.id,
            j.title,
            j.location,
            j.description,
            j.job_type,
            j.experience_required,
            j.salary_range,
            j.created_at,
            j.company_id,
            c.name AS company_name,
            c.logo_url AS company_logo_url,
            EXISTS (
                SELECT 1 FROM job_bookmarks jb
                WHERE jb.job_id = j.id AND jb.user_id = auth.uid()
            ) AS is_bookmarked,
            COUNT(*) OVER() AS total_count
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE (
            -- ✅ Super admin bypasses filter
            get_my_role() IN ('admin', 'super_admin')
            OR (j.is_active = TRUE AND j.is_approved = TRUE)
        )
        AND (
            p_search_query IS NULL
            OR j.title ILIKE '%' || p_search_query || '%'
            OR j.description ILIKE '%' || p_search_query || '%'
        )
        ORDER BY
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'desc' THEN j.created_at END DESC,
            CASE WHEN p_sort_by = 'date' AND p_sort_order = 'asc' THEN j.created_at END ASC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT * FROM filtered_jobs;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | get_latest_message                         | CREATE OR REPLACE FUNCTION public.get_latest_message(p_conversation_id uuid)
 RETURNS TABLE(message_id uuid, content text, sender_id uuid, sender_name text, created_at timestamp with time zone, message_type character varying, attachment_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS message_id,
    m.content,
    m.sender_id,
    p.full_name AS sender_name,
    m.created_at,
    m.message_type,
    m.attachment_url
  FROM
    messages m
    JOIN profiles p ON m.sender_id = p.id
  WHERE
    m.conversation_id = p_conversation_id
  ORDER BY
    m.created_at DESC
  LIMIT 1;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public | get_my_role                                | CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Important: This function assumes the 'profiles' table and 'role' column exist.
  -- It fetches the role for the currently authenticated user.
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | get_or_create_conversation                 | CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if conversation exists
  SELECT id INTO conversation_id
  FROM conversations
  WHERE (participant_1 = user1_id AND participant_2 = user2_id)
     OR (participant_1 = user2_id AND participant_2 = user1_id);
  
  -- If not exists, create it
  IF conversation_id IS NULL THEN
    INSERT INTO conversations(participant_1, participant_2, last_message_at)
    VALUES (user1_id, user2_id, NOW())
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public | get_role_by_name                           | CREATE OR REPLACE FUNCTION public.get_role_by_name(role_name text)
 RETURNS TABLE(id uuid, name text, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY SELECT r.id, r.name, r.description FROM roles r WHERE r.name = role_name;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | get_role_id_by_name                        | CREATE OR REPLACE FUNCTION public.get_role_id_by_name(role_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_id UUID;
BEGIN
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  RETURN role_id;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public | get_roles                                  | CREATE OR REPLACE FUNCTION public.get_roles()
 RETURNS TABLE(id uuid, name text, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY SELECT r.id, r.name, r.description FROM roles r;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public | get_table_columns                          | CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
 RETURNS TABLE(column_name text, data_type text)
 LANGUAGE sql
AS $function$
  select 
    column_name::text,
    data_type::text
  from information_schema.columns
  where table_schema = 'public'
  and table_name = $1
  order by ordinal_position;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | get_unread_message_count                   | CREATE OR REPLACE FUNCTION public.get_unread_message_count(conv_id uuid, user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  count_val INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_val
  FROM messages
  WHERE conversation_id = conv_id
    AND sender_id != user_id
    AND read_at IS NULL;
  
  RETURN count_val;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| public | get_unread_notifications_count             | CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(profile_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.notifications
  WHERE profile_id = profile_uuid AND is_read = FALSE;
  
  RETURN count;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | get_user_conversations                     | CREATE OR REPLACE FUNCTION public.get_user_conversations()
 RETURNS TABLE(conversation_id uuid, last_updated timestamp with time zone, participants jsonb, last_message_content text, last_message_created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH user_conversations AS (
        -- Get all conversations the current user is a part of
        SELECT cp.conversation_id
        FROM public.conversation_participants cp
        WHERE cp.user_id = auth.uid()
    ),
    conversation_participants_details AS (
        -- Get details of all participants in those conversations, excluding the current user
        SELECT
            cp.conversation_id,
            jsonb_agg(jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url)) AS participants
        FROM public.conversation_participants cp
        JOIN public.profiles p ON cp.user_id = p.id
        WHERE cp.conversation_id IN (SELECT uc.conversation_id FROM user_conversations)
          AND cp.user_id <> auth.uid()
        GROUP BY cp.conversation_id
    ),
    last_messages AS (
        -- Get the last message for each conversation using a window function
        SELECT
            m.conversation_id,
            m.content,
            m.created_at
        FROM (
            SELECT
                m.conversation_id,
                m.content,
                m.created_at,
                ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
            FROM public.messages m
            WHERE m.conversation_id IN (SELECT uc.conversation_id FROM user_conversations)
        ) m
        WHERE m.rn = 1
    )
    -- Final SELECT to join everything together
    SELECT
        c.id AS conversation_id,
        c.updated_at AS last_updated,
        cpd.participants,
        lm.content AS last_message_content,
        lm.created_at AS last_message_created_at
    FROM public.conversations c
    JOIN user_conversations uc ON c.id = uc.conversation_id
    LEFT JOIN conversation_participants_details cpd ON c.id = cpd.conversation_id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id
    ORDER BY c.updated_at DESC;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| public | get_user_conversations_v2                  | CREATE OR REPLACE FUNCTION public.get_user_conversations_v2(p_user_id uuid)
 RETURNS TABLE(conversation_id uuid, last_message_at timestamp with time zone, created_at timestamp with time zone, participant_id uuid, participant_name text, participant_avatar text, is_online boolean, unread_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT cp.conversation_id
    FROM conversation_participants cp
    WHERE cp.user_id = p_user_id
  )
  SELECT
    c.id,
    c.last_message_at,
    c.created_at,
    other_participant.user_id,
    p.full_name,
    p.avatar_url,
    COALESCE(p.is_online, FALSE),
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.read_at IS NULL
    ) AS unread_count
  FROM conversations c
  JOIN user_conversations uc ON c.id = uc.conversation_id
  JOIN conversation_participants other_participant ON c.id = other_participant.conversation_id AND other_participant.user_id != p_user_id
  JOIN profiles p ON other_participant.user_id = p.id
  ORDER BY c.last_message_at DESC;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | get_user_permissions                       | CREATE OR REPLACE FUNCTION public.get_user_permissions(profile_uuid uuid)
 RETURNS TABLE(permission_name text, permission_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT permissions.name, permissions.description
  FROM permissions
  WHERE permissions.id IN (
    SELECT permission_id 
    FROM role_permissions
    WHERE role_permissions.role_id IN (
      SELECT role_id 
      FROM user_roles
      WHERE user_roles.profile_id = profile_uuid
    )
  );
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | get_user_permissions_bypass_rls            | CREATE OR REPLACE FUNCTION public.get_user_permissions_bypass_rls(profile_uuid uuid)
 RETURNS TABLE(permission_name text, permission_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.description
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.profile_id = profile_uuid;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | get_user_role                              | CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  SELECT primary_role INTO user_role FROM public.profiles WHERE id = p_user_id;
  RETURN user_role;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| public | get_user_roles_bypass_rls                  | CREATE OR REPLACE FUNCTION public.get_user_roles_bypass_rls(profile_uuid uuid)
 RETURNS TABLE(role_name text, role_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.name, r.description
  FROM roles r
  JOIN user_roles ur ON r.id = ur.role_id
  WHERE ur.profile_id = profile_uuid;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| public | handle_new_user                            | CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert the new profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Return the NEW record
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but still return NEW to allow user creation
    RAISE WARNING 'Error in handle_new_user function: %', SQLERRM;
    RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| public | handle_updated_at                          | CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | is_conversation_participant                | CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- This function runs with the permissions of the user who defined it (the owner),
  -- bypassing the RLS policies of the calling user. This breaks the recursion.
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| public | is_member_of_group                         | CREATE OR REPLACE FUNCTION public.is_member_of_group(p_group_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| public | list_tables                                | CREATE OR REPLACE FUNCTION public.list_tables()
 RETURNS TABLE(table_name text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select table_name
    from information_schema.tables
   where table_schema = 'public'
     and table_type = 'BASE TABLE';
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | mark_conversation_as_read                  | CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(p_conversation_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE messages
  SET is_read = TRUE
  WHERE 
    conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND is_read = FALSE;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public | mark_notification_as_read                  | CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = notification_uuid AND profile_id = auth.uid();
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public | moddatetime                                | CREATE OR REPLACE FUNCTION public.moddatetime()
 RETURNS trigger
 LANGUAGE c
AS '$libdir/moddatetime', $function$moddatetime$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | notify_new_message                         | CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  participant_1_id UUID;
  participant_2_id UUID;
BEGIN
  -- Get the conversation participants
  SELECT participant_1, participant_2 INTO participant_1_id, participant_2_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Update unread count for the other participant (not the sender)
  -- This is used for notification badges
  IF participant_1_id = NEW.sender_id THEN
    -- Sender is participant 1, notify participant 2
    PERFORM pg_notify(
      'new_message',
      json_build_object(
        'user_id', participant_2_id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )::text
    );
  ELSE
    -- Sender is participant 2, notify participant 1
    PERFORM pg_notify(
      'new_message',
      json_build_object(
        'user_id', participant_1_id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | remove_role_bypass_rls                     | CREATE OR REPLACE FUNCTION public.remove_role_bypass_rls(profile_uuid uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_id_val UUID;
BEGIN
  -- Get role ID with fully qualified column names
  SELECT roles.id INTO role_id_val FROM roles WHERE roles.name = role_name;
  
  -- Check if role exists
  IF role_id_val IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remove role from user with fully qualified column names
  DELETE FROM user_roles
  WHERE user_roles.profile_id = profile_uuid AND user_roles.role_id = role_id_val;
  
  RETURN TRUE;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | remove_user_role                           | CREATE OR REPLACE FUNCTION public.remove_user_role(profile_uuid uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  
  -- Check if role exists
  IF role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remove role from user
  DELETE FROM user_roles
  WHERE profile_id = profile_uuid AND role_id = role_id;
  
  RETURN TRUE;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | rsvp_to_event                              | CREATE OR REPLACE FUNCTION public.rsvp_to_event(p_event_id uuid, p_attendee_id uuid, p_attendance_status_text text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO event_rsvps (event_id, user_id, attendance_status)
  VALUES (p_event_id, p_attendee_id, p_attendance_status_text)
  ON CONFLICT (event_id, user_id) DO
  UPDATE SET attendance_status = EXCLUDED.attendance_status;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| public | update_conversation_last_message_at        | CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| public | update_conversation_last_message_timestamp | CREATE OR REPLACE FUNCTION public.update_conversation_last_message_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update the conversation's last_message_at timestamp if conversation_id is not null
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | update_conversation_updated_at             | CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| public | update_event_published_status              | CREATE OR REPLACE FUNCTION public.update_event_published_status(event_id uuid, status_value text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    is_published_value BOOLEAN;
    result JSONB;
BEGIN
    -- Convert status string to boolean is_published value
    IF status_value = 'published' THEN
        is_published_value := TRUE;
    ELSE
        is_published_value := FALSE;
    END IF;
    
    -- Update the event status
    UPDATE public.events 
    SET 
        is_published = is_published_value,
        updated_at = now()
    WHERE id = event_id;
    
    -- Return the updated event
    SELECT row_to_json(e)::jsonb INTO result
    FROM public.events e
    WHERE id = event_id;
    
    RETURN result;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | update_event_status_rpc                    | CREATE OR REPLACE FUNCTION public.update_event_status_rpc(event_id uuid, new_status text)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
    SELECT public.update_event_published_status(event_id, new_status);
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | update_full_name                           | CREATE OR REPLACE FUNCTION public.update_full_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
    RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public | update_updated_at                          | CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| public | update_updated_at_column                   | CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public | user_has_permission                        | CREATE OR REPLACE FUNCTION public.user_has_permission(profile_uuid uuid, permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM permissions 
    WHERE permissions.name = permission_name
    AND permissions.id IN (
      SELECT permission_id 
      FROM role_permissions
      WHERE role_permissions.role_id IN (
        SELECT role_id 
        FROM user_roles
        WHERE user_roles.profile_id = profile_uuid
      )
    )
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public | user_has_role                              | CREATE OR REPLACE FUNCTION public.user_has_role(profile_uuid uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM roles 
    WHERE roles.name = role_name
    AND roles.id IN (
      SELECT role_id 
      FROM user_roles
      WHERE user_roles.profile_id = profile_uuid
    )
  ) INTO has_role;
  
  RETURN has_role;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       || table_name               | trigger_name                                 | timing | event  | function                                               |
| ------------------------ | -------------------------------------------- | ------ | ------ | ------------------------------------------------------ |
| achievements             | update_achievements_updated_at               | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at()                   |
| companies                | handle_updated_at                            | BEFORE | UPDATE | EXECUTE FUNCTION moddatetime('updated_at')             |
| connections              | handle_updated_at_connections                | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| event_attendees          | handle_event_attendees_updated_at            | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| event_attendees          | update_event_attendees_updated_at            | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at()                   |
| events                   | handle_updated_at_events                     | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| events                   | update_events_updated_at                     | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| group_posts              | on_group_posts_update                        | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| groups                   | on_groups_update                             | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| job_alerts               | update_job_alerts_updated_at                 | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| job_applications         | update_job_applications_updated_at           | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at()                   |
| job_bookmarks            | enforce_bookmark_limit                       | BEFORE | INSERT | EXECUTE FUNCTION check_bookmark_limit()                |
| job_bookmarks            | limit_bookmarks                              | BEFORE | INSERT | EXECUTE FUNCTION check_bookmark_limit()                |
| job_listings             | update_job_listings_updated_at               | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| jobs                     | handle_updated_at_jobs                       | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| mentee_profiles          | on_mentee_profiles_updated                   | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| mentees                  | update_mentees_updated_at                    | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| mentor_availability      | update_mentor_availability_updated_at        | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| mentor_profiles          | update_mentor_profiles_updated_at            | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| mentors                  | handle_updated_at_mentors                    | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| mentors                  | update_mentors_updated_at                    | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| mentorship_appointments  | update_mentorship_appointments_updated_at    | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |
| mentorship_programs      | update_mentorship_programs_updated_at        | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at()                   |
| mentorship_relationships | update_mentorship_relationships_updated_at   | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at()                   |
| mentorship_requests      | handle_updated_at_mentorship_requests        | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| messages                 | on_new_message                               | AFTER  | INSERT | EXECUTE FUNCTION update_conversation_updated_at()      |
| messages                 | on_new_message_update_conversation_timestamp | AFTER  | INSERT | EXECUTE FUNCTION update_conversation_last_message_at() |
| profiles                 | handle_updated_at_profiles                   | BEFORE | UPDATE | EXECUTE FUNCTION handle_updated_at()                   |
| profiles                 | update_full_name_trigger                     | BEFORE | UPDATE | EXECUTE FUNCTION update_full_name()                    |
| profiles                 | update_full_name_trigger                     | BEFORE | INSERT | EXECUTE FUNCTION update_full_name()                    |
| profiles                 | update_profiles_full_name                    | BEFORE | INSERT | EXECUTE FUNCTION update_full_name()                    |
| profiles                 | update_profiles_full_name                    | BEFORE | UPDATE | EXECUTE FUNCTION update_full_name()                    |
| profiles                 | update_profiles_updated_at                   | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()            |

| tablename                 | indexname                                                   | indexdef                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| achievements              | achievements_pkey                                           | CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id)                                                                                     |
| activity_logs             | activity_logs_pkey                                          | CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id)                                                                                   |
| admin_actions             | admin_actions_pkey                                          | CREATE UNIQUE INDEX admin_actions_pkey ON public.admin_actions USING btree (id)                                                                                   |
| admin_actions             | idx_admin_actions_admin_id                                  | CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id)                                                                            |
| admin_actions             | idx_admin_actions_created_at                                | CREATE INDEX idx_admin_actions_created_at ON public.admin_actions USING btree (created_at DESC)                                                                   |
| bookmarked_jobs           | bookmarked_jobs_pkey                                        | CREATE UNIQUE INDEX bookmarked_jobs_pkey ON public.bookmarked_jobs USING btree (id)                                                                               |
| bookmarked_jobs           | unique_user_job_bookmark                                    | CREATE UNIQUE INDEX unique_user_job_bookmark ON public.bookmarked_jobs USING btree (user_id, job_id)                                                              |
| companies                 | companies_name_key                                          | CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (name)                                                                                     |
| companies                 | companies_pkey                                              | CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id)                                                                                           |
| connections               | connections_pkey                                            | CREATE UNIQUE INDEX connections_pkey ON public.connections USING btree (id)                                                                                       |
| connections               | connections_requester_id_recipient_id_key                   | CREATE UNIQUE INDEX connections_requester_id_recipient_id_key ON public.connections USING btree (requester_id, recipient_id)                                      |
| connections               | idx_connections_recipient_id                                | CREATE INDEX idx_connections_recipient_id ON public.connections USING btree (recipient_id)                                                                        |
| connections               | idx_connections_requester_id                                | CREATE INDEX idx_connections_requester_id ON public.connections USING btree (requester_id)                                                                        |
| connections               | idx_connections_status                                      | CREATE INDEX idx_connections_status ON public.connections USING btree (status)                                                                                    |
| content_approvals         | content_approvals_pkey                                      | CREATE UNIQUE INDEX content_approvals_pkey ON public.content_approvals USING btree (id)                                                                           |
| content_approvals         | idx_content_approvals_creator_id                            | CREATE INDEX idx_content_approvals_creator_id ON public.content_approvals USING btree (creator_id)                                                                |
| content_approvals         | idx_content_approvals_status                                | CREATE INDEX idx_content_approvals_status ON public.content_approvals USING btree (status)                                                                        |
| content_moderation        | content_moderation_pkey                                     | CREATE UNIQUE INDEX content_moderation_pkey ON public.content_moderation USING btree (id)                                                                         |
| content_moderation        | idx_content_moderation_content_type                         | CREATE INDEX idx_content_moderation_content_type ON public.content_moderation USING btree (content_type)                                                          |
| content_moderation        | idx_content_moderation_status                               | CREATE INDEX idx_content_moderation_status ON public.content_moderation USING btree (status)                                                                      |
| conversation_participants | conversation_participants_pkey                              | CREATE UNIQUE INDEX conversation_participants_pkey ON public.conversation_participants USING btree (conversation_id, user_id)                                     |
| conversation_participants | idx_conversation_participants_conversation_id               | CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants USING btree (conversation_id)                                      |
| conversation_participants | idx_conversation_participants_user_id                       | CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants USING btree (user_id)                                                      |
| conversations             | conversations_pkey                                          | CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id)                                                                                   |
| education_history         | education_history_pkey                                      | CREATE UNIQUE INDEX education_history_pkey ON public.education_history USING btree (id)                                                                           |
| event_attendees           | event_attendees_event_id_attendee_id_key                    | CREATE UNIQUE INDEX event_attendees_event_id_attendee_id_key ON public.event_attendees USING btree (event_id, attendee_id)                                        |
| event_attendees           | event_attendees_event_id_idx                                | CREATE INDEX event_attendees_event_id_idx ON public.event_attendees USING btree (event_id)                                                                        |
| event_attendees           | event_attendees_event_id_user_id_key                        | CREATE UNIQUE INDEX event_attendees_event_id_user_id_key ON public.event_attendees USING btree (event_id, user_id)                                                |
| event_attendees           | event_attendees_pkey                                        | CREATE UNIQUE INDEX event_attendees_pkey ON public.event_attendees USING btree (id)                                                                               |
| event_attendees           | event_attendees_status_idx                                  | CREATE INDEX event_attendees_status_idx ON public.event_attendees USING btree (attendance_status)                                                                 |
| event_attendees           | event_attendees_user_id_idx                                 | CREATE INDEX event_attendees_user_id_idx ON public.event_attendees USING btree (user_id)                                                                          |
| event_attendees           | idx_event_attendees_attendee                                | CREATE INDEX idx_event_attendees_attendee ON public.event_attendees USING btree (user_id)                                                                         |
| event_attendees           | idx_event_attendees_event_id                                | CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id)                                                                        |
| event_feedback            | event_feedback_event_id_user_id_key                         | CREATE UNIQUE INDEX event_feedback_event_id_user_id_key ON public.event_feedback USING btree (event_id, user_id)                                                  |
| event_feedback            | event_feedback_pkey                                         | CREATE UNIQUE INDEX event_feedback_pkey ON public.event_feedback USING btree (id)                                                                                 |
| event_rsvps               | event_rsvps_event_id_user_id_key                            | CREATE UNIQUE INDEX event_rsvps_event_id_user_id_key ON public.event_rsvps USING btree (event_id, user_id)                                                        |
| event_rsvps               | event_rsvps_pkey                                            | CREATE UNIQUE INDEX event_rsvps_pkey ON public.event_rsvps USING btree (id)                                                                                       |
| events                    | events_category_idx                                         | CREATE INDEX events_category_idx ON public.events USING btree (category)                                                                                          |
| events                    | events_is_featured_idx                                      | CREATE INDEX events_is_featured_idx ON public.events USING btree (is_featured)                                                                                    |
| events                    | events_is_published_idx                                     | CREATE INDEX events_is_published_idx ON public.events USING btree (is_published)                                                                                  |
| events                    | events_organizer_id_idx                                     | CREATE INDEX events_organizer_id_idx ON public.events USING btree (organizer_id)                                                                                  |
| events                    | events_pkey                                                 | CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id)                                                                                                 |
| events                    | events_slug_unique                                          | CREATE UNIQUE INDEX events_slug_unique ON public.events USING btree (slug)                                                                                        |
| events                    | events_start_date_idx                                       | CREATE INDEX events_start_date_idx ON public.events USING btree (start_date)                                                                                      |
| events                    | idx_events_category                                         | CREATE INDEX idx_events_category ON public.events USING btree (category)                                                                                          |
| events                    | idx_events_event_type                                       | CREATE INDEX idx_events_event_type ON public.events USING btree (event_type)                                                                                      |
| events                    | idx_events_is_published                                     | CREATE INDEX idx_events_is_published ON public.events USING btree (is_published)                                                                                  |
| events                    | idx_events_organizer_id                                     | CREATE INDEX idx_events_organizer_id ON public.events USING btree (organizer_id)                                                                                  |
| events                    | idx_events_start_date                                       | CREATE INDEX idx_events_start_date ON public.events USING btree (start_date)                                                                                      |
| group_members             | group_members_pkey                                          | CREATE UNIQUE INDEX group_members_pkey ON public.group_members USING btree (group_id, user_id)                                                                    |
| group_posts               | group_posts_pkey                                            | CREATE UNIQUE INDEX group_posts_pkey ON public.group_posts USING btree (id)                                                                                       |
| groups                    | groups_pkey                                                 | CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id)                                                                                                 |
| job_alert_notifications   | job_alert_notifications_pkey                                | CREATE UNIQUE INDEX job_alert_notifications_pkey ON public.job_alert_notifications USING btree (id)                                                               |
| job_alerts                | job_alerts_pkey                                             | CREATE UNIQUE INDEX job_alerts_pkey ON public.job_alerts USING btree (id)                                                                                         |
| job_applications          | idx_job_applications_applicant_id                           | CREATE INDEX idx_job_applications_applicant_id ON public.job_applications USING btree (applicant_id)                                                              |
| job_applications          | idx_job_applications_job_id                                 | CREATE INDEX idx_job_applications_job_id ON public.job_applications USING btree (job_id)                                                                          |
| job_applications          | job_applications_job_id_applicant_id_key                    | CREATE UNIQUE INDEX job_applications_job_id_applicant_id_key ON public.job_applications USING btree (job_id, applicant_id)                                        |
| job_applications          | job_applications_pkey                                       | CREATE UNIQUE INDEX job_applications_pkey ON public.job_applications USING btree (id)                                                                             |
| job_bookmarks             | idx_job_bookmarks_job_id                                    | CREATE INDEX idx_job_bookmarks_job_id ON public.job_bookmarks USING btree (job_id)                                                                                |
| job_bookmarks             | idx_job_bookmarks_user_id                                   | CREATE INDEX idx_job_bookmarks_user_id ON public.job_bookmarks USING btree (user_id)                                                                              |
| job_bookmarks             | job_bookmarks_job_id_user_id_key                            | CREATE UNIQUE INDEX job_bookmarks_job_id_user_id_key ON public.job_bookmarks USING btree (job_id, user_id)                                                        |
| job_bookmarks             | job_bookmarks_pkey                                          | CREATE UNIQUE INDEX job_bookmarks_pkey ON public.job_bookmarks USING btree (id)                                                                                   |
| job_listings              | job_listings_pkey                                           | CREATE UNIQUE INDEX job_listings_pkey ON public.job_listings USING btree (id)                                                                                     |
| jobs                      | idx_jobs_company_id                                         | CREATE INDEX idx_jobs_company_id ON public.jobs USING btree (company_id)                                                                                          |
| jobs                      | idx_jobs_is_active                                          | CREATE INDEX idx_jobs_is_active ON public.jobs USING btree (is_active)                                                                                            |
| jobs                      | idx_jobs_job_type                                           | CREATE INDEX idx_jobs_job_type ON public.jobs USING btree (job_type)                                                                                              |
| jobs                      | idx_jobs_posted_by                                          | CREATE INDEX idx_jobs_posted_by ON public.jobs USING btree (posted_by)                                                                                            |
| jobs                      | jobs_pkey                                                   | CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id)                                                                                                     |
| mentee_profiles           | mentee_profiles_pkey                                        | CREATE UNIQUE INDEX mentee_profiles_pkey ON public.mentee_profiles USING btree (id)                                                                               |
| mentee_profiles           | user_id_unique_mentee_profile                               | CREATE UNIQUE INDEX user_id_unique_mentee_profile ON public.mentee_profiles USING btree (user_id)                                                                 |
| mentees                   | mentees_pkey                                                | CREATE UNIQUE INDEX mentees_pkey ON public.mentees USING btree (id)                                                                                               |
| mentees                   | mentees_status_idx                                          | CREATE INDEX mentees_status_idx ON public.mentees USING btree (status)                                                                                            |
| mentees                   | mentees_user_id_idx                                         | CREATE INDEX mentees_user_id_idx ON public.mentees USING btree (user_id)                                                                                          |
| mentor_availability       | mentor_availability_date_idx                                | CREATE INDEX mentor_availability_date_idx ON public.mentor_availability USING btree (date)                                                                        |
| mentor_availability       | mentor_availability_is_booked_idx                           | CREATE INDEX mentor_availability_is_booked_idx ON public.mentor_availability USING btree (is_booked)                                                              |
| mentor_availability       | mentor_availability_mentor_id_idx                           | CREATE INDEX mentor_availability_mentor_id_idx ON public.mentor_availability USING btree (mentor_id)                                                              |
| mentor_availability       | mentor_availability_pkey                                    | CREATE UNIQUE INDEX mentor_availability_pkey ON public.mentor_availability USING btree (id)                                                                       |
| mentor_profiles           | mentor_profiles_pkey                                        | CREATE UNIQUE INDEX mentor_profiles_pkey ON public.mentor_profiles USING btree (id)                                                                               |
| mentors                   | mentors_pkey                                                | CREATE UNIQUE INDEX mentors_pkey ON public.mentors USING btree (id)                                                                                               |
| mentors                   | mentors_status_idx                                          | CREATE INDEX mentors_status_idx ON public.mentors USING btree (status)                                                                                            |
| mentors                   | mentors_user_id_idx                                         | CREATE INDEX mentors_user_id_idx ON public.mentors USING btree (user_id)                                                                                          |
| mentors                   | mentors_user_id_unique                                      | CREATE UNIQUE INDEX mentors_user_id_unique ON public.mentors USING btree (user_id)                                                                                |
| mentorship_appointments   | mentorship_appointments_availability_id_idx                 | CREATE INDEX mentorship_appointments_availability_id_idx ON public.mentorship_appointments USING btree (availability_id)                                          |
| mentorship_appointments   | mentorship_appointments_created_at_idx                      | CREATE INDEX mentorship_appointments_created_at_idx ON public.mentorship_appointments USING btree (created_at)                                                    |
| mentorship_appointments   | mentorship_appointments_mentee_id_idx                       | CREATE INDEX mentorship_appointments_mentee_id_idx ON public.mentorship_appointments USING btree (mentee_id)                                                      |
| mentorship_appointments   | mentorship_appointments_pkey                                | CREATE UNIQUE INDEX mentorship_appointments_pkey ON public.mentorship_appointments USING btree (id)                                                               |
| mentorship_appointments   | mentorship_appointments_status_idx                          | CREATE INDEX mentorship_appointments_status_idx ON public.mentorship_appointments USING btree (status)                                                            |
| mentorship_programs       | mentorship_programs_pkey                                    | CREATE UNIQUE INDEX mentorship_programs_pkey ON public.mentorship_programs USING btree (id)                                                                       |
| mentorship_relationships  | mentorship_relationships_mentor_id_mentee_id_program_id_key | CREATE UNIQUE INDEX mentorship_relationships_mentor_id_mentee_id_program_id_key ON public.mentorship_relationships USING btree (mentor_id, mentee_id, program_id) |
| mentorship_relationships  | mentorship_relationships_pkey                               | CREATE UNIQUE INDEX mentorship_relationships_pkey ON public.mentorship_relationships USING btree (id)                                                             |
| mentorship_requests       | idx_mentorship_requests_mentee_id                           | CREATE INDEX idx_mentorship_requests_mentee_id ON public.mentorship_requests USING btree (mentee_id)                                                              |
| mentorship_requests       | idx_mentorship_requests_mentor_id                           | CREATE INDEX idx_mentorship_requests_mentor_id ON public.mentorship_requests USING btree (mentor_id)                                                              |
| mentorship_requests       | idx_mentorship_requests_status                              | CREATE INDEX idx_mentorship_requests_status ON public.mentorship_requests USING btree (status)                                                                    |
| mentorship_requests       | mentorship_requests_mentee_id_mentor_id_key                 | CREATE UNIQUE INDEX mentorship_requests_mentee_id_mentor_id_key ON public.mentorship_requests USING btree (mentee_id, mentor_id)                                  |
| mentorship_requests       | mentorship_requests_pkey                                    | CREATE UNIQUE INDEX mentorship_requests_pkey ON public.mentorship_requests USING btree (id)                                                                       |
| mentorships               | mentorships_mentor_id_mentee_id_key                         | CREATE UNIQUE INDEX mentorships_mentor_id_mentee_id_key ON public.mentorships USING btree (mentor_id, mentee_id)                                                  |
| mentorships               | mentorships_pkey                                            | CREATE UNIQUE INDEX mentorships_pkey ON public.mentorships USING btree (id)                                                                                       |
| messages                  | idx_messages_on_conversation_id                             | CREATE INDEX idx_messages_on_conversation_id ON public.messages USING btree (conversation_id)                                                                     |
| messages                  | messages_pkey                                               | CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)                                                                                             |
| networking_group_members  | networking_group_members_group_id_user_id_key               | CREATE UNIQUE INDEX networking_group_members_group_id_user_id_key ON public.networking_group_members USING btree (group_id, user_id)                              |
| networking_group_members  | networking_group_members_pkey                               | CREATE UNIQUE INDEX networking_group_members_pkey ON public.networking_group_members USING btree (id)                                                             |
| networking_groups         | networking_groups_pkey                                      | CREATE UNIQUE INDEX networking_groups_pkey ON public.networking_groups USING btree (id)                                                                           |
| notification_preferences  | notification_preferences_pkey                               | CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id)                                                             |
| notification_preferences  | notification_preferences_user_id_notification_type_key      | CREATE UNIQUE INDEX notification_preferences_user_id_notification_type_key ON public.notification_preferences USING btree (user_id, notification_type)            |
| notifications             | notifications_created_at_idx                                | CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at)                                                                        |
| notifications             | notifications_is_read_idx                                   | CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read)                                                                              |
| notifications             | notifications_pkey                                          | CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)                                                                                   |
| notifications             | notifications_profile_id_idx                                | CREATE INDEX notifications_profile_id_idx ON public.notifications USING btree (profile_id)                                                                        |
| permissions               | permissions_name_key                                        | CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name)                                                                                 |
| permissions               | permissions_pkey                                            | CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id)                                                                                       |
| profiles                  | idx_profiles_graduation_year                                | CREATE INDEX idx_profiles_graduation_year ON public.profiles USING btree (graduation_year)                                                                        |
| profiles                  | idx_profiles_is_mentor                                      | CREATE INDEX idx_profiles_is_mentor ON public.profiles USING btree (is_mentor)                                                                                    |
| profiles                  | idx_profiles_location                                       | CREATE INDEX idx_profiles_location ON public.profiles USING btree (location)                                                                                      |
| profiles                  | idx_profiles_major                                          | CREATE INDEX idx_profiles_major ON public.profiles USING btree (major)                                                                                            |
| profiles                  | profiles_email_key                                          | CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email)                                                                                     |
| profiles                  | profiles_pkey                                               | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)                                                                                             |
| resources                 | resources_pkey                                              | CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id)                                                                                           |
| resume_profiles           | resume_profiles_pkey                                        | CREATE UNIQUE INDEX resume_profiles_pkey ON public.resume_profiles USING btree (id)                                                                               |
| role_permissions          | role_permissions_pkey                                       | CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (role_id, permission_id)                                                         |
| roles                     | roles_name_key                                              | CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name)                                                                                             |
| roles                     | roles_pkey                                                  | CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id)                                                                                                   |
| system_alerts             | idx_system_alerts_created_at                                | CREATE INDEX idx_system_alerts_created_at ON public.system_alerts USING btree (created_at DESC)                                                                   |
| system_alerts             | idx_system_alerts_is_resolved                               | CREATE INDEX idx_system_alerts_is_resolved ON public.system_alerts USING btree (is_resolved)                                                                      |
| system_alerts             | system_alerts_pkey                                          | CREATE UNIQUE INDEX system_alerts_pkey ON public.system_alerts USING btree (id)                                                                                   |
| system_analytics          | system_analytics_pkey                                       | CREATE UNIQUE INDEX system_analytics_pkey ON public.system_analytics USING btree (id)                                                                             |
| user_activity_logs        | user_activity_logs_pkey                                     | CREATE UNIQUE INDEX user_activity_logs_pkey ON public.user_activity_logs USING btree (id)                                                                         |
| user_resumes              | user_resumes_pkey                                           | CREATE UNIQUE INDEX user_resumes_pkey ON public.user_resumes USING btree (id)                                                                                     |
| user_roles                | user_roles_pkey                                             | CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id)                                                                                         |
| user_roles                | user_roles_profile_id_role_id_key                           | CREATE UNIQUE INDEX user_roles_profile_id_role_id_key ON public.user_roles USING btree (profile_id, role_id)                                                      |

| constraint_name                                | table_from                | column_from              | table_to            | column_to |
| ---------------------------------------------- | ------------------------- | ------------------------ | ------------------- | --------- |
| achievements_profile_id_fkey                   | achievements              | profile_id               | profiles            | id        |
| activity_logs_profile_id_fkey                  | activity_logs             | profile_id               | profiles            | id        |
| bookmarked_jobs_job_id_fkey                    | bookmarked_jobs           | job_id                   | jobs                | id        |
| bookmarked_jobs_user_id_fkey                   | bookmarked_jobs           | user_id                  | auth.users          | id        |
| connections_recipient_id_fkey                  | connections               | recipient_id             | profiles            | id        |
| connections_requester_id_fkey                  | connections               | requester_id             | profiles            | id        |
| content_approvals_creator_id_fkey              | content_approvals         | creator_id               | profiles            | id        |
| content_approvals_reviewer_id_fkey             | content_approvals         | reviewer_id              | profiles            | id        |
| conversation_participants_conversation_id_fkey | conversation_participants | conversation_id          | conversations       | id        |
| conversation_participants_user_id_fkey         | conversation_participants | user_id                  | profiles            | id        |
| education_history_user_id_fkey                 | education_history         | user_id                  | profiles            | id        |
| event_attendees_attendee_id_fkey               | event_attendees           | attendee_id              | profiles            | id        |
| event_attendees_event_id_fkey                  | event_attendees           | event_id                 | events              | id        |
| event_attendees_user_id_fkey                   | event_attendees           | user_id                  | auth.users          | id        |
| events_created_by_fkey                         | events                    | created_by               | auth.users          | id        |
| events_creator_id_fkey                         | events                    | creator_id               | auth.users          | id        |
| events_organizer_id_fkey                       | events                    | organizer_id             | auth.users          | id        |
| events_user_id_fkey                            | events                    | user_id                  | profiles            | id        |
| profiles_id_fkey                               | profiles                  | id                       | auth.users          | id        |
| profiles_verification_reviewed_by_fkey         | profiles                  | verification_reviewed_by | profiles            | id        |
| event_feedback_event_id_fkey                   | event_feedback            | event_id                 | events              | id        |
| event_feedback_user_id_fkey                    | event_feedback            | user_id                  | profiles            | id        |
| group_members_group_id_fkey                    | group_members             | group_id                 | groups              | id        |
| group_members_user_id_fkey                     | group_members             | user_id                  | auth.users          | id        |
| fk_group_members_user_id                       | group_members             | user_id                  | profiles            | id        |
| group_posts_group_id_fkey                      | group_posts               | group_id                 | groups              | id        |
| group_posts_parent_post_id_fkey                | group_posts               | parent_post_id           | group_posts         | id        |
| group_posts_user_id_fkey                       | group_posts               | user_id                  | auth.users          | id        |
| fk_group_posts_user                            | group_posts               | user_id                  | profiles            | id        |
| groups_created_by_fkey                         | groups                    | created_by               | auth.users          | id        |
| job_alerts_user_id_fkey                        | job_alerts                | user_id                  | profiles            | id        |
| job_applications_applicant_id_fkey             | job_applications          | applicant_id             | profiles            | id        |
| job_applications_job_id_fkey                   | job_applications          | job_id                   | jobs                | id        |
| job_listings_creator_id_fkey                   | job_listings              | creator_id               | profiles            | id        |
| fk_jobs_company_id                             | jobs                      | company_id               | companies           | id        |
| jobs_created_by_fkey                           | jobs                      | created_by               | auth.users          | id        |
| jobs_posted_by_fkey                            | jobs                      | posted_by                | profiles            | id        |
| jobs_user_id_fkey                              | jobs                      | user_id                  | profiles            | id        |
| mentee_profiles_user_id_fkey                   | mentee_profiles           | user_id                  | profiles            | id        |
| mentees_user_id_fkey                           | mentees                   | user_id                  | profiles            | id        |
| mentor_availability_mentor_id_fkey             | mentor_availability       | mentor_id                | mentors             | id        |
| mentor_profiles_user_id_fkey                   | mentor_profiles           | user_id                  | profiles            | id        |
| mentors_user_id_fkey                           | mentors                   | user_id                  | profiles            | id        |
| mentorship_appointments_availability_id_fkey   | mentorship_appointments   | availability_id          | mentor_availability | id        |
| mentorship_appointments_mentee_id_fkey         | mentorship_appointments   | mentee_id                | mentees             | id        |
| mentorship_relationships_mentee_id_fkey        | mentorship_relationships  | mentee_id                | profiles            | id        |
| mentorship_relationships_mentor_id_fkey        | mentorship_relationships  | mentor_id                | profiles            | id        |
| mentorship_relationships_program_id_fkey       | mentorship_relationships  | program_id               | mentorship_programs | id        |
| mentorship_requests_mentee_id_fkey             | mentorship_requests       | mentee_id                | profiles            | id        |
| mentorship_requests_mentor_id_fkey             | mentorship_requests       | mentor_id                | profiles            | id        |
| messages_conversation_id_fkey                  | messages                  | conversation_id          | conversations       | id        |
| messages_recipient_id_fkey                     | messages                  | recipient_id             | profiles            | id        |
| messages_sender_id_fkey                        | messages                  | sender_id                | profiles            | id        |
| notification_preferences_user_id_fkey          | notification_preferences  | user_id                  | profiles            | id        |
| notifications_profile_id_fkey                  | notifications             | profile_id               | profiles            | id        |
| resume_profiles_user_id_fkey                   | resume_profiles           | user_id                  | auth.users          | id        |
| role_permissions_permission_id_fkey            | role_permissions          | permission_id            | permissions         | id        |
| user_activity_logs_user_id_fkey                | user_activity_logs        | user_id                  | profiles            | id        |
| user_resumes_user_id_fkey                      | user_resumes              | user_id                  | profiles            | id        |
| user_roles_role_id_fkey                        | user_roles                | role_id                  | roles               | id        |
| event_rsvps_event_id_fkey                      | event_rsvps               | event_id                 | events              | id        |
| event_rsvps_user_id_fkey                       | event_rsvps               | user_id                  | auth.users          | id        |
| job_bookmarks_job_id_fkey                      | job_bookmarks             | job_id                   | jobs                | id        |
| job_bookmarks_user_id_fkey                     | job_bookmarks             | user_id                  | auth.users          | id        |
| mentorships_mentee_id_fkey                     | mentorships               | mentee_id                | auth.users          | id        |
| mentorships_mentor_id_fkey                     | mentorships               | mentor_id                | auth.users          | id        |
| resources_created_by_fkey                      | resources                 | created_by               | auth.users          | id        |
| admin_actions_admin_id_fkey                    | admin_actions             | admin_id                 | profiles            | id        |
| system_alerts_resolved_by_fkey                 | system_alerts             | resolved_by              | profiles            | id        |
| content_moderation_moderator_id_fkey           | content_moderation        | moderator_id             | profiles            | id        |
| networking_group_members_group_id_fkey         | networking_group_members  | group_id                 | networking_groups   | id        |
| networking_group_members_user_id_fkey          | networking_group_members  | user_id                  | auth.users          | id        |
| job_alert_notifications_alert_id_fkey          | job_alert_notifications   | alert_id                 | job_alerts          | id        |
| job_alert_notifications_job_id_fkey            | job_alert_notifications   | job_id                   | jobs                | id        |
| job_alert_notifications_user_id_fkey           | job_alert_notifications   | user_id                  | profiles            | id        |
