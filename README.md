# AMET Alumni System - Project Overview

## 1. High-Level Summary

The AMET Alumni System is a full-stack web application designed to connect alumni of the AMET institution. It provides a platform for networking, job searching, and community engagement. The system is built with a modern technology stack, featuring a React frontend and a Supabase backend, which handles the database, authentication, and serverless functions.

**Core Technologies:**
*   **Frontend:** React.js, Create React App
*   **Backend:** Supabase (PostgreSQL, GoTrue Auth, Storage, Edge Functions)
*   **Deployment:** Vercel (for frontend)

---

## 2. Project Structure

The repository is organized into distinct sections for the frontend, backend (Supabase), and supporting scripts.

```
/
├── frontend/              # Contains the entire React.js application
│   ├── src/
│   │   ├── components/    # Reusable React components (e.g., AlumniDirectory, Jobs)
│   │   ├── contexts/      # React Context for state management (e.g., AuthContext)
│   │   ├── utils/         # Utility functions (e.g., supabase client setup)
│   │   └── App.js         # Main application component and routing
│   ├── public/
│   └── package.json       # Frontend dependencies and scripts
│
├── supabase/              # Supabase-specific configuration and migrations
│   ├── migrations/        # SQL migration files for database schema changes
│   └── schema.sql         # A snapshot of the complete database schema
│
├── scripts/               # Various utility and automation scripts
├── vercel.json            # Configuration for deploying the frontend to Vercel
├── README.md              # Project documentation
└── ... (other config files)
```

---

## 3. Backend Features & Implementation (Supabase)

The backend is built entirely on the Supabase platform, leveraging its integrated services.

### a. Database (PostgreSQL)

The database stores all core application data. Key tables include:
*   `profiles`: Stores user profile information, extending the built-in `auth.users` table. Contains fields like `full_name`, `role`, `company`, `title`, etc.
*   `connections`: Manages the networking relationships between users. It includes `requester_id`, `recipient_id` (or `receiver_id`), and a `status` (e.g., 'pending', 'accepted').
*   `jobs`: Contains job postings, including details like `title`, `company`, `description`, and `location`.
*   `job_bookmarks`: **(Planned/Incomplete)** This table is intended to store user bookmarks for jobs but is not yet implemented in the database, causing 404 errors that have been gracefully handled on the frontend.

### b. Authentication & Authorization

*   **Authentication:** Handled by **Supabase GoTrue**. It manages user sign-up, sign-in, and session management via JWTs.
*   **Authorization (RBAC):** Implemented using a combination of a `role` column in the `profiles` table and PostgreSQL's **Row-Level Security (RLS)** policies.
    *   **Roles:**
        *   `super_admin`: Full access to all data and features.
        *   `admin`: Administrative privileges, likely for managing users and content.
        *   `moderator`: Content moderation capabilities.
        *   `employer`: Can post and manage job listings.
        *   `alumni`: The default role for all registered users.
    *   **RLS Policies:** Database policies are in place to ensure users can only access and modify data they own or have explicit permission for. For example, a user can only update their own profile.

### c. Serverless APIs (RPC Functions)

Custom business logic is implemented using PostgreSQL functions, which are exposed as RPC (Remote Procedure Call) endpoints.
*   `get_connections_count(p_user_id)`:
    *   **Functionality:** Securely calculates the total number of 'accepted' connections for a given user.
    *   **Implementation Level:** **Production Ready**. The function is robust, dynamically handling variations in the schema (`recipient_id` vs. `receiver_id`) to prevent errors.
*   `has_permission(user_id, permission_name)`:
    *   **Functionality:** Checks if a user has a specific permission, likely by checking their role against a permissions table.
    *   **Implementation Level:** **Implemented**. This is used in the frontend's `AuthContext` to conditionally render UI elements and restrict actions.

---

## 4. Frontend Features & Implementation (React)

The frontend is a Single Page Application (SPA) built with React.

### a. Core Components & Features

*   **Authentication Flow:**
    *   **Functionality:** Handles user login, session persistence, and profile management.
    *   **Implementation Level:** **Production Ready**. The `AuthContext` is the heart of this system. It manages the user's auth state, fetches their profile, and handles permissions. It has been made resilient with increased timeouts and a fallback mechanism to create a temporary profile if the backend is slow to respond, ensuring a smooth user experience.

*   **Alumni Directory:**
    *   **Functionality:** A searchable and filterable directory of all alumni. Features include pagination to handle large numbers of users.
    *   **Implementation Level:** **Mostly Complete**. The core functionality is working. Recent fixes have resolved runtime errors related to pagination logic. The UI and filtering experience could be further refined.

*   **User Dashboard:**
    *   **Functionality:** A personalized dashboard for logged-in users. Currently, it displays the user's total number of connections.
    *   **Implementation Level:** **Implemented**. The connection count is fetched using the robust `fetchConnectionsCount` function, which has fallbacks to prevent UI errors.

