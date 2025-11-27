export const coalesceAppUrl = (j) => {
  if (!j) return '';
  const a = (j.application_url && String(j.application_url).trim()) || '';
  const b = (j.external_url && String(j.external_url).trim()) || '';
  const c = (j.apply_url && String(j.apply_url).trim()) || '';
  return a || b || c || '';
};

export const getSourceType = (j) => {
  const st = j?.source_type;
  if (st === 'quick_link' || st === 'in_app') return st;
  const hasExternal = !!(j?.application_url || j?.external_url);
  return hasExternal ? 'quick_link' : 'in_app';
};

export const isQuickLink = (j) => !!(j?.application_url || j?.external_url);
export const isInternal = (j) => getSourceType(j) === 'in_app';

export const normalizeJobCompany = (job) => {
  if (!job) return { name: '', logo_url: '' };

  const name =
    job.company_name ||
    job.companies?.name ||
    job.company?.name ||
    '';

  const logo_url =
    job.company_logo_url ||
    job.companies?.logo_url ||
    job.company?.logo_url ||
    '';

  return { name, logo_url };
};

export const getJobLogoUrl = (job) => normalizeJobCompany(job).logo_url;
export const getJobCompanyName = (job) => normalizeJobCompany(job).name;

export const companyDisplay = (j) => normalizeJobCompany(j);

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

// Central helper for apply/closed/quick-link state
export const computeJobApplyState = (job, now = new Date()) => {
  if (!job) {
    return {
      isQuickLink: false,
      canApplyInApp: false,
      canApplyExternally: false,
      isClosed: true,
      reason: 'no-job',
    };
  }

  const isQuickLink = Boolean(job.application_url || job.external_url);
  const statusActive = job.status ? String(job.status).toLowerCase() === 'active' : true;
  const activeFlag = job.is_active !== false; // treat null/undefined as active
  const isApproved = job.is_approved === true;
  const isRejected = job.is_rejected === true;

  const deadline =
    job.deadline ||
    job.application_deadline ||
    job.expires_at ||
    null;

  let deadlinePassed = false;
  if (deadline) {
    const d = new Date(deadline);
    deadlinePassed = d.getTime() < now.getTime();
  }

  const baseOpen =
    isApproved &&
    !isRejected &&
    activeFlag &&
    statusActive &&
    !deadlinePassed;

  const canApplyExternally = isQuickLink && baseOpen;
  const canApplyInApp = !isQuickLink && baseOpen;
  const isClosed = !baseOpen;

  return {
    isQuickLink,
    canApplyInApp,
    canApplyExternally,
    isClosed,
    reason: baseOpen ? 'open' : (deadlinePassed ? 'deadline-passed' : 'not-open'),
  };
};
