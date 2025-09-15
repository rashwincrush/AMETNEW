import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isQuickLink, coalesceAppUrl, companyDisplay } from '../../utils/jobs';
import { getApplicantsCount } from '../../utils/applicants';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { requestConnectionForJob } from '../../utils/connections';
import { supabase } from '../../utils/supabase';
import { ShareIcon, BookmarkIcon, MapPinIcon, BriefcaseIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toggleBookmarkRPC } from '../../utils/bookmarks';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { shareJob } from '../../utils/share';

export default function JobCard({ job }) {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const employerId = job?.posted_by || job?.user_id || null;
  const isStudent = ['alumni', 'student'].includes(userRole);
  const isOwner = user?.id === employerId;

  // Normalize company for display
  const { name: companyName, logo_url: companyLogo } = useMemo(() => companyDisplay(job), [job]);
  const isQuick = isQuickLink(job);
  const externalUrl = useMemo(() => coalesceAppUrl(job), [job]);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(job?.is_bookmarked));
  const bookmarkedJobs = useMemo(() => user?.bookmarked_jobs || [], [user]);

  const toggleBookmark = async () => {
    if (!user?.id) {
      toast.error('Please login to bookmark jobs.');
      return;
    }
    try {
      // Optional client-side cap before calling server
      if (!isBookmarked && bookmarkedJobs && bookmarkedJobs.length >= 3) {
        toast.error('You can only bookmark up to 3 jobs.');
        return;
      }
      const nowBookmarked = await toggleBookmarkRPC(supabase, job.id);
      setIsBookmarked(nowBookmarked);
      toast.success(nowBookmarked ? 'Job bookmarked' : 'Bookmark removed');
    } catch (e) {
      console.error('Bookmark error:', e);
      toast.error('Failed to update bookmark');
    }
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
      {/* Header row with top-right actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName || 'Company'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-gray-400">Logo</span>
          )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              <span className={isQuick ? 'text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'}>
                {isQuick ? 'Quick Link' : 'In-App'}
              </span>
            </div>
            {companyName && <div className="text-ocean-600 text-sm">{companyName}</div>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => shareJob(job)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Share job">
            <ShareIcon className="w-5 h-5 text-gray-500" />
          </button>
          <button onClick={toggleBookmark} className={`p-2 rounded-full ${isBookmarked ? 'bg-ocean-100 hover:bg-ocean-200' : 'hover:bg-gray-100'}`} aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
            <BookmarkIcon className={`w-5 h-5 ${isBookmarked ? 'text-ocean-600' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>

      {/* Middle content */}
      <p className="text-gray-600 text-sm mt-3 mb-4">
        {job.description?.slice(0, 120) + (job.description?.length > 120 ? '...' : '')}
      </p>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {!!job.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{job.location}</span>
          </div>
        )}
        {!!job.job_type && (
          <div className="flex items-center text-sm text-gray-600">
            <BriefcaseIcon className="w-4 h-4 mr-1" />
            <span className="capitalize">{job.job_type}</span>
          </div>
        )}
        {!!job.experience_level && (
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span className="capitalize">{job.experience_level}</span>
          </div>
        )}
        {job.application_deadline && (
          <div className="flex items-center text-sm text-gray-600 col-span-2">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Footer CTAs */}
      <div className="mt-4 flex justify-between items-center">
        {(() => { const c = getApplicantsCount(job); return (c !== null && c > 0) ? (<span className="text-sm text-gray-500">{c} applicant{c === 1 ? '' : 's'}</span>) : <span />; })()}
        
        <div className="flex gap-2">
          <Link className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50" to={`/jobs/${job.id}`}>View Details</Link>
          
          {isQuick ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener"
              className="px-3 py-2 rounded-lg bg-ocean-600 text-white text-sm hover:bg-ocean-700 flex items-center gap-1"
            >
              <span>Apply Externally</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <button
              className="px-3 py-2 rounded-lg bg-ocean-600 text-white text-sm hover:bg-ocean-700"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              {isOwner ? 'View Applications' : 'Apply Now'}
            </button>
          )}

          {isStudent && employerId && !isOwner && (
            <button
              className="px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={async () => {
                try { await requestConnectionForJob(job.id, employerId, user?.id); } catch (e) { console.error('Failed to request connection:', e); }
                navigate(`/messages?peer=${employerId}&job=${job.id}`);
              }}
            >
              Ask Employer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