*   **Job Board:**
    *   **Functionality:** Allows users to view, search, and filter job postings.
    *   **Implementation Level:** **Partially Complete**.
        *   **Viewing/Searching Jobs:** This functionality is working correctly.
        *   **Bookmarking Jobs:** The UI for this feature exists, but the corresponding `job_bookmarks` table is missing in the backend. I have implemented a graceful fallback on the frontend to prevent application crashes. The app logs a warning and disables the feature for the user session. This feature is not yet functional.

### b. State Management

*   Application state, particularly authentication and user data, is managed through **React Context** (`AuthContext`).
*   A singleton pattern is used for the Supabase client (`/utils/supabase.js`) to prevent multiple instances and duplicate event listeners, which was a source of bugs that have now been fixed.

---

## 5. Overall Status & Next Steps

The application has a solid foundation and several core features are functional. The immediate next steps should focus on stabilizing existing features and completing planned ones.

*   **High Priority:**
    1.  **Implement `job_bookmarks` Table:** Create the database table and RLS policies for the job bookmarking feature to make it fully functional.
    2.  **Address Profile Fetch Performance:** While the timeout has been increased, the root cause of the slow profile fetch should be investigated. This could involve optimizing the database query or checking for Supabase service performance issues.
*   **Medium Priority:**
    1.  **UI/UX Review:** Conduct a thorough review of the Alumni Directory and Job Board to improve user experience.
    2.  **Expand Dashboard:** Add more personalized widgets and information to the `AlumniDashboard`.
*   **Low Priority:**
    1.  **Code Cleanup:** Refactor components and address any remaining lint warnings or minor bugs.






# AMET Alumni System - Pending Features (Basic-Level Scope)

This document lists all the **remaining features** yet to be built for the AMET Alumni System, scoped strictly to **basic/minimum viable implementations**. These features will be implemented using only the **existing environment and technologies**: React (frontend), Supabase (backend, auth, storage), and Vercel (deployment).

---

## 🔐 User Management & Profiles

* **Profile Verification**

  * Admin can toggle a `verified` boolean in the `profiles` table.

* **Two-Factor Authentication**

  * Enable email-based 2FA using Supabase GoTrue built-in support.

* **QR-Based Registration**

  * Static QR code linking to `/register` page (printed or displayed at events).

---

## 📚 Alumni Directory & Search

* **Advanced Search Options**

  * Add filters for batch year, department, and company.

* **Alumni Achievements Showcase**

  * Add `achievements` field in `profiles`, display in UI on directory/profile.

---

## 🗓️ Event Management

* **Event Creation**

  * Admin-only form, saving event data to a new `events` table.

* **RSVP System**

  * `event_rsvps` table with `user_id`, `event_id`, and toggle logic.

* **Event Calendar**

  * Display events on calendar grid (e.g., FullCalendar or custom layout).

* **Event Reminders**

  * Scheduled email reminder 24 hours before via Supabase Edge Functions.

* **Event Feedback Collection**

  * Simple feedback form (`user_id`, `event_id`, `feedback_text`).

* **Social Sharing**

  * Events shareable via LinkedIn, Facebook, WhatsApp, X (Twitter); Instagram via "copy link".

---

## 💼 Job Portal

* **Resume Upload**

  * Upload resumes to Supabase Storage; store link in `profiles.resume_url`.

* **Job Alerts**

  * Weekly job alert email to users with `wants_job_alerts = true`.

* **Application Tracking**

  * `job_applications` table: `user_id`, `job_id`, `status`.

* **Employer Profiles**

  * Extend `profiles` with `company_name`, `website`, etc., for `role = employer`.

* **Adding a URL**

  * Allow `apply_url` field in `jobs` table.

* **Reviewing & Approving Job Postings**

  * Add `is_approved` boolean field; admin-controlled.

* **Verification of Job/Data Repository**

  * Admin can toggle `is_verified` boolean field for job entries.

* **Social Sharing**

  * Share job posts via LinkedIn, Facebook, WhatsApp, X (Twitter); Instagram via copy link.

---

## 🢑 Networking & Mentorship

* **Mentorship Program**

  * Add `is_mentor` flag; mentees can send mentorship requests.

* **Networking Groups**

  * Create `groups` table; users can join interest-based groups (e.g., departments, regions).

* **Messaging System**

  * `messages` table with `sender_id`, `receiver_id`, `message`, `created_at`.

* **Mentorship Matching Algorithm**

  * Manual matching by mentees based on industry/skills, with filters.

---

## 🛠️ Administration Tools

* **CSV Import/Export**

  * Use PapaParse or similar to allow admins to upload/download CSVs from Supabase data.

* **Data Backup & Validation**

  * Leverage Supabase automatic backups; enforce constraints like `NOT NULL`, `UNIQUE` in schema.

* **Reporting Tools**

  * Admin dashboard showing total alumni, events, jobs, applications, etc.

* **Content Management**

  * Admin-editable `static_pages` table for About, Terms, etc.

* **Analytics Dashboard**

  * Use basic charts to display app usage metrics (users, logins, posts).

* **Enable/Disable Social Media**

  * Admin UI toggles for showing/hiding social share buttons.

* **Generic Analytical Tools**

  * Track counts and interactions (e.g., job views, RSVPs, active users per week).

---

## 💡 UI/UX

