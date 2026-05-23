# Forgecircle Alumni Platform - Role Capability Matrix & Story Completion Audit

## Executive Summary

This document maps every user role against all modules/features, identifying **story completion gaps** — where a user can start a workflow but cannot finish it meaningfully.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ **Full** | Complete lifecycle — can start, manage, and finish |
| 🟡 **Partial** | Can interact but with gaps (noted) |
| ❌ **None** | No access |
| 🔴 **Gap** | Critical missing piece identified |

---

## ROLE 1: ALUMNI

### 1.1 Identity & Profile Module
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Register | ✅ Full | Can register, verify email, complete profile |
| Edit Profile | ✅ Full | Can update all personal/professional info |
| Upload Resume | ✅ Full | Can upload multiple resumes to `user_resumes` |
| Add Degrees | ✅ Full | Can add education history |
| Add Achievements | ✅ Full | Can add professional achievements |
| Security Questions | ✅ Full | Can set/change security question for recovery |
| Delete Account | 🟡 Partial | Can request deletion via admin; no self-serve soft-delete |
| **Gap Identified** | 🔴 | Cannot download/export own data (GDPR gap) |

### 1.2 Jobs Portal (Job Seeker)
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Browse Jobs | ✅ Full | Can view, filter, search all active jobs |
| Match My Education | ✅ Full | Jobs matched against profile education |
| Apply to Jobs | ✅ Full | Can apply with resume + cover letter |
| Track Applications | ✅ Full | Can view status timeline |
| Withdraw Application | ✅ Full | Can withdraw before final status |
| Job Alerts | ✅ Full | Can create/manage alerts |
| Bookmark Jobs | ✅ Full | Can pin/bookmark for later |
| **Gap Identified** | 🔴 | Cannot see WHY rejected (no rejection reason shown) |
| **Gap Identified** | 🔴 | Cannot respond to interview requests (one-way status) |
| **Gap Identified** | 🔴 | Cannot upload updated resume after rejection for re-apply |

### 1.3 Networking & Community
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Alumni Directory | ✅ Full | Can browse, search, filter directory |
| View Profiles | ✅ Full | Can see other alumni profiles |
| Request Connection | ✅ Full | Can send connection requests |
| Accept/Reject Connections | ✅ Full | Full connection lifecycle |
| Direct Messaging | ✅ Full | Can message connections |
| Groups (Member) | ✅ Full | Can join public/private groups |
| Groups (Creator) | ✅ Full | Can create, manage, archive own groups |
| Groups (Admin) | ✅ Full | Can manage members, posts, settings |
| Post to Groups | ✅ Full | Can create posts, polls, comments |
| Events | ✅ Full | Can RSVP, register, provide feedback |
| **Gap Identified** | 🔴 | Cannot block specific users from messaging (no DM blocking) |

### 1.4 Mentorship (Mentee Track)
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Find Mentors | ✅ Full | Can browse, search mentor directory |
| Request Mentorship | ✅ Full | Can send mentorship requests |
| View My Mentors | ✅ Full | Can see active relationships |
| Schedule Sessions | ✅ Full | Can propose session times |
| Mentorship Chat | ✅ Full | Can message mentor |
| End Relationship | ✅ Full | Can end mentorship |
| Provide Feedback | 🟡 Partial | Can give feedback (if feature exposed) |

### 1.5 Mentorship (Mentor Track)
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Become Mentor | ✅ Full | Can apply, fill profile, get approved |
| Set Availability | ✅ Full | Can set calendar/availability |
| Set Max Mentees | ✅ Full | Can cap capacity |
| Accept/Reject Requests | ✅ Full | Full request management |
| View My Mentees | ✅ Full | Can see active mentees |
| Schedule Sessions | ✅ Full | Can propose times, set meeting links |
| Mentorship Chat | ✅ Full | Can message mentees |
| End Relationship | ✅ Full | Can end mentorship |
| Mentor Settings | ✅ Full | Can update expertise, preferences |
| **Gap Identified** | 🔴 | Cannot pause mentorship temporarily (only end) |
| **Gap Identified** | 🔴 | Cannot see mentee progress/completion tracking |

---

## ROLE 2: STUDENT

### 2.1 Identity & Profile Module
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Register | ✅ Full | Can register with student role |
| Edit Profile | ✅ Full | Can update profile |
| Upload Resume | ✅ Full | Can upload resumes |
| **Gap Identified** | 🔴 | Cannot become mentor (blocked — intentional but limits growth) |

### 2.2 Jobs Portal (Job Seeker)
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Browse Jobs | ✅ Full | Same as alumni |
| Apply to Jobs | ✅ Full | Same as alumni |
| Track Applications | ✅ Full | Same as alumni |
| **Gap Identified** | 🔴 | Cannot filter "new grad" or "entry level" jobs specifically |

