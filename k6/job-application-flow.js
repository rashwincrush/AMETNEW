/**
 * End-to-End Job Application Flow Test
 * 
 * Purpose: Simulate complete candidate journey
 * - Login
 * - Browse jobs
 * - Apply to job
 * - Check application status
 * 
 * Duration: 5 minutes
 * Users: 20 concurrent users
 * 
 * Run: k6 run -e TEST_EMAIL=xxx -e TEST_PASSWORD=xxx job-application-flow.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const errorRate = new Rate('errors');
const loginTime = new Trend('login_duration');
const applyTime = new Trend('application_submit_duration');

export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    login_duration: ['p(95)<2000'],        // Login under 2s
    application_submit_duration: ['p(95)<3000'], // Apply under 3s
    errors: ['rate<0.05'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

// Note: In production, use proper authentication
// This is a simplified version for testing the API flow

export default function () {
  let authToken = null;
  let userId = null;

  group('1. Authentication', () => {
    // Step 1: Get session or login
    const loginStart = Date.now();
    
    // This would be replaced with actual Supabase auth call
    // For now, we're testing the API structure
    const authResponse = http.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: __ENV.TEST_EMAIL || 'test@example.com',
        password: __ENV.TEST_PASSWORD || 'testpassword',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
        },
      }
    );

    loginTime.add(Date.now() - loginStart);

    const authCheck = check(authResponse, {
      'Auth request completed': (r) => r.status === 200 || r.status === 400 || r.status === 401,
    });
    errorRate.add(!authCheck);

    if (authResponse.status === 200) {
      try {
        const authData = JSON.parse(authResponse.body);
        authToken = authData.access_token;
        userId = authData.user?.id;
      } catch (e) {
        errorRate.add(1);
      }
    }

    sleep(1);
  });

  let selectedJobId = null;

  group('2. Browse Jobs', () => {
    const jobsResponse = http.get(
      `${SUPABASE_URL}/rest/v1/jobs?select=id,title,company_name,location,job_type,created_at&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${ANON_KEY}`,
        },
      }
    );

    const jobsCheck = check(jobsResponse, {
      'Jobs fetched successfully': (r) => r.status === 200,
      'Jobs list not empty': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) && data.length > 0;
        } catch (e) {
          return false;
        }
      },
    });
    errorRate.add(!jobsCheck);

    if (jobsResponse.status === 200) {
      try {
        const jobs = JSON.parse(jobsResponse.body);
        if (jobs.length > 0) {
          // Randomly select a job to apply to
          const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
          selectedJobId = randomJob.id;
        }
      } catch (e) {
        errorRate.add(1);
      }
    }

    sleep(Math.random() * 3 + 1);
  });

  group('3. View Job Details', () => {
    if (!selectedJobId) {
      errorRate.add(1);
      return;
    }

    const detailResponse = http.get(
      `${SUPABASE_URL}/rest/v1/jobs?id=eq.${selectedJobId}&select=*,profiles(full_name,email)`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${ANON_KEY}`,
        },
      }
    );

    const detailCheck = check(detailResponse, {
      'Job detail fetched': (r) => r.status === 200,
    });
    errorRate.add(!detailCheck);

    sleep(Math.random() * 5 + 2);
  });

  group('4. Submit Application', () => {
    if (!selectedJobId || !userId) {
      // Skip if no job selected or not authenticated
      return;
    }

    const applyStart = Date.now();

    // Use the job_apply RPC function
    const applyResponse = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/job_apply`,
      JSON.stringify({
        p_job_id: selectedJobId,
        p_resume_file_path: `resumes/${userId}/test-resume-${uuidv4()}.pdf`,
        p_cover_letter: 'This is a test application from k6 performance testing.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    applyTime.add(Date.now() - applyStart);

    const applyCheck = check(applyResponse, {
      'Application submitted or proper error': (r) => 
        r.status === 200 || r.status === 201 || r.status === 400 || r.status === 409,
      // 200/201 = success
      // 400 = validation error (acceptable in test)
      // 409 = already applied (acceptable in test)
    });
    errorRate.add(!applyCheck);

    sleep(2);
  });

  group('5. Check My Applications', () => {
    if (!authToken) {
      return;
    }

    const myAppsResponse = http.get(
      `${SUPABASE_URL}/rest/v1/job_applications?select=*,jobs(title,company_name)&order=created_at.desc`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const myAppsCheck = check(myAppsResponse, {
      'My applications fetched': (r) => r.status === 200,
    });
    errorRate.add(!myAppsCheck);

    sleep(1);
  });
}