* **User Feedback System**

  * Form for users to submit feedback; store in `user_feedback` table.

---

## 📲 Social Media Integration (Limited Scope)

* **Platforms Supported**: LinkedIn, Facebook, WhatsApp, X (Twitter), Instagram (copy link only)

* **Basic Implementation**:

  * Pre-filled share URLs on content pages.
  * Use standard share URL formats (e.g., `https://www.linkedin.com/shareArticle?url=...`).


---

**Note:** All features must be implemented using only the current stack: React (Create React App), Supabase (DB, Auth, Storage, Functions), and Vercel.




| table_name                    | column_name          | data_type                | is_nullable | column_default               |
| ----------------------------- | -------------------- | ------------------------ | ----------- | ---------------------------- |
| achievements                  | id                   | uuid                     | NO          | gen_random_uuid()            |
| achievements                  | profile_id           | uuid                     | YES         | null                         |
| achievements                  | title                | text                     | NO          | null                         |
| achievements                  | description          | text                     | YES         | null                         |
| achievements                  | year                 | integer                  | YES         | null                         |
| achievements                  | url                  | text                     | YES         | null                         |
| achievements                  | achievement_type     | text                     | YES         | null                         |
| achievements                  | created_at           | timestamp with time zone | YES         | now()                        |
| achievements                  | updated_at           | timestamp with time zone | YES         | now()                        |
| activity_logs                 | id                   | uuid                     | NO          | uuid_generate_v4()           |
| activity_logs                 | profile_id           | uuid                     | YES         | null                         |
| activity_logs                 | action               | text                     | NO          | null                         |
| activity_logs                 | entity_type          | text                     | NO          | null                         |
| activity_logs                 | entity_id            | text                     | NO          | null                         |
| activity_logs                 | details              | jsonb                    | YES         | null                         |
| activity_logs                 | created_at           | timestamp with time zone | YES         | now()                        |
| bookmarked_jobs               | id                   | bigint                   | NO          | null                         |
| bookmarked_jobs               | user_id              | uuid                     | NO          | null                         |
| bookmarked_jobs               | job_id               | uuid                     | NO          | null                         |
| bookmarked_jobs               | created_at           | timestamp with time zone | NO          | now()                        |
| companies                     | id                   | uuid                     | NO          | gen_random_uuid()            |
| companies                     | name                 | text                     | NO          | null                         |
| companies                     | logo_url             | text                     | YES         | null                         |
| companies                     | created_at           | timestamp with time zone | NO          | now()                        |
| companies                     | updated_at           | timestamp with time zone | NO          | now()                        |
| connections                   | id                   | uuid                     | NO          | uuid_generate_v4()           |
| connections                   | requester_id         | uuid                     | YES         | null                         |
| connections                   | recipient_id         | uuid                     | YES         | null                         |
| connections                   | status               | text                     | YES         | 'pending'::text              |
| connections                   | created_at           | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| connections                   | updated_at           | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| content_approvals             | id                   | bigint                   | NO          | null                         |
| content_approvals             | created_at           | timestamp with time zone | YES         | now()                        |
| content_approvals             | content_type         | text                     | NO          | null                         |
| content_approvals             | content_data         | jsonb                    | YES         | null                         |
| content_approvals             | creator_id           | uuid                     | NO          | null                         |
| content_approvals             | reviewer_id          | uuid                     | YES         | null                         |
| content_approvals             | status               | text                     | NO          | 'pending'::text              |
| content_approvals             | reviewed_at          | timestamp with time zone | YES         | null                         |
| content_approvals             | rejection_reason     | text                     | YES         | null                         |
| conversation_participants     | conversation_id      | uuid                     | NO          | null                         |
| conversation_participants     | user_id              | uuid                     | NO          | null                         |
| conversation_participants     | joined_at            | timestamp with time zone | NO          | now()                        |
| conversations                 | id                   | uuid                     | NO          | gen_random_uuid()            |
| conversations                 | created_at           | timestamp with time zone | NO          | now()                        |
| conversations                 | updated_at           | timestamp with time zone | NO          | now()                        |
| conversations                 | last_message_at      | timestamp with time zone | YES         | now()                        |
| education_history             | id                   | uuid                     | NO          | gen_random_uuid()            |
| education_history             | user_id              | uuid                     | YES         | null                         |
| education_history             | institution_name     | text                     | NO          | null                         |
| education_history             | degree_type          | text                     | NO          | null                         |
| education_history             | major                | text                     | YES         | null                         |
| education_history             | graduation_year      | integer                  | YES         | null                         |
| education_history             | gpa                  | numeric                  | YES         | null                         |
| education_history             | honors               | text                     | YES         | null                         |
| education_history             | notable_achievements | text                     | YES         | null                         |
| education_history             | created_at           | timestamp with time zone | YES         | now()                        |
| event_attendees               | id                   | uuid                     | NO          | gen_random_uuid()            |
| event_attendees               | created_at           | timestamp with time zone | NO          | now()                        |
| event_attendees               | updated_at           | timestamp with time zone | YES         | now()                        |
| event_attendees               | event_id             | uuid                     | NO          | null                         |
| event_attendees               | user_id              | uuid                     | NO          | null                         |
| event_attendees               | status               | text                     | NO          | 'registered'::text           |
| event_attendees               | check_in_time        | timestamp with time zone | YES         | null                         |
| event_attendees_with_profiles | id                   | uuid                     | YES         | null                         |
| event_attendees_with_profiles | created_at           | timestamp with time zone | YES         | null                         |
| event_attendees_with_profiles | event_id             | uuid                     | YES         | null                         |
| event_attendees_with_profiles | user_id              | uuid                     | YES         | null                         |
| event_attendees_with_profiles | status               | text                     | YES         | null                         |
| event_attendees_with_profiles | check_in_time        | timestamp with time zone | YES         | null                         |
| event_attendees_with_profiles | profile_id           | uuid                     | YES         | null                         |
| event_attendees_with_profiles | full_name            | text                     | YES         | null                         |
| event_attendees_with_profiles | avatar_url           | text                     | YES         | null                         |
| event_attendees_with_profiles | event_title          | text                     | YES         | null                         |
| event_attendees_with_profiles | event_start_date     | timestamp with time zone | YES         | null                         |
| event_feedback                | id                   | uuid                     | NO          | uuid_generate_v4()           |
| event_feedback                | event_id             | uuid                     | YES         | null                         |
| event_feedback                | user_id              | uuid                     | YES         | null                         |
| event_feedback                | rating               | integer                  | YES         | null                         |
| event_feedback                | comments             | text                     | YES         | null                         |
| event_feedback                | submitted_at         | timestamp with time zone | YES         | now()                        |
| event_rsvps                   | id                   | uuid                     | NO          | gen_random_uuid()            |
| event_rsvps                   | created_at           | timestamp with time zone | NO          | now()                        |
| event_rsvps                   | event_id             | uuid                     | NO          | null                         |
| event_rsvps                   | user_id              | uuid                     | NO          | null                         |
| event_stats                   | event_id             | uuid                     | YES         | null                         |
| event_stats                   | title                | text                     | YES         | null                         |
| event_stats                   | start_date           | timestamp with time zone | YES         | null                         |
| event_stats                   | end_date             | timestamp with time zone | YES         | null                         |
| event_stats                   | location             | text                     | YES         | null                         |
| event_stats                   | is_virtual           | boolean                  | YES         | null                         |
| event_stats                   | category             | text                     | YES         | null                         |
| event_stats                   | is_featured          | boolean                  | YES         | null                         |
| event_stats                   | is_published         | boolean                  | YES         | null                         |
| event_stats                   | max_attendees        | integer                  | YES         | null                         |
| event_stats                   | organizer_id         | uuid                     | YES         | null                         |
| event_stats                   | organizer_name       | text                     | YES         | null                         |
| event_stats                   | attendee_count       | bigint                   | YES         | null                         |
| event_stats                   | spots_remaining      | bigint                   | YES         | null                         |
| events                        | id                   | uuid                     | NO          | gen_random_uuid()            |


