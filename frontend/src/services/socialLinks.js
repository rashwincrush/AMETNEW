import { supabase } from '../utils/supabase';

// Supported providers must mirror the DB enum/check in public.social_links
const PROVIDERS = ['linkedin', 'github', 'x', 'website', 'instagram', 'facebook'];

export async function loadProfileSocialLinks(profileId) {
  try {
    const { data, error } = await supabase
      .from('profile_social_links')
      .select('social_links')
      .eq('id', profileId)
      .single();

    if (!error && data && data.social_links && typeof data.social_links === 'object') {
      console.info('socialLinks load (view) social_links:', data.social_links);
      const obj = data.social_links;
      return {
        linkedin: obj.linkedin || null,
        github: obj.github || null,
        x: obj.x || obj.twitter || null,
        website: obj.website || null,
      };
    }
  } catch (_) {
    // fall back to direct table read
  }

  try {
    const { data: rows, error } = await supabase
      .from('social_links')
      .select('type, url')
      .eq('profile_id', profileId);

    if (error) throw error;

    console.info('socialLinks load (table) rows:', rows);
    const links = {};
    (rows || []).forEach((r) => {
      const type = (r.type || '').toLowerCase();
      // normalize historical 'twitter' to 'x'
      const normType = type === 'twitter' ? 'x' : type;
      if (PROVIDERS.includes(normType)) {
        links[normType] = r.url;
      }
    });
    return links;
  } catch (e) {
    console.warn('Failed to load social links:', e);
    return {};
  }
}

export async function saveProfileSocialLinks(profileId, links) {
  // Build rows for upsert; normalize types and URLs lightly
  const rows = [];
  const entries = Object.entries(links || {});

  const normalizeType = (t) => {
    const s = String(t || '').trim().toLowerCase();
    if (!s) return null;
    if (s === 'twitter') return 'x';
    return PROVIDERS.includes(s) ? s : null;
  };

  const normalizeUrl = (url) => {
    if (typeof url !== 'string') return null;
    let u = url.trim();
    if (!u) return null;
    if (!/^[a-z]+:\/\//i.test(u)) u = 'https://' + u;
    return u;
  };

  for (const [rawType, rawUrl] of entries) {
    const type = normalizeType(rawType);
    const url = normalizeUrl(rawUrl);
    if (!type || !url) continue; // ignore unsupported or empty
    rows.push({ profile_id: profileId, type, url });
  }

  if (rows.length === 0) return { upserted: 0 };

  // Single upsert call; rely on DB UNIQUE(profile_id,type)
  console.info('socialLinks upsert rows:', rows);
  const { error } = await supabase
    .from('social_links')
    .upsert(rows, { onConflict: 'profile_id,type' });

  if (error) {
    // Do not throw generic errors upstream; include code for UI to map toast
    const err = new Error(error.message || 'Failed to upsert social links');
    err.code = error.code;
    err.details = error.details;
    throw err;
  }
  return { upserted: rows.length };
}
