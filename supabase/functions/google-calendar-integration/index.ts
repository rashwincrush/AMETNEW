// Deno Edge Function: google-calendar-integration
// Creates Google Calendar events with automatic Google Meet link generation for mentorship sessions
// Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("SB_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SB_ANON_KEY");
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Missing required environment variables for google-calendar-integration function");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

// Helper function to get fresh Google access token
async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    // Get user's Google OAuth tokens from Supabase auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return null;
    }

    // Check if user has Google OAuth identity
    const googleIdentity = user.identities?.find(
      (identity: any) => identity.provider === 'google'
    );

    if (!googleIdentity) {
      console.error("User does not have Google OAuth identity");
      return null;
    }

    // Check if we have a fresh access token
    let accessToken = googleIdentity.identity_data?.access_token;
    const expiresAt = googleIdentity.identity_data?.expires_at;

    // If token is expired or will expire soon, refresh it
    if (!accessToken || (expiresAt && Date.now() >= expiresAt - 60000)) {
      const refreshToken = googleIdentity.identity_data?.refresh_token;
      
      if (!refreshToken) {
        console.error("No refresh token available");
        return null;
      }

      // Refresh the token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        console.error("Error refreshing token:", tokenData);
        return null;
      }

      accessToken = tokenData.access_token;
      
      // Update user's identity with new token (optional - may need admin API)
      // For now, we'll return the fresh token
    }

    return accessToken;
  } catch (error) {
    console.error("Error getting Google access token:", error);
    return null;
  }
}

// Helper function to create Google Calendar event with Meet link
async function createCalendarEventWithMeet(
  accessToken: string,
  mentorEmail: string,
  menteeEmail: string,
  startTime: string,
  endTime: string,
  timezone: string,
  summary: string
): Promise<{ meetLink: string; eventId: string } | null> {
  try {
    const requestId = crypto.randomUUID();
    
    const eventData = {
      summary: summary,
      start: {
        dateTime: startTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endTime,
        timeZone: timezone,
      },
      attendees: [
        { email: mentorEmail },
        { email: menteeEmail },
      ],
      conferenceDataVersion: 1,
      conferenceData: {
        createRequest: {
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
          requestId: requestId,
        },
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Error creating calendar event:", responseData);
      return null;
    }

    return {
      meetLink: responseData.hangoutLink,
      eventId: responseData.id,
    };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const {
      mentorship_request_id,
      mentor_email,
      mentee_email,
      scheduled_start_time,
      scheduled_end_time,
      timezone = "Asia/Kolkata",
    } = await req.json();

    // Validate inputs
    if (!mentorship_request_id || !mentor_email || !mentee_email || !scheduled_start_time || !scheduled_end_time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user ID from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Google access token
    const accessToken = await getGoogleAccessToken(user.id);
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Failed to get Google access token. Please connect your Google account." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create calendar event with Meet link
    const calendarResult = await createCalendarEventWithMeet(
      accessToken,
      mentor_email,
      mentee_email,
      scheduled_start_time,
      scheduled_end_time,
      timezone,
      "Mentorship Video Session"
    );

    if (!calendarResult) {
      return new Response(
        JSON.stringify({ error: "Failed to create Google Calendar event" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update mentorship request with Google Meet details
    const { error: updateError } = await supabase
      .from("mentorship_requests")
      .update({
        google_meet_link: calendarResult.meetLink,
        google_calendar_event_id: calendarResult.eventId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mentorship_request_id);

    if (updateError) {
      console.error("Error updating mentorship request:", updateError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to update mentorship request",
          meetLink: calendarResult.meetLink,
          eventId: calendarResult.eventId,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        meetLink: calendarResult.meetLink,
        eventId: calendarResult.eventId,
        message: "Google Calendar event created with Meet link",
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );
  } catch (error) {
    console.error("google-calendar-integration error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
