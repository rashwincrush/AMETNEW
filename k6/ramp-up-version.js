/**
 * Ramp-Up Version of High-Concurrency Login Test
 * 
 * Same total load as spike test, but with gradual ramp-up.
 * Use this to compare with the spike version.
 * 
 * Run: k6 run ramp-up-version.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const loginSuccessRate = new Rate('login_success_rate');
const loginFailureRate = new Rate('login_failure_rate');
const tokenExtractionFailures = new Counter('token_extraction_failures');
const loginDuration = new Trend('login_duration');
const dashboardLoadTime = new Trend('dashboard_load_time');
const rpcLatency = new Trend('rpc_latency');

export const options = {
  scenarios: {
    // Gradual ramp to same 5000 user target
    ramp_up_login: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Phase 1: Warm-up
        { duration: '2m', target: 500 },    // Gentle start
        { duration: '2m', target: 500 },    // Stabilize
        
        // Phase 2: Gradual increase
        { duration: '3m', target: 1500 },   // Ramp to 1500
        { duration: '2m', target: 1500 },   // Stabilize
        
        // Phase 3: Target load
        { duration: '3m', target: 3000 },   // Ramp to 3000
        { duration: '2m', target: 3000 },   // Stabilize
        
        // Phase 4: Peak
        { duration: '3m', target: 5000 },   // Ramp to 5000
        { duration: '3m', target: 5000 },   // Sustain peak
        
        // Phase 5: Recovery
        { duration: '2m', target: 1000 },   // Reduce
        { duration: '1m', target: 0 },      // End
      ],
      gracefulRampDown: '30s',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    login_duration: ['p(95)<2500', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    login_success_rate: ['rate>0.90'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

function generateTestUser(vuId) {
  return {
    email: `testuser${vuId % 10000}@alumni-test.edu`,
    password: `TestPass${vuId % 10000}@2024`,
  };
}

function performLogin(user) {
  const start = Date.now();
  
  const response = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      timeout: '10s',
    }
  );
  
  const duration = Date.now() - start;
  loginDuration.add(duration);
  
  let success = false;
  if (response.status === 200) {
    try {
      const data = JSON.parse(response.body);
      if (data.access_token) {
        success = true;
        loginSuccessRate.add(1);
        return { success, token: data.access_token, duration };
      }
    } catch (e) {
      tokenExtractionFailures.add(1);
    }
  }
  
  if (!success) {
    loginFailureRate.add(1);
  }
  
  return { success, token: null, duration };
}

function fetchProfile(token) {
  const start = Date.now();
  const response = http.get(
    `${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  check(response, {
    'profile fetch success': (r) => r.status === 200,
  });
}

function loadDashboard(token) {
  const start = Date.now();
  
  const responses = http.batch([
    ['GET', `${SUPABASE_URL}/rest/v1/jobs?select=count`, null, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }],
    ['GET', `${SUPABASE_URL}/rest/v1/job_applications?select=count`, null, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }],
  ]);
  
  dashboardLoadTime.add(Date.now() - start);
}

function callRPC(token) {
  const start = Date.now();
  
  const response = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_applications_for_job_v2`,
    JSON.stringify({ p_job_id: '00000000-0000-0000-0000-000000000000', p_limit: 5, p_offset: 0 }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  rpcLatency.add(Date.now() - start);
}

export default function () {
  const user = generateTestUser(__VU);
  
  group('Login', () => {
    const loginResult = performLogin(user);
    
    if (!loginResult.success) return;
    
    sleep(Math.random() * 1 + 0.5);
    
    group('Profile', () => {
      fetchProfile(loginResult.token);
    });
    
    sleep(Math.random() * 1.5 + 0.5);
    
    group('Dashboard', () => {
      loadDashboard(loginResult.token);
    });
    
    sleep(Math.random() * 1 + 0.5);
    
    group('RPC', () => {
      callRPC(loginResult.token);
    });
    
    sleep(Math.random() * 1 + 0.5);
  });
}

export function setup() {
  console.log('🚀 Ramp-Up Version: 5000 users gradually over ~18 minutes');
  console.log('   Comparing gradual vs spike load patterns');
  console.log('');
  return { startTime: Date.now() };
}