| tablename                 | policyname                                                      | command | using_expression                                                                                                                                                                                         | with_check_expression                                                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| achievements              | Anyone can view achievements                                    | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| achievements              | Users can update their own achievements                         | ALL     | (auth.uid() = profile_id)                                                                                                                                                                                | null                                                                                                                                                                                                      |
| bookmarked_jobs           | Allow users to delete their own bookmarks                       | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| bookmarked_jobs           | Allow users to insert their own bookmarks                       | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = user_id)                                                                                                                                                                                    |
| bookmarked_jobs           | Allow users to view their own bookmarks                         | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| connections               | Users can delete their connection requests                      | DELETE  | ((auth.uid() = requester_id) OR (auth.uid() = recipient_id))                                                                                                                                             | null                                                                                                                                                                                                      |
| connections               | Users can request connections                                   | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = requester_id)                                                                                                                                                                               |
| connections               | Users can update connection requests they received              | UPDATE  | (auth.uid() = recipient_id)                                                                                                                                                                              | null                                                                                                                                                                                                      |
| connections               | Users can view their own connections                            | SELECT  | ((auth.uid() = requester_id) OR (auth.uid() = recipient_id))                                                                                                                                             | null                                                                                                                                                                                                      |
| conversation_participants | Users can insert their own participation                        | INSERT  | null                                                                                                                                                                                                     | (user_id = auth.uid())                                                                                                                                                                                    |
| conversation_participants | Users can view participants of their conversations              | SELECT  | is_conversation_participant(conversation_id, auth.uid())                                                                                                                                                 | null                                                                                                                                                                                                      |
| conversations             | Users can access conversations they participate in              | SELECT  | is_conversation_participant(id, auth.uid())                                                                                                                                                              | null                                                                                                                                                                                                      |
| event_attendees           | Authenticated users can register for events                     | INSERT  | null                                                                                                                                                                                                     | (auth.role() = 'authenticated'::text)                                                                                                                                                                     |
| event_attendees           | Enable insert for users to RSVP for themselves                  | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = user_id)                                                                                                                                                                                    |
| event_attendees           | Enable read access for all authenticated users                  | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| event_attendees           | Enable read access for authenticated users                      | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| event_attendees           | Enable update for users to change their own RSVP status         | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                   | (auth.uid() = user_id)                                                                                                                                                                                    |
| event_attendees           | Enable users to delete their own RSVP                           | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_attendees           | Event attendees are viewable by everyone                        | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| event_attendees           | Event organizers can view registrations                         | SELECT  | (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND (events.organizer_id = auth.uid()))))                                                                              | null                                                                                                                                                                                                      |
| event_attendees           | Event registrations are viewable by everyone                    | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| event_attendees           | Users can cancel their own event registration                   | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_attendees           | Users can cancel their own registration                         | DELETE  | (user_id = auth.uid())                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_attendees           | Users can cancel their own registrations                        | DELETE  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_attendees           | Users can register for events                                   | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = user_id)                                                                                                                                                                                    |
| event_attendees           | Users can register for published events                         | INSERT  | null                                                                                                                                                                                                     | ((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM events
  WHERE ((events.id = event_attendees.event_id) AND (events.is_published = true)))))                                                        |
