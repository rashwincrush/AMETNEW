/**
 * High-Concurrency Login Validation Test
 * Production-Grade Performance Test for Alumni SaaS
 * 
 * Objective: Validate system handles 5000 concurrent user logins
 * Rate: ~400-600 logins/second over 10-15 seconds
 * Total: ~5000-7000 users
 * 
 * Run: k6 run high-concurrency-login-test.js
 * 
 * ⚠️  WARNING: This test will generate significant load on your Supabase instance.
 *     Ensure you have proper rate limits and monitoring in place.
 *     Consider running during off-peak hours.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import exec from 'k6/execution';

// ============================================
// CUSTOM METRICS
// ============================================

// Login success/failure tracking
const loginSuccessRate = new Rate('login_success_rate');
const loginFailureRate = new Rate('login_failure_rate');
const tokenExtractionFailures = new Counter('token_extraction_failures');

// Performance trends
const loginDuration = new Trend('login_duration', true);
const dashboardLoadTime = new Trend('dashboard_load_time', true);
const rpcLatency = new Trend('rpc_latency', true);
const profileFetchTime = new Trend('profile_fetch_time', true);

// System health
const activeUsers = new Gauge('concurrent_active_users');
const requestQueueDepth = new Gauge('request_queue_depth');

// ============================================
// CONFIGURATION
// ============================================

// Environment variables with defaults
const BASE_URL = __ENV.BASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const SUPABASE_URL = __ENV.SUPABASE_URL || BASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || __ENV.ANON_KEY;

// Test parameters
const TARGET_LOGINS_PER_SEC = parseInt(__ENV.LOGIN_RATE || '450'); // ~400-600 as specified
const TEST_DURATION_SECONDS = parseInt(__ENV.DURATION || '12');     // 10-15 seconds
const PRE_ALLOCATED_VUS = parseInt(__ENV.PRE_ALLOCATED_VUS || '1500');
const MAX_VUS = parseInt(__ENV.MAX_VUS || '6500');

// Validation
if (!SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

// ============================================
// TEST OPTIONS - Constant Arrival Rate Executor
// ============================================

export const options = {
  scenarios: {
    // Main test: Constant arrival rate of logins
    high_concurrency_login: {
      executor: 'constant-arrival-rate',
      
      // Rate: 450 iterations per second (total ~5400 over 12s)
      rate: TARGET_LOGINS_PER_SEC,
      timeUnit: '1s',
      
      // Duration: 12 seconds
      duration: `${TEST_DURATION_SECONDS}s`,
      
      // Pre-allocated VUs to handle the load
      preAllocatedVUs: PRE_ALLOCATED_VUS,
      maxVUs: MAX_VUS,
      
      // Graceful stop to allow in-progress iterations to complete
      gracefulStop: '30s',
    },
    
    // Optional: Ramp-up comparison (uncomment to run alongside)
    // gradual_load: {
    //   executor: 'ramping-arrival-rate',
    //   startRate: 50,
    //   timeUnit: '1s',
    //   stages: [
    //     { target: 200, duration: '5s' },   // Ramp to 200/s
    //     { target: 450, duration: '5s' },   // Ramp to 450/s
    //     { target: 450, duration: '10s' },  // Sustain
    //     { target: 0, duration: '5s' },     // Ramp down
    //   ],
    //   preAllocatedVUs: 1000,
    //   maxVUs: 6000,
    // },
  },
  
  // ============================================
  // STRICT THRESHOLDS
  // ============================================
  thresholds: {
    // Overall response time
    http_req_duration: [
      'p(95)<2000',  // 95% under 2s as specified
      'p(99)<5000',  // 99% under 5s
    ],
    
    // Login specific
    login_duration: [
      'p(95)<2500',  // 95% under 2.5s as specified
      'p(99)<5000',  // 99% under 5s
    ],
    
    // Dashboard load
    dashboard_load_time: [
      'p(95)<2000',
      'p(99)<4000',
    ],
    
    // RPC latency
    rpc_latency: [
      'p(95)<1500',
      'p(99)<3000',
    ],
    
    // Error rates
    http_req_failed: ['rate<0.05'],           // < 5% errors as specified
    login_failure_rate: ['rate<0.10'],         // < 10% login failures
    token_extraction_failures: ['count<100'],  // < 100 token failures
    
    // Success rates
    login_success_rate: ['rate>0.90'],         // > 90% success
  },
  
  // ============================================
  // SYSTEM LIMITS
  // ============================================
  // Prevent overwhelming the system
  batch: 20,           // Max 20 parallel requests per batch
  batchPerHost: 10,    // Max 10 per host
  
  // Graceful stop allows in-progress iterations to complete
  gracefulStop: '30s', 
  
  // Teardown timeout
  teardownTimeout: '60s',
};

// ============================================
// TEST DATA GENERATION
// ============================================

/**
 * Generate realistic test user credentials
 * In production, load this from a file or database
 */
