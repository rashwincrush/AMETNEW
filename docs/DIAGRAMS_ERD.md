# Forgecircle Alumni Platform — Entity Relationship Diagrams

## Core Data Model

```mermaid
erDiagram
    PROFILES ||--o{ USER_DEGREES : has
    PROFILES ||--o{ ACHIEVEMENTS : has
    PROFILES ||--o{ SOCIAL_LINKS : has
    PROFILES ||--o{ USER_RESUMES : uploads
    PROFILES ||--o{ CONNECTIONS : requests
    PROFILES ||--o{ CONNECTIONS : receives
    PROFILES ||--o{ NOTIFICATIONS : receives
    PROFILES ||--o{ JOB_APPLICATIONS : submits
    PROFILES ||--o{ MENTORS : becomes
    PROFILES ||--o{ MENTEES : registers
    PROFILES ||--o{ GROUP_MEMBERS : joins
    PROFILES ||--o{ DM_THREADS : participates

    JOBS ||--o{ JOB_APPLICATIONS : receives
    JOBS ||--|| PROFILES : posted_by
    JOBS ||--o{ JOB_BOOKMARKS : bookmarked

    EVENTS ||--o{ EVENT_ATTENDEES : has
    EVENTS ||--o{ EVENT_RSVPS : receives
    EVENTS ||--o{ EVENT_FEEDBACK : receives
    EVENTS ||--|| PROFILES : organized_by

    GROUPS ||--o{ GROUP_MEMBERS : has
    GROUPS ||--o{ GROUP_POSTS : contains
    GROUPS ||--o{ GROUP_INVITATIONS : sends

    MENTORS ||--o{ MENTOR_AVAILABILITY : sets
    MENTORS ||--o{ MENTORSHIP_RELATIONSHIPS : has

    MENTEES ||--o{ MENTORSHIP_RELATIONSHIPS : participates
    MENTEES ||--o{ MENTORSHIP_REQUESTS : submits

    MENTORSHIP_RELATIONSHIPS ||--o{ MENTORSHIP_APPOINTMENTS : schedules

    DM_THREADS ||--o{ DM_MESSAGES : contains
    DM_THREADS ||--o{ DM_THREAD_PARTICIPANTS : has

    PROFILES {
        uuid id PK
        text email
        text first_name
        text last_name
        text role
        text status
        text company_name
        text current_job_title
        text location
        text avatar_url
        boolean is_deleted
        timestamp created_at
    }

    JOBS {
        uuid id PK
        text title
        text company_name
        text description
        text location
        text employment_type
        numeric min_salary
        numeric max_salary
        uuid posted_by FK
        text status
        timestamp deadline
    }

    CONNECTIONS {
        uuid id PK
        uuid requester_id FK
        uuid recipient_id FK
        text status
        timestamp created_at
    }

    GROUPS {
        uuid id PK
        text name
        text description
        text visibility
        uuid created_by FK
        timestamp created_at
    }

    MENTORS {
        uuid id PK
        uuid user_id FK
        text status
        text expertise
        int max_mentees
        text mentoring_statement
    }

    EVENTS {
        uuid id PK
        text title
        text description
        timestamp event_date
        text location
        text event_type
        uuid organizer_id FK
        boolean is_featured
    }
```

