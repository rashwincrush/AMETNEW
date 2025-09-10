import { supabase } from '../utils/supabase';

export type SocialLinks = {
  linkedin?: string | null;
  github?: string | null;
  x?: string | null; // X (Twitter)
  website?: string | null;
};

const PROVIDERS: Array<keyof SocialLinks> = ['linkedin', 'github', 'x', 'website'];

export async function loadProfileSocialLinks(profileId: string): Promise<SocialLinks> {
  try {
    // Prefer the view if present
    const { data, error } = await supabase
      .from('profile_social_links')
      .select('social_links')
      .eq('id', profileId)
      .single();

    if (!error && data && data.social_links && typeof data.social_links === 'object') {
      const obj = data.social_links as Record<string, string>;
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

  // Fallback: read from table rows
  try {
    const { data: rows, error } = await supabase
      .from('social_links')
      .select('type, url')
      .eq('profile_id', profileId);

    if (error) throw error;

    const links: SocialLinks = {};
    (rows || []).forEach((r: any) => {
      const type = (r.type || '').toLowerCase();
      if (type === 'twitter') {
        (links as any)['x'] = r.url; // historical support
      } else if (PROVIDERS.includes(type as keyof SocialLinks)) {
        (links as any)[type] = r.url;
      }
    });
    return links;
  } catch (e) {
    console.warn('Failed to load social links:', e);
    return {};
  }
}

export async function saveProfileSocialLinks(profileId: string, links: SocialLinks): Promise<void> {
  // Normalize values (trim empty to null)
  const normalized: SocialLinks = {};
  PROVIDERS.forEach((k) => {
    const v = (links as any)[k];
    if (typeof v === 'string') {
      const trimmed = v.trim();
      normalized[k] = trimmed ? trimmed : null;
    } else {
      normalized[k] = v ?? null;
    }
  });

  // For each provider, delete existing rows then insert if value exists
  for (const key of PROVIDERS) {
    try {
      // Delete existing for this provider
      const { error: delErr } = await supabase
        .from('social_links')
        .delete()
        .eq('profile_id', profileId)
        .eq('type', key);
      if (delErr) {
        // Non-fatal
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
