# Google Calendar & Google Meet Integration Research

**Research Date:** April 20, 2026  
**Objective:** Integrate Google Calendar with Google Meet for mentorship, online events, and employer-candidate meetings  
**Constraint:** FREE APIs only (no payment required)

---

## Executive Summary

**Google Calendar Integration:** ✅ **FEASIBLE - FREE**
- 1,000,000 queries per day
- Supabase has built-in Google OAuth support
- Simple integration with React

**Google Meet Integration:** ✅ **FEASIBLE - FREE**
- Google Meet REST API is available at **no additional cost**
- Free Google Meet has **60-minute limit for group meetings** (3+ participants)
- **1-on-1 meetings have no time limit** on free account
- Can be created automatically via Google Calendar API using `conferenceData`
- No separate API key required - uses Google Calendar API

---

## Google Meet API Analysis

### Free Tier Details
- **Cost:** FREE (no additional cost for Google Meet REST API)
- **Authentication:** Uses Google Calendar API OAuth tokens
- **Meeting Limits:**
  - 1-on-1 meetings: **No time limit** on free account
  - Group meetings (3+ participants): **60-minute limit** on free account
  - Participants: Up to 100 on free account
- **API Usage:** No separate rate limits - uses Google Calendar API quota
- **Video Quality:** HD (720p) on free account

### Capabilities
- ✅ Create meetings via Google Calendar API (automatic)
- ✅ 1-on-1 unlimited duration
- ✅ Screen sharing
- ✅ Real-time captions
- ✅ Chat during meetings
- ✅ No account required for participants (if invited)
- ✅ Automatic meeting link generation
- ✅ Calendar integration (built-in)

### How Google Meet Integration Works
Google Meet meetings are created **automatically** when you create a Google Calendar event with `conferenceData`. You don't need a separate API call.

**Example API Call:**
```javascript
const eventData = {
  summary: "Mentorship Session",
  start: {
    dateTime: "2025-01-16T10:00:00+05:30",
    timeZone: "Asia/Kolkata"
  },
  end: {
    dateTime: "2025-01-16T11:00:00+05:30",
    timeZone: "Asia/Kolkata"
  },
  attendees: [
    { email: "mentor@gmail.com" },
    { email: "mentee@gmail.com" }
  ],
  conferenceDataVersion: 1,  // Required for Meet link
  conferenceData: {
    createRequest: {
      conferenceSolutionKey: {
        type: "hangoutsMeet"
      },
      requestId: "unique-request-id"  // Must be unique per request
    }
  }
};

const response = await fetch(
  'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  }
);

const event = await response.json();
const meetLink = event.hangoutLink;  // Google Meet link
```

### Key Requirements
1. **conferenceDataVersion=1** in query parameter (REQUIRED)
2. **conferenceData.createRequest** in event body
3. **Unique requestId** for each create request
4. **OAuth token** with Calendar scope
5. **Google account** for all participants (for free tier)

### Integration Complexity
- **Backend:** Low (uses Google Calendar API)
- **Frontend:** Low (Supabase handles OAuth)
- **Cost:** FREE

### Limitations
- Group meetings limited to 60 minutes (3+ participants)
- No recording on free account
- No breakout rooms on free account
- No advanced moderation on free account
- Participants need Google accounts

### Verdict
**RECOMMENDED** for 1-on-1 use cases (mentorship, interviews). For group events (3+ participants), the 60-minute limit may be restrictive for longer events.

---

## Google Calendar API Analysis

### Free Tier Details
- **Cost:** FREE
- **Quota:** 1,000,000 queries per day
- **Rate Limit:** ~1,000 queries per second per project
- **Authentication:** OAuth 2.0 required

### Capabilities
- ✅ Create events
- ✅ Read events
- ✅ Update events
- ✅ Delete events
- ✅ Sync with multiple calendars
- ✅ Recurring events support
- ✅ Event reminders

### Integration Requirements
1. **Google Cloud Project Setup**
   - Create Google Cloud Project
   - Enable Calendar API
   - Configure OAuth Consent Screen
   - Create OAuth Client Credentials

2. **Supabase Integration**
   - Enable Google OAuth provider in Supabase
   - Configure callback URL: `https://<project>.supabase.co/auth/v1/callback`
   - Store OAuth tokens in Supabase auth

3. **React Integration**
   - Use Supabase Auth for Google OAuth
   - Use Google Calendar API via backend (Node.js) or client-side
   - Libraries available: `react-google-calendar-api`, `googleapis`