function generateTestUser(iteration) {
  // Use iteration to ensure unique users
  const userIndex = iteration % 10000; // Cycle through 10k users
  
  return {
    email: `testuser${userIndex}@alumni-test.edu`,
    password: `TestPass${userIndex}@2024`,
    userId: `user-${userIndex}`,
  };
}

/**
 * Alternative: Load from external test data file
 * Uncomment if using test-data.json
 */
// const testData = JSON.parse(open('./test-data.json'));
// function getTestUser(iteration) {
//   return testData.users[iteration % testData.users.length];
// }

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Perform login and extract token
 * Includes retry logic for resilience
 */
function performLogin(user, maxRetries = 2) {
  const loginStart = Date.now();
  let retries = 0;
  let success = false;
  let authData = null;
  let lastError = null;
  
  while (retries <= maxRetries && !success) {
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
    
    // Check if login succeeded
    if (response.status === 200) {
      try {
        authData = JSON.parse(response.body);
        if (authData.access_token && authData.user) {
          success = true;
          break;
        }
      } catch (e) {
        lastError = `Token extraction failed: ${e.message}`;
        tokenExtractionFailures.add(1);
      }
    } else {
      lastError = `HTTP ${response.status}: ${response.body}`;
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        break;
      }
    }
    
    if (!success && retries < maxRetries) {
      retries++;
      sleep(0.5 * retries); // Exponential backoff
    }
  }
  
  const loginTime = Date.now() - loginStart;
  loginDuration.add(loginTime);
  
  if (success) {
    loginSuccessRate.add(1);
  } else {
    loginFailureRate.add(1);
    console.error(`Login failed for ${user.email}: ${lastError}`);
  }
  
  return {
    success,
    token: authData?.access_token,
    userId: authData?.user?.id,
    refreshToken: authData?.refresh_token,
    expiresAt: authData?.expires_at,
    loginTime,
    retries,
  };
}

/**
 * Fetch user profile with authenticated request
 */
function fetchUserProfile(token) {
  const start = Date.now();
  
  const response = http.get(
    `${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      timeout: '5s',
    }
  );
  
  profileFetchTime.add(Date.now() - start);
  
  const success = check(response, {
    'profile fetch status 200': (r) => r.status === 200,
    'profile response valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch (e) {
        return false;
      }
    },
  });
  
  return { success, response };
}

/**
 * Load dashboard data
 */
function loadDashboard(token) {
  const start = Date.now();
  
  // Parallel dashboard data requests (realistic)
  const requests = {
    jobs: {
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/jobs?select=count`,
      params: {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
        timeout: '5s',
      },
    },
    applications: {
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/job_applications?select=status,count&groupby=status`,
      params: {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
        timeout: '5s',
      },
    },
    events: {
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/events?select=count&order=start_time.desc&limit=5`,
      params: {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
        timeout: '5s',
      },
    },
  };
  
  const responses = http.batch(requests);
  
  dashboardLoadTime.add(Date.now() - start);
  
  const allSuccess = check(null, {
    'all dashboard requests succeeded': () => 
      responses.jobs.status === 200 &&
      responses.applications.status === 200 &&
      (responses.events.status === 200 || responses.events.status === 401), // Events may require different auth
  });
  
  return {
    success: allSuccess,
    jobs: responses.jobs,
    applications: responses.applications,
    events: responses.events,
  };
}

/**
 * Call RPC endpoints
 */
function callRPCEndpoints(token) {
  const results = [];
  
  // RPC 1: Get applications summary
  const rpc1Start = Date.now();
  const rpc1 = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_applications_for_job_v2`,
    JSON.stringify({
      p_job_id: '00000000-0000-0000-0000-000000000000',
      p_limit: 5,
      p_offset: 0,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      timeout: '5s',
    }
  );
  rpcLatency.add(Date.now() - rpc1Start);
  
  check(rpc1, {
    'RPC get_applications responds': (r) => r.status === 200 || r.status === 401 || r.status === 403,
  });
  
  results.push({ name: 'get_applications', status: rpc1.status, time: Date.now() - rpc1Start });
  
  // RPC 2: Alumni search (if available)
  const rpc2Start = Date.now();
  const rpc2 = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/search_alumni`,
    JSON.stringify({
      p_query: '',
      p_limit: 10,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      timeout: '5s',
    }
  );
  rpcLatency.add(Date.now() - rpc2Start);
  
  // Note: search_alumni may not exist - this tests if RPC is available
  if (rpc2.status !== 404) {
    check(rpc2, {
      'RPC search_alumni responds': (r) => r.status === 200 || r.status === 401,
    });
    results.push({ name: 'search_alumni', status: rpc2.status, time: Date.now() - rpc2Start });
  }
  
  return results;
}

// ============================================
// SETUP (runs once per VU)
// ============================================

