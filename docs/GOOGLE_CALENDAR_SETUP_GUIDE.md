# Google Calendar + Google Meet Setup Guide for Mentorship Module

**Last Updated:** April 20, 2026  
**Objective:** Enable Google Calendar integration with automatic Google Meet link generation for mentorship video sessions

---

## Overview

This guide will walk you through setting up Google Calendar integration for the Mentorship Module. The integration will:
- Automatically create Google Calendar events when mentorship video sessions are scheduled
- Generate Google Meet links automatically (unlimited duration for 1-on-1 sessions)
- Send calendar invites to both mentor and mentee
- Store Meet links and calendar event IDs in the database

**Cost:** FREE (Google Calendar API is free with 1,000,000 queries/day)

---

## Prerequisites

- Google account (for setting up Google Cloud project)
- Supabase project access (sjksibkuxvduuuvakwqx)
- Basic understanding of OAuth 2.0

---

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
1. Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project selector (top left)
4. Click **"New Project"**
5. Enter project name: `Forgecircle Alumni Portal - Mentorship`
6. Click **"Create"**

### 1.2 Enable Calendar API
1. Select your new project from the project selector
2. Navigate to **APIs & Services** → **Library** (sidebar)
3. Search for **"Google Calendar API"**
4. Click on it and click **"Enable"**

### 1.3 Configure OAuth Consent Screen
1. Navigate to **APIs & Services** → **OAuth consent screen** (sidebar)
2. Choose **User Type:** **External** (recommended for customer-facing apps)
3. Click **"Create"**
4. Fill in required fields:
   - **App name:** Forgecircle Alumni Portal
   - **User support email:** your email
   - **Developer contact information:** your email
5. Click **"Save and Continue"** (skip optional fields for now)
6. Click **"Save and Continue"** again (skip scopes)
7. Click **"Save and Continue"** again (skip test users)
8. Click **"Back to Dashboard"**

### 1.4 Create OAuth Client Credentials
1. Navigate to **APIs & Services** → **Credentials** (sidebar)
2. Click **"+ Create Credentials"** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Forgecircle Alumni Portal - Web Client`
5. Under **Authorized redirect URIs**, add:
   ```
   https://sjksibkuxvduuuvakwqx.supabase.co/auth/v1/callback
   ```
6. Click **"Create"**
7. **IMPORTANT:** Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

---

## Step 2: Enable Google OAuth in Supabase

### 2.1 Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `Alumni- Standalone` (sjksibkuxvduuuvakwqx)

### 2.2 Enable Google Provider
1. Navigate to **Authentication** → **Providers** → **Google**
2. Toggle **"Enable Sign in with Google"** to ON
3. Paste the **Client ID** from Google Cloud Console
4. Paste the **Client Secret** from Google Cloud Console
5. **IMPORTANT:** Copy the **Callback URL** displayed (you may need this for Google Cloud Console if not already added)
6. Click **"Save"**

### 2.3 Verify Callback URL
1. The callback URL should be:
   ```
   https://sjksibkuxvduuuvakwqx.supabase.co/auth/v1/callback
   ```
2. If this is not in your Google Cloud Console OAuth client, add it now:
   - Go back to Google Cloud Console
   - Navigate to **APIs & Services** → **Credentials**
   - Click on your OAuth client ID
   - Under **Authorized redirect URIs**, add the callback URL
   - Click **"Save"**

---

## Step 3: Test Google OAuth (Optional but Recommended)

### 3.1 Add Google Login to Your App
Add a Google login button to your app to test OAuth flow:

```javascript
import { supabase } from '../utils/supabase';

