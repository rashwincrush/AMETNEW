/**
 * Stress Test - Find the breaking point
 * 
 * Purpose: Determine maximum capacity before failure
 * Duration: ~15 minutes
 * Users: 100-500 virtual users
 * 
 * Run: k6 run stress-test.js
 * Warning: This may temporarily overload your Supabase instance
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const successCounter = new Counter('successful_requests');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Normal load
    { duration: '5m', target: 100 },   // Sustain
    { duration: '2m', target: 200 },   // Increase
    { duration: '5m', target: 200 },   // Sustain
    { duration: '2m', target: 300 },   // Push further
    { duration: '5m', target: 300 },   // Sustain
    { duration: '2m', target: 500 },   // Maximum load
    { duration: '2m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Under stress, allow up to 2s
    errors: ['rate<0.20'],             // Up to 20% errors acceptable under stress
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
  // Multiple concurrent requests to stress the system
  const requests = [
    {
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/jobs?select=*&limit=50`,
    },
    {
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/jobs?select=id,title,company_name&order=created_at.desc&limit=20`,
    },
    {
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/job_applications?select=status,count&groupby=status`,
    },
  ];

  const responses = http.batch(requests.map(req => ({
    method: req.method,
    url: req.url,
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
  })));

  responses.forEach((res, i) => {
    const success = check(res, {
      [`Request ${i + 1} succeeded`]: (r) => r.status === 200,
      [`Request ${i + 1} under 2s`]: (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);
    if (success) {
      successCounter.add(1);
    }
  });

  // Random sleep to simulate realistic traffic patterns
  sleep(Math.random() * 2);
}
