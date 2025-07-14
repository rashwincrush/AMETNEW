# AMET Alumni Portal

A full-stack application for the AMET Alumni community to connect, share job opportunities, attend events, and participate in mentorship programs.

## Project Structure

```
├── backend/             # Python FastAPI backend
│   ├── server.py       # Main API server
│   └── .env            # Backend environment variables
├── frontend/           # React frontend
│   ├── public/         # Static files
│   ├── src/            # Source code
│   │   ├── components/ # React components
│   │   ├── contexts/   # Context providers
│   │   └── utils/      # Utility functions
│   └── .env            # Frontend environment variables
├── supabase/           # Supabase configuration
│   └── migrations/     # Database migrations
├── supabase_schema.sql # Consolidated database schema
└── vercel.json         # Vercel deployment configuration
```

## Features

- **Authentication**: Email/password and social login (Google, LinkedIn) via Supabase
- **User Profiles**: Alumni, employers, and administrators
- **Job Board**: Post and apply for job opportunities
- **Events**: Create and register for alumni events
- **Mentorship**: Connect mentors with mentees
- **Messaging**: Direct messaging between users

## Tech Stack

- **Frontend**: React, Material-UI, Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth + JWT
- **Deployment**: Vercel

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- Supabase account

### Environment Variables

#### Frontend (.env)

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_KEY=your_supabase_anon_key
```

#### Backend (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
MONGO_URL=your_mongodb_url (optional)
DB_NAME=your_db_name (optional)
```

### Local Development

1. **Set up Supabase**

   - Create a new Supabase project
   - Run the consolidated schema SQL in the Supabase SQL editor
   - Copy your project URL and API keys

2. **Backend Setup**

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn server:app --reload
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm start
   ```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Create a new project in Vercel
3. Link your GitHub repository
4. Add the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

## Database Schema

The database schema is consolidated in `supabase_schema.sql` and includes:

- User profiles
- Events and event attendees
- Jobs and companies
- Mentors and mentee profiles
- Mentorship requests
- Messages
- User resumes

Each table has appropriate Row Level Security (RLS) policies to ensure data security.

## API Endpoints

### Authentication

- `POST /api/login`: Authenticate with email/password
- `POST /api/test_login`: Test authentication (development only)
- `GET /api/me`: Get current user profile

### Status (Example)

- `GET /api/status`: Get status checks
- `POST /api/status`: Create a status check

## Frontend-Backend Communication

The frontend communicates with the backend using an Axios-based API client that sends requests to the `/api` routes. Social logins are handled directly through Supabase on the frontend.