## Authentication & Authorization Model

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : extends
    AUTH_USERS ||--o{ AUTH_IDENTITIES : has
    AUTH_USERS ||--o{ AUTH_SESSIONS : creates
    PROFILES ||--o{ ADMIN_ACTIONS : performs

    AUTH_USERS {
        uuid id PK
        text email
        encrypted_password
        jsonb raw_user_meta_data
        jsonb raw_app_meta_data
        timestamp email_confirmed_at
    }

    PROFILES {
        uuid id PK
        text email
        text role
        text status
        boolean is_admin
        uuid institution_id
    }

    ADMIN_ACTIONS {
        uuid id PK
        uuid admin_id FK
        text action_type
        jsonb target_user_ids
        timestamp created_at
    }
```

## Job Application Flow Data Model

```mermaid
erDiagram
    PROFILES ||--o{ JOB_APPLICATIONS : submits
    JOBS ||--o{ JOB_APPLICATIONS : receives
    JOB_APPLICATIONS ||--o{ ACTIVITY_LOGS : generates

    JOB_APPLICATIONS {
        uuid id PK
        uuid job_id FK
        uuid applicant_id FK
        text status
        text resume_path
        text cover_letter
        timestamp applied_at
        timestamp updated_at
    }

    JOBS {
        uuid id PK
        text title
        text company_name
        text status
        timestamp deadline
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid actor_id FK
        text action
        text entity_type
        uuid entity_id
        timestamp created_at
    }
```

## Mentorship Relationship Model

```mermaid
erDiagram
    PROFILES ||--|| MENTORS : can_be
    PROFILES ||--|| MENTEES : can_be
    MENTORS ||--o{ MENTORSHIP_REQUESTS : receives
    MENTEES ||--o{ MENTORSHIP_REQUESTS : sends
    MENTORS ||--o{ MENTORSHIP_RELATIONSHIPS : has
    MENTEES ||--o{ MENTORSHIP_RELATIONSHIPS : participates
    MENTORSHIP_RELATIONSHIPS ||--o{ MENTORSHIP_APPOINTMENTS : schedules

    MENTORSHIP_REQUESTS {
        uuid id PK
        uuid mentor_id FK
        uuid mentee_id FK
        text status
        text message
        timestamp created_at
    }

    MENTORSHIP_RELATIONSHIPS {
        uuid id PK
        uuid mentor_id FK
        uuid mentee_id FK
        text status
        timestamp started_at
        timestamp ended_at
    }

    MENTORSHIP_APPOINTMENTS {
        uuid id PK
        uuid relationship_id FK
        timestamp scheduled_at
        text meeting_link
        text notes
        text status
    }
```

## Group & Community Model

```mermaid
erDiagram
    PROFILES ||--o{ GROUPS : creates
    PROFILES ||--o{ GROUP_MEMBERS : joins
    GROUPS ||--o{ GROUP_MEMBERS : has
    GROUPS ||--o{ GROUP_POSTS : contains
    GROUPS ||--o{ GROUP_INVITATIONS : sends
    GROUP_MEMBERS ||--o{ GROUP_POSTS : authors

    GROUPS {
        uuid id PK
        text name
        text description
        text visibility
        boolean admin_only_posts
        uuid created_by FK
        timestamp created_at
    }

    GROUP_MEMBERS {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        text role
        text status
        timestamp joined_at
    }

    GROUP_POSTS {
        uuid id PK
        uuid group_id FK
        uuid author_id FK
        text content
        text post_type
        timestamp created_at
    }

    GROUP_INVITATIONS {
        uuid id PK
        uuid group_id FK
        uuid invited_by FK
        text invitee_email
        text status
        timestamp expires_at
    }
```

## Messaging System Model

```mermaid
erDiagram
    DM_THREADS ||--o{ DM_THREAD_PARTICIPANTS : has
    DM_THREADS ||--o{ DM_MESSAGES : contains
    PROFILES ||--o{ DM_THREAD_PARTICIPANTS : participates
    PROFILES ||--o{ DM_MESSAGES : sends

    DM_THREADS {
        uuid id PK
        text type
        timestamp created_at
        timestamp updated_at
    }

    DM_THREAD_PARTICIPANTS {
        uuid id PK
        uuid thread_id FK
        uuid user_id FK
        timestamp joined_at
    }

    DM_MESSAGES {
        uuid id PK
        uuid thread_id FK
        uuid sender_id FK
        text content
        boolean is_read
        timestamp created_at
    }
```

## Notification System Model

```mermaid
erDiagram
    PROFILES ||--o{ NOTIFICATIONS : receives
    NOTIFICATIONS ||--o{ NOTIFICATION_PREFERENCES : respects

    NOTIFICATIONS {
        uuid id PK
        uuid recipient_id FK
        text type
        text title
        text message
        text link
        boolean is_read
        text module
        timestamp created_at
    }

    NOTIFICATION_PREFERENCES {
        uuid id PK
        uuid user_id FK
        text notification_type
        boolean email_enabled
        boolean push_enabled
        boolean in_app_enabled
    }
```

---

*These diagrams represent the core data relationships in the Forgecircle Alumni Platform.*
