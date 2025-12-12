import { parseDeadline, isDeadlinePassed } from './deadlines.ts';

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

// Resolve the effective logo URL for a job, preferring any explicit
// job-level logo field before falling back to company-level logos.
const resolveJobLogoUrl = (job) => {
  if (!job) return '';

  return (
    // Normalized/camelCase job-level field (frontend model)
    job.logoUrl ||
    // Raw DB column on jobs table, if present
    job.logo_url ||
    // Effective logo from views/RPCs (COALESCE(jobs.logo_url, companies.logo_url))
    job.company_logo_url ||
    // Joined company shapes
    job.companies?.logo_url ||
    job.company?.logo_url ||
    ''
  );
};

export const normalizeJobCompany = (job) => {
  if (!job) return { name: '', logo_url: '' };

  const name =
    job.company_name ||
    job.companies?.name ||
    job.company?.name ||
    '';

  const logo_url = resolveJobLogoUrl(job);

  return { name, logo_url };
};

export const getJobLogoUrl = (job) => resolveJobLogoUrl(job);
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
    (j?.salary_max != null) ||
    j?.contact_name ||
    j?.contact_email ||
    j?.contact_phone
  );
};

// Deadline helpers for expired logic (centralized via IST-aware utilities)
export const getDeadline = (row) =>
  row?.deadline ?? row?.application_deadline ?? row?.expires_at ?? null;

export const isExpired = (row, now = new Date()) => {
  const d = getDeadline(row);
  return isDeadlinePassed(d, now);
};

// Minimal client-side sorting (three modes)
export const sortJobs = (rows, sort = 'newest') => {
  const byTitleAZ = (a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
  const dateOrNull = (d) => {
    const parsed = parseDeadline(d);
    return parsed ? parsed.getTime() : Number.POSITIVE_INFINITY;
  };

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
      canApply: false,
      disabled: true,
      reason: 'no-job',
      disabledReason: 'This job is not available.',
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

  const deadlinePassed = isDeadlinePassed(deadline, now);

  const baseOpen =
    isApproved &&
    !isRejected &&
    activeFlag &&
    statusActive &&
    !deadlinePassed;

  const canApplyExternally = isQuickLink && baseOpen;
  const canApplyInApp = !isQuickLink && baseOpen;
  const isClosed = !baseOpen;

  const canApply = canApplyInApp || canApplyExternally;
  const disabled = !canApply;

  let reasonCode = 'open';
  if (!baseOpen) {
    reasonCode = deadlinePassed ? 'deadline-passed' : 'not-open';
  }

  let disabledReason = null;
  if (!baseOpen) {
    if (deadlinePassed) {
      disabledReason = 'Applications are closed because the deadline has passed.';
    } else if (isRejected) {
      disabledReason = 'This job has been rejected by an administrator.';
    } else if (!isApproved) {
      disabledReason = 'This job is waiting for admin approval.';
    } else if (!activeFlag || !statusActive) {
      disabledReason = 'This job is currently paused or closed.';
    } else {
      disabledReason = 'Applications are currently closed for this job.';
    }
  }

  return {
    isQuickLink,
    canApplyInApp,
    canApplyExternally,
    isClosed,
    canApply,
    disabled,
    reason: reasonCode,
    disabledReason,
  };
};

// Derive a consolidated status string for display and moderation UIs
// based on the same semantics used in computeJobApplyState and
// Jobs listings (is_approved, is_active, status, deadlines, rejections).
export const deriveJobStatus = (job, now = new Date()) => {
  if (!job) return 'unknown';

  const isRejected = job.is_rejected === true;
  const isApproved = job.is_approved === true;
  const activeFlag = job.is_active !== false; // treat null/undefined as active
  const statusActive = job.status ? String(job.status).toLowerCase() === 'active' : true;

  const applyState = computeJobApplyState(job, now);

  if (isRejected) return 'rejected';

  // Not approved yet: distinguish between pending-but-visible vs pending-and-paused
  if (!isApproved) {
    return activeFlag && statusActive ? 'pending_approval' : 'pending_inactive';
  }

  // Approved jobs: mirror apply state + flags
  if (applyState.reason === 'deadline-passed') return 'expired';

  const baseOpen = !applyState.isClosed;

  if (!baseOpen) {
    // Approved but effectively not open – treat as paused/disabled
    if (!activeFlag || !statusActive) return 'paused';
    return 'closed';
  }

  return 'open';
};

// Normalize a job location string for display and filters.
// Today the schema primarily uses a single `location` field; fall back
// to optional label-style fields if present.
export const getJobLocation = (job) => {
  if (!job) return '';
  return (
    job.location ||
    job.location_label ||
    ''
  );
};

// Normalize a raw job row into a consistent frontend shape while
// preserving all original fields. This is used by API helpers and
// can be safely applied to rows coming from views or RPCs.
export const normalizeJob = (raw, now = new Date()) => {
  if (!raw) return raw;

  const company = normalizeJobCompany(raw);
  const logoUrl = resolveJobLogoUrl(raw);
  const location = getJobLocation(raw);
  const computedStatus = deriveJobStatus(raw, now);

  return {
    ...raw,
    company,
    // Keep both normalized and legacy fields for compatibility
    company_name: company.name || raw.company_name || '',
    companyName: company.name || raw.company_name || '',
    company_logo_url: logoUrl || raw.company_logo_url || '',
    logoUrl: logoUrl || raw.logoUrl || null,
    companyLogoUrl: logoUrl || raw.companyLogoUrl || null,
    location,
    computed_status: computedStatus,
  };
};