### Example Integration Flow
```
1. User authenticates with Google via Supabase
2. Supabase stores provider tokens (access_token, refresh_token)
3. Backend uses tokens to call Google Calendar API
4. Events are created/updated in user's Google Calendar
5. Webhooks can sync changes back to app
```

### Implementation Complexity
- **Backend:** Medium (requires OAuth token management)
- **Frontend:** Low (Supabase handles OAuth)
- **Cost:** FREE

---

## Integration Strategy for Your Use Cases

### Use Case 1: Mentorship Video Sessions

**Requirements:**
- 30-60 minute sessions
- 1-on-1 (perfect for Google Meet unlimited duration)
- Scheduling with calendar integration
- Recording (optional - not available on free tier)

**Recommended Solution:**
- **Video:** Google Meet (unlimited 1-on-1 duration)
- **Calendar:** Google Calendar API (scheduling)
- **Integration:**
  1. Mentor/mentee schedules session via app
  2. Google Calendar event created with `conferenceData` for automatic Meet link
  3. Meet link extracted from `hangoutLink` field
  4. Participants receive calendar invites with Meet link
  5. Both join via Google Calendar or direct Meet link

**Database Schema Additions:**
```sql
ALTER TABLE mentorship_requests ADD COLUMN google_meet_link TEXT;
ALTER TABLE mentorship_requests ADD COLUMN google_calendar_event_id TEXT;
ALTER TABLE mentorship_requests ADD COLUMN scheduled_start_time TIMESTAMP;
ALTER TABLE mentorship_requests ADD COLUMN scheduled_end_time TIMESTAMP;
```

### Use Case 2: Online Events

**Requirements:**
- Variable duration (30 min to several hours)
- Multiple participants (3+)
- Public or private events
- Calendar integration for attendees

**Recommended Solution:**
- **Video:** Google Meet (60-minute limit for 3+ participants)
- **Calendar:** Google Calendar API (event creation and RSVPs)
- **Integration:**
  1. Event creator schedules online event
  2. Google Calendar event created with `conferenceData`
  3. Meet link extracted and stored
  4. Attendees RSVP via app
  5. Calendar invites sent with Meet link
  6. **Note:** Events longer than 60 minutes will need to be split into multiple sessions

**Database Schema Additions:**
```sql
ALTER TABLE events ADD COLUMN is_online BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN google_meet_link TEXT;
ALTER TABLE events ADD COLUMN google_calendar_event_id TEXT;
```

### Use Case 3: Employer-Candidate Interviews

**Requirements:**
- 30-60 minute sessions
- 1-on-1 or panel interviews
- Scheduling with calendar
- Recording (optional - not available on free tier)

**Recommended Solution:**
- **Video:** Google Meet (unlimited 1-on-1 duration)
- **Calendar:** Google Calendar API (scheduling)
- **Integration:**
  1. Employer creates interview request
  2. Candidate accepts and suggests times
  3. Employer confirms time
  4. Google Calendar event created for both parties with `conferenceData`
  5. Meet link extracted and stored
  6. Both receive calendar invites with Meet link

**Database Schema Additions:**
```sql
ALTER TABLE job_applications ADD COLUMN interview_scheduled BOOLEAN DEFAULT false;
ALTER TABLE job_applications ADD COLUMN interview_start_time TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN interview_end_time TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN google_meet_link TEXT;
ALTER TABLE job_applications ADD COLUMN google_calendar_event_id TEXT;
```

---

## Implementation Roadmap

### Phase 1: Google Calendar Integration (2-3 weeks)

**Step 1: Setup Google Cloud Project**
- Create Google Cloud Project
- Enable Calendar API
- Configure OAuth Consent Screen
- Create OAuth Client Credentials
- Add callback URL to Supabase

**Step 2: Enable Google OAuth in Supabase**
- Navigate to Authentication → Providers → Google
- Add Client ID and Client Secret
- Copy callback URL

**Step 3: Backend Integration**
- Create Supabase Edge Function for Google Calendar API calls
- Implement token refresh logic
- Create RPC functions:
  - `create_calendar_event_with_meet(event_data)` - includes conferenceData
  - `update_calendar_event(event_id, event_data)`
  - `delete_calendar_event(event_id)`
  - `sync_calendar_events(user_id)`

**Step 4: Frontend Integration**
- Add "Connect Google Calendar" button in user settings
- Implement OAuth flow via Supabase Auth
- Create calendar event creation forms in:
  - Mentorship requests
  - Online events
  - Job applications

### Phase 2: Google Meet Integration (1-2 weeks)

