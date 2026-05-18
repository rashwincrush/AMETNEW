import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const RESEND_API_URL = 'https://api.resend.com/emails';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  current_job_title: string | null;
}

interface JobNotification {
  id: string;
  title: string;
  message: string;
  data: {
    job_id: string;
    alert_id: string;
    ai_score: number;
    ai_reason: string;
  };
  created_at: string;
}

interface EmailIntroResult {
  intro: string;
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

    console.log('Starting weekly digest generation...');

    // Fetch all users with active job alerts
    const { data: usersWithAlerts, error: usersError } = await supabase
      .from('job_alerts')
      .select('user_id')
      .eq('is_active', true);

    if (usersError) {
      console.error('Error fetching users with alerts:', usersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!usersWithAlerts || usersWithAlerts.length === 0) {
      console.log('No users with active alerts');
      return new Response(JSON.stringify({ message: 'No users to process', processed: 0 }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(usersWithAlerts.map(a => a.user_id))];
    console.log(`Processing ${uniqueUserIds.length} users...`);

    let totalEmailsSent = 0;

    for (const userId of uniqueUserIds) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile || !profile.email) {
        console.log(`Skipping user ${userId}: no profile or email`);
        continue;
      }

      // Fetch job notifications from the past week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('type', 'job_alert')
        .gte('created_at', oneWeekAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!notifications || notifications.length === 0) {
        console.log(`No job notifications for user ${userId} this week`);
        continue;
      }

      console.log(`Found ${notifications.length} job matches for user ${userId}`);

      // Generate personalized email intro
      const introResult = await generateEmailIntro(profile, notifications);
      
      // Build email content
      const emailContent = buildEmailContent(profile, notifications, introResult.intro);

      // Send email via Resend
      const emailSent = await sendEmail(profile.email, emailContent);
      
      if (emailSent) {
        totalEmailsSent++;
        console.log(`Weekly digest sent to ${profile.email}`);
      } else {
        console.error(`Failed to send email to ${profile.email}`);
      }
    }

    console.log(`Weekly digest complete. Sent ${totalEmailsSent} emails.`);

    return new Response(JSON.stringify({ 
      message: 'Weekly digest sent successfully',
      processed: uniqueUserIds.length,
      emails_sent: totalEmailsSent
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-weekly-digest:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function generateEmailIntro(
  profile: UserProfile,
  notifications: JobNotification[]
): Promise<EmailIntroResult> {
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY not configured');
    return { intro: 'Here are your job matches from this week.' };
  }

  const userName = profile.full_name || 'there';
  const bestMatch = notifications[0]; // Highest score due to ordering
  const jobCount = notifications.length;

  const systemPrompt = `You are a job search assistant. Write a personalized 3-sentence email intro for a weekly job digest.

Return ONLY a valid JSON object with this exact structure:
{
  "intro": "3-sentence personalized email intro"
}

Guidelines:
- Exactly 3 sentences
- Mention the user's name
- Highlight the best match (highest score)
- Provide one insight about the jobs found
- Be factual, no hype
- Professional tone`;

  const userPrompt = `User: ${userName}
Best Match: ${bestMatch.title} (Score: ${bestMatch.data.ai_score}/100)
Total Jobs This Week: ${jobCount}

Write a 3-sentence email intro. Return ONLY the JSON object.`;

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
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Groq API error for email intro:', response.status);
      return { intro: 'Here are your job matches from this week.' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { intro: 'Here are your job matches from this week.' };
    }

    const result = JSON.parse(content);
    return { intro: result.intro || 'Here are your job matches from this week.' };
  } catch (error) {
    console.error('Error calling Groq API for email intro:', error);
    return { intro: 'Here are your job matches from this week.' };
  }
}

function buildEmailContent(
  profile: UserProfile,
  notifications: JobNotification[],
  intro: string
): string {
  const userName = profile.full_name || 'there';
  
  let content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a365d;">Your Weekly Job Digest</h2>
      <p style="color: #4a5568; line-height: 1.6;">${intro}</p>
      
      <div style="margin-top: 30px;">
        <h3 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Top Job Matches This Week</h3>
  `;

  notifications.forEach((notif, index) => {
    const score = notif.data.ai_score || 0;
    const reason = notif.data.ai_reason || 'Good match';
    
    content += `
      <div style="margin: 20px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #3182ce; border-radius: 4px;">
        <h4 style="color: #2d3748; margin: 0 0 5px 0;">${notif.title}</h4>
        <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px;">${notif.message}</p>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #c6f6d5; color: #22543d; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
            Match Score: ${score}/100
          </span>
          <span style="color: #718096; font-size: 12px;">${reason}</span>
        </div>
      </div>
    `;
  });

  content += `
      </div>
      
      <div style="margin-top: 30px; padding: 15px; background: #ebf8ff; border-radius: 4px;">
        <p style="color: #2c5282; margin: 0; font-size: 14px;">
          <strong>Tip:</strong> Adjust your job alert settings to get more relevant matches.
        </p>
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #718096; font-size: 12px;">
        <p>You're receiving this because you have active job alerts.</p>
        <p>Alumni Portal - Your Career Network</p>
      </div>
    </div>
  `;

  return content;
}

async function sendEmail(to: string, htmlContent: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Alumni Portal <noreply@alumniportal.com>',
        to: [to],
        subject: 'Your Weekly Job Digest',
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