### 2.3 Networking & Community
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Alumni Directory | ❌ None | Redirected to jobs (employers only path) |
| Request Connection | ✅ Full | Can connect with alumni |
| Groups | 🟡 Partial | Cannot join "alumni-only" groups (correct) |
| Events | ✅ Full | Can RSVP to events |
| **Gap Identified** | 🔴 | Cannot view limited student directory (no student-student networking) |

### 2.4 Mentorship
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Find Mentors | ✅ Full | Can find alumni mentors |
| Request Mentorship | ✅ Full | Can request |
| Become Mentee | ✅ Full | Full mentee lifecycle |
| **Gap Identified** | 🔴 | Cannot be "junior mentor" to other students (peer mentorship gap) |

---

## ROLE 3: EMPLOYER

### 3.1 Identity & Profile Module
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Register | ✅ Full | Can register as employer |
| Company Profile | ✅ Full | Can create/edit company page |
| **Gap Identified** | 🔴 | Cannot have multiple company profiles (if recruiter for many) |
| **Gap Identified** | 🔴 | Cannot add team members to manage postings jointly |

### 3.2 Jobs Portal (Recruiter)
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Post Jobs (Internal) | ✅ Full | Can create job postings |
| Post Jobs (External Link) | ✅ Full | Can post quick-link jobs |
| Edit Jobs | ✅ Full | Can edit own jobs |
| Close Jobs | ✅ Full | Can close/expire jobs |
| View Applications | ✅ Full | Can see applicants for own jobs |
| View Resumes | ✅ Full | Can download/view applicant resumes |
| **Change Status** | 🟡 Partial | Can set: submitted → reviewed → shortlisted → interviewing → offered → hired/rejected |
| **Add Rejection Reason** | 🔴 **GAP** | ❌ CANNOT add why candidate was rejected |
| **Upload Offer Letter** | 🔴 **GAP** | ❌ CANNOT attach offer letter to "offered" status |
| **Schedule Interview** | 🔴 **GAP** | ❌ No integrated interview scheduling (status only) |
| **Send Message to Applicant** | 🔴 **GAP** | ❌ Cannot DM applicant directly from application view |
| **Bulk Actions** | 🔴 **GAP** | ❌ Cannot bulk-reject or bulk-shortlist |
| **Application Notes** | 🔴 **GAP** | ❌ Cannot add internal notes per application |
| **Rating/Tags** | 🔴 **GAP** | ❌ Cannot tag/star applicants for later |

### 3.3 Networking & Community
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Alumni Directory | ❌ None | Redirected away (intentional) |
| Groups | ❌ None | Cannot join/create groups |
| Events | 🟡 Partial | Can view but employer-specific events not implemented |
| **Gap Identified** | 🔴 | No "recruiter networking" space (virtual career fair, etc.) |

---

## ROLE 4: ADMIN

### 4.1 User Management
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| View All Users | ✅ Full | Can browse, filter, search |
| Edit User | ✅ Full | Can modify profile details |
| Change User Role | ✅ Full | Can assign roles (with restrictions) |
| Approve/Reject Users | ✅ Full | Full approval lifecycle |
| Soft Delete User | ✅ Full | Can soft-delete with audit |
| Hard Delete User | ✅ Full | Can permanently delete |
| Block/Unblock User | ✅ Full | Can block with reason |
| View User Activity | ✅ Full | Can see activity logs |
| **Impersonate User** | 🔴 **GAP** | Cannot log in as user to debug issues |
| **Bulk Operations** | 🟡 Partial | CSV import/export only; no bulk approve/reject UI |

### 4.2 Content Moderation
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| Moderate Jobs | ✅ Full | Can approve/reject job postings |
| Moderate Events | ✅ Full | Can approve/reject events |
| Moderate Groups | ✅ Full | Can approve/reject groups |
| View Reports | ✅ Full | Can see reported content |
| **Gap Identified** | 🔴 | No "escalation" workflow (auto-escalate repeated violators) |

### 4.3 Jobs Admin
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| View All Applications | ✅ Full | Can see all applications across jobs |
| Manage Any Job | ✅ Full | Can edit/close any job |
| **Gap Identified** | 🔴 | Cannot "feature" jobs or boost visibility (no priority flag) |

### 4.4 Analytics & Reporting
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| View Analytics Dashboard | ✅ Full | Can see system metrics |
| Run Data Validation | ✅ Full | Can run integrity checks |
| View Audit Logs | ✅ Full | Can see admin action logs |
| **Custom Reports** | 🔴 **GAP** | Cannot create custom SQL reports or export |
| **Scheduled Reports** | 🔴 **GAP** | Cannot schedule automated reports |

