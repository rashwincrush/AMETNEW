/**
 * @fileoverview Groq AI service for job alert suggestions
 * Uses Groq API to generate intelligent job alert criteria from user input
 */

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generates job alert suggestions using Groq AI
 * @param {object} userProfile - User's profile data from Supabase
 * @param {string} userDescription - User's plain English description
 * @returns {Promise<{ success: boolean, suggestions?: object, error?: string }>}
 */
export async function generateJobAlertSuggestions(userProfile, userDescription) {
  try {
    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    if (!userDescription || userDescription.trim().length === 0) {
      return { success: false, error: 'Please describe what you are looking for' };
    }

    // Build context from user profile
    const profileContext = {
      degree: userProfile?.degree_code || 'Not specified',
      department: userProfile?.department_id || 'Not specified',
      graduationYear: userProfile?.graduation_year || userProfile?.expected_graduation_year || 'Not specified',
      currentJobTitle: userProfile?.current_job_title || 'Not specified',
      location: userProfile?.location || 'Not specified',
      skills: userProfile?.skills || [],
      experience: userProfile?.experience_level || 'Not specified',
    };

    const systemPrompt = `You are an expert job search assistant for an alumni portal. Your task is to analyze a user's profile and their job search description to generate optimal job alert criteria.

Return ONLY a valid JSON object with this exact structure:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "experience_level": "entry" | "mid" | "senior" | "lead",
  "min_salary": number (in LPA, or null),
  "max_salary": number (in LPA, or null),
  "job_type": "full-time" | "part-time" | "contract" | "internship",
  "location": "city name or null"
}

Guidelines:
- keywords: 3-7 relevant job titles/skills based on description + profile
- experience_level: Match user's current level or one step up
- salary_range: Based on experience level (entry: 5-10, mid: 10-20, senior: 15-30, lead: 25-50)
- job_type: Default to "full-time" unless description specifies otherwise
- location: Extract from description or use user's profile location
- Return null for any field if not applicable
- Be realistic and conservative with salary expectations`;

    const userPrompt = `User Profile:
- Degree: ${profileContext.degree}
- Department: ${profileContext.department}
- Graduation Year: ${profileContext.graduationYear}
- Current Job: ${profileContext.currentJobTitle}
- Location: ${profileContext.location}
- Skills: ${profileContext.skills.join(', ') || 'Not specified'}
- Experience Level: ${profileContext.experience}

User's Job Search Description:
"${userDescription}"

Generate job alert criteria based on this information. Return ONLY the JSON object, no additional text.`;

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
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return { success: false, error: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No response from Groq API' };
    }

    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', content);
      return { success: false, error: 'Invalid response format from AI' };
    }

    // Validate the response structure
    if (!suggestions.keywords || !Array.isArray(suggestions.keywords)) {
      return { success: false, error: 'Invalid suggestions format' };
    }

    return { success: true, suggestions };
  } catch (error) {
    console.error('Groq service error:', error);
    return { success: false, error: error.message || 'Failed to generate suggestions' };
  }
}

/**
 * Generates alert health suggestions using Groq AI
 * @param {object} alert - Alert criteria
 * @returns {Promise<{ success: boolean, suggestions?: object, error?: string }>}
 */
export async function generateAlertHealthSuggestions(alert) {
  try {
    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    const systemPrompt = `You are an expert job search analyst. Your task is to analyze why a job alert might not be finding any matches and suggest improvements.

Return ONLY a valid JSON object with this exact structure:
{
  "explanation": "one-line explanation of why the alert might not be matching",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}

Guidelines:
- Analyze the alert criteria for being too restrictive
- Consider keyword specificity, location, salary range, experience level
- Provide 3 specific, actionable improvements
- Be concise and practical`;

    const userPrompt = `Alert Criteria:
- Keywords: ${Array.isArray(alert.keywords) ? alert.keywords.join(', ') : 'None'}
- Location: ${alert.location || 'None'}
- Job Type: ${alert.job_type || 'None'}
- Experience Level: ${alert.experience_level || 'None'}
- Salary Range: ${alert.min_salary || 'Any'} - ${alert.max_salary || 'Any'} LPA

This alert has found 0 jobs in the past 14 days. Explain why and suggest 3 improvements. Return ONLY the JSON object.`;

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
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return { success: false, error: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No response from Groq API' };
    }

    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', content);
      return { success: false, error: 'Invalid response format from AI' };
    }

    return { success: true, suggestions };
  } catch (error) {
    console.error('Groq service error:', error);
    return { success: false, error: error.message || 'Failed to generate suggestions' };
  }
}

