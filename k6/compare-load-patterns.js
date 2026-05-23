/**
 * Load Pattern Comparison Test
 * 
 * Compares Gradual Load vs Spike Load patterns
 * to understand system behavior under different conditions.
 * 
 * Run: k6 run compare-load-patterns.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const gradualErrorRate = new Rate('gradual_errors');
const spikeErrorRate = new Rate('spike_errors');
const gradualLoginTime = new Trend('gradual_login_time');
const spikeLoginTime = new Trend('spike_login_time');

export const options = {
  scenarios: {
    // Scenario A: Gradual Ramp-Up (Predictable)
    gradual_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 },   // Slow ramp
        { duration: '3m', target: 1000 },   // Sustain
        { duration: '2m', target: 2000 },   // Increase
        { duration: '3m', target: 2000 },   // Sustain
        { duration: '2m', target: 3000 },   // Peak
        { duration: '2m', target: 3000 },   // Sustain peak
        { duration: '1m', target: 0 },      // Ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'gradualScenario',
    },
    
    // Scenario B: Sudden Spike (Unexpected)
    spike_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },    // Baseline
        { duration: '30s', target: 3000 },  // SUDDEN SPIKE!
        { duration: '5m', target: 3000 },   // Sustain spike
        { duration: '30s', target: 100 },   // Sudden drop
        { duration: '2m', target: 100 },    // Recovery
        { duration: '1m', target: 0 },      // End
      ],
      gracefulRampDown: '30s',
      startTime: '16m',  // Run after gradual completes
      exec: 'spikeScenario',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    gradual_errors: ['rate<0.05'],
    spike_errors: ['rate<0.15'],  // Allow higher errors during spike
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

// Helper: Perform login
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
  
  const success = check(response, {
    'login responds': (r) => r.status !== 0,
    'login not timeout': (r) => r.timings.waiting < 10000,
  });
  
  return {
    success,
    duration: Date.now() - start,
    status: response.status,
  };
}

// Generate test user
function getTestUser(vuId) {
  return {
    email: `testuser${vuId % 10000}@alumni-test.edu`,
    password: `TestPass${vuId % 10000}@2024`,
  };
}

// Scenario A: Gradual Load
export function gradualScenario() {
  group('Gradual Load - Login Flow', () => {
    const user = getTestUser(__VU);
    const result = performLogin(user);
    
    gradualLoginTime.add(result.duration);
    gradualErrorRate.add(!result.success);
    
    if (result.success) {
      sleep(Math.random() * 2 + 1);
    }
  });
}

// Scenario B: Spike Load
export function spikeScenario() {
  group('Spike Load - Login Flow', () => {
    const user = getTestUser(__VU);
    const result = performLogin(user);
    
    spikeLoginTime.add(result.duration);
    spikeErrorRate.add(!result.success);
    
    // Shorter sleep during spike to maintain pressure
    if (result.success) {
      sleep(Math.random() * 1 + 0.5);
    }
  });
}

export function handleSummary(data) {
  const gradual = data.metrics.gradual_login_time?.values || {};
  const spike = data.metrics.spike_login_time?.values || {};
  
  const comparison = {
    comparison: {
      timestamp: new Date().toISOString(),
      scenarios: {
        gradual: {
          avg_response: gradual.avg?.toFixed(2) || 'N/A',
          p95_response: gradual['p(95)']?.toFixed(2) || 'N/A',
          p99_response: gradual['p(99)']?.toFixed(2) || 'N/A',
          error_rate: (data.metrics.gradual_errors?.values?.rate * 100)?.toFixed(2) || '0',
        },
        spike: {
          avg_response: spike.avg?.toFixed(2) || 'N/A',
          p95_response: spike['p(95)']?.toFixed(2) || 'N/A',
          p99_response: spike['p(99)']?.toFixed(2) || 'N/A',
          error_rate: (data.metrics.spike_errors?.values?.rate * 100)?.toFixed(2) || '0',
        },
      },
      analysis: {
        winner: gradual['p(95)'] < spike['p(95)'] ? 'gradual' : 'spike',
        recommendation: spike['p(95)'] > 5000 
          ? 'System cannot handle sudden spikes. Implement rate limiting or auto-scaling.'
          : 'System handles both patterns reasonably well.',
      },
    },
  };
  
  return {
    'stdout': JSON.stringify(comparison, null, 2),
    './k6/results/load-pattern-comparison.json': JSON.stringify(comparison, null, 2),
  };
}
