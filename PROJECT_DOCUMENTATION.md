# AMETNEWSUPABASE Project Documentation

## Project Overview

AMETNEWSUPABASE is an alumni management and networking platform built with Supabase as the backend service. The application features a React frontend and provides functionalities such as alumni directory, job postings, mentorship, event management, networking, and messaging.

## Project Structure

```
/AMETNEWSUPABASE/
├── frontend/                  # React frontend application
│   ├── build/                 # Production build output
│   ├── public/                # Public assets 
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   ├── Admin/         # Admin panel components
│   │   │   ├── Auth/          # Authentication components
│   │   │   ├── Companies/     # Company related components
│   │   │   ├── Dashboard/     # Dashboard components
│   │   │   ├── Directory/     # Alumni directory components
│   │   │   ├── Events/        # Event management components
│   │   │   ├── Groups/        # Group functionality components
│   │   │   ├── Jobs/          # Job listings components
│   │   │   ├── Landing/       # Landing page components
│   │   │   ├── Layout/        # Layout components (header, footer, etc.)
│   │   │   ├── Mentorship/    # Mentorship program components
│   │   │   ├── Messages/      # Messaging system components
│   │   │   ├── Networking/    # Networking functionality components
│   │   │   ├── Notifications/ # Notification components
│   │   │   ├── Registration/  # User registration components
│   │   │   ├── common/        # Shared/common components
│   │   │   └── ui/            # UI component library
│   │   ├── contexts/          # React contexts (Auth, etc.)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   └── utils/             # Utility functions
│   ├── package.json           # Frontend dependencies and scripts
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── netlify.toml           # Netlify deployment configuration
│
├── backend/                   # Backend API server
│   ├── external_integrations/ # External service integrations
│   ├── routers/               # API route handlers
│   ├── server.py              # Main server file
│   ├── dependencies.py        # Server dependencies
│   └── requirements.txt       # Python dependencies
│
├── migrations/                # Database migration scripts
│   ├── update_public_profiles_view_with_names.sql
│   ├── add_company_id_to_profiles.sql
│   ├── add_get_unread_notifications_count.sql
│   ├── add_get_unread_notifications_count_by_type.sql
│   └── 002_update_get_my_posted_jobs.sql
│
├── supabase/                  # Supabase configuration files
│
├── scripts/                   # Utility scripts
│
└── [Various SQL files]        # Database schema and function definitions
```

## Key Components

### Frontend

The frontend is a React application with the following key features:

1. **Alumni Directory** (`/frontend/src/components/Directory/`): 
   - Displays profiles of alumni
   - Allows filtering and searching
   - Shows detailed profiles with contact information, work history, etc.

2. **Authentication** (`/frontend/src/components/Auth/`):
   - Handles user login/signup
   - Manages user sessions
   - Profile management

3. **Job Board** (`/frontend/src/components/Jobs/`):
   - Job listings
   - Job application management
   - Employer job posting

4. **Mentorship** (`/frontend/src/components/Mentorship/`):
   - Mentor matching
   - Mentorship session scheduling
   - Feedback and reviews

5. **Events** (`/frontend/src/components/Events/`):
   - Event calendar
   - RSVP functionality
   - Event management

6. **Notifications** (`/frontend/src/components/Notifications/`):
   - Real-time notifications
   - Notification preferences

7. **Messages** (`/frontend/src/components/Messages/`):
   - Direct messaging between users
   - Conversation management

### Backend

The backend is built using Supabase and supplemented with custom API routes:

1. **Database Tables and Views**:
   - `profiles`: User profile information
   - `public_profiles_view`: Filtered view of profiles for directory listing
   - `companies`: Company information
   - `jobs`: Job listings
   - `events`: Event information
   - `mentorship_requests`: Mentorship connections
   - Various other tables for messaging, notifications, etc.

2. **Database Functions**:
   - Connection status checks
   - Notification counters
   - Permission validation
   - Real-time messaging

## Important Development Notes

### Database Schema

1. **Generated Columns**: Some columns like `is_profile_complete` are defined as `GENERATED ALWAYS AS (...) STORED`, meaning they:
   - Cannot be manually updated
   - Are automatically calculated by the database
   - Must be excluded from any update operations

2. **Real-time Subscriptions**: The application uses Supabase real-time features for:
   - Messaging
   - Notifications
   - Connection status updates

### Frontend Development

1. **Supabase Client**:
   - Use the singleton pattern for the Supabase client
   - Import from `/frontend/src/utils/supabase.js`
   - Manage listeners with useRef and clean them up in useEffect

2. **Authentication Flow**:
   - Auth state is managed through the AuthContext
   - Listeners should be properly managed to avoid duplicates

3. **Profile Updates**:
   - Remove generated columns like `is_profile_complete` before sending updates to Supabase:
   ```javascript
   // Example:
   delete profileData.is_profile_complete;
   // Then send to Supabase
   ```

## Development Environment Setup

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account and project

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm start
```

3. The application will be available at http://localhost:3000

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Start the backend server:
```bash
python server.py
```

### Database Migrations

1. Run database migrations:
```bash
sh run_migrations.sh
```

## Deployment

### Frontend Deployment

The frontend can be deployed to Netlify or Vercel:

1. **Netlify**: Configuration is in `frontend/netlify.toml`
2. **Vercel**: Configuration is in `frontend/vercel.json`

### Backend Deployment

The backend API can be deployed to Vercel or a similar serverless platform:
- Configuration is in `backend/vercel.json`

### Database

The database is hosted on Supabase, which handles:
- PostgreSQL database
- Real-time subscriptions
- Authentication
- Storage for files and images

## Common Issues and Solutions

1. **Auth Listener Duplication**:
   - Issue: Multiple auth state change events firing
   - Solution: Use singleton Supabase client and manage listeners with useRef

2. **Profile Updates Failing**:
   - Issue: Generated columns cannot be manually updated
   - Solution: Remove generated columns from update payload

3. **React Development Server Port Conflict**:
   - Issue: Port 3000 already in use
   - Solution: Kill processes on port 3000 before starting the server
   ```bash
   kill -9 $(lsof -ti:3000)
   ```

## Key Frontend Components Documentation

### Alumni Directory Components

1. **AlumniDirectory.js**:
   - Main component for the alumni directory page
   - Handles searching, filtering, and pagination
   - Queries the `public_profiles_view` to get verified profiles with public visibility

2. **AlumniCard.js**:
   - Card view for alumni profiles
   - Displays name, avatar, headline, position, company, etc.
   - Shows mentor/employer badges

3. **AlumniListItem.js**:
   - List view for alumni profiles
   - Compact display of key information

4. **AlumniProfile.js**:
   - Detailed profile view
   - Shows complete information including experience, education, etc.

### Profile Management Components

1. **Profile.js**:
   - Profile editing component
   - Handles updating user information
   - Important: Removes generated columns like `is_profile_complete` before updates

## Best Practices

1. **State Management**:
   - Use React Context for global state
   - Use useState and useReducer for component state

2. **Performance**:
   - Implement pagination for large data sets
   - Use memoization with useMemo and useCallback

3. **Security**:
   - Validate data on both client and server sides
   - Use Supabase Row Level Security (RLS) policies

4. **Error Handling**:
   - Always check error objects in Supabase responses
   - Implement error boundaries for React components

## Conclusion

AMETNEWSUPABASE is a comprehensive alumni management platform with robust features for networking, job hunting, mentorship, and events. The application uses modern web technologies and best practices to provide a smooth user experience.

For specific questions or issues, refer to the documentation above or contact the project maintainers.
