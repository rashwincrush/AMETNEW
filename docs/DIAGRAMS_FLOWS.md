# Forgecircle Alumni Platform — Flow Diagrams

## 1. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase Auth
    participant DB as PostgreSQL
    participant C as AuthContext

    U->>F: Enter credentials
    F->>S: auth.signInWithPassword()
    S->>DB: Validate user
    DB-->>S: User validated
    S-->>F: Session + JWT
    F->>C: setUser(session.user)
    C->>DB: Fetch profile
    DB-->>C: Profile data
    C->>C: Compute permissions
    C-->>F: Auth state ready
    F-->>U: Redirect to dashboard
    
    Note over F,C: AuthListener subscribes to<br/>auth state changes for auto-refresh
```

## 2. Job Application Flow

```mermaid
sequenceDiagram
    participant A as Alumni
    participant J as JobDetails
    participant D as ApplyDialog
    participant St as Storage
    participant R as RPC job_apply
    participant DB as Database

    A->>J: View job details
    J->>J: computeJobApplyState()
    Note right of J: Checks: deadline, status,<br/>existing application, permissions
    
    alt Can apply
        A->>D: Click "Apply"
        D->>D: Show resume upload
        A->>D: Upload resume
        D->>St: Upload to resumes bucket
        St-->>D: resume_path
        A->>D: Add cover letter
        D->>R: Call job_apply()
        R->>DB: Insert job_applications
        DB-->>R: Success
        R->>DB: Log activity
        R->>DB: Create notification
        R-->>D: Success response
        D-->>A: Show success toast
    else Cannot apply
        J-->>A: Show disabled state<br/>(reason: deadline passed/<br/>already applied/not approved)
    end
```

## 3. Mentorship Request Flow

```mermaid
sequenceDiagram
    participant M as Mentee
    participant F as FindMentorsPanel
    participant MP as MentorProfile
    participant R as Request Panel
    participant S as Supabase
    participant DB as Database

    M->>F: Browse mentors
    F->>S: Query approved mentors
    S->>DB: SELECT mentors + profiles
    DB-->>S: Mentor list
    S-->>F: Display cards
    
    M->>MP: View mentor details
    MP->>MP: Check eligibility
    
    alt Eligible
        MP-->>M: Show "Request Mentorship"
        M->>R: Open request form
        M->>R: Fill goals & message
        R->>S: request_mentorship()
        S->>DB: Insert mentorship_requests
        DB-->>S: Created
        S->>DB: Create notification
        S-->>R: Success
        R-->>M: Request sent
    else Not eligible
        MP-->>M: Show requirement gaps<br/>(pending approval/already has mentor)
    end
```

## 4. Connection Request Flow

```mermaid
sequenceDiagram
    participant U1 as User A
    participant D as Directory
    participant C as ConnectionCTA
    participant S as Supabase
    participant U2 as User B

    U1->>D: Browse directory
    D->>S: Query profiles
    S-->>D: Results
    
    U1->>C: Click "Connect"
    C->>C: Check connection status
    
    alt Not connected
        C->>S: request_connection()
        S->>S: Check if blocked
        S->>S: Check daily limit
        S->>S: Insert connections row
        S->>S: Create notification
        S-->>C: Pending created
        C-->>U1: Show pending state
        
        Note over U2: Receives notification
        U2->>S: Accept connection
        S->>S: Update connections status
        S->>S: Create DM thread
        S-->>U1: Realtime update
        S-->>U2: Realtime update
    else Already connected
        C-->>U1: Show "Message" button
    end
```

## 5. Group Join Flow

```mermaid
sequenceDiagram
    participant U as User
    participant G as GroupsList
    participant D as GroupDetail
    participant S as Supabase
    participant DB as Database

    U->>G: Browse groups
    G->>S: Query groups
    S-->>G: Public/private groups
    
    U->>D: View group details
    D->>S: Check membership
    
    alt Public group
        U->>D: Click "Join"
        D->>S: join_group()
        S->>DB: Insert group_members
        S->>DB: Create notification
        DB-->>S: Success
        S-->>D: Joined
        D-->>U: Show member view
    else Private group
        D-->>U: Show "Request to Join"
        U->>D: Submit request
        D->>S: join_group()
        S->>DB: Insert with status 'pending'
        S->>DB: Notify group admins
        S-->>D: Pending
        D-->>U: Show pending state
        
        Note over D: Admin approves
        D->>S: Approve request
        S-->>U: Realtime status update
    else Has invite
        D->>S: accept_group_invite()
        S->>DB: Add member
        S-->>D: Joined
    end