---

## ROLE 5: SUPER_ADMIN

### 5.1 Platform Governance
| Feature | Status | Story Completion Notes |
|---------|--------|------------------------|
| All Admin Capabilities | ✅ Full | Inherits all admin permissions |
| Manage Admins | ✅ Full | Can create/remove admin accounts |
| Feature Flags | 🟡 Partial | Can toggle features (if exposed in UI) |
| System Settings | 🟡 Partial | Can change app settings |
| **Gap Identified** | 🔴 | No "super admin dashboard" with platform health overview |

---

## CRITICAL STORY GAPS SUMMARY

### 🔴 High Priority Gaps (Break User Workflows)

1. **Employer → Job Application Management (INCOMPLETE)**
   - Can change status to "rejected" but CANNOT explain why
   - Can change status to "offered" but CANNOT attach offer letter
   - CANNOT message applicant directly from application
   - CANNOT schedule interviews within platform
   - **Impact**: Recruiters must use external email/phone for all communication
   - **Fix**: Add `rejection_reason`, `offer_letter_url`, `internal_notes` to `job_applications` table

2. **Job Seeker → Application Feedback (INCOMPLETE)**
   - Can see "rejected" but never knows why
   - Cannot respond or ask for feedback
   - **Impact**: Poor candidate experience, cannot improve
   - **Fix**: Show `rejection_reason` if provided; add "request feedback" button

3. **Employer → Team Collaboration (MISSING)**
   - Single employer = single user
   - Cannot add hiring managers to review applications
   - **Impact**: Forces credential sharing or external coordination
   - **Fix**: Add "company team members" concept with permissions

4. **Mentorship → Session Management (INCOMPLETE)**
   - Can schedule but no calendar integration
   - No reminders/notifications for upcoming sessions
   - No session completion tracking
   - **Impact**: Sessions are forgotten, no accountability
   - **Fix**: Add session reminders, completion check-in, progress milestones

5. **All Users → Data Portability (MISSING)**
   - Can upload data but cannot download own data
   - No "export my profile" feature
   - **Impact**: GDPR compliance gap, user lock-in concern
   - **Fix**: Add "Export My Data" feature

### 🟡 Medium Priority Gaps

6. **Groups → Content Moderation (PARTIAL)**
   - Group admins can delete posts but no "report to platform admin" escalation
   - No auto-moderation for spam

7. **Events → Organizer Tools (PARTIAL)**
   - Can create events but no attendee check-in system
   - No post-event analytics (attendance vs registration)

8. **Messaging → Safety (PARTIAL)**
   - Can block but no "report harassment" workflow
   - No content scanning for inappropriate messages

---

## RECOMMENDED FIX PRIORITIZATION

### Phase 1: Fix Broken Recruiter Workflow (Week 1-2)
```sql
-- Add to job_applications table
ALTER TABLE job_applications ADD COLUMN rejection_reason TEXT;
ALTER TABLE job_applications ADD COLUMN offer_letter_url TEXT;
ALTER TABLE job_applications ADD COLUMN internal_notes TEXT; -- for employer only
ALTER TABLE job_applications ADD COLUMN employer_rating INTEGER; -- 1-5 stars for internal tracking
ALTER TABLE job_applications ADD COLUMN tags TEXT[]; -- e.g., {'star', 'follow-up', 'maybe'}
```

Update `ManageJobApplications.js`:
- Add textarea for rejection reason when status = 'rejected'
- Add file upload for offer letter when status = 'offered'
- Add internal notes field (always visible to employer only)
- Add DM button to message applicant

### Phase 2: Candidate Experience (Week 3)
- Update `JobApplicationStatus.js` to show rejection_reason if present
- Add "Request Feedback" button for rejected applications

### Phase 3: Collaboration (Week 4)
- Add company team members table
- Add permission levels (view, edit, manage applications)

---

## PERMISSION MATRIX QUICK REFERENCE

| Permission | Alumni | Student | Employer | Admin | Super |
|------------|--------|---------|----------|-------|-------|
| `access:dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `view:jobs` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `apply:jobs` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `post:jobs` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `view:job_applications` | ❌ | ❌ | ✅* | ✅ | ✅ |
| `access:events` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `events:create` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `access:groups` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `groups:create` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `view:alumni_directory` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `request:mentorship` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `become:mentor` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `access:all` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `manage:company_profile` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `access:profile_settings` | ✅ | ✅ | ✅ | ✅ | ✅ |

*Employer can only view applications for their own jobs

---

## DOCUMENT META

- **Generated**: April 20, 2026
- **Schema Version**: Based on schema.sql + migrations up to 20260113
- **Frontend Version**: Based on frontend/src scan
- **Next Review**: When new modules added or major role changes