| event_attendees           | Users can update their own event registration                   | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_attendees           | Users can update their own registration                         | UPDATE  | (user_id = auth.uid())                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_attendees           | Users can update their own registrations                        | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_attendees           | Users can view their own event registrations                    | SELECT  | (user_id = auth.uid())                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| event_feedback            | Admins can view all event feedback                              | SELECT  | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                            | null                                                                                                                                                                                                      |
| event_feedback            | Users can manage their own event feedback                       | ALL     | (auth.uid() = user_id)                                                                                                                                                                                   | (auth.uid() = user_id)                                                                                                                                                                                    |
| event_rsvps               | Allow authenticated users to view RSVPs                         | SELECT  | (auth.role() = 'authenticated'::text)                                                                                                                                                                    | null                                                                                                                                                                                                      |
| event_rsvps               | Users can manage their own RSVPs                                | ALL     | (auth.uid() = user_id)                                                                                                                                                                                   | (auth.uid() = user_id)                                                                                                                                                                                    |
| events                    | Allow admins to create events                                   | INSERT  | null                                                                                                                                                                                                     | (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]))                                                                                                                             |
| events                    | Allow admins to manage all events                               | ALL     | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                            | (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)                                                                                                             |
| events                    | Allow authorized users to delete events                         | DELETE  | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                | null                                                                                                                                                                                                      |
| events                    | Allow authorized users to update events                         | UPDATE  | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                | null                                                                                                                                                                                                      |
| events                    | Allow public read access to events                              | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| events                    | Authenticated users can create events                           | INSERT  | null                                                                                                                                                                                                     | (auth.role() = 'authenticated'::text)                                                                                                                                                                     |
| events                    | Events are editable by organizer                                | UPDATE  | ((auth.uid() = organizer_id) OR (auth.uid() = created_by) OR (auth.uid() = creator_id))                                                                                                                  | null                                                                                                                                                                                                      |
| events                    | Events are viewable by everyone                                 | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| events                    | Events are viewable by everyone when published                  | SELECT  | (is_published = true)                                                                                                                                                                                    | null                                                                                                                                                                                                      |
| events                    | Events can be created by authenticated users                    | INSERT  | null                                                                                                                                                                                                     | ((auth.uid() IS NOT NULL) AND ((auth.uid() = organizer_id) OR (auth.uid() = created_by) OR (auth.uid() = creator_id)))                                                                                    |
| events                    | Events can be deleted by organizer                              | DELETE  | ((auth.uid() = organizer_id) OR (auth.uid() = created_by) OR (auth.uid() = creator_id))                                                                                                                  | null                                                                                                                                                                                                      |
| events                    | Organizers can delete their own events                          | DELETE  | (organizer_id = auth.uid())                                                                                                                                                                              | null                                                                                                                                                                                                      |
| events                    | Organizers can update their own events                          | UPDATE  | (organizer_id = auth.uid())                                                                                                                                                                              | null                                                                                                                                                                                                      |
| events                    | Organizers can view their own events                            | SELECT  | (organizer_id = auth.uid())                                                                                                                                                                              | null                                                                                                                                                                                                      |
| events                    | Users can delete their own events                               | DELETE  | (auth.uid() = creator_id)                                                                                                                                                                                | null                                                                                                                                                                                                      |
| events                    | Users can update their own events                               | UPDATE  | (auth.uid() = creator_id)                                                                                                                                                                                | null                                                                                                                                                                                                      |
| group_members             | Allow members to leave or be removed by admins                  | DELETE  | ((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = auth.uid()) AND (gm.role = 'admin'::text)))))                   | null                                                                                                                                                                                                      |
| group_members             | Allow members to view other members in their group              | SELECT  | is_member_of_group(group_id)                                                                                                                                                                             | null                                                                                                                                                                                                      |
| group_members             | Allow users to join groups                                      | INSERT  | null                                                                                                                                                                                                     | (( SELECT (NOT groups.is_private)
   FROM groups
  WHERE (groups.id = group_members.group_id)) OR (( SELECT groups.created_by
   FROM groups
  WHERE (groups.id = group_members.group_id)) = auth.uid())) |