const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    console.error('Google login error:', error);
  } else {
    console.log('Google login successful:', data);
  }
};
```

### 3.2 Verify OAuth Tokens
After successful login, check if Google tokens are stored in Supabase:
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click on your user
4. Check if **Provider** shows `google` and tokens are present

---

## Step 4: Database Setup (Already Completed)

The following database changes have already been applied:

### 4.1 Mentorship Request Fields
- `google_meet_link` - Google Meet link for video session
- `google_calendar_event_id` - Google Calendar event ID
- `scheduled_start_time` - Scheduled start time
- `scheduled_end_time` - Scheduled end time
- `is_video_session_scheduled` - Flag indicating if video session is scheduled

### 4.2 RPC Functions
- `schedule_mentorship_video_session()` - Schedules a video session
- `update_mentorship_google_meet_details()` - Updates Google Meet details after calendar event creation

---

## Step 5: Edge Function Deployment

The Edge Function has been created at `supabase/functions/google-calendar-integration/index.ts`. You need to deploy it and set up environment variables.

### 5.1 Install Supabase CLI (if not already installed)
```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://supabase.com/install/v2/cli | bash

# Windows
# Download from https://supabase.com/docs/guides/cli
```

### 5.2 Login to Supabase
```bash
supabase login
```

### 5.3 Link to your project
```bash
cd /Users/ashwin/Desktop/AI\ Projects/Alumni\ Standalone
supabase link --project-ref sjksibkuxvduuuvakwqx
```

### 5.4 Deploy the Edge Function
```bash
supabase functions deploy google-calendar-integration
```

### 5.5 Set Environment Variables
You need to set these secrets for the Edge Function:

```bash
# Set Supabase URL and keys
supabase secrets set SUPABASE_URL=https://sjksibkuxvduuuvakwqx.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key-here

# Set Google OAuth credentials
supabase secrets set GOOGLE_CLIENT_ID=your-google-client-id
supabase secrets set GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**To get your SUPABASE_ANON_KEY:**
1. Go to Supabase Dashboard
2. Navigate to Project Settings → API
3. Copy the **anon public** key

**To get your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:**
1. Go to Google Cloud Console
2. Navigate to APIs & Services → Credentials
3. Copy the Client ID and Client Secret from your OAuth client

### Alternative: Set Secrets via Supabase Dashboard
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → Secrets
3. Add the following secrets:
   - `SUPABASE_URL`: `https://sjksibkuxvduuuvakwqx.supabase.co`
   - `SUPABASE_ANON_KEY`: your anon key
   - `GOOGLE_CLIENT_ID`: your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: your Google OAuth Client Secret

---

## Step 6: Frontend Integration (After Edge Function)

After the Edge Function is created, I will:
1. Add "Schedule Video Session" button in mentorship module
2. Create date/time picker for scheduling
3. Call Edge Function to create calendar event with Meet link
4. Display Meet link in mentorship request details
5. Add "Join Google Meet" button

---

## Troubleshooting

### Issue: "Redirect URI mismatch" error
**Solution:** Ensure the callback URL in Supabase matches exactly what's in Google Cloud Console OAuth client.

### Issue: OAuth tokens not stored
**Solution:** 
- Verify Google provider is enabled in Supabase
- Check that Client ID and Secret are correct
- Ensure redirect URI matches

### Issue: Calendar API returns 403 error
**Solution:**
- Verify Calendar API is enabled in Google Cloud Console
- Check OAuth consent screen is configured
- Ensure user has granted Calendar permissions

### Issue: Meet link not generated
**Solution:**
- Ensure `conferenceDataVersion=1` is in query parameter
- Check that `conferenceData.createRequest` is in event body
- Verify `requestId` is unique for each request

---

## Security Considerations

1. **OAuth Tokens:** Stored securely in Supabase auth
2. **Access Control:** Only mentor and mentee can schedule/update video sessions
3. **Rate Limiting:** Google Calendar API has 1,000,000 queries/day limit
4. **Data Validation:** All inputs validated before API calls
5. **Error Handling:** Proper error messages without exposing sensitive data

---

## Next Steps

1. ✅ **Complete Steps 1-3** (Google Cloud setup + Supabase OAuth)
2. ⏳ **Create Edge Function** (I will do this after you complete setup)
3. ⏳ **Frontend Integration** (I will do this after Edge Function)
4. ⏳ **Testing** (We will test together)

**Please let me know when you've completed Steps 1-3 and I'll proceed with the Edge Function setup.**
