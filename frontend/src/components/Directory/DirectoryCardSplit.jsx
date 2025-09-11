import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckBadgeIcon, ChevronRightIcon, AcademicCapIcon, BuildingOffice2Icon, BriefcaseIcon } from '@heroicons/react/24/outline';
import ConnectionCTA from '../shared/ConnectionCTA';
import { DegreeChip, DeptChip, CompanyChip, PositionChip } from '../shared/Chips';
// Using v_profiles_directory_card which already formats academic/professional labels

export default function DirectoryCardSplit({ meId, profile, currentTab = 'all', onChanged }) {
  const navigate = useNavigate();
  const rel = useMemo(() => profile?.rel || { status: null, pending_side: null }, [profile?.rel]);

  // Normalized fields for view columns
  const degreeDepartment = profile.degree_department ?? null;
  const company = profile.current_company ?? profile.company_name ?? profile.company ?? null;
  const position = profile.current_title ?? profile.current_job_title ?? profile.job_title ?? null;
  const batch = profile.graduation_year ?? profile.batch_year ?? profile.batch ?? null;

  const message = () => navigate(`/messages?peer=${profile.id}`);
  const viewProfile = () => navigate(`/directory/${profile.id}`);
  
  // Single initial for avatar placeholder (fixed blue background)
  const getInitial = () => {
    const ch = profile.full_name?.trim()?.charAt(0) || 'A';
    return ch.toUpperCase();
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
      <div className="p-4 flex flex-col">
        {/* Top section: Avatar and Name */}
        <div className="flex items-center mb-3">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full overflow-hidden ring-1 ring-slate-200 shadow-sm mr-3">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Profile'} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-blue-600 text-white font-semibold text-lg">
                {getInitial()}
              </div>
            )}
          </div>
          
          {/* Name and batch */}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-900 truncate max-w-[180px]" title={profile.full_name}>
                {profile.full_name}
              </h3>
              {profile.is_verified && 
                <CheckBadgeIcon className="h-4 w-4 shrink-0 text-sky-500" title="Verified" />
              }
            </div>
            
            {batch && (
              <div className="mt-1 inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                Batch {batch}
              </div>
            )}
          </div>
        </div>
        
        {/* Middle section: Details */}
        <div className="mb-3">
          {/* Academic info */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
              <AcademicCapIcon className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate" title={degreeDepartment || '—'}>{degreeDepartment || '—'}</span>
            </div>
          </div>
          
          {/* Professional info */}
          <div className="flex flex-wrap gap-1.5">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
              <BuildingOffice2Icon className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate" title={company || '—'}>{company || '—'}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 max-w-full truncate">
              <BriefcaseIcon className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate" title={position || '—'}>{position || '—'}</span>
            </div>
          </div>
        </div>
        
        {/* Bottom section: Buttons */}
        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100">
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
            onClick={viewProfile}
            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
            aria-label="View Profile"
          >
            <span>View Profile</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}