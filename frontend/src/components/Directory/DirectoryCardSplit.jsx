import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckBadgeIcon, ChevronRightIcon, AcademicCapIcon, BuildingOffice2Icon, BriefcaseIcon, BuildingLibraryIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import ConnectionCTA from '../shared/ConnectionCTA';
import { DegreeChip, DeptChip, CompanyChip, PositionChip } from '../shared/Chips';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
// Using v_profiles_directory_card which already formats academic/professional labels

export default function DirectoryCardSplit({ meId, profile, currentTab = 'all', onChanged }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const rel = useMemo(() => profile?.rel || { status: null, pending_side: null }, [profile?.rel]);

  // Prefer normalized fields coming from DirectoryPage, then fall back to view columns
  // Degree and Department as separate chips (prefer normalized; fallback to parsing view label)
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
          // If only one token present, assume it's the department if it's long text; else treat as degree code
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

  // Compute display name robustly in-card as a final fallback
  const displayName = useMemo(() => {
    const fn = (profile.full_name || '').trim();
    if (fn) return fn;
    const first = (profile.first_name || '').trim();
    const last = (profile.last_name || '').trim();
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    const email = (profile.email || '').trim();
    if (email) return email.split('@')[0];
    return 'Alumni';
  }, [profile.full_name, profile.first_name, profile.last_name, profile.email]);
  
  // Single initial for avatar placeholder (fixed blue background)
  const getInitial = () => {
    const ch = displayName?.trim()?.charAt(0) || 'A';
    return ch.toUpperCase();
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-ocean-300 transition-all duration-200">
      <div className="p-4 flex flex-col">
        {/* Top section: Avatar and Name */}
        <div className="flex items-center mb-3">
          {/* Avatar */}
          <div className="h-16 w-16 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-slate-200 shadow-sm mr-3 flex items-center justify-center">
            <Avatar src={profile.avatar_url} alt={profile.full_name || 'Profile'} size={64} version={profile?.updated_at} />
          </div>
          
          {/* Name and batch */}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-[200px] lg:max-w-[240px]" title={displayName}>
                {displayName}
              </h3>
              {profile.is_verified && 
                <CheckBadgeIcon className="h-4 w-4 shrink-0 text-sky-500" aria-label="Verified" title="Verified" />
              }
              {isAdmin && (profile?.is_employer || profile?.role === 'employer') && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-medium" title="Employer">
                  Employer
                </span>
              )}
            </div>
            
            {/* Batch chip moved to chips row below to keep all chips together */}
          </div>
        </div>
        
        {/* Middle section: Details */}
        <div className="mb-3">
          {/* Chips: Degree Program, Department, Graduation Year, Current Company, Current Position */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {degreeLabel && (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
                <AcademicCapIcon className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate" title={degreeLabel}>{degreeLabel}</span>
              </div>
            )}
            {departmentLabel && (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
                <BuildingLibraryIcon className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate" title={departmentLabel}>{departmentLabel}</span>
              </div>
            )}
            {batch && (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
                <CalendarDaysIcon className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate" title={`Batch ${batch}`}>Batch {batch}</span>
              </div>
            )}
            {company && (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
                <BuildingOffice2Icon className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate" title={company}>{company}</span>
              </div>
            )}
            {position && (
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
                <BriefcaseIcon className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate" title={position}>{position}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom section: Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 pt-3 border-t border-slate-100">
          {/* Connection CTA */}
          <div className="flex-1">
            <ConnectionCTA
              meId={meId}
              peerId={profile.id}
              rel={rel}
              currentTab={currentTab}
              scope="directory"
              onChanged={onChanged}
              onMessage={message}
            />
          </div>
          
          {/* View Profile button */}
          <button
            type="button"
            onClick={viewProfile}
            className="shrink-0 inline-flex items-center justify-center gap-1 min-h-[40px] rounded-lg px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ocean-500 w-full sm:w-auto"
            aria-label="View full profile"
          >
            <span>View Profile</span>
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}