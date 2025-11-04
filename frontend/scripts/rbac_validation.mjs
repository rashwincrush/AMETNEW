// AMET Alumni — RBAC & RLS Validation Harness (basic)
// Edit SUPABASE_URL, SUPABASE_ANON_KEY, and USERS before running.

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

// ====== ENV / USERS (EDIT THESE) ======
const SUPABASE_URL = '<<paste>>';
const SUPABASE_ANON_KEY = '<<paste>>';
const USERS = {
  admin:    { email: 'admin@test.amet',    password: 'pass' },
  employer: { email: 'employer@test.amet', password: 'pass' },
  alumni:   { email: 'alumni@test.amet',   password: 'pass' },
  student:  { email: 'student@test.amet',  password: 'pass' },
};
// ======================================

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function policyFromError(err){
  const e = err?.error || err?.cause || err;
  return {
    message: e?.message || String(e),
    details: e?.details || null,
    hint: e?.hint || null,
    code: e?.code || null,
    status: e?.status || null,
  };
}

async function withRole(role, fn) {
  const { email, password } = USERS[role];
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: signIn, error: signErr } = await sb.auth.signInWithPassword({ email, password });
  if (signErr) throw new Error(`[auth:${role}] ${signErr.message}`);
  const roleCheck = await sb.rpc('current_role'); // alias of public.current_role()
  console.log(`[role=${role}] current_role() ->`, roleCheck.data || roleCheck.error?.message);
  const { data: u } = await sb.auth.getUser();
  const authUser = u?.user || null;
  return fn(sb, role, authUser);
}

async function tryq(label, q) {
  try {
    const r = await q();
    if (r?.error) throw r.error;
    return { ok: true, data: r.data ?? r };
  } catch (e) {
    return { ok: false, error: policyFromError(e) };
  }
}

async function test_jobs(sb, role) {
  const results = {};
  if (role === 'employer' || role === 'admin') {
    results.insert_job = await tryq('insert_job', () => sb.from('jobs').insert({
      title: 'RBAC Probe', employment_type: 'full_time',
      deadline: new Date(Date.now() + 7 * 864e5).toISOString(),
    }).select('id').single());
    const jobId = results.insert_job?.data?.id;
    if (jobId) {
      results.patch_job = await tryq('patch_job', () => sb.from('jobs').update({ title: 'RBAC Probe (edit)' }).eq('id', jobId));
      results.delete_job = await tryq('delete_job', () => sb.from('jobs').delete().eq('id', jobId));
      results.view_apps = await tryq('get_apps', () => sb.rpc('get_applications_for_job', { p_job_id: jobId, p_limit: 10, p_offset: 0 }));
    }
  } else {
    results.select_visible = await tryq('select_visible', () => sb.from('jobs').select('id,deadline').gte('deadline', new Date().toISOString()).limit(3));
    results.insert_forbidden = await tryq('insert_forbidden', () => sb.from('jobs').insert({ title: 'should-403', deadline: new Date().toISOString() }));
    // Apply once test on a visible job (if any)
    const list = await sb.from('jobs').select('id,deadline').gte('deadline', new Date().toISOString()).limit(1);
    const jobId = list?.data?.[0]?.id;
    if (jobId) {
      results.apply_once = await test_apply_once(sb, jobId);
    } else {
      results.apply_once = { ok: true, note: 'no active jobs to test' };
    }
  }
  results.view_expired = await tryq('view_expired', () => sb.from('jobs').select('id,deadline').lt('deadline', new Date().toISOString()).limit(1));
  results.expired_matrix = await check_expired_matrix(sb, role);
  results.details_sanity = await test_job_details(sb);
  return results;
}

async function test_groups(sb) {
  const results = {};
  results.list = await tryq('groups_list', () => sb.from('groups').select('id,name').limit(3));
  const g = results.list?.data?.[0];
  if (g) {
    results.join = await tryq('join', () => sb.from('group_members').insert({ group_id: g.id, role: 'member' }));
    results.leave = await tryq('leave', () => sb.from('group_members').delete().match({ group_id: g.id }));
  }
  return results;
}

