// Canonical job application status helpers (JS wrapper)
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
];

const LEGACY_TO_CANONICAL = {
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

export function normalizeStatus(raw) {
  const key = (raw || '').toLowerCase().trim();
  const mapped = LEGACY_TO_CANONICAL[key];
  if (mapped) return mapped;
  if (APPLICATION_STATUS.includes(key)) {
    return key;
  }
  return 'submitted';
}

export const STATUS_LABEL = {
  submitted: 'Submitted',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  interviewing: 'Interviewing',
  offered: 'Offer received',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STATUS_BADGE_CLASS = {
  submitted: 'bg-ocean-100 text-ocean-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-indigo-100 text-indigo-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offered: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
};

// Heroicons-style SVG paths for each status
export const STATUS_ICON = {
  submitted: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  under_review: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  shortlisted: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z',
  interviewing: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  offered: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  hired: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  rejected: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  withdrawn: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12a4 4 0 11-8 0 4 4 0 018 0z',
};
