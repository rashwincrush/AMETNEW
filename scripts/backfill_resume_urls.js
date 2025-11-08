#!/usr/bin/env node
/*
Backfill job_applications.resume_url to public URLs when legacy rows store storage paths.
Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env (service key to bypass RLS for updates).
*/

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const batchSize = 200;
  let updated = 0;
  let offset = 0;

  console.log('Scanning job_applications for legacy resume paths...');

  while (true) {
    const { data: rows, error } = await supabase
      .from('job_applications')
      .select('id, applicant_id, resume_url')
      .not('resume_url', 'is', null)
      .not('resume_url', 'ilike', 'http%')
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const path = row.resume_url; // storage path
      try {
        const { data: pub } = supabase.storage.from('resumes').getPublicUrl(path);
        const publicUrl = pub?.publicUrl;
        if (!publicUrl) {
          console.warn('No public URL resolved for path:', path, 'row:', row.id);
          continue;
        }

        // Optional: verify object exists by attempting to create a short signed URL
        const { data: signed, error: signErr } = await supabase.storage.from('resumes').createSignedUrl(path, 60);
        if (signErr) {
          console.warn('Skipping missing object:', path, 'row:', row.id, signErr.message);
          continue;
        }

        const { error: upErr } = await supabase
          .from('job_applications')
          .update({ resume_url: publicUrl })
          .eq('id', row.id);
        if (upErr) throw upErr;
        updated += 1;
        console.log('Updated application', row.id);
      } catch (e) {
        console.error('Failed to update row', row.id, e.message);
      }
    }

    offset += rows.length;
  }

  console.log('Backfill completed. Updated rows:', updated);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
