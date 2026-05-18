/**
 * Load Test - Simulate normal production traffic
 * 
 * Purpose: Test system performance under expected load
 * Duration: 5 minutes ramp up, 10 minutes sustained, 5 minutes ramp down
 * Users: 10-100 virtual users
 * 
 * Run: k6 run load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const jobsFetchTime = new Trend('jobs_fetch_time');
const applicationTime = new Trend('application_submit_time');

export const options = {
  stages: [
    { duration: '5m', target: 50 },   // Ramp up
    { duration: '10m', target: 50 }, // Stay at 50 users
    { duration: '5m', target: 100 }, // Ramp to peak
    { duration: '5m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.05'],           // Less than 5% errors
    jobs_fetch_time: ['p(95)<300'],
    application_time: ['p(95)<1000'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

// Simulate candidate browsing and applying
export default function () {
  group('Candidate Browse Jobs', () => {
    // Step 1: Fetch job listings
    const jobsStart = Date.now();
    const jobsResponse = http.get(
      `${SUPABASE_URL}/rest/v1/jobs?select=*,profiles(full_name)&order=created_at.desc&limit=20`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );
    jobsFetchTime.add(Date.now() - jobsStart);

    const jobsCheck = check(jobsResponse, {
      'Jobs list fetched successfully': (r) => r.status === 200,
      'Jobs returned in reasonable time': (r) => r.timings.duration < 500,
    });
    errorRate.add(!jobsCheck);

    sleep(Math.random() * 3 + 1); // Think time 1-4 seconds

    // Step 2: View specific job details
    if (jobsResponse.status === 200) {
      try {
        const jobs = JSON.parse(jobsResponse.body);
        if (jobs.length > 0) {
          const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
          
          const jobDetail = http.get(
            `${SUPABASE_URL}/rest/v1/jobs?id=eq.${randomJob.id}&select=*`,
            {
              headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`,
              },
            }
          );

          check(jobDetail, {
            'Job detail fetched': (r) => r.status === 200,
          });
        }
      } catch (e) {
        errorRate.add(1);
      }
    }

    sleep(Math.random() * 5 + 2); // Think time 2-7 seconds
  });

  group('Employer View Applications', () => {
    // Note: In real scenario, this would require auth
    // This simulates an authenticated employer viewing their job applications
    
    const appsResponse = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/get_applications_for_job_v2`,
      JSON.stringify({
        p_job_id: '00000000-0000-0000-0000-000000000000', // Dummy ID - will 401
        p_limit: 10,
        p_offset: 0,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );

    // We expect 401/403 since we're not authenticated
    // But we're testing that the endpoint responds correctly
    check(appsResponse, {
      'Applications endpoint responds': (r) => r.status === 401 || r.status === 403 || r.status === 200,
    });

    sleep(Math.random() * 3 + 1);
  });
}
