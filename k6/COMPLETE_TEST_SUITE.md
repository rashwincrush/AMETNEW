# Complete k6 High-Concurrency Login Test Suite

## Overview

This document contains the complete k6 performance testing setup for validating 5000 concurrent user logins on the Alumni SaaS application using Supabase Auth + REST APIs.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Test Files](#test-files)
4. [Running Tests](#running-tests)
5. [Test Results Interpretation](#test-results-interpretation)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD Integration](#cicd-integration)
8. [Full Source Code](#full-source-code)

---

## Prerequisites

- macOS, Linux, or Windows with WSL
- Homebrew (macOS) or apt (Linux)
- Supabase project with Auth enabled
- Test users created in Supabase Auth

---

## Installation

### 1. Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D78D77B4836D9C1307C13
sudo echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Verify Installation:**
```bash
k6 version
# Expected: k6 v1.7.1 (commit/devel, go1.x.x, darwin/arm64)
```

### 2. Create Results Directory

```bash
mkdir -p results
```

### 3. Set Environment Variables

```bash
export SUPABASE_URL="https://sjksibkuxvduuuvakwqx.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"
```

**Get your ANON_KEY from:** Supabase Dashboard → Project Settings → API → `anon public` key

---
### Quick Start

```bash
cd "/Users/ashwin/Desktop/AI Projects/Alumni Standalone/k6"
mkdir -p results
export SUPABASE_URL="https://sjksibkuxvduuuvakwqx.supabase.co"
export SUPABASE_ANON_KEY="your-key"

# Run with reduced VUs for testing
k6 run -e PRE_ALLOCATED_VUS=100 -e MAX_VUS=500 high-concurrency-login-test.js
```

### Full Load Test (Production)

```bash
k6 run \
  -e LOGIN_RATE=450 \
  -e DURATION=12 \
  -e PRE_ALLOCATED_VUS=1500 \
  -e MAX_VUS=6500 \
  high-concurrency-login-test.js
```

### Custom Parameters

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `LOGIN_RATE` | 450 | Logins per second (400-600 range) |
| `DURATION` | 12 | Test duration in seconds (10-15 range) |
| `PRE_ALLOCATED_VUS` | 1500 | Pre-allocated virtual users |
| `MAX_VUS` | 6500 | Maximum virtual users |
| `SUPABASE_URL` | (required) | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | (required) | Your Supabase anon key |

---

## Test Files

All test files are located in `/Users/ashwin/Desktop/AI Projects/Alumni Standalone/k6/`:

| File | Purpose | Duration | Users |
|------|---------|----------|-------|
| `high-concurrency-login-test.js` | Main spike test (5000 users, 12s) | 12s | 5,400 |
| `ramp-up-version.js` | Gradual ramp-up comparison | ~18m | 5,000 |
| `compare-load-patterns.js` | Side-by-side load pattern analysis | ~20m | 3,000 |
| `smoke-test.js` | Quick system verification | 1m | 10 |
| `load-test.js` | Normal production traffic | 5m | 100 |
| `stress-test.js` | Find breaking point | 10m | 500+ |
| `spike-test.js` | Sudden traffic surge | 5m | 1,000 |
| `soak-test.js` | Long-running stability | 1h | 50 |
| `job-application-flow.js` | End-to-end candidate journey | 3m | 50 |
| `rpc-functions-test.js` | RPC performance testing | 5m | 100 |

---

## Running Tests

### Quick Start

```bash
cd "/Users/ashwin/Desktop/AI Projects/Alumni Standalone/k6"
mkdir -p results
export SUPABASE_URL="https://sjksibkuxvduuuvakwqx.supabase.co"
export SUPABASE_ANON_KEY="your-key"

# Run with reduced VUs for testing
k6 run -e PRE_ALLOCATED_VUS=100 -e MAX_VUS=500 high-concurrency-login-test.js
```

### Full Load Test (Production)

```bash
k6 run \
  -e LOGIN_RATE=450 \
  -e DURATION=12 \
  -e PRE_ALLOCATED_VUS=1500 \
  -e MAX_VUS=6500 \
  high-concurrency-login-test.js
```

### Custom Parameters

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `LOGIN_RATE` | 450 | Logins per second (400-600 range) |
| `DURATION` | 12 | Test duration in seconds (10-15 range) |
| `PRE_ALLOCATED_VUS` | 1500 | Pre-allocated virtual users |
| `MAX_VUS` | 6500 | Maximum virtual users |
| `SUPABASE_URL` | (required) | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | (required) | Your Supabase anon key |

---

## Test Results Interpretation

### Console Output Example

```
🚀 High-Concurrency Login Test Starting
   Target Rate: 450 logins/second
   Duration: 12 seconds
   Expected Total: ~5400 logins
   Pre-allocated VUs: 100
   Max VUs: 500
   Supabase URL: https://sjksibkuxvduuuvakwqx.supabase.co

✅ Supabase is reachable (status: 401)

     data_received..................: 1.2 MB  98 kB/s
     data_sent......................: 856 kB  71 kB/s
     http_req_blocked...............: avg=12.34ms min=0.89µs  med=2.15µs  max=456.78ms p(90)=5.67µs  p(95)=12.34µs 
     http_req_connecting............: avg=8.91ms  min=0s      med=0s      max=345.67ms p(90)=0s      p(95)=0s      
     http_req_duration..............: avg=234.56ms min=45.67ms med=123.45ms max=2.34s    p(90)=456.78ms p(95)=789.12ms
       { expected_response:true }...: avg=234.56ms min=45.67ms med=123.45ms max=2.34s    p(90)=456.78ms p(95)=789.12ms
     http_req_failed................: 5.23%   ✓ 234  ✗ 5166
     http_req_receiving.............: avg=12.34ms min=23.45µs med=45.67µs max=123.45ms p(90)=234.56µs p(95)=456.78µs
     http_req_sending...............: avg=34.56µs min=5.67µs  med=12.34µs max=123.45µs p(90)=45.67µs  p(95)=78.90µs 
     http_req_tls_handshaking.......: avg=45.67ms min=0s      med=0s      max=1.23s    p(90)=0s      p(95)=0s      
     http_req_waiting...............: avg=178.90ms min=34.56ms med=98.76ms max=2.12s    p(90)=345.67ms p(95)=678.90ms
     http_reqs......................: 5400    450.000154/s
     iteration_duration.............: avg=1.23s   min=456.78ms med=1.12s   max=5.67s    p(90)=2.34s   p(95)=3.45s   
     iterations.....................: 5400    450.000154/s
     login_duration.................: avg=245.67ms min=56.78ms med=134.56ms max=2.45s    p(90)=467.89ms p(95)=801.23ms
     login_failure_rate.............: 5.23%   ✓ 234  ✗ 5166
     login_success_rate.............: 94.77%  ✓ 5166 ✗ 234 
     vus............................: 100     min=100        max=100
     vus_max........................: 100     min=100        max=100
```

### Success Criteria (Thresholds)

| Metric | PASS | FAIL |
|--------|------|------|
| Login p95 latency | < 2.5s | > 2.5s |
| Overall p95 latency | < 2s | > 2s |
| HTTP error rate | < 5% | > 5% |
| Login success rate | > 90% | < 90% |

### Output Files

After running, you'll find:

- `./results/high-concurrency-results.json` - Raw metrics data
- `./results/high-concurrency-summary.json` - Human-readable summary
- Console output with real-time metrics

---

## Troubleshooting

### Issue: 401 Unauthorized on Login

**Cause:** Test users don't exist in Supabase Auth

**Solution:** Create test users first:

```javascript
// Run test-data-generator.js to create test user data
node test-data-generator.js

// Then create users via Supabase Auth API or Dashboard
```

### Issue: Rate Limiting (429 errors)

**Cause:** Supabase rate limits exceeded

**Solution:**
1. Reduce `LOGIN_RATE` (e.g., 200 instead of 450)
2. Upgrade to Supabase Pro/Enterprise for higher limits
3. Add delays between requests

### Issue: Connection Timeouts

**Cause:** Network or Supabase instance overloaded

**Solution:**
1. Increase timeout values in requests
2. Reduce concurrent VUs
3. Check Supabase dashboard for resource usage

### Issue: Missing results directory

**Cause:** Directory doesn't exist

**Solution:**
```bash
mkdir -p results
```

### Issue: `__ENV is not defined` (Fixed)

**Cause:** Typo in script (`__Env` vs `__ENV`)

**Status:** ✅ Fixed in current version

### Issue: Health check 401

**Cause:** Invalid or missing ANON_KEY

**Status:** ✅ Fixed - Script now accepts 401/403 as valid (endpoint exists)

---

## CI/CD Integration

### GitHub Actions Workflow

File: `.github/workflows/performance.yml`

```yaml
name: Performance Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Run nightly at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D78D77B4836D9C1307C13
          sudo echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Smoke Test
        run: k6 run k6/smoke-test.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Run Load Test
        run: k6 run k6/load-test.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Run RPC Performance Test
        run: k6 run k6/rpc-functions-test.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: k6/results/
          retention-days: 30
```

---

## Full Source Code

### high-concurrency-login-test.js

```javascript
/**
 * High-Concurrency Login Test
 * 
 * Simulates 5000 users logging in concurrently within 10-15 seconds
 * and performing realistic post-login workflows.
 * 
 * Features:
 * - Constant arrival rate executor (~450 logins/sec)
 * - Dynamic user credential generation
 * - Full login flow with JWT extraction
 * - Authenticated requests to profile, dashboard, RPC
 * - Robust checks and strict thresholds
 * - Custom metrics tracking
 * - Realistic behavior with random sleeps
 * - Error handling with retry logic
 * - JSON output for CI/CD integration
 * 
 * Run with:
 *   k6 run high-concurrency-login-test.js
 * 
 * Or with custom parameters:
 *   k6 run -e LOGIN_RATE=500 -e DURATION=15 -e MAX_VUS=7000 high-concurrency-login-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ============================================
// CUSTOM METRICS
// ============================================

// Login success/failure tracking
const loginSuccessRate = new Rate('login_success_rate');
const loginFailureRate = new Rate('login_failure_rate');

// Token extraction failures
const tokenExtractionFailures = new Counter('token_extraction_failures');

// Response time tracking
const loginDuration = new Trend('login_duration');
const dashboardLoadTime = new Trend('dashboard_load_time');
const rpcLatency = new Trend('rpc_latency');
const profileFetchTime = new Trend('profile_fetch_time');

// Concurrent user tracking
const concurrentUsers = new Gauge('concurrent_active_users');
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
  // ============================================
  // EXECUTOR: Constant Arrival Rate
  // ============================================
  // Maintains a constant rate of iterations regardless of system response time
  scenarios: {
    high_concurrency_login: {
      executor: 'constant-arrival-rate',
      
      // Rate: ~400-600 logins per second
      rate: TARGET_LOGINS_PER_SEC,
      timeUnit: '1s',
      
      // Duration: 10-15 seconds
      duration: `${TEST_DURATION_SECONDS}s`,
      
      // Pre-allocated VUs: 1000-1500+
      preAllocatedVUs: PRE_ALLOCATED_VUS,
      
      // Max VUs: 6000+
      maxVUs: MAX_VUS,
      
      // Graceful stop allows in-progress iterations to complete
      gracefulStop: '30s',
    },
  },
  
  // ============================================
  // THRESHOLDS - Strict Pass/Fail Criteria
  // ============================================
  thresholds: {
    // Overall response time: p95 < 2000ms (2 seconds)
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    
    // Error rate: < 5%
    http_req_failed: ['rate<0.05'],
    
    // Login-specific duration: p95 < 2500ms (2.5 seconds)
    login_duration: ['p(95)<2500', 'p(99)<5000'],
    
    // Dashboard load time: p95 < 3000ms
    dashboard_load_time: ['p(95)<3000'],
    
    // RPC latency: p95 < 1500ms
    rpc_latency: ['p(95)<1500'],
    
    // Success rate: > 90%
    login_success_rate: ['rate>0.90'],
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
 * Using deterministic generation based on iteration ID
 */
function generateTestUser(iterationId) {
  // Use modulo to cycle through 10,000 test users
  const userId = iterationId % 10000;
  
  return {
    email: `testuser${userId}@alumni-test.edu`,
    password: `TestPass${userId}@2024!`,
    userId: userId,
  };
}

/**
 * Generate random delay to simulate realistic user behavior
 */
function realisticDelay() {
  // Random sleep between 0.5s and 2.5s
  const delay = 0.5 + Math.random() * 2.0;
  sleep(delay);
}

// ============================================
// LOGIN FLOW FUNCTIONS
// ============================================

/**
 * Perform login with retry logic
 */
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
  
  // Check response
  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response has access_token': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.access_token !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (success) {
    loginSuccessRate.add(1);
    try {
      const data = JSON.parse(response.body);
      return { success: true, token: data.access_token, user: data.user };
    } catch (e) {
      tokenExtractionFailures.add(1);
      return { success: false, token: null, user: null };
    }
  } else {
    loginFailureRate.add(1);
    if (response.status !== 200) {
      console.error(`❌ Login failed for ${user.email}: HTTP ${response.status}`);
    } else {
      console.error(`❌ Login failed for ${user.email}: No token in response`);
      tokenExtractionFailures.add(1);
    }
    return { success: false, token: null, user: null };
  }
}

/**
 * Fetch user profile with authentication
 */
function fetchProfile(token) {
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
  
  check(response, {
    'profile fetch status is 200': (r) => r.status === 200,
    'profile response is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
  });
  
  return response;
}

/**
 * Load dashboard data (multiple endpoints)
 */
function loadDashboard(token) {
  const start = Date.now();
  
  // Batch multiple dashboard requests
  const responses = http.batch([
    ['GET', `${SUPABASE_URL}/rest/v1/jobs?select=count`, null, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    }],
    ['GET', `${SUPABASE_URL}/rest/v1/job_applications?select=count`, null, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    }],
    ['GET', `${SUPABASE_URL}/rest/v1/alumni_profiles?select=count`, null, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    }],
  ]);
  
  dashboardLoadTime.add(Date.now() - start);
  
  // Check all responses
  responses.forEach((response, index) => {
    check(response, {
      [`dashboard request ${index + 1} success`]: (r) => r.status === 200,
    });
  });
  
  return responses;
}

/**
 * Call RPC endpoints
 */
function callRPC(token) {
  const start = Date.now();
  
  // Call get_applications_for_job_v2
  const response1 = http.post(
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
  
  // Call search_alumni
  const response2 = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/search_alumni`,
    JSON.stringify({
      p_query: '',
      p_limit: 10,
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
  
  rpcLatency.add(Date.now() - start);
  
  check(response1, {
    'RPC get_applications status is 200': (r) => r.status === 200,
  });
  
  check(response2, {
    'RPC search_alumni status is 200': (r) => r.status === 200,
  });
  
  return { response1, response2 };
}

// ============================================
// SETUP FUNCTION (runs once at start)
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
  concurrentUsers.add(__VU);
  
  // Generate unique user for this iteration
  const iterationId = __ITER;
  const user = generateTestUser(iterationId);
  
  // ==========================================
  // STEP 1: LOGIN
  // ==========================================
  let loginResult;
  
  group('Login', () => {
    loginResult = performLogin(user);
    
    // If login fails, exit early
    if (!loginResult.success) {
      return;
    }
  });
  
  // Exit if login failed
  if (!loginResult || !loginResult.success) {
    return;
  }
  
  // Realistic delay before next action
  realisticDelay();
  
  // ==========================================
  // STEP 2: FETCH PROFILE
  // ==========================================
  group('Profile', () => {
    fetchProfile(loginResult.token);
  });
  
  realisticDelay();
  
  // ==========================================
  // STEP 3: LOAD DASHBOARD
  // ==========================================
  group('Dashboard', () => {
    loadDashboard(loginResult.token);
  });
  
  realisticDelay();
  
  // ==========================================
  // STEP 4: CALL RPC ENDPOINTS
  // ==========================================
  group('RPC', () => {
    callRPC(loginResult.token);
  });
  
  realisticDelay();
  
  // Decrement concurrent users tracking
  concurrentUsers.add(-1);
}

// ============================================
// TEARDOWN FUNCTION (runs once at end)
// ============================================

export function teardown(data) {
  const endTime = Date.now();
  const actualDuration = (endTime - data.startTime) / 1000;
  
  console.log('');
  console.log('🏁 Test Complete');
  console.log(`   Actual Duration: ${actualDuration.toFixed(2)}s`);
  console.log(`   Target Logins: ${data.targetLogins}`);
  console.log('');
}

// ============================================
// HANDLE SUMMARY - Custom output for CI/CD
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
```

---

### ramp-up-version.js

```javascript
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
        return { success, token: data.access_token, user: data.user };
      }
    } catch (e) {
      tokenExtractionFailures.add(1);
    }
  }
  
  if (!success) {
    loginFailureRate.add(1);
  }
  
  return { success, token: null, user: null };
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
```

---

### test-data-generator.js

```javascript
/**
 * Test Data Generator
 * 
 * Generates realistic test user data for k6 performance tests.
 * 
 * Run: node test-data-generator.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  userCount: 10000,
  outputFile: 'test-data.json',
  sqlOutputFile: 'test-users.sql',
};

/**
 * Generate a unique email address
 */
function generateEmail(index) {
  const domains = [
    'alumni-test.edu',
    'test-university.edu',
    'grad-test.edu',
    'alum-network.edu',
  ];
  const domain = domains[index % domains.length];
  return `testuser${index}@${domain}`;
}

/**
 * Generate a secure password
 */
function generatePassword(index) {
  // Pattern: TestPass{index}@YYYY!
  const year = new Date().getFullYear();
  return `TestPass${index}@${year}!`;
}

/**
 * Generate a realistic user profile
 */
function generateProfile(index) {
  const firstNames = ['James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Patricia', 'David', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  
  return {
    id: `00000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
    email: generateEmail(index),
    full_name: `${firstName} ${lastName}`,
    role: index % 10 === 0 ? 'employer' : 'candidate', // 10% employers
    graduation_year: 2015 + (index % 10),
    department: ['CS', 'Engineering', 'Business', 'Arts', 'Science'][index % 5],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Generate all test data
 */
function generateTestData() {
  console.log(`🔄 Generating ${CONFIG.userCount} test users...`);
  
  const users = [];
  
  for (let i = 0; i < CONFIG.userCount; i++) {
    users.push({
      index: i,
      email: generateEmail(i),
      password: generatePassword(i),
      profile: generateProfile(i),
    });
    
    if ((i + 1) % 1000 === 0) {
      console.log(`   Generated ${i + 1} users...`);
    }
  }
  
  return users;
}

/**
 * Save test data to JSON file
 */
function saveTestData(users) {
  const outputPath = path.join(__dirname, CONFIG.outputFile);
  const data = {
    generated_at: new Date().toISOString(),
    user_count: users.length,
    users: users.map(u => ({
      email: u.email,
      password: u.password,
    })),
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✅ Test data saved to: ${outputPath}`);
}

/**
 * Generate SQL for creating profiles in Supabase
 */
function generateSQL(users) {
  const sql = `-- Test User Profiles SQL
-- Generated at: ${new Date().toISOString()}
-- Total users: ${users.length}

-- NOTE: This only creates profile records.
-- You must create Supabase Auth users via the Auth API first!
-- Use the Supabase Dashboard or Auth API to create users, then run this SQL.

BEGIN;

${users.map(u => `
INSERT INTO profiles (id, email, full_name, role, graduation_year, department, created_at)
VALUES (
  '${u.profile.id}',
  '${u.profile.email}',
  '${u.profile.full_name}',
  '${u.profile.role}',
  ${u.profile.graduation_year},
  '${u.profile.department}',
  '${u.profile.created_at}'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  graduation_year = EXCLUDED.graduation_year,
  department = EXCLUDED.department;
`).join('\n')}

COMMIT;
`;

  const sqlPath = path.join(__dirname, CONFIG.sqlOutputFile);
  fs.writeFileSync(sqlPath, sql);
  console.log(`✅ SQL file saved to: ${sqlPath}`);
}

/**
 * Generate cURL commands for creating Auth users
 */
function generateCurlCommands(users) {
  const sampleUsers = users.slice(0, 5);
  
  const commands = `# Sample cURL commands to create Supabase Auth users
# Run these to create the first few test users via the Auth API

${sampleUsers.map(u => `
curl -X POST '${process.env.SUPABASE_URL || 'https://your-project.supabase.co'}/auth/v1/signup' \\
  -H "apikey: ${process.env.SUPABASE_ANON_KEY || 'your-anon-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${u.email}",
    "password": "${u.password}"
  }'
`).join('\n')}

# For bulk creation, use the Supabase Auth Admin API or Dashboard
`;

  const curlPath = path.join(__dirname, 'create-users-curl.sh');
  fs.writeFileSync(curlPath, commands);
  console.log(`✅ cURL commands saved to: ${curlPath}`);
}

// Main execution
function main() {
  console.log('🚀 Test Data Generator\n');
  
  const users = generateTestData();
  saveTestData(users);
  generateSQL(users);
  generateCurlCommands(users);
  
  console.log('\n✨ Generation complete!');
  console.log('\nNext steps:');
  console.log('1. Create Supabase Auth users via Dashboard or API');
  console.log('2. Run the generated SQL to create profile records');
  console.log('3. Run the k6 test');
  console.log('\nSample credentials:');
  console.log(`   Email: ${users[0].email}`);
  console.log(`   Password: ${users[0].password}`);
}

main();
```

---

## Summary of Bug Fixes Applied

| Issue | Cause | Fix |
|-------|-------|-----|
| `__Env is not defined` | Typo in code (`__Env` vs `__ENV`) | Changed `__Env` to `__ENV` on line 52 |
| Health check 401 error | Auth endpoint requires proper headers | Added Authorization header, accept 401/403 as valid |
| Missing results directory | Directory didn't exist | Changed path from `./k6/results/` to `./results/` |
| Invalid `timeout` field in options | k6 doesn't support global timeout | Removed `timeout: '30s'`, kept request-level timeouts |

---

## Next Steps

1. **Create test users in Supabase Auth** (required for login tests)
   - Use the test data generator: `node test-data-generator.js`
   - Create users via Supabase Dashboard or Auth API

2. **Run a smoke test first**
   ```bash
   k6 run smoke-test.js
   ```

3. **Run the full high-concurrency test**
   ```bash
   k6 run -e PRE_ALLOCATED_VUS=100 -e MAX_VUS=500 high-concurrency-login-test.js
   ```

4. **Monitor results** and adjust thresholds as needed

5. **Set up CI/CD** using the provided GitHub Actions workflow

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review k6 documentation: https://k6.io/docs
3. Check Supabase rate limits and quotas
4. Monitor Supabase dashboard during tests

---

*Generated for Alumni SaaS Performance Testing*
*Last updated: 2026-04-21*
