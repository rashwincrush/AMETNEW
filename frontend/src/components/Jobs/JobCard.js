import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isQuickLink, coalesceAppUrl, getJobLogoUrl, getJobCompanyName } from '../../utils/jobs';
import { getApplicantsCount } from '../../utils/applicants';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { requestConnectionForJob } from '../../utils/connections';
import { supabase } from '../../utils/supabase';
import { ShareIcon, BookmarkIcon, MapPinIcon, BriefcaseIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toggleBookmarkRPC } from '../../utils/bookmarks';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { shareJob } from '../../utils/share';
import ImageWithFallback from '../common/ImageWithFallback';

export default function JobCard({ job }) {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const employerId = job?.posted_by || job?.user_id || null;
  const isStudent = ['alumni', 'student'].includes(userRole);
  const isOwner = user?.id === employerId;

  // Normalize company for display
  const companyName = useMemo(() => getJobCompanyName(job), [job]);
  const companyLogo = useMemo(() => getJobLogoUrl(job), [job]);
  const isQuick = isQuickLink(job);
  const externalUrl = useMemo(() => coalesceAppUrl(job), [job]);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(job?.is_bookmarked));
  const bookmarkedJobs = useMemo(() => user?.bookmarked_jobs || [], [user]);

  // Prefer salary_display_inr; fallback to legacy or numeric fields
  const salaryText = useMemo(() => {
    if (job?.salary_display_inr) return job.salary_display_inr;
    const min = job?.salary_min;
    const max = job?.salary_max;
    if (min && max) {
      return `₹${Number(min).toLocaleString('en-IN')} - ₹${Number(max).toLocaleString('en-IN')}`;
    }
    if (min != null) return `₹${Number(min).toLocaleString('en-IN')}+`;
    if (max != null) return `Up to ₹${Number(max).toLocaleString('en-IN')}`;
    if (job?.salary_range) {
      const sr = String(job.salary_range).trim();
      return sr.replace(/^USD\s*/i, '₹ ');
    }
    return null;
  }, [job]);

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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 p-6 h-full flex flex-col">
      {/* Header row with top-right actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
            <ImageWithFallback
              src={companyLogo}
              alt={companyName || 'Company'}
              className="w-10 h-10"
              placeholderSrc="/default-avatar.svg"
              emptyMessage="Employer logo to be uploaded"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors cursor-pointer">{job.title}</h3>
              <span className={isQuick ? 'text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'}>
                {isQuick ? 'Quick Link' : 'In-App'}
              </span>
            </div>
            {companyName && <div className="text-blue-600 text-sm font-medium mt-1">{companyName}</div>}
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
      <p className="text-gray-600 text-sm mt-3 mb-2">
        {job.description?.slice(0, 120) + (job.description?.length > 120 ? '...' : '')}
      </p>

      {/* Skills preview, if available */}
      {(() => {
        const raw = job.skills;
        const arr = Array.isArray(raw)
          ? raw
          : typeof raw === 'string'
            ? raw.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        if (!arr.length) return null;
        return (
          <div className="flex flex-wrap gap-1 mb-3">
            {arr.slice(0, 5).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-ocean-50 text-ocean-700 border border-ocean-100"
              >
                {skill}
              </span>
            ))}
          </div>
        );
      })()}

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
        {salaryText && (
          <div className="flex items-center text-sm text-gray-600">
            <span>{salaryText}</span>
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
          <Link className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 transition-colors" to={`/jobs/${job.id}`}>View Details</Link>

          {isQuick ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>Apply Externally</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors font-medium"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              {isOwner ? 'View Applications' : 'Apply Now'}
            </button>
          )}

          {employerId && !isOwner && (
            <button
              className="px-3 py-2 rounded-lg text-sm bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
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