/**
 * Generates job posting improvement suggestions using Groq AI
 * Used when a job matches fewer than 10 alerts to suggest changes
 * @param {object} job - Job posting data
 * @param {number} currentMatchCount - Number of alerts currently matching
 * @returns {Promise<{ success: boolean, suggestions?: string[], error?: string }>}
 */
export async function generateJobImprovementSuggestions(job, currentMatchCount) {
  try {
    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    const systemPrompt = `You are an expert job posting optimizer for an alumni portal. Your task is to analyze a job posting that is matching fewer than 10 candidate alerts and suggest specific improvements to reach more qualified candidates.

Return ONLY a valid JSON object with this exact structure:
{
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Guidelines:
- Provide 3 specific, actionable suggestions
- Focus on: job title clarity, location flexibility, experience level range, salary transparency, required skills
- Keep each suggestion to one sentence
- Be practical and employer-friendly
- Suggest specific changes to fields, not generic advice`;

    const userPrompt = `Job Posting Details:
- Title: ${job.title || 'Not specified'}
- Company: ${job.company_name || 'Not specified'}
- Location: ${job.location || 'Not specified'}
- Job Type: ${job.job_type || 'Not specified'}
- Experience Level: ${job.experience_level || 'Not specified'}
- Salary Range: ${job.salary_min || 'Not specified'} - ${job.salary_max || 'Not specified'} LPA
- Keywords/Skills: ${Array.isArray(job.keywords) ? job.keywords.join(', ') : job.keywords || 'Not specified'}
- Description: ${job.description || 'Not specified'}

Current Status: This job matches only ${currentMatchCount} candidate alerts.

Suggest 3 specific changes to reach more candidates. Return ONLY the JSON object.`;

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
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return { success: false, error: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No response from Groq API' };
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', content);
      return { success: false, error: 'Invalid response format from AI' };
    }

    return { success: true, suggestions: result.suggestions || [] };
  } catch (error) {
    console.error('Groq service error:', error);
    return { success: false, error: error.message || 'Failed to generate suggestions' };
  }
}

/**
 * Generates personalized job application advice using Groq AI
 * Provides stage-specific guidance based on job requirements and user profile
 * @param {object} job - Job details (requirements, title, company, etc.)
 * @param {object} profile - User profile (skills, experience, degree, etc.)
 * @param {string} status - Current application status
 * @returns {Promise<{ success: boolean, advice?: string, error?: string }>}
 */
