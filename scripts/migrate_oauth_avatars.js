#!/usr/bin/env node
/*
Migrate OAuth-based avatar URLs (Google/LinkedIn) into the canonical `avatars` bucket.

For each profile where:
  - avatar_source = 'oauth', or
  - avatar_url starts with https://lh3.googleusercontent.com/ or https://media.licdn.com/

this script will:
  1) Download the image from the external URL.
  2) Upload it to the `avatars` storage bucket at path `${user_id}/${timestamp}.${ext}`.
  3) Call the `update_user_avatar(p_file_path)` RPC so `profiles.avatar_url` and
     metadata stay consistent.

If the external URL cannot be fetched or is not an image, the script logs a warning
and skips that user (you can then clear avatar_url manually or ask them to re-upload).

Requirements:
  - Node 18+ (for built-in global `fetch`). If you are on an older Node, install node-fetch
    and replace `globalThis.fetch` usage accordingly.
  - Environment variables:
      SUPABASE_URL
      SUPABASE_SERVICE_ROLE_KEY   (service role key; keep it secret and NEVER ship to frontend)

Usage:
  node scripts/migrate_oauth_avatars.js
*/

const { createClient } = require('@supabase/supabase-js');

async function downloadImage(url) {
  const fetchFn = (typeof fetch !== 'undefined') ? fetch : globalThis.fetch;
  if (!fetchFn) {
    throw new Error('Global fetch is not available. Use Node 18+ or polyfill with node-fetch.');
  }

  const res = await fetchFn(url, { redirect: 'follow' });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching avatar URL`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Non-image content-type: ${contentType}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('[migrate_oauth_avatars] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log('[migrate_oauth_avatars] Loading profiles with OAuth-based avatars...');

  const { data: rows, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, avatar_source, avatar_storage_bucket')
    .neq('avatar_url', null)
    .or(
      "avatar_source.eq.oauth,avatar_url.ilike.https://lh3.googleusercontent.com/%,avatar_url.ilike.https://media.licdn.com/%"
    )
    .order('full_name', { ascending: true });

  if (error) {
    console.error('[migrate_oauth_avatars] Failed to load profiles:', error.message || error);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('[migrate_oauth_avatars] No OAuth-based avatars found. Nothing to do.');
    process.exit(0);
  }

  console.log(`[migrate_oauth_avatars] Found ${rows.length} profiles to process.`);

  let migrated = 0;
  let failed = 0;

  for (const row of rows) {
    const { id, full_name, email, avatar_url } = row;
    const label = `${full_name || '(no name)'} <${email}> (${id})`;

    console.log(`\n[migrate_oauth_avatars] Processing ${label}`);

    if (!avatar_url) {
      console.log('  - Skipping: avatar_url is null');
      continue;
    }

    try {
      // 1) Download from OAuth URL
      const { buffer, contentType } = await downloadImage(avatar_url);

      // 2) Decide file extension
      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';

      const filePath = `${id}/${Date.now()}.${ext}`;

      // 3) Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: contentType || 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message || uploadError}`);
      }

      // 4) Update profile via RPC so avatar_url & metadata stay consistent
      const { error: rpcError } = await supabase.rpc('update_user_avatar', {
        p_file_path: filePath,
      });

      if (rpcError) {
        // Rollback storage upload if RPC fails
        await supabase.storage.from('avatars').remove([filePath]).catch(() => {});
        throw new Error(`update_user_avatar RPC failed: ${rpcError.message || rpcError}`);
      }

      migrated += 1;
      console.log(`  ✅ Migrated avatar to avatars/${filePath}`);
    } catch (e) {
      failed += 1;
      console.warn(`  ⚠️ Failed to migrate avatar for ${label}:`, e.message || e);
      console.warn('  You may want to clear avatar_url for this user and ask them to re-upload manually.');
    }
  }

  console.log('\n[migrate_oauth_avatars] Migration complete.');
  console.log(`  ✅ Successful migrations: ${migrated}`);
  console.log(`  ⚠️ Failed migrations: ${failed}`);
}

main().catch((e) => {
  console.error('[migrate_oauth_avatars] Fatal error:', e.message || e);
  process.exit(1);
});