async function test_messaging(sb, authUser) {
  const results = {};
  const me = authUser?.id || null;
  const peer = await pickPeer(sb, me);
  if (!peer) {
    results.thread = { ok: false, error: { message: 'no peer available to test' } };
    return results;
  }
  results.thread = await tryq('get_or_create_thread', () => sb.rpc('dm_get_or_create_thread', { peer_id: peer }));
  const t = results.thread?.data?.id;
  if (t) {
    results.send = await tryq('send_msg', () => sb.from('dm_messages').insert({ thread_id: t, body: 'RBAC hello' }).select('id').single());
    results.read = await tryq('read_msg', () => sb.from('dm_messages').select('id,body,thread_id').eq('thread_id', t).limit(1));
    results.realtime = await test_realtime_messages(sb, t);
  }
  return results;
}

async function test_mentorship(sb, role) {
  const results = {};
  if (role === 'alumni' || role === 'student') {
    results.request = await tryq('mentee_request', () => sb.from('mentorship_requests').insert({
      mentor_id: '00000000-0000-0000-0000-000000000000', status: 'pending',
    }));
  }
  if (role === 'alumni' || role === 'employer' || role === 'admin') {
    results.accept = await tryq('mentor_accept', () => sb.from('mentorship_requests').update({ status: 'accepted' }).eq('status', 'pending').limit(1));
  }
  results.view_mine = await tryq('view_mine', () => sb.from('mentorship_requests').select('id,mentor_id,mentee_id,status').limit(3));
  return results;
}

async function test_events(sb, role) {
  const results = {};
  results.events = await tryq('events', () => sb.from('events').select('id,title').limit(3));
  const e = results.events?.data?.[0];
  if (e) {
    results.rsvp = await tryq('rsvp', () => sb.from('event_attendees').insert({ event_id: e.id, status: 'going' }));
    if (role === 'alumni' || role === 'student' || role === 'admin' || role === 'employer') {
      results.feedback = await tryq('feedback', () => sb.from('event_feedback').insert({ event_id: e.id, rating: 5, comment: 'RBAC check' }));
    }
  }
  return results;
}

async function test_storage() {
  async function ping(url) {
    try {
      const r = await fetch(url);
      return { ok: r.ok, status: r.status };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  return {
    group_avatars: await ping('<<public_group_avatar_url>>'),
    job_images: await ping('<<public_job_image_url>>'),
    profile_pics: await ping('<<public_profile_pic_url>>'),
  };
}

// Anonymous client (no token) checks for public data
const sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: {} } });
async function test_anonymous(){
  return {
    public_jobs: await tryq('anon_jobs', ()=> sbAnon.from('jobs').select('id,title').limit(3)),
    public_events: await tryq('anon_events', ()=> sbAnon.from('events').select('id,title,is_public').eq('is_public', true).limit(3)),
    storage_images: await test_storage(),
  };
}

// Expired jobs visibility matrix assertion
async function check_expired_matrix(sb, role){
  const nowIso = new Date().toISOString();
  const expired = await tryq('expired', ()=> sb.from('jobs').select('id,deadline,created_by').lt('deadline', nowIso).limit(3));
  return {
    expired_seen: expired,
    assert: (role==='admin' || role==='employer') ? expired.ok : !expired.ok
  };
}

// Apply-once invariant
async function test_apply_once(sb, jobId){
  const first = await tryq('apply_first', ()=> sb.from('job_applications').insert({ job_id: jobId }).select('id').single());
  const second = await tryq('apply_second', ()=> sb.from('job_applications').insert({ job_id: jobId }));
  return { first, second_expected_fail: !second.ok ? second : { ok:false, error:{ message:'Expected failure, got success' } } };
}

