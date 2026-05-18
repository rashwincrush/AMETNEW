/**
 * Spike Test - Sudden traffic surge simulation
 * 
 * Purpose: Test how system handles sudden traffic spikes
 * Duration: ~5 minutes
 * Users: 0 → 1000 → 0 (sudden spike)
 * 
 * Run: k6 run spike-test.js
 * Use case: Job fair announcement, viral job posting
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Baseline
    { duration: '30s', target: 1000 }, // SPIKE! Sudden surge
    { duration: '3m', target: 1000 },  // Stay at peak
    { duration: '30s', target: 10 },   // Sudden drop
    { duration: '2m', target: 10 },    // Recovery period
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // Allow longer times during spike
    errors: ['rate<0.30'],             // Up to 30% errors during spike acceptable
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
  // Simulate viral job post getting many views
  const responses = http.batch([
    ['GET', `${SUPABASE_URL}/rest/v1/jobs?select=*&limit=1`, null, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }],
    ['GET', `${SUPABASE_URL}/rest/v1/jobs?select=count`, null, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }],
    ['GET', `${SUPABASE_URL}/rest/v1/profiles?select=count`, null, { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }],
  ]);

  responses.forEach((res, i) => {
    const success = check(res, {
      [`Spike request ${i + 1} responded`]: (r) => r.status !== 0, // Any response is ok during spike
      [`Spike request ${i + 1} not timeout`]: (r) => r.timings.waiting < 5000,
    });
    errorRate.add(!success);
  });

  sleep(0.5); // Minimal sleep during spike
}
