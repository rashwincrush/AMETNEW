export function validateLinkedIn(url) {
  try {
    const u = new URL(url);
    const host = (u.hostname || '').toLowerCase();
    const path = (u.pathname || '').toLowerCase();
    const isHttpOrHttps = u.protocol === 'https:' || u.protocol === 'http:';
    const pathOk = /^\/(in|pub|company|school)\/[A-Za-z0-9][A-Za-z0-9._%/-]*\/?$/.test(path);
    return isHttpOrHttps && host.endsWith('linkedin.com') && pathOk;
  } catch {
    return false;
  }
}

export function validateGitHub(url) {
  try {
    const u = new URL(url);
    const host = (u.hostname || '').toLowerCase();
    const path = (u.pathname || '');
    const isHttpOrHttps = u.protocol === 'https:' || u.protocol === 'http:';
    const pathOk = /^\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])(\/.*)?$/.test(path);
    return isHttpOrHttps && host.endsWith('github.com') && pathOk;
  } catch {
    return false;
  }
}

export function validateX(url) {
  try {
    const u = new URL(url);
    const host = (u.hostname || '').toLowerCase();
    const path = (u.pathname || '');
    const isHttpOrHttps = u.protocol === 'https:' || u.protocol === 'http:';
    const allowed = host.endsWith('twitter.com') || host.endsWith('x.com');
    const pathOk = /^\/[A-Za-z0-9_]{1,15}(\/.*)?$/.test(path);
    return isHttpOrHttps && allowed && pathOk;
  } catch {
    return false;
  }
}

export function validateWebsite(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function findDuplicateProvider(links) {
  if (!links) return null;
  const entries = Object.entries(links).filter(([_, v]) => !!v);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (String(entries[i][1]).trim().toLowerCase() === String(entries[j][1]).trim().toLowerCase()) {
        return { duplicate: true, fields: [entries[i][0], entries[j][0]] };
      }
    }
  }
  return null;
}