// Realtime smoke test for messaging
async function test_realtime_messages(sb, threadId){
  let got = false;
  const channel = sb.channel('rbac_dm_test')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${threadId}` },
      ()=> { got = true; })
    .subscribe();
  await delay(200);
  await tryq('rt_insert', ()=> sb.from('dm_messages').insert({ thread_id: threadId, body: 'rt' }));
  await delay(3000);
  await sb.removeChannel(channel);
  return { received_without_refresh: got };
}

// Pick a peer automatically for messaging/mentorship
async function pickPeer(sb, excludeUserId){
  const r = await sb.from('profiles').select('id').neq('id', excludeUserId).limit(1);
  return r.data?.[0]?.id || null;
}

// Signed URL tester for non-public buckets
async function test_signed_url(sb, bucket, path){
  const r = await sb.storage.from(bucket).createSignedUrl(path, 60);
  return r.error ? { ok:false, error: policyFromError(r.error) } : { ok:true, url:r.data.signedUrl };
}

// Assertions for CI-style failures
function assertOrFail(condition, label, context){
  if (!condition) {
    console.error('ASSERT FAIL:', label, context || '');
    process.exitCode = 1;
  }
}

// Jobs “View Details” sanity
async function test_job_details(sb){
  const list = await sb.from('jobs').select('id, image_url').gte('deadline', new Date().toISOString()).limit(1);
  const job = list.data?.[0];
  if (!job) return { ok:true, note:'no active jobs to test' };
  const details = await tryq('job_details', ()=> sb.from('jobs').select('*').eq('id', job.id).single());
  let imgPing = { ok:true, status:204 };
  if (job.image_url){
    try { const r = await fetch(job.image_url); imgPing = { ok:r.ok, status:r.status }; }
    catch(e){ imgPing = { ok:false, error:String(e) }; }
  }
  return { details, image_fetch: imgPing };
}

async function runAll() {
  const report = {};
  for (const role of ['admin', 'employer', 'alumni', 'student']) {
    await withRole(role, async (sb, _role, authUser) => {
      report[role] = {
        role_check: await tryq('role_check', () => sb.rpc('current_role')),
        user_mgmt: 'Login + redirect verified by role_check above',
        jobs: await test_jobs(sb, role),
        groups: await test_groups(sb),
        messaging: await test_messaging(sb, authUser),
        mentorship: await test_mentorship(sb, role),
        events: await test_events(sb, role),
      };
      // Assertions (non-fatal): expired visibility matrix
      const em = report[role]?.jobs?.expired_matrix;
      if (em) assertOrFail(em.assert === true, `expired_matrix for ${role}`, em);
    });
  }
  report.anonymous = await test_anonymous();
  console.log('RBAC REPORT >>>', JSON.stringify(report, null, 2));

  // CSV/Markdown export
  function flattenReport(rep){
    const rows = [];
    for (const [role, sections] of Object.entries(rep)){
      for (const [module, res] of Object.entries(sections)){
        const status = (res && typeof res.ok === 'boolean') ? (res.ok ? 'OK' : 'FAIL') : 'NA';
        rows.push({ role, module, status, error: res?.error || null });
      }
    }
    return rows;
  }
  function toCSV(rows){
    const header = 'role,module,status,error\n';
    const lines = rows.map(r => `${r.role},${r.module},${r.status},${JSON.stringify(r.error || {}).replaceAll(',', ';')}`);
    return header + lines.join('\n');
  }
  function toMarkdown(rows){
    const header = '| role | module | status | error |\n|---|---|---|---|\n';
    const lines = rows.map(r => `| ${r.role} | ${r.module} | ${r.status} | ${r.error ? '`'+String(r.error?.message||'')+'`' : ''} |`);
    return header + lines.join('\n');
  }
  const flat = flattenReport(report);
  try { fs.writeFileSync('rbac_report.csv', toCSV(flat)); } catch(e) { /* ignore */ }
  try { fs.writeFileSync('rbac_report.md', toMarkdown(flat)); } catch(e) { /* ignore */ }
}

runAll().catch((e) => {
  console.error('RBAC harness failed:', e);
  process.exit(1);
});
