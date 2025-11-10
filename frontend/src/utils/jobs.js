export const coalesceAppUrl = (j) =>
  (j && (
    j.application_url ||
    j.apply_url ||
    j.external_url ||
    j.url ||
    j.company_apply_url
  )) || null;

export const getSourceType = (j) => {
  const st = j?.source_type;
  if (st === 'quick_link' || st === 'in_app') return st;
  // Legacy fallback based on presence of external application URL
  return coalesceAppUrl(j) ? 'quick_link' : 'in_app';
};

export const isQuickLink = (j) => getSourceType(j) === 'quick_link';
export const isInternal = (j) => getSourceType(j) === 'in_app';

export const companyDisplay = (j) => ({
  name: (j && (j.company_name || j.companies?.name)) || '',
  logo_url: (j && (j.companies?.logo_url || j.company_logo_url)) || ''
});

// Overview guard: render overview only when we have meaningful data
export const hasOverviewData = (j) => {
  return Boolean(
    j?.location ||
    j?.job_type ||
    j?.experience_level ||
    j?.department ||
    j?.salary_display_inr ||
    (j?.salary_min != null) ||
    (j?.salary_max != null)
  );
};

// Deadline helpers for expired logic
export const getDeadline = (row) =>
  row?.deadline ?? row?.application_deadline ?? row?.expires_at ?? null;

export const isExpired = (row) => {
  const d = getDeadline(row);
  return d ? new Date(d) < new Date() : false;
};

// Minimal client-side sorting (three modes)
export const sortJobs = (rows, sort = 'newest') => {
  const byTitleAZ = (a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
  const dateOrNull = (d) => (d ? new Date(d).getTime() : Number.POSITIVE_INFINITY);

  switch (sort) {
    case 'alpha': // Title (A–Z)
      return [...rows].sort(byTitleAZ);
    case 'deadline': // Deadline (Soonest)
      return [...rows].sort((a, b) => dateOrNull(getDeadline(a)) - dateOrNull(getDeadline(b)));
    case 'newest': // Date Posted (Newest)
    default:
      return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};
