/**
 * RPC Functions Performance Test
 * 
 * Purpose: Test all critical RPC functions under load
 * Duration: 3 minutes
 * Users: 30 concurrent users
 * 
 * Run: k6 run rpc-functions-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('rpc_errors');
const rpcDuration = new Trend('rpc_duration');

export const options = {
  vus: 30,
  duration: '3m',
  thresholds: {
    rpc_duration: ['p(95)<500'],
    rpc_errors: ['rate<0.10'],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

// Test UUIDs (these are dummy IDs, functions will return errors but we test performance)
const TEST_JOB_ID = '00000000-0000-0000-0000-000000000001';
const TEST_APP_ID = '00000000-0000-0000-0000-000000000002';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  };

  // Test 1: job_apply RPC
  const start1 = Date.now();
  const jobApply = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/job_apply`,
    JSON.stringify({
      p_job_id: TEST_JOB_ID,
      p_resume_file_path: 'resumes/test.pdf',
      p_cover_letter: 'Test application',
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start1);

  // Expect 401/403 since we're not authenticated, but measure response time
  check(jobApply, {
    'job_apply responds quickly': (r) => r.timings.waiting < 500,
    'job_apply returns expected status': (r) => r.status === 401 || r.status === 403 || r.status === 200,
  });
  errorRate.add(jobApply.timings.waiting > 500);

  sleep(0.5);

  // Test 2: get_applications_for_job_v2 RPC
  const start2 = Date.now();
  const getApps = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_applications_for_job_v2`,
    JSON.stringify({
      p_job_id: TEST_JOB_ID,
      p_limit: 10,
      p_offset: 0,
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start2);

  check(getApps, {
    'get_applications_for_job_v2 responds quickly': (r) => r.timings.waiting < 500,
  });
  errorRate.add(getApps.timings.waiting > 500);

  sleep(0.5);

  // Test 3: set_application_status RPC
  const start3 = Date.now();
  const setStatus = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/set_application_status`,
    JSON.stringify({
      p_application_id: TEST_APP_ID,
      p_status: 'reviewed',
      p_notes: null,
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start3);

  check(setStatus, {
    'set_application_status responds quickly': (r) => r.timings.waiting < 500,
  });
  errorRate.add(setStatus.timings.waiting > 500);

  sleep(0.5);

  // Test 4: bulk_set_application_status RPC
  const start4 = Date.now();
  const bulkSetStatus = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/bulk_set_application_status`,
    JSON.stringify({
      p_application_ids: [TEST_APP_ID],
      p_status: 'shortlisted',
      p_notes: null,
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start4);

  check(bulkSetStatus, {
    'bulk_set_application_status responds quickly': (r) => r.timings.waiting < 500,
  });
  errorRate.add(bulkSetStatus.timings.waiting > 500);

  sleep(0.5);

  // Test 5: get_job_application_resume_path_for_viewer RPC
  const start5 = Date.now();
  const getResumePath = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_job_application_resume_path_for_viewer`,
    JSON.stringify({
      p_application_id: TEST_APP_ID,
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start5);

  check(getResumePath, {
    'get_job_application_resume_path_for_viewer responds quickly': (r) => r.timings.waiting < 500,
  });
  errorRate.add(getResumePath.timings.waiting > 500);

  sleep(0.5);

  // Test 6: send_offer_letter RPC
  const start6 = Date.now();
  const sendOffer = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/send_offer_letter`,
    JSON.stringify({
      p_application_id: TEST_APP_ID,
      p_file_path: 'offer-letters/test.pdf',
      p_file_name: 'offer.pdf',
      p_notes: 'Test offer',
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start6);

  check(sendOffer, {
    'send_offer_letter responds quickly': (r) => r.timings.waiting < 500,
  });
  errorRate.add(sendOffer.timings.waiting > 500);

  sleep(0.5);

  // Test 7: get_offer_letter_for_applicant RPC
  const start7 = Date.now();
  const getOffer = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_offer_letter_for_applicant`,
    JSON.stringify({
      p_application_id: TEST_APP_ID,
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start7);

  check(getOffer, {
    'get_offer_letter_for_applicant responds quickly': (r) => r.timings.waiting < 500,
  });
  errorRate.add(getOffer.timings.waiting > 500);

  sleep(0.5);

  // Test 8: respond_to_offer RPC
  const start8 = Date.now();
  const respondOffer = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/respond_to_offer`,
    JSON.stringify({
      p_application_id: TEST_APP_ID,
      p_response: 'accepted',
    }),
    { headers }
  );
  rpcDuration.add(Date.now() - start8);

  check(respondOffer, {
    'respond_to_offer responds quickly': (r) => r.timings.waiting < 500,
  });
  errorRate.add(respondOffer.timings.waiting > 500);

  sleep(1);
}
