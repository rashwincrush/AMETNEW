/**
 * Soak Test - Long-running stability test
 * 
 * Purpose: Detect memory leaks, connection pool exhaustion, database bloat
 * Duration: 1 hour
 * Users: 50 sustained users
 * 
 * Run: k6 run soak-test.js
 * Best run overnight or during low-traffic periods
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');

export const options = {
  stages: [
    { duration: '5m', target: 50 },     // Ramp up slowly
    { duration: '55m', target: 50 },   // Stay at 50 for 55 minutes
    { duration: '5m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],    // Consistent performance
    http_req_failed: ['rate<0.01'],      // Very low error rate
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
  // Mix of different operations to simulate realistic long-term usage
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Browse jobs
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/jobs?select=*&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );
    responseTimeTrend.add(res.timings.duration);
    errorRate.add(!check(res, { 'Browse OK': (r) => r.status === 200 }));

  } else if (scenario < 0.7) {
    // 30% - Search/filter jobs
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/jobs?location=eq.Remote&select=*&limit=5`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );
    responseTimeTrend.add(res.timings.duration);
    errorRate.add(!check(res, { 'Search OK': (r) => r.status === 200 }));

  } else if (scenario < 0.9) {
    // 20% - View job details
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/jobs?select=*,profiles(full_name)&limit=1`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );
    responseTimeTrend.add(res.timings.duration);
    errorRate.add(!check(res, { 'Details OK': (r) => r.status === 200 }));

  } else {
    // 10% - Check application counts
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/job_applications?select=status,count&groupby=status`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );
    responseTimeTrend.add(res.timings.duration);
    errorRate.add(!check(res, { 'Stats OK': (r) => r.status === 200 }));
  }

  sleep(Math.random() * 5 + 2); // 2-7 seconds between requests
}
