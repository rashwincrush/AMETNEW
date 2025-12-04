# Mentorship Module Refactor - Implementation Progress

## Status: Phase 1 Complete ✅

### Completed Components

#### 1. Core Hooks ✅
- **`useOpenMentorshipChat`** (`/hooks/useOpenMentorshipChat.ts`)
  - Single source of truth for all mentorship→DM navigation
  - Uses `ensureDmThreadWith` with metadata support
  - Navigates to `/messages?thread=<id>&source=mentorship&relationshipId=...&requestId=...`
  - Replaces all legacy `mentorId`/`menteeId`/`userId` query params
  - Includes error handling and loading states

- **`useMentorshipRoleContext`** (`/hooks/useMentorshipRoleContext.ts`)
  - Centralized role/status information
  - Returns: `isStudent`, `isAlumni`, `isMenteeApproved`, `hasMentorProfile`, `mentorStatus`, `isDualRole`
  - Includes summary counts (active mentors/mentees, pending requests)
  - Used by tabs, banners, and hub for role-aware UI

- **`useMentorshipBannerModel`** (`/hooks/useMentorshipBannerModel.ts`)
  - Computes which banners to show based on role/status
  - Separate mentee and mentor banner logic
  - Correct CTAs (mentee → mentee settings, mentor → mentor settings)
  - Max 2 banners (one per role)

#### 2. Layout & Navigation ✅
- **`MentorshipLayout`** (`/components/Mentorship/MentorshipLayout.jsx`)
  - Canonical page shell with header, banners, tabs, and hub
  - Uses 4px spacing grid for atomic UI
  - Mobile-first responsive design

- **`MentorshipTabs`** (`/components/Mentorship/MentorshipTabs.jsx`)
  - Role-aware tab navigation using query params
  - Different tab sets for:
    - Mentee-only: Find, My Mentors, My Requests, Settings
    - Mentor-only: My Mentees, Requests, Settings
    - Dual-role: All tabs
  - Pill-style design with 44x44px touch targets
  - Accessible with ARIA attributes

- **`MentorshipHub`** (`/components/Mentorship/MentorshipHub.jsx`)
  - Central hub reading `tab`, `sub`, `mode` from URL
  - Role-aware default tab logic
  - Renders appropriate panel based on query params
  - Supports highlight params for deep linking

#### 3. Banner System ✅
- **`MentorshipBanner`** (`/components/Mentorship/banners/MentorshipBanner.jsx`)
  - Generic banner component
  - Variants: info, success, warning, danger
  - Role badges (mentee/mentor/both)
  - Primary and secondary CTAs

- **`MentorshipStatusBannerStrip`** (`/components/Mentorship/banners/MentorshipStatusBannerStrip.jsx`)
  - Container for 0-2 banners
  - Uses `useMentorshipBannerModel` for content

#### 4. Panel Stubs ✅
Created placeholder panels (ready for data integration):
- `FindMentorsPanel.jsx`
- `MyMentorsPanel.jsx`
- `MyMenteesPanel.jsx`
- `RequestsPanel.jsx`
- `MentorshipSettingsPanel.jsx`

#### 5. API Updates ✅
- **`ensureDmThreadWith`** (`/api/dm.js`)
  - Now accepts optional `metadata` parameter
  - Passes `source`, `relationshipId`, `requestId` to backend RPC

---

## Next Steps (Phase 2)

### 1. Card Components (In Progress)
- [ ] `MentorshipRequestCard.jsx`
  - Props: direction, otherUser, status, requestId, handlers
  - Buttons: Cancel/Accept/Reject/Open chat
  - Confirm dialogs for destructive actions

- [ ] `MentorshipRelationshipCard.jsx`
  - Props: role, otherUser, status, relationshipId, handlers
  - Role chips, status chips
  - Primary CTA: Send first message / Open chat
  - Secondary: End mentorship (with confirm)

### 2. Panel Data Integration
- [ ] Integrate `FindMentorsPanel` with existing `FindMentorsPage` logic
- [ ] Wire `MyMentorsPanel` with relationship queries
- [ ] Wire `MyMenteesPanel` with relationship queries
- [ ] Wire `RequestsPanel` with request queries
- [ ] Integrate `MentorshipSettingsPanel` with `MentorRegistrationForm`

### 3. Router Updates
- [ ] Add canonical `/mentorship` route
- [ ] Add redirect routes for legacy URLs:
  - `/mentorship/find` → `/mentorship?tab=find`
  - `/mentorship/my-requests` → `/mentorship?tab=requests&sub=sent`
  - `/mentorship/requests-to-me` → `/mentorship?tab=requests&sub=received`
  - `/mentorship/my-mentorships` → `/mentorship?tab=mentee`
  - `/mentorship/me` → `/mentorship`