| group_posts               | Group admins can delete any post in their group.                | DELETE  | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = group_posts.group_id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                  | null                                                                                                                                                                                                      |
| group_posts               | Group members can create posts.                                 | INSERT  | null                                                                                                                                                                                                     | (group_id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE (group_members.user_id = auth.uid())))                                                                                         |
| group_posts               | Group members can view posts.                                   | SELECT  | (group_id IN ( SELECT group_members.group_id
   FROM group_members
  WHERE (group_members.user_id = auth.uid())))                                                                                        | null                                                                                                                                                                                                      |
| group_posts               | Users can delete their own posts.                               | DELETE  | (user_id = auth.uid())                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| group_posts               | Users can update their own posts.                               | UPDATE  | (user_id = auth.uid())                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| groups                    | Allow read access to groups                                     | SELECT  | ((is_private = false) OR is_member_of_group(id))                                                                                                                                                         | null                                                                                                                                                                                                      |
| groups                    | Authenticated users can create groups.                          | INSERT  | null                                                                                                                                                                                                     | (auth.role() = 'authenticated'::text)                                                                                                                                                                     |
| groups                    | Group admins can delete their group.                            | DELETE  | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                             | null                                                                                                                                                                                                      |
| groups                    | Group admins can update their group.                            | UPDATE  | (( SELECT group_members.role
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = auth.uid()))) = 'admin'::text)                                             | null                                                                                                                                                                                                      |
| job_applications          | Employers can view applications for their jobs                  | SELECT  | (( SELECT jobs.created_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id)) = auth.uid())                                                                                                        | null                                                                                                                                                                                                      |
| job_applications          | Job creators can view applications                              | SELECT  | (EXISTS ( SELECT 1
   FROM job_listings
  WHERE ((job_listings.id = job_applications.job_id) AND (job_listings.creator_id = auth.uid()))))                                                               | null                                                                                                                                                                                                      |
| job_applications          | Job posters can update application status                       | UPDATE  | (auth.uid() IN ( SELECT jobs.posted_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id)))                                                                                                        | null                                                                                                                                                                                                      |
| job_applications          | Users can apply to jobs                                         | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = applicant_id)                                                                                                                                                                               |
| job_applications          | Users can manage their own job applications                     | ALL     | (auth.uid() = applicant_id)                                                                                                                                                                              | (auth.uid() = applicant_id)                                                                                                                                                                               |
| job_applications          | Users can submit applications                                   | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = applicant_id)                                                                                                                                                                               |
| job_applications          | Users can view applications for their jobs or their own applica | SELECT  | ((auth.uid() = applicant_id) OR (auth.uid() IN ( SELECT jobs.posted_by
   FROM jobs
  WHERE (jobs.id = job_applications.job_id))))                                                                       | null                                                                                                                                                                                                      |
| job_applications          | Users can view their own applications                           | SELECT  | (auth.uid() = applicant_id)                                                                                                                                                                              | null                                                                                                                                                                                                      |
| job_bookmarks             | Users can manage their own job bookmarks                        | ALL     | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| job_listings              | Anyone can view published job listings                          | SELECT  | (is_published = true)                                                                                                                                                                                    | null                                                                                                                                                                                                      |
| job_listings              | Creators can delete their own job listings                      | DELETE  | (auth.uid() = creator_id)                                                                                                                                                                                | null                                                                                                                                                                                                      |
| job_listings              | Creators can update their own job listings                      | UPDATE  | (auth.uid() = creator_id)                                                                                                                                                                                | null                                                                                                                                                                                                      |
| job_listings              | Creators can view their own job listings                        | SELECT  | (auth.uid() = creator_id)                                                                                                                                                                                | null                                                                                                                                                                                                      |
| jobs                      | Allow authorized users to create jobs                           | INSERT  | null                                                                                                                                                                                                     | (get_user_role(auth.uid()) = ANY (ARRAY['employer'::text, 'admin'::text, 'super_admin'::text]))                                                                                                           |
| jobs                      | Allow authorized users to delete jobs                           | DELETE  | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                | null                                                                                                                                                                                                      |
| jobs                      | Allow authorized users to update jobs                           | UPDATE  | ((auth.uid() = user_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                | null                                                                                                                                                                                                      |
| jobs                      | Allow public read access to jobs                                | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| jobs                      | Anyone can view active jobs                                     | SELECT  | (is_active = true)                                                                                                                                                                                       | null                                                                                                                                                                                                      |
| jobs                      | Authenticated users can create jobs                             | INSERT  | null                                                                                                                                                                                                     | true                                                                                                                                                                                                      |
| jobs                      | Jobs are editable by poster                                     | UPDATE  | (auth.uid() = posted_by)                                                                                                                                                                                 | null                                                                                                                                                                                                      |
| jobs                      | Jobs are viewable by everyone                                   | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| jobs                      | Jobs can be deleted by poster                                   | DELETE  | (auth.uid() = posted_by)                                                                                                                                                                                 | null                                                                                                                                                                                                      |
| jobs                      | Jobs can be posted by authenticated users                       | INSERT  | null                                                                                                                                                                                                     | ((auth.uid() IS NOT NULL) AND (auth.uid() = posted_by))                                                                                                                                                   |
| jobs                      | Users can delete their own jobs                                 | DELETE  | (posted_by = auth.uid())                                                                                                                                                                                 | null                                                                                                                                                                                                      |
| jobs                      | Users can update their own jobs                                 | UPDATE  | (posted_by = auth.uid())                                                                                                                                                                                 | null                                                                                                                                                                                                      |
| mentee_profiles           | Allow users and admins to view mentee profiles                  | SELECT  | ((user_id = auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])))                                                                                                | null                                                                                                                                                                                                      |
| mentee_profiles           | Allow users to create their own mentee profile                  | INSERT  | null                                                                                                                                                                                                     | (user_id = auth.uid())                                                                                                                                                                                    |
| mentee_profiles           | Allow users to update their own mentee profile                  | UPDATE  | (user_id = auth.uid())                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| mentees                   | Users can manage their own mentee profile                       | ALL     | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| mentees                   | Users can view mentees they are mentoring                       | SELECT  | ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM mentorship_relationships
  WHERE ((mentorship_relationships.mentee_id = mentees.user_id) AND (mentorship_relationships.mentor_id = auth.uid()))))) | null                                                                                                                                                                                                      |
