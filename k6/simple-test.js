/**
 * Simple Connectivity Test
 * 
 * Quick test that works with auth-required Supabase setups
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

const SUPABASE_URL = 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa3NpYmt1eHZkdXV1dmFrd3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzc3OTMsImV4cCI6MjA5MTgxMzc5M30.WgDipf1uz1eRwVDjI2hc-J80lGPtZV_eGfeahpkLw68';

export default function () {
  // Just verify Supabase is responding (any status means it's up)
  const response = http.get(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': ANON_KEY,
    },
  });

  console.log(`Status: ${response.status}`);
  console.log(`Response time: ${response.timings.waiting}ms`);
  
  check(response, {
    'Supabase responds': (r) => r.status !== 0, // Any response = alive
    'Response time < 1s': (r) => r.timings.waiting < 1000,
  });
}
