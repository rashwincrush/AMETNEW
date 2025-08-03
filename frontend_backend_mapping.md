# Frontend to Backend Table Mapping

This document maps the usage of redundant backend tables in the frontend codebase, as requested.

| Redundant Set | Frontend Usage (components/APIs) | Which Table is Used | Unused Table(s) |
|---------------|----------------------------------|---------------------|-----------------|
| jobs, job_listings, job_postings | - `utils/supabase.js` - CRUD operations<br>- `Components/Jobs/*.js` - Job listing, details, applications<br>- `Components/Companies/PublicCompanyProfile.js` - Company jobs | Both `jobs` and `job_postings` are used | `job_listings` |
| bookmarked_jobs, job_bookmarks | - `Components/Jobs/BookmarkedJobs.js` - Saved jobs<br>- `Components/Jobs/JobListingsPage.js` - Bookmark toggle | `job_bookmarks` | `bookmarked_jobs` |
| mentor_profiles, mentors | - `Components/Mentorship/*.js` - Mentor directory, profiles<br>- `utils/supabase.js` - Mentor queries<br>- `Components/Registration/MentorRegistrationForm.js` - Registration | `mentors` | `mentor_profiles` |
| mentee_profiles, mentees | - `Components/Registration/MenteeRegistrationForm.js` - Registration<br>- `Components/Mentorship/MenteeRegistrationForm.js` - Registration | `mentee_profiles` | `mentees` |
| networking_groups, groups | - `Components/Networking/GroupDetails.js` - Group information<br>- `utils/supabase.js` - Group CRUD operations | `groups` | `networking_groups` |
| networking_group_members, group_members | - `utils/supabase.js` - Group membership management | `group_members` | `networking_group_members` |
| job_alerts, job_alert_notifications | - `Components/Jobs/JobAlerts.js` - Job alerts management | `job_alerts` | `job_alert_notifications` |
| event_attendees, event_attendees_with_profiles | - `Components/Events/Events.js` - Event management<br>- `utils/supabase.js` - Event attendee queries<br>- `Components/Dashboard/AlumniDashboard.js` - Dashboard display | `event_attendees` | `event_attendees_with_profiles` |
| resume_profiles, user_resumes | - `Components/Jobs/ResumeUploadForm.js` - Resume upload<br>- `Components/Jobs/JobApplication.js` - Job applications<br>- `Components/Auth/ProfileResume.js` - Profile management | Both `resume_profiles` and `user_resumes` are used | None |

## Key Findings

1. **Duplicate Usage**: Two sets have multiple tables being used simultaneously in the frontend:
   - Both `jobs` and `job_postings` are actively used
   - Both `resume_profiles` and `user_resumes` are actively used

2. **Frontend Alignment**: Most redundant sets have one clear table being used in the frontend, which aligns with the recommendations:
   - `job_bookmarks` (not `bookmarked_jobs`)
   - `mentors` (not `mentor_profiles`)
   - `mentee_profiles` (not `mentees`)
   - `groups` (not `networking_groups`)
   - `group_members` (not `networking_group_members`)
   - `job_alerts` (not `job_alert_notifications`)
   - `event_attendees` (not `event_attendees_with_profiles`)

3. **Database Optimization**: Consolidating to use only the recommended tables would require frontend code changes in two areas:
   - Jobs system: standardize on `jobs` table
   - Resume system: standardize on one resume table
