import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'
import { corsHeaders, handleOptionsRequest } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest()
  }

  try {
    // Create a Supabase client with the Auth context of the user that called the function.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the mentee's preferences from the request body
    const { expertise, industry } = await req.json()

    if (!expertise || !Array.isArray(expertise) || !industry) {
      return new Response(JSON.stringify({ error: 'Expertise (array) and industry (string) must be provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Fetch all approved mentors
    const { data: mentors, error: mentorsError } = await supabaseClient
      .from('mentors')
      .select('user_id, areas_of_expertise, industry, profile:user_id (full_name, avatar_url)')
      .eq('approval_status', 'approved')

    if (mentorsError) {
      throw mentorsError
    }

    // Simple scoring algorithm
    const scoredMentors = mentors.map(mentor => {
      let score = 0;
      // +2 for each matching area of expertise
      if (mentor.areas_of_expertise) {
        const menteeExpertise = expertise.map(e => e.toLowerCase());
        const mentorExpertise = mentor.areas_of_expertise.map(e => e.toLowerCase());
        score += mentorExpertise.filter(e => menteeExpertise.includes(e)).length * 2;
      }
      // +1 for matching industry
      if (mentor.industry && mentor.industry.toLowerCase() === industry.toLowerCase()) {
        score += 1;
      }
      return { ...mentor, score };
    }).filter(mentor => mentor.score > 0);

    // Sort mentors by score in descending order
    scoredMentors.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify(scoredMentors), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
