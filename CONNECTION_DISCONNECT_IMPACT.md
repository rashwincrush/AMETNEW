# Connection Disconnect Impact Analysis

## Overview
This document analyzes the impact of disconnecting connections across different role-based flows in the AMET Alumni Portal.

## Database Architecture

### Core Connection Table: `connections`
- **Fields**: `id`, `requester_id`, `recipient_id`, `status`, `created_at`, `updated_at`
- **Status values**: `pending`, `accepted`, `connected`, `declined`, `removed`
- **Function**: `are_users_connected(a, b)` - Returns true if status is `accepted` or `connected`

### Key Relationships
The `connections` table is the **single source of truth** for user relationships and gates access to:
1. **Direct Messaging (DM)** - via `v_my_dm_threads.can_send`
2. **Mentorship relationships** - indirectly via approval workflows
3. **Job applications** - employer-student communication
4. **Event networking** - organizer-attendee communication

---

## Impact Analysis by Flow

### 1. **Alumni ↔ Alumni (Peer Networking)**

#### Current Behavior
- Alumni can connect with other alumni for networking
- Connection enables DM chat via `dm_threads` and `dm_messages`
- Connection status checked by `are_users_connected()` function

#### Disconnect Impact
✅ **Messaging**: 
- `can_send` becomes `false` in `v_my_dm_threads` view
- Chat window shows "You must be connected to send messages" error
- **Existing messages remain visible** (read-only history)
- Thread remains in conversation list but cannot send new messages

✅ **Re-connection**:
- Either party can send a new connection request
- Previous chat history remains intact
- Once reconnected, messaging resumes

---

### 2. **Mentor ↔ Mentee (Mentorship Flow)**

#### Current Behavior
Per MEMORY[e8223583-6e8b-45ea-937c-42a3a7895c38]:
- Mentorship uses separate tables: `mentorship_requests`, `mentorship_relationships`
- `MentorshipChat.js` checks **two conditions** for `canSend`:
  1. `mentorship_requests.status === 'accepted'`
  2. Active `mentorship_relationships` with `status='active'`
- DB triggers handle relationship creation when request is accepted

#### Disconnect Impact
⚠️ **Mentorship Chat**:
- If users disconnect via `connections` table, it does **NOT directly affect** `mentorship_relationships`
- Mentorship chat remains functional as long as `mentorship_relationships.status='active'`
- **However**: If mentorship was initiated through a connection request, disconnecting may cause confusion

⚠️ **Potential Issues**:
- **Inconsistent state**: Mentorship relationship active but general connection removed
- **User confusion**: Can chat in mentorship context but not in general DM
- **No cascade delete**: Disconnecting doesn't automatically close mentorship

#### Recommended Behavior
When disconnecting from a mentor/mentee:
1. **Warn user** if active mentorship relationship exists
2. **Optionally close mentorship** (update `mentorship_relationships.status` to `closed` or `inactive`)
3. **Preserve chat history** for both mentorship and DM threads

---

### 3. **Employer ↔ Student (Job Application Flow)**

#### Current Behavior
- Students apply to jobs posted by employers
- Connection request can be sent when applying or messaging about a job
- `requestConnectionForJob()` helper in `utils/connections.js` handles this
- Chat window checks connection status via `are_users_connected()`

#### Disconnect Impact
⚠️ **Job Application Communication**:
- Student can no longer message employer about the job
- Employer can no longer message student about application
- **Application record remains** in `job_applications` table
- **Application status** (submitted/reviewed/rejected/accepted) is unaffected

⚠️ **Potential Issues**:
- **Communication breakdown**: Active application but no way to communicate
- **Employer perspective**: May need to contact student about interview/offer
- **Student perspective**: May need to follow up on application

#### Recommended Behavior
When disconnecting from an employer/student:
1. **Check for active applications** in `job_applications` table
2. **Warn user** if pending/active applications exist
3. **Suggest alternative**: "This will prevent messaging about your application for [Job Title]"
4. **Allow override**: User can still disconnect but with informed consent

---

### 4. **Event Organizer ↔ Attendee**

#### Current Behavior
- Users RSVP to events via `event_rsvps` table
- Connection can be requested when messaging organizer
- `requestConnectionForEvent()` helper in `utils/connections.js`

