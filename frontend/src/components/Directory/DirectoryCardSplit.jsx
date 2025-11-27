import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckBadgeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ConnectionCTA from '../shared/ConnectionCTA';
import { DegreeChip, BatchChip, DeptChip, CompanyChip, PositionChip } from '../shared/Chips';
import { SecondaryButton } from '../shared/Buttons';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';

/**
 * Converts a name to Title Case (non-admin users never see ALL CAPS)
 */
function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function DirectoryCardSplit({ meId, profile, currentTab = 'all', onChanged }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const rel = useMemo(() => profile?.rel || { status: null, pending_side: null }, [profile?.rel]);

  // Parse degree and department from profile data
  const { degreeLabel, departmentLabel } = useMemo(() => {
    let dp = profile.degree_program || null;
    let dept = profile.department || null;
    if ((!dp || !dept) && profile.degree_department) {
      const label = String(profile.degree_department);
      const byComma = label.split(',').map(s => s.trim());
      if (byComma.length >= 2) {
        dp = dp || byComma[0]?.toUpperCase() || null;
        dept = dept || byComma.slice(1).join(', ') || null;
      } else {
        const byDash = label.split(' - ').map(s => s.trim());
        if (byDash.length >= 2) {
          dp = dp || byDash[0]?.toUpperCase() || null;
          dept = dept || byDash.slice(1).join(' - ') || null;
        } else if (!dp) {
          const upper = label.toUpperCase();
          const KNOWN = ['BBA','BCA','BE','BSC','BTECH','MBA','MCA','ME','MSC','MTECH','PHD'];
          if (KNOWN.includes(upper)) dp = upper; else dept = label;
        }
      }
    }
    return { degreeLabel: dp, departmentLabel: dept };
  }, [profile.degree_program, profile.department, profile.degree_department]);

  const company = profile.company_name ?? profile.current_company ?? profile.company ?? null;
  const position = profile.current_job_title ?? profile.current_title ?? profile.job_title ?? null;
  const batch = profile.graduation_year ?? profile.batch_year ?? profile.batch ?? null;

  const message = () => navigate(`/messages?peer=${profile.id}`);
  const viewProfile = () => navigate(`/directory/${profile.id}`);

  // Compute display name robustly
  const displayName = useMemo(() => {
    const fn = (profile.full_name || '').trim();
    if (fn) return toTitleCase(fn);
    const first = (profile.first_name || '').trim();
    const last = (profile.last_name || '').trim();
    const combined = `${first} ${last}`.trim();
    if (combined) return toTitleCase(combined);
    const email = (profile.email || '').trim();
    if (email) return toTitleCase(email.split('@')[0]);
    return 'Alumni';
  }, [profile.full_name, profile.first_name, profile.last_name, profile.email]);

  // Admin status badges
  let statusBadge = null;
  if (isAdmin) {
    const raw = profile?._raw || {};
    const hasApprovalFields =
      raw.approval_status !== undefined ||
      raw.alumni_verification_status !== undefined ||
      raw.is_approved !== undefined ||
      raw.is_deleted !== undefined;

    if (hasApprovalFields) {
      const isDeleted = raw.is_deleted === true;
      if (isDeleted) {
        statusBadge = (
          <span
            className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            title="Deleted profile"
          >
            D
          </span>
        );
      } else {
        const effectiveApproval =
          raw.approval_status ||
          raw.alumni_verification_status ||
          (raw.is_approved ? 'approved' : 'pending');

        if (effectiveApproval === 'rejected') {
          statusBadge = (
            <span
              className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              title="Rejected profile"
            >
              R
            </span>
          );
        } else if (effectiveApproval && effectiveApproval !== 'approved') {
          statusBadge = (
            <span
              className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              title="Unapproved profile"
            >
              UA
            </span>
          );
        }
      }
    }
  }

  // Chip-first philosophy: chips carry the 4 key facts (degree, department, position, company).
  // Text lines stay minimal: only name + optional "Batch {year}" under the name.

  const normalize = (s) => (s || '').trim().toLowerCase();

  let degreeChip = degreeLabel || null;
  let departmentChip = departmentLabel || null;
  let positionChip = position || null;
  let companyChip = company || null;

  // Deduplicate degree vs department (when text is effectively the same)
  if (degreeChip && departmentChip && normalize(degreeChip) === normalize(departmentChip)) {
    departmentChip = null;
  }

  // Deduplicate position vs company: if same or one contains the other, keep the richer text (position)
  if (positionChip && companyChip) {
    const nPos = normalize(positionChip);
    const nComp = normalize(companyChip);
    if (nPos && (nPos === nComp || nPos.includes(nComp) || nComp.includes(nPos))) {
      // Prefer keeping designation; drop company chip in this case
      companyChip = null;
    }
  }

  // Hard cap: max 4 chips per card. Drop in this order: position, then company if still over.
  const countChips = () => [degreeChip, departmentChip, positionChip, companyChip].filter(Boolean).length;
  if (countChips() > 4) {
    positionChip = null;
  }
  if (countChips() > 4) {
    companyChip = null;
  }

  return (
    <div 
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-ocean-300 hover:-translate-y-0.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-ocean-400 focus-within:ring-offset-2"
      role="article"
      aria-label={`${displayName} profile card`}
    >
      {/* Subtle top accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-ocean-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
      
      <div className="relative p-4 sm:p-5 flex flex-col h-full">
        {/* Header: Avatar + Name + Identity line */}
        <div className="flex items-start gap-3 mb-3">
          {/* Smaller avatar: 60px */}
          <div className="relative flex-shrink-0">
            <Avatar
              src={profile.avatar_url}
              alt={`${displayName} profile photo`}
              size={60}
              version={profile?.updated_at}
              loading="lazy"
              className="ring-2 ring-slate-200 group-hover:ring-ocean-300 transition-all duration-200"
            />
          </div>
          
          {/* Name and identity */}
          <div className="flex-1 min-w-0">
            {/* Name row with verified badge */}
            <div className="flex items-start gap-1.5 mb-1">
              <h3 className="text-base font-bold text-slate-900 truncate flex-1 leading-tight" title={displayName}>
                {displayName}
              </h3>
              {profile.is_verified && (
                <CheckBadgeIcon className="h-4 w-4 shrink-0 text-sky-500 mt-0.5" aria-label="Verified" title="Verified profile" />
              )}
            </div>
            
            {/* Optional secondary line: Batch only */}
            {batch && (
              <p className="text-xs text-slate-500 mb-1" title={`Batch ${batch}`}>
                Batch {batch}
              </p>
            )}
            
            {/* Admin badges row */}
            {(isAdmin && (profile?.is_employer || profile?.role === 'employer')) || statusBadge ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                {isAdmin && (profile?.is_employer || profile?.role === 'employer') && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" title="Employer account">
                    E
                  </span>
                )}
                {statusBadge}
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Chip rows: education (degree/department) then career (position/company) */}
        {(degreeChip || departmentChip) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {degreeChip && <DegreeChip primary>{degreeChip}</DegreeChip>}
            {departmentChip && <DeptChip>{departmentChip}</DeptChip>}
          </div>
        )}

        {(positionChip || companyChip) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {positionChip && <PositionChip>{positionChip}</PositionChip>}
            {companyChip && <CompanyChip>{companyChip}</CompanyChip>}
          </div>
        )}
        
        {/* Actions row: Connection CTA + View Profile */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-auto pt-3 border-t border-slate-100">
          {/* Connection CTA (left, primary) */}
          <div className="flex-1 min-w-0">
            <ConnectionCTA
              meId={meId}
              peerId={profile.id}
              rel={rel}
              currentTab={currentTab}
              scope="directory"
              onChanged={onChanged}
              onMessage={message}
              profileName={displayName}
            />
          </div>
          
          {/* View Profile button (right, secondary) */}
          <SecondaryButton
            onClick={viewProfile}
            className="shrink-0 min-h-[44px] w-full sm:w-auto"
            aria-label={`View ${displayName}'s full profile`}
          >
            <span>View Profile</span>
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}