// Canonical job application status helpers
// Keep this in sync with backend job_applications.status CHECK constraint

export const APPLICATION_STATUS = [
  'submitted',
  'under_review',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

const LEGACY_TO_CANONICAL: Record<string, ApplicationStatus> = {
  // Submitted
  submitted: 'submitted',
  applied: 'submitted',
  pending: 'submitted',

  // Under review
  review: 'under_review',
  reviewing: 'under_review',
  reviewed: 'under_review',
  under_review: 'under_review',
  in_progress: 'under_review',

  // Shortlisted
  shortlisted: 'shortlisted',

  // Interviewing
  interview: 'interviewing',
  interviewing: 'interviewing',

  // Offered
  offer: 'offered',
  offered: 'offered',

  // Hired
  hired: 'hired',

  // Rejected
  rejected: 'rejected',
  declined: 'rejected',

  // Withdrawn
  withdrawn: 'withdrawn',
};

export function normalizeStatus(raw: string | null | undefined): ApplicationStatus {
  const key = (raw || '').toLowerCase().trim();
  const mapped = LEGACY_TO_CANONICAL[key];
  if (mapped) return mapped;
  // Fallback: if already canonical, trust it; otherwise treat as submitted
  if ((APPLICATION_STATUS as readonly string[]).includes(key)) {
    return key as ApplicationStatus;
  }
  return 'submitted';
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  interviewing: 'Interviewing',
  offered: 'Offer received',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

// WCAG AA compliant colors (4.5:1 contrast ratio)
export const STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  shortlisted: 'bg-violet-100 text-violet-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offered: 'bg-blue-100 text-blue-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-rose-100 text-rose-800',
  withdrawn: 'bg-gray-100 text-gray-600',
};

// Heroicons-style SVG paths for each status
export const STATUS_ICON: Record<ApplicationStatus, string> = {
  submitted: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z', // Inbox/filter icon
  under_review: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', // Eye icon
  shortlisted: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z', // Star icon
  interviewing: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', // Calendar icon
  offered: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.318 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.318 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.318 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.318 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', // Award/check badge icon
  hired: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // CheckCircle icon
  rejected: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', // XCircle icon
  withdrawn: 'M10 19l-7-7m0 0l7-7m-7 7h18', // ArrowLeft icon
};