| mentees                   | mentees_insert_policy                                           | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = user_id)                                                                                                                                                                                    |
| mentees                   | mentees_select_policy                                           | SELECT  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| mentees                   | mentees_update_policy                                           | UPDATE  | (auth.uid() = user_id)                                                                                                                                                                                   | null                                                                                                                                                                                                      |
| mentor_availability       | Anyone can view mentor availability                             | SELECT  | (EXISTS ( SELECT 1
   FROM mentors
  WHERE ((mentors.id = mentor_availability.mentor_id) AND ((mentors.status = 'approved'::text) OR (mentors.user_id = auth.uid())))))                                  | null                                                                                                                                                                                                      |
| mentor_availability       | Mentors can manage their own availability                       | ALL     | (EXISTS ( SELECT 1
   FROM mentors
  WHERE ((mentors.id = mentor_availability.mentor_id) AND (mentors.user_id = auth.uid()))))                                                                           | null                                                                                                                                                                                                      |
| mentor_availability       | mentor_availability_delete_policy                               | DELETE  | (auth.uid() = mentor_id)                                                                                                                                                                                 | null                                                                                                                                                                                                      |
| mentor_availability       | mentor_availability_insert_policy                               | INSERT  | null                                                                                                                                                                                                     | (auth.uid() = mentor_id)                                                                                                                                                                                  |
| mentor_availability       | mentor_availability_select_mentee_policy                        | SELECT  | true                                                                                                                                                                                                     | null                                                                                                                                                                                                      |
| function_name                              | function_definition                                                                                                                                                                    
| assign_role_bypass_rls                     | CREATE OR REPLACE FUNCTION public.assign_role_bypass_rls(profile_uuid uuid, role_name text)
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
| assign_user_role                           | CREATE OR REPLACE FUNCTION public.assign_user_role(profile_uuid uuid, role_name text)
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
| auto_confirm_email                         | CREATE OR REPLACE FUNCTION public.auto_confirm_email()
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
| check_user_permission_bypass_rls           | CREATE OR REPLACE FUNCTION public.check_user_permission_bypass_rls(profile_uuid uuid, permission_name text)
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
| check_user_role_bypass_rls                 | CREATE OR REPLACE FUNCTION public.check_user_role_bypass_rls(profile_uuid uuid, role_name text)
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
| create_event_with_agenda                   | CREATE OR REPLACE FUNCTION public.create_event_with_agenda(event_data jsonb)
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
| create_group_and_add_admin                 | CREATE OR REPLACE FUNCTION public.create_group_and_add_admin(group_name text, group_description text, group_is_private boolean, group_tags text[])
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
| create_new_event                           | CREATE OR REPLACE FUNCTION public.create_new_event(event_data jsonb)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
    SELECT public.create_event_with_agenda(event_data);
$function$
                                                                                                                                                                                           |