```

## 6. Direct Message Flow

```mermaid
sequenceDiagram
    participant U1 as User A
    participant M as Messages
    participant C as ChatWindow
    participant R as useDmRealtime
    participant S as Supabase
    participant U2 as User B

    U1->>M: Open messages
    M->>S: Fetch threads
    S-->>M: Thread list
    
    U1->>C: Select conversation
    C->>S: Fetch messages
    S->>S: Check connection status
    S-->>C: Messages + status
    
    alt Connected
        U1->>C: Type message
        U1->>C: Send
        C->>S: send_dm_message()
        S->>S: Insert dm_messages
        S->>S: Update thread timestamp
        S->>S: Create notification
        
        R->>S: Subscribe to changes
        S-->>U2: Realtime message
        S-->>U1: Confirm sent
        C-->>U1: Show delivered
    else Not connected
        C-->>U1: Show connection banner<br/>with "Reconnect" CTA
    end
```

## 7. Admin User Management Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant P as AdminUsersPage
    participant G as UserGrid
    participant S as Supabase
    participant F as Admin Functions
    participant DB as Database

    A->>P: Open user management
    P->>S: admin_list_users_with_last_login()
    S->>DB: Query profiles + auth
    DB-->>S: User list
    S-->>P: Display grid
    
    A->>G: Search/filter users
    G->>G: Client-side filter
    
    A->>G: Select user action
    
    alt Block User
        A->>P: Click "Block"
        P->>S: admin_block_user()
        S->>F: Validate admin
        S->>DB: Update profile
        S->>S: Set JWT claim
        S->>DB: Log admin action
        S-->>P: Success
    else Change Role
        A->>P: Change role
        P->>S: admin_update_user_role()
        S->>DB: Update profile
        S->>S: Sync JWT claim
        S->>DB: Log change
        S-->>P: Updated
    else Delete User
        A->>P: Delete
        P->>P: Confirm dialog
        P->>S: admin_delete_user_rpc()
        S->>F: Soft delete + anonymize
        S->>DB: Cascade to related tables
        S-->>P: Deleted
    end
```

## 8. Event RSVP Flow

```mermaid
sequenceDiagram
    participant U as User
    participant E as EventDetail
    participant S as Supabase
    participant DB as Database

    U->>E: View event
    E->>S: Fetch event + my RSVP
    S->>DB: Query events
    S->>DB: Check event_rsvps
    DB-->>S: Event + RSVP status
    S-->>E: Display
    
    alt Not RSVP'd
        U->>E: Click "Attend"
        E->>S: Create RSVP
        S->>S: Check approval status
        S->>DB: Insert event_rsvps
        S->>DB: Add event_attendees
        S->>DB: Create notification
        DB-->>S: Success
        S-->>E: RSVP confirmed
        E-->>U: Show "You're attending"
    else Already RSVP'd
        U->>E: Toggle volunteer
        E->>S: Update event_rsvps
        S->>DB: Update wants_to_volunteer
        S-->>E: Updated
        E-->>U: Volunteer status updated
    end
```

## 9. Real-time Notification Flow

```mermaid
sequenceDiagram
    participant S as Supabase Realtime
    participant N as NotificationProvider
    participant P as NotificationsPage
    participant B as Bell Icon
    participant U as User

    Note over S: Any table change<br/>triggers Realtime
    
    S->>N: INSERT on notifications
    N->>N: Filter for current user
    N->>N: Update unread count
    N->>B: Badge update
    B-->>U: Show dot/count
    
    U->>B: Click bell
    B->>P: Open panel
    P->>S: Fetch notifications
    S-->>P: List
    
    U->>P: Mark as read
    P->>S: mark_notification_read()
    S->>DB: Update notifications
    S-->>P: Success
    P->>N: Update count
    N->>B: Clear badge
```

## 10. Profile Update Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Profile
    participant V as Validation
    participant S as Supabase
    participant C as AuthContext
    participant DB as Database

    U->>P: Edit profile fields
    P->>V: validate()
    
    alt Invalid
        V-->>P: Show errors
        P-->>U: Highlight fields
    else Valid
        U->>P: Click "Save"
        P->>C: updateProfile()
        C->>C: pickSafeProfileFields()
        Note right of C: Whitelist prevents<br/>mass assignment
        C->>S: upsertMyProfileFillOnly()
        S->>DB: UPDATE profiles
        DB-->>S: Success
        S-->>C: Updated profile
        C->>C: Refresh auth state
        C-->>P: Update complete
        P-->>U: Success toast
    end
```

---

*These sequence diagrams illustrate the primary user flows in the Forgecircle Alumni Platform.*
