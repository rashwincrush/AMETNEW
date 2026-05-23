import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  expected_graduation_year: number;
}

interface JobAlert {
  id: string;
  alert_name: string;
  keywords: string[] | null;
  location: string | null;
  job_type: string | null;
  experience_level: string | null;
  min_salary: number | null;
  max_salary: number | null;
}

interface TransitionSuggestion {
  alert_id: string;
  current_keywords: string[];
  suggested_keywords: string[];
  current_experience_level: string | null;
  suggested_experience_level: string;
  current_min_salary: number | null;
  current_max_salary: number | null;
  suggested_min_salary: number;
  suggested_max_salary: number;
  reasoning: string;
}

interface GroqResult {
  suggestions: {
    keywords: string[];
    experience_level: string;
    min_salary: number;
    max_salary: number;
    reasoning: string;
  };
}

Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting graduation transition agent...');

    const currentYear = new Date().getFullYear();
    console.log(`Checking for students graduating in ${currentYear}...`);

    // Find students who graduated this year
    const { data: graduatedStudents, error: studentsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, expected_graduation_year')
      .eq('role', 'student')
      .eq('expected_graduation_year', currentYear);

    if (studentsError) {
      console.error('Error fetching graduated students:', studentsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch students' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!graduatedStudents || graduatedStudents.length === 0) {
      console.log('No graduated students found');
      return new Response(JSON.stringify({ 
        message: 'No graduated students to process',
        processed: 0 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${graduatedStudents.length} graduated students`);

    let totalSuggestionsCreated = 0;

    for (const student of graduatedStudents) {
      console.log(`Processing student: ${student.email}`);

      // Fetch student's job alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', student.id)
        .eq('is_active', true);

      if (alertsError) {
        console.error(`Error fetching alerts for ${student.id}:`, alertsError);
        continue;
      }

      if (!alerts || alerts.length === 0) {
        console.log(`No active alerts for ${student.id}`);
        continue;
      }

      console.log(`Found ${alerts.length} alerts for ${student.id}`);

      for (const alert of alerts) {
        try {
          // Check if suggestion already exists for this alert
          const { data: existing } = await supabase
            .from('alert_transition_suggestions')
            .select('id')
            .eq('alert_id', alert.id)
            .eq('status', 'pending')
            .single();

          if (existing) {
            console.log(`Suggestion already exists for alert ${alert.id}`);
            continue;
          }

          // Call Groq API for transition suggestions
          const suggestionResult = await generateTransitionSuggestion(alert);
          
          if (!suggestionResult) {
            console.log(`Failed to generate suggestion for alert ${alert.id}`);
            continue;
          }

          // Save suggestion to database
          const { error: insertError } = await supabase
            .from('alert_transition_suggestions')
            .insert({
              user_id: student.id,
              alert_id: alert.id,
              current_keywords: alert.keywords || [],
              suggested_keywords: suggestionResult.suggestions.keywords,
              current_experience_level: alert.experience_level,
              suggested_experience_level: suggestionResult.suggestions.experience_level,
              current_min_salary: alert.min_salary,
              current_max_salary: alert.max_salary,
              suggested_min_salary: suggestionResult.suggestions.min_salary,
              suggested_max_salary: suggestionResult.suggestions.max_salary,
              reasoning: suggestionResult.suggestions.reasoning,
              status: 'pending',
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Error inserting suggestion:', insertError);
            continue;
          }

          totalSuggestionsCreated++;
          console.log(`Created transition suggestion for alert ${alert.id}`);
        } catch (error) {
          console.error('Error processing alert:', error);
          continue;
        }
      }

      // Update student role to alumni
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'alumni' })
        .eq('id', student.id);

      if (updateError) {
        console.error(`Error updating role for ${student.id}:`, updateError);
      } else {
        console.log(`Updated ${student.id} role to alumni`);
      }
    }

    console.log(`Processing complete. Created ${totalSuggestionsCreated} suggestions.`);

    return new Response(JSON.stringify({ 
      message: 'Graduation transition processing complete',
      processed: graduatedStudents.length,
      suggestions_created: totalSuggestionsCreated
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in graduation-transition-agent:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function generateTransitionSuggestion(alert: JobAlert): Promise<GroqResult | null> {
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY not configured');
    return null;
  }

  const systemPrompt = `You are a career transition assistant helping new graduates update their job search criteria. 
The user has just graduated and needs to transition from student-oriented job alerts to professional job alerts.

Return ONLY a valid JSON object with this exact structure:
{
  "suggestions": {
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "experience_level": "entry" | "mid" | "senior",
    "min_salary": number (in LPA, typically 3-6 for freshers),
    "max_salary": number (in LPA, typically 6-10 for freshers),
    "reasoning": "one-line explanation of the changes"
  }
}

Guidelines:
- Remove student/internship-specific terms: "Intern", "Trainee", "Summer Intern", "Winter Intern"
- Add professional terms: "Fresher", "Entry Level", "Junior", "Associate"
- Update experience level from "intern" to "entry"
- Increase salary range by ~30% from current (min 3 LPA, max 10 LPA for freshers)
- Keep location and job_type the same
- Be specific with 3-5 relevant keywords`;

  const userPrompt = `Current Job Alert:
- Alert Name: ${alert.alert_name}
- Current Keywords: ${alert.keywords?.join(', ') || 'None'}
- Current Experience Level: ${alert.experience_level || 'Not specified'}
- Current Salary Range: ${alert.min_salary || 'Not specified'} - ${alert.max_salary || 'Not specified'} LPA
- Location: ${alert.location || 'Not specified'}
- Job Type: ${alert.job_type || 'Not specified'}

The user has just graduated. Suggest updated job alert criteria for a fresh graduate.
Return ONLY the JSON object.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    const result = JSON.parse(content);
    return result as GroqResult;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return null;
  }
}