**Step 1: Update Backend RPC Functions**
- Modify `create_calendar_event_with_meet` to include:
  - `conferenceDataVersion: 1` in query parameter
  - `conferenceData.createRequest` in event body
  - Extract and return `hangoutLink` from response
- Store Google Meet link in database

**Step 2: Database Updates**
- Run migration to add Google Meet fields:
  - `google_meet_link` TEXT
  - `google_calendar_event_id` TEXT
  - `scheduled_start_time` TIMESTAMP
  - `scheduled_end_time` TIMESTAMP
- Update RLS policies for new fields

**Step 3: Frontend Integration**
- Add "Join Google Meet" buttons in:
  - Mentorship requests (accepted state)
  - Online events (when is_online = true)
  - Job applications (when interview scheduled)
- Display Meet link in event details
- Add meeting duration warnings for group events (>60 min)

### Phase 3: End-to-End Integration (1-2 weeks)

**Step 1: Connect Calendar + Meet**
- When event created → create Google Calendar event with conferenceData
- Extract Meet link from response
- Store Meet link and calendar event ID in database
- Include Meet link in calendar event description

**Step 2: Notification System**
- Send email notifications with Meet link
- Add in-app notifications for scheduled meetings
- Send reminders 24 hours before
- Include direct Meet link in notifications

**Step 3: Testing**
- Test mentorship video sessions (1-on-1, unlimited)
- Test online events with multiple participants (60-min limit)
- Test employer-candidate interviews (1-on-1, unlimited)
- Test calendar sync and updates
- Test Meet link generation and access

---

## Cost Summary

| Service | Tier | Cost | Limitations |
|---------|------|------|-------------|
| Google Calendar API | Free | $0 | 1M queries/day |
| Google Meet API | Free | $0 | No additional cost |
| Google Meet (Free Account) | Free | $0 | 60-min group meetings, unlimited 1-on-1 |

**Total Cost for Recommended Solution:** **$0/month**

---

## Security Considerations

### Google Calendar API
- Store OAuth tokens securely in Supabase
- Implement token refresh logic
- Use service account for admin operations (optional)
- Validate calendar ownership before creating events
- Sanitize event data before API calls

### Google Meet
- Meet links are generated by Google and are secure
- No additional security measures needed for Meet links
- Participants need Google accounts (for free tier)
- Meet links are unique per event
- Calendar events control access (invitees only)

### General
- Rate limit API calls (Google Calendar API quota)
- Implement retry logic with exponential backoff
- Log all meeting creations for audit
- Validate user permissions before creating calendar events
- Implement meeting duration enforcement (especially for group events >60 min)
- Use unique requestId for each conferenceData.createRequest

---

## Conclusion

**Google Calendar Integration:** ✅ **FEASIBLE** - Free tier sufficient for all use cases

**Google Meet Integration:** ✅ **RECOMMENDED for 1-on-1** - Unlimited duration for 1-on-1 meetings, 60-minute limit for group meetings

**Recommended Solution:**
- **Google Calendar API** for scheduling
- **Google Meet** for video conferencing (automatic via Calendar API)
- **Total Cost:** $0/month
- **Implementation Time:** 4-7 weeks
- **Maintenance:** Low (no API costs, minimal backend)

### Best Use Cases for Google Meet (Free Tier)

**Excellent for:**
- ✅ Mentorship sessions (1-on-1, unlimited duration)
- ✅ Employer-candidate interviews (1-on-1, unlimited duration)
- ✅ Career counseling (1-on-1, unlimited duration)

**Acceptable for:**
- 🟡 Online events with 3+ participants (60-minute limit)
- 🟡 Group meetings (60-minute limit)
- 🟡 Guest lectures (60-minute limit, may need multiple sessions)

**Limitations:**
- ❌ No recording on free account
- ❌ No breakout rooms on free account
- ❌ Participants need Google accounts
- ❌ 60-minute limit for group meetings (3+ participants)

### Final Recommendation

**Google Calendar + Google Meet** is the best free solution for your use cases, especially for mentorship and interviews which are primarily 1-on-1. The integration is simpler than Jitsi (no separate video SDK needed), and the automatic Meet link generation via Calendar API makes implementation straightforward.

For online events with 3+ participants, the 60-minute limit may be restrictive. If you need longer events, consider:
1. Splitting events into multiple 60-minute sessions
2. Using a paid Google Workspace account ($6-$12/user/month for unlimited duration)
3. Keeping Jitsi as an alternative for longer group events