#### Disconnect Impact
⚠️ **Event Communication**:
- Attendee cannot message organizer about event details
- Organizer cannot send updates/changes to specific attendees
- **RSVP status remains** in `event_rsvps` table
- **Event attendance** is unaffected

⚠️ **Potential Issues**:
- **Pre-event coordination**: Cannot ask questions about venue, timing, etc.
- **Post-event follow-up**: Cannot share feedback or thank organizer

#### Recommended Behavior
When disconnecting from event organizer/attendee:
1. **Check for upcoming events** with active RSVPs
2. **Warn user** if events are within next 30 days
3. **Preserve RSVP**: Disconnection doesn't cancel event registration

---

## Technical Implementation Details

### Current Disconnect Implementation
```javascript
// In useConnectionsPanel.js
const disconnect = async (peerId) => {
  const { data: edge } = await supabase
    .from('connections')
    .select('id')
    .or(`and(requester_id.eq.${currentUserId},recipient_id.eq.${peerId}),and(requester_id.eq.${peerId},recipient_id.eq.${currentUserId})`)
    .in('status', ['accepted', 'connected'])
    .maybeSingle();
  if (!edge) return;
  await supabase.from('connections').delete().eq('id', edge.id);
  toast.success('Connection removed');
  load();
};
```

### What Gets Affected
1. ✅ **Immediate**: `are_users_connected()` returns `false`
2. ✅ **Immediate**: `v_my_dm_threads.can_send` becomes `false`
3. ✅ **Immediate**: ChatWindow blocks new message sending
4. ❌ **NOT affected**: Existing DM messages (remain visible)
5. ❌ **NOT affected**: `mentorship_relationships` table
6. ❌ **NOT affected**: `job_applications` table
7. ❌ **NOT affected**: `event_rsvps` table

### Database Cascade Behavior
- **No CASCADE DELETE** constraints found in schema
- Disconnecting only affects the `connections` table
- Related records in other tables remain intact

---

## Recommendations

### 1. **Add Confirmation Dialog with Context**
Before disconnecting, check and display:
- Active mentorship relationships
- Pending/active job applications
- Upcoming event RSVPs (within 30 days)
- Number of DM messages exchanged

### 2. **Implement Smart Warnings**
```
⚠️ Disconnecting will affect:
• 1 active mentorship relationship
• 2 pending job applications
• 1 upcoming event (Marine Engineering Summit - Jan 15)
• 47 messages in your chat history (will become read-only)

Are you sure you want to disconnect?
[Cancel] [Disconnect Anyway]
```

### 3. **Prevent Re-connection Spam**
- After disconnecting, implement a cooldown period (e.g., 24 hours)
- Or require the disconnected party to send a new request (not auto-accept)

### 4. **Role-Specific Behavior**

#### For Mentors/Mentees:
- Option to "Close Mentorship" separately from disconnecting
- Closing mentorship updates `mentorship_relationships.status` to `closed`
- Disconnecting only affects general DM, not mentorship chat

#### For Employers:
- Warn if disconnecting from students with active applications
- Suggest completing application review first

#### For Event Organizers:
- Warn if disconnecting from attendees of upcoming events
- Suggest waiting until after event

### 5. **Audit Trail**
- Log disconnect actions in `activity_logs` table
- Include context (reason, related entities)
- Useful for debugging user issues

---

## Implementation Checklist

- [x] Basic disconnect functionality
- [ ] Pre-disconnect context check (mentorship/jobs/events)
- [ ] Confirmation dialog with impact summary
- [ ] Role-aware warnings
- [ ] Cooldown period for re-connection
- [ ] Activity logging
- [ ] Admin override (if needed)
- [ ] User education (help text/tooltips)

---

## Testing Scenarios

1. **Alumni disconnects from alumni**: Should only affect DM
2. **Mentee disconnects from mentor**: Should warn about active mentorship
3. **Student disconnects from employer**: Should warn about pending applications
4. **Attendee disconnects from organizer**: Should warn about upcoming events
5. **User disconnects and immediately tries to reconnect**: Should require new request
6. **User disconnects, other party sends message**: Should fail gracefully with clear error

---

## Conclusion

Disconnecting a connection has **limited direct impact** (only affects DM messaging) but **significant indirect implications** across mentorship, job applications, and event coordination. The current implementation is **safe but incomplete** - it needs context-aware warnings and user education to prevent unintended consequences.
