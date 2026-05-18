import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface JobAlert {
  id: string;
  user_id: string;
  alert_name: string;
  keywords: string[] | null;
  location: string | null;
  job_type: string | null;
  experience_level: string | null;
  min_salary: number | null;
  max_salary: number | null;
  frequency: string;
  last_sent_at: string | null;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  company_name: string | null;
  description: string | null;
  requirements: string | null;
  location: string | null;
  job_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  degree_code: string | null;
  department_id: string | null;
  graduation_year: number | null;
  expected_graduation_year: number | null;
  current_job_title: string | null;
  location: string | null;
  skills: string[] | null;
  experience_level: string | null;
}

interface AiScoreResult {
  score: number;
  reason: string;
}

interface NotificationMessageResult {
  message: string;
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

    console.log('Starting job alert processing with AI scoring...');

    // Fetch all active job alerts that are due for processing
    const { data: alerts, error: alertsError } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('is_active', true)
      .or('last_sent_at.is.null,last_sent_at.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (alertsError) {
      console.error('Error fetching job alerts:', alertsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch job alerts' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!alerts || alerts.length === 0) {
      console.log('No alerts to process');
      return new Response(JSON.stringify({ message: 'No alerts to process', processed: 0 }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${alerts.length} job alerts...`);

    let totalNotificationsCreated = 0;

    for (const alert of alerts) {
      const lastCheck = alert.last_sent_at || alert.created_at;
      
      // Fetch user profile for AI scoring
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', alert.user_id)
        .single();

      if (!profile) {
        console.error(`Profile not found for user ${alert.user_id}`);
        continue;
      }

      // Find matching jobs posted since last check
      let jobQuery = supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .eq('is_rejected', false)
        .gt('created_at', lastCheck);

      // Apply basic filters (keyword matching will be refined by AI)
      if (alert.job_type) {
        jobQuery = jobQuery.eq('job_type', alert.job_type);
      }
      if (alert.experience_level) {
        jobQuery = jobQuery.eq('experience_level', alert.experience_level);
      }
      if (alert.location) {
        jobQuery = jobQuery.ilike('location', `%${alert.location}%`);
      }
      if (alert.min_salary) {
        jobQuery = jobQuery.gte('salary_max', alert.min_salary);
      }
      if (alert.max_salary) {
        jobQuery = jobQuery.lte('salary_min', alert.max_salary);
      }

      const { data: jobs } = await jobQuery.limit(20);

      if (!jobs || jobs.length === 0) {
        console.log(`No jobs found for alert ${alert.id}`);
        continue;
      }

      console.log(`Found ${jobs.length} potential matches for alert ${alert.id}`);

      // Score each job with AI
      for (const job of jobs) {
        try {
          const aiResult = await scoreJobMatch(profile, job, alert);
          
          if (aiResult.score >= 65) {
            // Generate personalized notification message
            const messageResult = await generateNotificationMessage(
              profile,
              job,
              aiResult.score
            );
            
            const notificationMessage = messageResult.message || 
              `New job posted: ${job.title}${job.company_name ? ` at ${job.company_name}` : ''}`;

            // Create notification with AI score in metadata
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                recipient_id: alert.user_id,
                type: 'job_alert',
                title: `New job matching your alert: ${alert.alert_name}`,
                message: notificationMessage,
                data: {
                  job_id: job.id,
                  alert_id: alert.id,
                  ai_score: aiResult.score,
                  ai_reason: aiResult.reason,
                },
                created_at: new Date().toISOString(),
              });

            if (!notifError) {
              totalNotificationsCreated++;
              console.log(`Created notification for job ${job.id} (score: ${aiResult.score})`);
            } else {
              console.error('Error creating notification:', notifError);
            }
          } else {
            console.log(`Job ${job.id} scored ${aiResult.score} - below threshold`);
          }
        } catch (scoreError) {
          console.error('Error scoring job:', scoreError);
          // Continue with next job even if scoring fails
        }
      }

      // Update last_sent_at
      await supabase
        .from('job_alerts')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', alert.id);
    }

    console.log(`Processing complete. Created ${totalNotificationsCreated} notifications.`);

    return new Response(JSON.stringify({ 
      message: 'Job alerts processed successfully',
      processed: alerts.length,
      notifications_created: totalNotificationsCreated
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-job-alerts-ai:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function scoreJobMatch(
  profile: UserProfile,
  job: Job,
  alert: JobAlert
): Promise<AiScoreResult> {
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY not configured');
    return { score: 0, reason: 'AI scoring not available' };
  }

  const systemPrompt = `You are an expert job matching system. Your task is to score how well a job matches a user's profile and job alert criteria.

Return ONLY a valid JSON object with this exact structure:
{
  "score": number (0-100),
  "reason": "one-line explanation"
}

Scoring guidelines:
- 90-100: Perfect match - all criteria met, highly relevant skills and experience
- 75-89: Strong match - most criteria met, good fit
- 65-74: Moderate match - some criteria met, worth considering
- 50-64: Weak match - few criteria met, low relevance
- 0-49: Poor match - not relevant

Consider:
- Skills overlap between job requirements and user profile
- Experience level alignment
- Location match
- Salary expectations
- Degree/education relevance
- Job type preference`;

  const userPrompt = `User Profile:
- Degree: ${profile.degree_code || 'Not specified'}
- Department: ${profile.department_id || 'Not specified'}
- Graduation Year: ${profile.graduation_year || profile.expected_graduation_year || 'Not specified'}
- Current Job: ${profile.current_job_title || 'Not specified'}
- Location: ${profile.location || 'Not specified'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Experience Level: ${profile.experience_level || 'Not specified'}

Job Alert Criteria:
- Keywords: ${alert.keywords?.join(', ') || 'Not specified'}
- Location: ${alert.location || 'Not specified'}
- Job Type: ${alert.job_type || 'Not specified'}
- Experience Level: ${alert.experience_level || 'Not specified'}
- Salary Range: ${alert.min_salary || 'Any'} - ${alert.max_salary || 'Any'} LPA

Job Details:
- Title: ${job.title}
- Company: ${job.company_name || 'Not specified'}
- Location: ${job.location || 'Not specified'}
- Job Type: ${job.job_type || 'Not specified'}
- Experience Level: ${job.experience_level || 'Not specified'}
- Salary Range: ${job.salary_min || 'Not specified'} - ${job.salary_max || 'Not specified'} LPA
- Description: ${job.description || 'Not specified'}
- Requirements: ${job.requirements || 'Not specified'}

Score this job match (0-100) and provide a one-line reason. Return ONLY the JSON object.`;

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
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return { score: 0, reason: 'AI scoring failed' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { score: 0, reason: 'No AI response' };
    }

    const result = JSON.parse(content);
    
    return {
      score: Math.min(100, Math.max(0, result.score || 0)),
      reason: result.reason || 'No reason provided'
    };
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return { score: 0, reason: 'AI scoring error' };
  }
}

async function generateNotificationMessage(
  profile: UserProfile,
  job: Job,
  score: number
): Promise<NotificationMessageResult> {
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY not configured');
    return { message: 'AI message generation not available' };
  }

  const userName = profile.current_job_title || 'Professional';
  const systemPrompt = `You are a job notification system. Write a personalized, factual notification message about a job match.

Return ONLY a valid JSON object with this exact structure:
{
  "message": "15-word engaging notification message"
}

Guidelines:
- Keep it to exactly 15 words
- Be factual, no hype
- Mention the job title and company
- Reference the match score
- Make it actionable
- No emojis`;

  const userPrompt = `User: ${userName}
Job: ${job.title} at ${job.company_name || 'Company'}
Match Score: ${score}/100

Write a 15-word notification message. Return ONLY the JSON object.`;

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
        temperature: 0.5,
        max_tokens: 100,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Groq API error for message generation:', response.status);
      return { message: 'AI message generation failed' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { message: 'No AI response' };
    }

    const result = JSON.parse(content);
    return { message: result.message || 'Message generation failed' };
  } catch (error) {
    console.error('Error calling Groq API for message:', error);
    return { message: 'AI message generation error' };
  }
}
