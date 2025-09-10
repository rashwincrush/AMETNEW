import { supabase } from '../utils/supabase';

const PROVIDERS = ['linkedin', 'github', 'x', 'website'];

export async function loadProfileSocialLinks(profileId) {
  try {
    const { data, error } = await supabase
      .from('profile_social_links')
      .select('social_links')
      .eq('id', profileId)
      .single();

    if (!error && data && data.social_links && typeof data.social_links === 'object') {
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

    const links = {};
    (rows || []).forEach((r) => {
      const type = (r.type || '').toLowerCase();
      if (type === 'twitter') {
        links['x'] = r.url; // historical support
      } else if (PROVIDERS.includes(type)) {
        links[type] = r.url;
      }
    });
    return links;
  } catch (e) {
    console.warn('Failed to load social links:', e);
    return {};
  }
}

export async function saveProfileSocialLinks(profileId, links) {
  const normalized = {};
  PROVIDERS.forEach((k) => {
    const v = links && links[k];
    if (typeof v === 'string') {
      const trimmed = v.trim();
      normalized[k] = trimmed ? trimmed : null;
    } else {
      normalized[k] = v ?? null;
    }
  });

  for (const key of PROVIDERS) {
    try {
      const { error: delErr } = await supabase
        .from('social_links')
        .delete()
        .eq('profile_id', profileId)
        .eq('type', key);
      if (delErr) {
        console.warn('Delete social link failed', key, delErr);
      }

      const url = normalized[key];
      if (url) {
        const { error: insErr } = await supabase
          .from('social_links')
          .insert([{ profile_id: profileId, type: key, url }]);
        if (insErr) throw insErr;
      }
    } catch (e) {
      console.error(`Failed to upsert social link for ${key}:`, e);
      throw e;
    }
  }
}