| create_notification                        | CREATE OR REPLACE FUNCTION public.create_notification(user_id uuid, notification_title text, notification_message text, notification_link text DEFAULT NULL::text)
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
| drop_all_policies                          | CREATE OR REPLACE FUNCTION public.drop_all_policies(target_table text)
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
| find_or_create_conversation                | CREATE OR REPLACE FUNCTION public.find_or_create_conversation(other_user_id uuid)
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
| get_connections_count                      | CREATE OR REPLACE FUNCTION public.get_connections_count(p_user_id uuid)
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
| get_latest_message                         | CREATE OR REPLACE FUNCTION public.get_latest_message(p_conversation_id uuid)
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
| get_or_create_conversation                 | CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
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
| get_role_by_name                           | CREATE OR REPLACE FUNCTION public.get_role_by_name(role_name text)
 RETURNS TABLE(id uuid, name text, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY SELECT r.id, r.name, r.description FROM roles r WHERE r.name = role_name;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                              |
| get_role_id_by_name                        | CREATE OR REPLACE FUNCTION public.get_role_id_by_name(role_name text)
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
| get_roles                                  | CREATE OR REPLACE FUNCTION public.get_roles()
 RETURNS TABLE(id uuid, name text, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY SELECT r.id, r.name, r.description FROM roles r;
END;
$function$
                                                                                                                                                                                                                         |
| get_unread_message_count                   | CREATE OR REPLACE FUNCTION public.get_unread_message_count(conv_id uuid, user_id uuid)
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
| get_unread_notifications_count             | CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(profile_uuid uuid)
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
| get_user_conversations                     | CREATE OR REPLACE FUNCTION public.get_user_conversations()
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
| get_user_conversations_v2                  | CREATE OR REPLACE FUNCTION public.get_user_conversations_v2(p_user_id uuid)
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
| get_user_permissions                       | CREATE OR REPLACE FUNCTION public.get_user_permissions(profile_uuid uuid)
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
| get_user_permissions_bypass_rls            | CREATE OR REPLACE FUNCTION public.get_user_permissions_bypass_rls(profile_uuid uuid)
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
| get_user_role                              | CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
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
| get_user_roles_bypass_rls                  | CREATE OR REPLACE FUNCTION public.get_user_roles_bypass_rls(profile_uuid uuid)
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
| handle_new_user                            | CREATE OR REPLACE FUNCTION public.handle_new_user()
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
| handle_updated_at                          | CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
    
                                                                                                              |
| is_conversation_participant                | CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
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
| is_member_of_group                         | CREATE OR REPLACE FUNCTION public.is_member_of_group(p_group_id uuid)
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
| list_tables                                | CREATE OR REPLACE FUNCTION public.list_tables()
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
| mark_conversation_as_read                  | CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(p_conversation_id uuid, p_user_id uuid)
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
| mark_notification_as_read                  | CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_uuid uuid)
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
| moddatetime                                | CREATE OR REPLACE FUNCTION public.moddatetime()
 RETURNS trigger
 LANGUAGE c
AS '$libdir/moddatetime', $function$moddatetime$function$
                                                                                                                                                                                                                                       |
| notify_new_message                         | CREATE OR REPLACE FUNCTION public.notify_new_message()
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
| remove_role_bypass_rls                     | CREATE OR REPLACE FUNCTION public.remove_role_bypass_rls(profile_uuid uuid, role_name text)
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
| remove_user_role                           | CREATE OR REPLACE FUNCTION public.remove_user_role(profile_uuid uuid, role_name text)
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
| update_conversation_last_message_at        | CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
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
| update_conversation_last_message_timestamp | CREATE OR REPLACE FUNCTION public.update_conversation_last_message_timestamp()
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
| update_conversation_updated_at             | CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
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
| update_event_published_status              | CREATE OR REPLACE FUNCTION public.update_event_published_status(event_id uuid, status_value text)
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
| update_event_status_rpc                    | CREATE OR REPLACE FUNCTION public.update_event_status_rpc(event_id uuid, new_status text)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
    SELECT public.update_event_published_status(event_id, new_status);
$function$
                                                                                                                                                                                                                                              |
| update_full_name                           | CREATE OR REPLACE FUNCTION public.update_full_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
    RETURN NEW;
END;
$function$
  
                                                                     |
| update_updated_at                          | CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
      
                                                                                                            |
| update_updated_at_column                   | CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                |
| user_has_permission                        | CREATE OR REPLACE FUNCTION public.user_has_permission(profile_uuid uuid, permission_name text)
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
| user_has_role                              | CREATE OR REPLACE FUNCTION public.user_has_role(profile_uuid uuid, role_name text)
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
   
   
   | view_name                     | view_definition                                                                       
   
| event_attendees_with_profiles |  SELECT ea.id,
    ea.created_at,
    ea.event_id,
    ea.user_id,
    ea.status,
    ea.check_in_time,
    p.id AS profile_id,
    p.full_name,
    p.avatar_url,
    e.title AS event_title,
    e.start_date AS event_start_date
   FROM ((event_attendees ea
     JOIN profiles p ON ((ea.user_id = p.id)))
     JOIN events e ON ((ea.event_id = e.id)));                                                                                                                                                                                                                                                                                |
| event_stats                   |  SELECT e.id AS event_id,
    e.title,
    e.start_date,
    e.end_date,
    e.location,
    e.is_virtual,
    e.category,
    e.is_featured,
    e.is_published,
    e.max_attendees,
    e.organizer_id,
    p.full_name AS organizer_name,
    count(ea.id) AS attendee_count,
        CASE
            WHEN (e.max_attendees IS NOT NULL) THEN GREATEST((0)::bigint, (e.max_attendees - count(ea.id)))
            ELSE NULL::bigint
        END AS spots_remaining
   FROM ((events e
     LEFT JOIN event_attendees ea ON ((e.id = ea.event_id)))
     LEFT JOIN profiles p ON ((e.organizer_id = p.id)))
  GROUP BY e.id, p.full_name; |