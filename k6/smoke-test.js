/**
 * Smoke Test - Quick verification that system is working
 * 
 * Purpose: Verify basic functionality before running heavier tests
 * Duration: ~1 minute
 * Users: 1-5 virtual users
 * 
 * Run: k6 run smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'],             // Error rate under 10%
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
  // Test 1: Health check - Supabase is reachable
  const healthCheck = http.get(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
  });

  const healthOk = check(healthCheck, {
    'Supabase API is reachable': (r) => r.status === 200,
  });
  errorRate.add(!healthOk);

  // Test 2: Check jobs table is accessible (public read)
  const jobsList = http.get(
    `${SUPABASE_URL}/rest/v1/jobs?select=id,title,company_name&limit=5`,
    {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    }
  );

  const jobsOk = check(jobsList, {
    'Jobs endpoint returns 200': (r) => r.status === 200,
    'Jobs data is returned': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) && data.length > 0;
      } catch (e) {
        return false;
      }
    },
  });
  errorRate.add(!jobsOk);

  // Test 3: Test RPC function exists (will fail auth but proves function exists)
  const rpcCheck = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_applications_for_job_v2`,
    JSON.stringify({ p_job_id: '00000000-0000-0000-0000-000000000000', p_limit: 1, p_offset: 0 }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    }
  );

  const rpcOk = check(rpcCheck, {
    'RPC endpoint exists': (r) => r.status === 200 || r.status === 401 || r.status === 403,
  });
  errorRate.add(!rpcOk);

  sleep(1);
}