### 4. Legacy Migration
- [ ] Replace all `navigate('/messages?mentorId=...')` with `useOpenMentorshipChat`
- [ ] Replace all `navigate('/messages?menteeId=...')` with `useOpenMentorshipChat`
- [ ] Replace all `navigate('/messages?userId=...')` with `useOpenMentorshipChat`
- [ ] Quarantine legacy components:
  - `MyRequestsPage.jsx`
  - `RequestsToMePage.jsx`
  - `MyMentorshipPage.jsx`
  - `MentorshipStatus.js`
  - `MentorshipChat.js`

### 5. Final QA
- [ ] Test student mentee flow
- [ ] Test alumni mentee flow
- [ ] Test alumni mentor flow
- [ ] Test dual-role alumni flow
- [ ] Verify all chat buttons open correct DM threads
- [ ] Verify banners show correct CTAs
- [ ] Verify tabs are role-appropriate

---

## Architecture Principles Applied

✅ **One mentorship module** - Single hub at `/mentorship`  
✅ **One chat system** - DM stack only (`dm_threads` + `dm_messages`)  
✅ **One way to open chat** - `useOpenMentorshipChat` hook  
✅ **Role clarity** - Different UI for mentee/mentor/dual-role  
✅ **State clarity** - Clear status chips and labels  
✅ **Mobile-first** - 44x44px touch targets, responsive layout  
✅ **Accessibility** - ARIA attributes, focus management  
✅ **Atomic UI** - 4px spacing grid, consistent typography  

---

## Files Created/Modified

### New Files
- `/frontend/src/hooks/useOpenMentorshipChat.ts`
- `/frontend/src/hooks/useMentorshipRoleContext.ts`
- `/frontend/src/hooks/useMentorshipBannerModel.ts`
- `/frontend/src/components/Mentorship/MentorshipHub.jsx`
- `/frontend/src/components/Mentorship/panels/FindMentorsPanel.jsx`
- `/frontend/src/components/Mentorship/panels/MyMentorsPanel.jsx`
- `/frontend/src/components/Mentorship/panels/MyMenteesPanel.jsx`
- `/frontend/src/components/Mentorship/panels/RequestsPanel.jsx`
- `/frontend/src/components/Mentorship/panels/MentorshipSettingsPanel.jsx`
- `/frontend/src/components/Mentorship/banners/MentorshipBanner.jsx`
- `/frontend/src/components/Mentorship/banners/MentorshipStatusBannerStrip.jsx`

### Modified Files
- `/frontend/src/api/dm.js` - Added metadata support to `ensureDmThreadWith`
- `/frontend/src/components/Mentorship/MentorshipLayout.jsx` - Updated to use new structure
- `/frontend/src/components/Mentorship/MentorshipTabs.jsx` - Complete refactor for role-awareness

---

## Backend Assumptions (Already in Place)

The frontend assumes these backend contracts are met:

1. **Triggers ensure connections + DM threads**
   - `ensure_connection_on_mentorship_accept` trigger on `mentorship_requests`
   - `ensure_thread_for_connection` trigger on `connections`

2. **RPCs for mentorship actions**
   - `mentorship_request_respond` (accept/reject)
   - `mentorship_relationship_end` (end mentorship)
   - `ensure_dm_thread_with` (create/get DM thread)

3. **State invariants**
   - Accepted mentorship ⇒ active relationship + accepted connection + DM thread
   - One active relationship per mentor-mentee pair

---

## Testing Checklist

### Per Persona
- [ ] **Student mentee**: Can find mentors, send requests, see correct tabs/banners
- [ ] **Alumni mentee**: Same as student, with alumni-appropriate copy
- [ ] **Alumni mentor**: Can see received requests, manage mentees, correct capacity banners
- [ ] **Dual-role**: Sees all tabs, both mentee and mentor banners when relevant

### Chat Integration
- [ ] All "Open chat" buttons use `useOpenMentorshipChat`
- [ ] Chat opens with correct thread selected
- [ ] `source=mentorship` appears in DM URL
- [ ] No broken `mentorId`/`menteeId`/`userId` params

### Navigation
- [ ] Legacy routes redirect to canonical hub with correct tab
- [ ] Deep links with `highlightRequestId`/`highlightRelationshipId` work
- [ ] Tab switching preserves context

### Banners
- [ ] Mentee banners never link to mentor registration
- [ ] Mentor banners show capacity warnings when at limit
- [ ] Dual-role users see appropriate banners for each role

---

## Notes

- TypeScript errors in `useMentorshipRoleContext` are due to AuthContext typing; using `as any` assertion as workaround
- Panel stubs are ready for data integration in Phase 2
- Card components will be created next with full prop types and handlers
- Router changes will be made after card components are ready