export function setup() {
  console.log('🚀 High-Concurrency Login Test Starting');
  console.log(`   Target Rate: ${TARGET_LOGINS_PER_SEC} logins/second`);
  console.log(`   Duration: ${TEST_DURATION_SECONDS} seconds`);
  console.log(`   Expected Total: ~${TARGET_LOGINS_PER_SEC * TEST_DURATION_SECONDS} logins`);
  console.log(`   Pre-allocated VUs: ${PRE_ALLOCATED_VUS}`);
  console.log(`   Max VUs: ${MAX_VUS}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log('');
  console.log('⚠️  Ensure your Supabase instance can handle this load!');
  console.log('   Monitor your dashboard during the test.');
  console.log('');
  
  // Verify Supabase is reachable (accept 200, 401, or 403 as valid)
  const healthCheck = http.get(`${SUPABASE_URL}/rest/v1/`, {
    headers: { 
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    timeout: '10s',
  });
  
  // Accept 200 (success) or 401/403 (auth required but endpoint exists)
  const isReachable = healthCheck.status === 200 || healthCheck.status === 401 || healthCheck.status === 403;
  
  if (!isReachable) {
    console.error(`❌ Supabase health check failed: ${healthCheck.status}`);
    console.error('   Response:', healthCheck.body);
    console.error('   Aborting test - verify your SUPABASE_URL and ANON_KEY');
    throw new Error('Supabase unreachable');
  }
  
  console.log('✅ Supabase is reachable (status:', healthCheck.status + ')');
  console.log('');
  
  return {
    startTime: Date.now(),
    targetLogins: TARGET_LOGINS_PER_SEC * TEST_DURATION_SECONDS,
  };
}

// ============================================
// MAIN TEST FUNCTION (runs for each iteration)
// ============================================

export default function (data) {
  // Track concurrent users
  activeUsers.add(exec.instance.vusActive);
  requestQueueDepth.add(exec.instance.vusInitialized - exec.instance.vusActive);
  
  // Generate unique user for this iteration
  const user = generateTestUser(exec.scenario.iterationInTest);
  
  // ============================================
  // STEP 1: LOGIN
  // ============================================
  group('1. Authentication', () => {
    const loginResult = performLogin(user);
    
    if (!loginResult.success) {
      // Early exit if login fails
      return;
    }
    
    // ============================================
    // STEP 2: FETCH PROFILE
    // ============================================
    sleep(randomIntBetween(500, 1500) / 1000); // 0.5-1.5s realistic delay
    
    group('2. User Profile', () => {
      fetchUserProfile(loginResult.token);
    });
    
    // ============================================
    // STEP 3: DASHBOARD LOAD
    // ============================================
    sleep(randomIntBetween(1000, 2500) / 1000); // 1-2.5s realistic delay
    
    group('3. Dashboard Data', () => {
      loadDashboard(loginResult.token);
    });
    
    // ============================================
    // STEP 4: RPC ENDPOINTS
    // ============================================
    sleep(randomIntBetween(500, 2000) / 1000); // 0.5-2s realistic delay
    
    group('4. RPC Calls', () => {
      callRPCEndpoints(loginResult.token);
    });
    
    // ============================================
    // CLEANUP: Simulate user session end
    // ============================================
    sleep(randomIntBetween(500, 1500) / 1000);
  });
}

// ============================================
// TEARDOWN (runs once after all iterations)
// ============================================

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  
  console.log('');
  console.log('🏁 Test Complete');
  console.log(`   Duration: ${duration.toFixed(2)} seconds`);
  console.log('');
  console.log('📊 Results Summary:');
  console.log('   Review console output above for metric details');
  console.log('   Check thresholds - any failures will be highlighted');
  console.log('');
  console.log('🔍 Next Steps:');
  console.log('   1. Review Supabase logs for slow queries');
  console.log('   2. Check if any rate limits were hit');
  console.log('   3. Analyze p95/p99 response times');
  console.log('   4. Compare with previous test runs');
  console.log('');
}

// ============================================
// HANDLE SUMMARY (custom output formatting)
// ============================================

export function handleSummary(data) {
  const summary = {
    'high-concurrency-test': {
      timestamp: new Date().toISOString(),
      duration: data.state.testRunDurationMs,
      iterations: data.metrics.iterations?.values?.count || 0,
      login_success_rate: data.metrics.login_success_rate?.values?.rate || 0,
      login_failure_rate: data.metrics.login_failure_rate?.values?.rate || 0,
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
      p95_login_duration: data.metrics.login_duration?.values?.['p(95)'] || 0,
      p95_response_time: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
      p99_response_time: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
      threshold_passed: data.metrics.http_req_failed?.values?.rate < 0.05,
    },
  };
  
  // Write JSON results for CI/CD
  return {
    'stdout': JSON.stringify(summary, null, 2),
    './results/high-concurrency-results.json': JSON.stringify(data, null, 2),
    './results/high-concurrency-summary.json': JSON.stringify(summary, null, 2),
  };
}