export async function generateApplicationStatusAdvice(job, profile, status) {
  try {
    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    const systemPrompt = `You are a career coach providing honest, personalized advice to job applicants. 
Analyze the applicant's profile against the job requirements and provide one sentence of specific, actionable advice for their current application stage.

Guidelines:
- Be honest but encouraging
- Reference specific skills, experience, or qualifications from the applicant's profile
- Provide stage-appropriate advice (e.g., follow-up timing, preparation tips, next steps)
- Keep it to one sentence, maximum 25 words
- Be specific to the industry/role when possible
- If rejected, provide constructive feedback about the gap

Examples by stage:
- submitted: "Your marine engineering background aligns well; consider following up after 5 business days."
- under_review: "Highlight your CAD certification in any follow-up communications."
- interviewing: "Prepare specific examples of your project management experience from your profile."
- rejected: "The role requires 5+ years; your 2 years of experience is the gap."
- offered: "Your skills match 90% of requirements; negotiate based on the salary range provided.`;

    const userPrompt = `Job Details:
- Title: ${job.title || 'Not specified'}
- Company: ${job.company_name || 'Not specified'}
- Requirements: ${job.requirements || job.description || 'Not specified'}
- Skills Required: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || 'Not specified'}
- Experience Level: ${job.experience_level || 'Not specified'}

Applicant Profile:
- Degree: ${profile.degree || 'Not specified'}
- Field of Study: ${profile.field_of_study || profile.branch || 'Not specified'}
- Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || 'Not specified'}
- Experience: ${profile.years_of_experience || profile.experience || 'Not specified'} years
- Previous Roles: ${profile.previous_roles || profile.work_experience || 'Not specified'}

Current Application Status: ${status}

Provide one sentence of honest, personalized advice for this stage. Be specific about their qualifications.`;

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
        temperature: 0.4,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return { success: false, error: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    const advice = data.choices?.[0]?.message?.content?.trim();

    if (!advice) {
      return { success: false, error: 'No response from Groq API' };
    }

    return { success: true, advice };
  } catch (error) {
    console.error('Groq service error:', error);
    return { success: false, error: error.message || 'Failed to generate advice' };
  }
}

/**
 * Generates career coaching insights for rejected job applications
 * Analyzes gaps and suggests improvements and alternative roles
 * @param {object} job - Job details (requirements, title, company, etc.)
 * @param {object} profile - User profile (skills, experience, degree, etc.)
 * @param {object} application - Application data (status, resume, etc.)
 * @returns {Promise<{ success: boolean, insights?: object, error?: string }>}
 */
export async function generateRejectionInsights(job, profile, application) {
  try {
    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    const systemPrompt = `You are a supportive career coach helping a job applicant learn from a rejection. 
Your goal is to provide constructive, actionable feedback that helps them grow — not criticism.

Analyze the job requirements against the applicant's profile and provide insights in this exact JSON format:
{
  "gap_analysis": "One sentence explaining what specific gap (skill, experience, or qualification) made them less competitive for this specific role. Be specific and encouraging.",
  "next_steps": [
    "First specific action: e.g., 'Complete a certification in [specific skill] within 3 months'",
    "Second specific action: e.g., 'Build a portfolio project demonstrating [relevant capability]'"
  ],
  "similar_roles": [
    "Alternative job title 1 that better matches their current profile",
    "Alternative job title 2 that is a stepping stone to their goal"
  ]
}

Guidelines:
- gap_analysis: Be honest but kind. Focus on one specific gap, not general inadequacy.
- next_steps: Give 2 concrete, time-bound actions. Make them specific to their field.
- similar_roles: Suggest 2 job titles they should target now. These should be realistic next steps.
- Frame everything as coaching, not rejection.
- Keep the tone encouraging and forward-looking.`;

    const userPrompt = `Job Details:
- Title: ${job.title || 'Not specified'}
- Company: ${job.company_name || 'Not specified'}
- Requirements: ${job.requirements || job.description || 'Not specified'}
- Required Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || 'Not specified'}
- Experience Level Required: ${job.experience_level || 'Not specified'}
- Industry: ${job.industry || 'Not specified'}

Applicant Profile:
- Degree: ${profile.degree || 'Not specified'}
- Field of Study: ${profile.field_of_study || profile.branch || 'Not specified'}
- Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || 'Not specified'}
- Years of Experience: ${profile.years_of_experience || profile.experience || 'Not specified'}
- Previous Roles: ${profile.previous_roles || profile.work_experience || 'Not specified'}

Application Data:
- Applied: ${application.created_at ? new Date(application.created_at).toLocaleDateString() : 'Not specified'}
- Status: ${application.status || 'rejected'}

The application was not selected. As a career coach, provide insights to help them improve and find better-fitting roles.

Return ONLY the JSON object with no additional text.`;

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
        temperature: 0.4,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return { success: false, error: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No response from Groq API' };
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', content);
      return { success: false, error: 'Invalid response format from AI' };
    }

    // Validate required fields
    if (!result.gap_analysis || !result.next_steps || !result.similar_roles) {
      return { success: false, error: 'Missing required fields in AI response' };
    }

    return { 
      success: true, 
      insights: {
        gap_analysis: result.gap_analysis,
        next_steps: Array.isArray(result.next_steps) ? result.next_steps : [result.next_steps],
        similar_roles: Array.isArray(result.similar_roles) ? result.similar_roles : [result.similar_roles],
      }
    };
  } catch (error) {
    console.error('Groq service error:', error);
    return { success: false, error: error.message || 'Failed to generate insights' };
  }
}

/**
 * Generates an AI ranking score and fit summary for a job applicant
 * Compares applicant profile against job requirements
 * @param {object} job - Job details (requirements, skills, experience level, etc.)
 * @param {object} applicant - Applicant profile (skills, degree, experience, graduation year)
 * @returns {Promise<{ success: boolean, score?: number, summary?: string, error?: string }>}
 */
export async function generateApplicantRanking(job, applicant) {
  try {
    if (!GROQ_API_KEY) {
      return { success: false, error: 'GROQ_API_KEY not configured' };
    }

    const systemPrompt = `You are an expert recruiter evaluating job applicants. 
Compare the applicant's qualifications against the job requirements and provide a fit score and brief summary.

Return ONLY a valid JSON object with this exact structure:
{
  "score": number between 0-100 (overall fit score),
  "summary": "exactly 10 words describing the fit"
}

Scoring guidelines:
- 90-100: Exceptional fit - all requirements met or exceeded
- 80-89: Strong fit - most requirements met, minor gaps
- 60-79: Moderate fit - some requirements met, noticeable gaps
- 40-59: Weak fit - few requirements met, significant gaps
- 0-39: Poor fit - does not meet core requirements

Consider:
- Required skills match
- Experience level alignment
- Education relevance
- Industry/domain knowledge
- Overall profile strength

Summary should be exactly 10 words describing the fit (e.g., "Strong technical skills match, lacks leadership experience required")`;

    const userPrompt = `Job Details:
- Title: ${job.title || 'Not specified'}
- Requirements: ${job.requirements || job.description || 'Not specified'}
- Required Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || 'Not specified'}
- Experience Level Required: ${job.experience_level || 'Not specified'}
- Industry: ${job.industry || 'Not specified'}
- Location: ${job.location || 'Not specified'}

Applicant Profile:
- Name: ${applicant.full_name || 'Not specified'}
- Degree: ${applicant.degree || 'Not specified'}
- Field of Study: ${applicant.field_of_study || applicant.branch || 'Not specified'}
- Skills: ${Array.isArray(applicant.skills) ? applicant.skills.join(', ') : applicant.skills || 'Not specified'}
- Years of Experience: ${applicant.years_of_experience || applicant.experience || 0}
- Work Experience: ${applicant.work_experience || applicant.previous_roles || 'Not specified'}
- Graduation Year: ${applicant.graduation_year || applicant.expected_graduation_year || 'Not specified'}

Evaluate this applicant against the job requirements.
Return ONLY the JSON object with score and summary.`;

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
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return { success: false, error: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No response from Groq API' };
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', content);
      return { success: false, error: 'Invalid response format from AI' };
    }

    // Validate score
    const score = parseInt(result.score);
    if (isNaN(score) || score < 0 || score > 100) {
      return { success: false, error: 'Invalid score from AI' };
    }

    // Validate summary exists
    if (!result.summary || typeof result.summary !== 'string') {
      return { success: false, error: 'Missing summary from AI' };
    }

    return { 
      success: true, 
      score: score,
      summary: result.summary.trim()
    };
  } catch (error) {
    console.error('Groq service error:', error);
    return { success: false, error: error.message || 'Failed to generate ranking' };
  }
}

export default {
  generateJobAlertSuggestions,
  generateAlertHealthSuggestions,
  generateJobImprovementSuggestions,
  generateApplicationStatusAdvice,
  generateRejectionInsights,
  generateApplicantRanking,
};
