import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import useJobsRealtime from '../../hooks/useJobsRealtime';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MapPinIcon,
  BriefcaseIcon,
  ClockIcon,
  ShareIcon,
  PlusIcon,
  BellIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { CircularProgress } from '@mui/material';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { coalesceAppUrl, isQuickLink, companyDisplay, getSourceType } from '../../utils/jobs';
import { useApproval } from '../../hooks/useApproval';
import { getApplicantsCount } from '../../utils/applicants';
import { requestConnectionForJob } from '../../utils/connections';
import toast from 'react-hot-toast';
import { useNotification } from '../common/NotificationCenter';
import { shareJob } from '../../utils/share';
import BookmarkButton from './BookmarkButton';
import { toggleBookmarkRPC } from '../../utils/bookmarks';

/* ---------- Helpers ---------- */
const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

const filterOptions = {
  jobType: [
    { value: 'all', label: 'All Job Types' },
    { value: 'full-time', label: 'Full-Time' },
    { value: 'part-time', label: 'Part-Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ],
  department: [
    { value: 'all', label: 'All Departments' },
    { value: 'marine', label: 'Marine' },
    { value: 'naval', label: 'Naval' },
    { value: 'port', label: 'Port' },
    { value: 'logistics', label: 'Logistics' },
  ],
  experience: [
    { value: 'all', label: 'All Experience Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
  ],
  location: [
    { value: 'all', label: 'All Locations' },
    { value: 'remote', label: 'Remote' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'chennai', label: 'Chennai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'bengaluru', label: 'Bengaluru' },
  ],
  industry: [
    { value: 'all', label: 'All Industries' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'maritime', label: 'Maritime' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'cruises', label: 'Cruises' },
    { value: 'naval', label: 'Naval' },
  ],
  salaryRange: [
    { value: 'all', label: 'All Salary Ranges' },
    { value: '0-300000', label: 'Up to 3L' },
    { value: '300000-600000', label: '3L to 6L' },
    { value: '600000-1000000', label: '6L to 10L' },
    { value: '1000000-1500000', label: '10L to 15L' },
    { value: '1500000-', label: 'Above 15L' },
  ],
  postedWithin: [
    { value: 'all', label: 'Anytime' },
    { value: '1', label: 'Today' },
    { value: '7', label: 'Last Week' },
    { value: '30', label: 'Last Month' },
    { value: '90', label: 'Last 3 Months' },
  ],
};

/* ---------- Small subcomponents that need the bookmark state passed in ---------- */
const JobCard = ({ job, handleBookmark, isBookmarked }) => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const employerId = job?.posted_by || job?.user_id || job?.employer_id;
  const isOwner = user?.id && employerId && user.id === employerId;
  const isStudent = ['alumni', 'student'].includes(userRole);
  if (!job) return null;

  const quick = isQuickLink(job);
  const href = coalesceAppUrl(job);

  const renderStatusBadge = () => {
    if (job.is_approved === true) {
      return (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Approved</span>);
    }
    if (job.is_active === false) {
      return (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>);
    }
    return (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>);
  };

  return (
    <div className="glass-card rounded-lg p-6 hover:shadow-lg transition-shadow border border-transparent h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <img
            src={job.companies?.logo_url || '/logo.png'}
            alt={job.companies?.name || 'Company'}
            className="w-12 h-12 rounded-lg object-cover mr-4"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1" title={job.title}>{job.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/company/${job.company_id}`} className="text-ocean-600 font-medium hover:underline">
                {job.companies?.name || job.company_name}
              </Link>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${quick ? 'bg-ocean-100 text-ocean-800' : 'bg-green-100 text-green-800'}`}>
                {quick ? 'Quick Link' : 'In-App'}
              </span>
              {renderStatusBadge()}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button onClick={() => shareJob(job)} className="inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80" aria-label="Share job">
            <ShareIcon className="w-5 h-5 text-gray-500" />
          </button>

          <BookmarkButton
            jobId={job.id}
            isBookmarked={isBookmarked}
            handleBookmark={handleBookmark}
          />
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{job.description || 'No description provided.'}</p>

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

      <div className="mt-auto flex justify-between items-center">
        {(() => { const count = getApplicantsCount(job); return (count !== null && count > 0) ? (
          <span className="text-sm text-gray-500">{count} applicant{count === 1 ? '' : 's'}</span>
        ) : <span />; })()}
        <div className="space-x-2">
          {isStudent && employerId && !isOwner && (
            <button
              onClick={async () => {
                try { await requestConnectionForJob(job.id, employerId, user?.id); } catch (error) {
                  console.error('Failed to request connection:', error);
                  toast.error('Connection request failed. Please try again.');
                }
                navigate(`/messages?peer=${employerId}&job=${job.id}`);
              }}
              className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border-2 border-ocean-600 text-ocean-600 hover:bg-ocean-600 hover:text-white text-sm transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80"
            >
              Ask Employer
            </button>
          )}
          <Link to={`/jobs/${job.id}`} className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border-2 border-ocean-600 text-ocean-600 hover:bg-ocean-600 hover:text-white text-sm transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80">View Details</Link>
          <button
            onClick={() => {
              if (quick && href) window.open(href, '_blank', 'noopener,noreferrer');
              else navigate(`/jobs/${job.id}`);
            }}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-gradient-to-b from-ocean-500 to-ocean-600 text-white text-sm hover:from-ocean-600 hover:to-ocean-700 transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80"
          >
            {quick ? 'Apply Externally' : (isOwner ? 'View Applications' : 'Apply Now')}
          </button>
        </div>
      </div>
    </div>
  );
};

const JobListItem = ({ job, handleBookmark, isBookmarked }) => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const employerId = job?.posted_by || job?.user_id;
  const isOwner = user?.id && employerId && user.id === employerId;
  const isStudent = ['alumni', 'student'].includes(userRole);
  if (!job) return null;

  const quick = isQuickLink(job);

  const renderStatusBadge = () => {
    if (job.is_approved === true) {
      return (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Approved</span>);
    }
    if (job.is_active === false) {
      return (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>);
    }
    return (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>);
  };

  return (
    <div className="glass-card rounded-lg p-4 hover:shadow-lg transition-shadow flex flex-col sm:flex-row items-start gap-4 border border-transparent min-h-[140px]">
      <img src={job.companies?.logo_url || '/logo.png'} alt={job.companies?.name || 'Company'} className="w-16 h-16 rounded-lg object-cover" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/jobs/${job.id}`} className="text-lg font-bold text-gray-900 hover:text-ocean-600 transition-colors duration-200 line-clamp-1" title={job.title}>
              {job.title}
            </Link>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${quick ? 'bg-ocean-100 text-ocean-800' : 'bg-green-100 text-green-800'}`}>
              {quick ? 'Quick Link' : 'In-App'}
            </span>
            {renderStatusBadge()}
          </div>
          <span />
        </div>
        <div className="flex items-center gap-1 mb-2">
          <Link to={`/company/${job.company_id}`} className="text-ocean-600 font-medium hover:underline">{job.companies?.name || job.company_name}</Link>
        </div>
        <p className="text-gray-600 text-sm mt-2 mb-3 line-clamp-2">{job.description ? `${job.description.slice(0, 160)}...` : 'No description provided.'}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
          {!!job.location && (<div className="flex items-center"><MapPinIcon className="w-4 h-4 mr-1" /><span>{job.location}</span></div>)}
          {!!job.job_type && (<div className="flex items-center"><BriefcaseIcon className="w-4 h-4 mr-1" /><span className="capitalize">{job.job_type}</span></div>)}
          {!!job.experience_level && (<div className="flex items-center"><ClockIcon className="w-4 h-4 mr-1" /><span className="capitalize">{job.experience_level}</span></div>)}
          {job.application_deadline && (<div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1" /><span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span></div>)}
        </div>
      </div>
      <div className="flex flex-col items-end justify-between self-stretch pt-2 sm:pt-0">
        <div className="flex items-center">
          <button onClick={() => shareJob(job)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Share job">
            <ShareIcon className="w-5 h-5 text-gray-500" />
          </button>
          <BookmarkButton jobId={job.id} isBookmarked={isBookmarked} handleBookmark={handleBookmark} />
        </div>
        <div className="flex gap-2 mt-4">
          {isStudent && employerId && !isOwner && (
            <button
              className="btn-secondary-outline px-4 py-2 rounded-lg text-sm"
              onClick={async () => {
                try { await requestConnectionForJob(job.id, employerId, user?.id); } catch (error) { console.error('Failed to request connection:', error); }
                navigate(`/messages?peer=${employerId}&job=${job.id}`);
              }}
            >
              Ask Employer
            </button>
          )}
          <Link to={`/jobs/${job.id}`} className="btn-ocean-outline px-4 py-2 rounded-lg text-sm">View Details</Link>
          <button
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-gradient-to-b from-ocean-500 to-ocean-600 text-white text-sm hover:from-ocean-600 hover:to-ocean-700 transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80"
            onClick={() => {
              if (quick) {
                const url = coalesceAppUrl(job);
                if (url) window.open(url, '_blank', 'noopener');
              } else {
                navigate(`/jobs/${job.id}`);
              }
            }}
          >
            {quick ? 'Apply Externally' : (isOwner ? 'View Applications' : 'Apply Now')}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Page ---------- */
const JobListingsPage = () => {
  const { user, loading: authLoading, userRole } = useAuth();
  const { loading: apprLoading, isApprovedEmployer } = useApproval();
  const navigateJob = useNavigate();
  const goPostJob = () => {
    if (!isApprovedEmployer) {
      toast.error('Your profile is not approved. Kindly contact administrator.');
      return;
    }
    navigateJob('/jobs/post');
  };

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const notification = useNotification();
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'grid');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    jobType: searchParams.get('jobType') || 'all',
    experience: searchParams.get('experience') || 'all',
    location: searchParams.get('location') || 'all',
    industry: searchParams.get('industry') || 'all',
    department: searchParams.get('department') || 'all',
    salaryRange: searchParams.get('salaryRange') || 'all',
    postedWithin: searchParams.get('postedWithin') || 'all',
  });
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at,desc');
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const rawSourceQS = searchParams.get('source') || 'all';
  const canonicalSource = rawSourceQS === 'quick' ? 'quick_link' : rawSourceQS === 'internal' ? 'in_app' : rawSourceQS;
  const [sourceFilter, setSourceFilter] = useState(['quick_link', 'in_app'].includes(canonicalSource) ? canonicalSource : 'all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState(searchParams.get('approval') || 'all');

  const fetchController = useRef(null);
  const filtersRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleFilters = useCallback(() => {
    setFiltersOpen((prev) => {
      const next = !prev;
      if (next) {
        // Opening: scroll and focus the first filter control
        setTimeout(() => {
          try {
            if (filtersRef.current) {
              filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              const firstSelect = filtersRef.current.querySelector('select');
              if (firstSelect) firstSelect.focus();
            }
          } catch (_) { /* noop */ }
        }, 0);
      }
      return next;
    });
  }, []);

  const fetchJobs = useCallback(async () => {
    if (fetchController.current) fetchController.current.abort();
    fetchController.current = new AbortController();

    setLoading(true);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Fetching jobs with filters:', { searchQuery, sortBy, currentPage });
    }

    const [sortCol, sortDir] = (sortBy || 'created_at,desc').split(',');
    const isEmployer = userRole === 'employer';

    let data = null; let error = null; let serverFilteredByDepartment = false;

    if (isEmployer) {
      ({ data, error } = await supabase.rpc('get_my_posted_jobs', {
        p_search_query: searchQuery || null,
        p_sort_by: sortCol || 'created_at',
        p_sort_order: (sortDir || 'desc').toLowerCase(),
        p_limit: pageSize,
        p_offset: (currentPage - 1) * pageSize,
      }));
    } else {
      const deptParam = (filters.department && filters.department !== 'all') ? filters.department : null;
      ({ data, error } = await supabase.rpc('get_jobs_feed', {
        p_search_query: searchQuery || null,
        p_sort_by: sortCol || 'created_at',
        p_sort_order: (sortDir || 'desc').toLowerCase(),
        p_limit: pageSize,
        p_offset: (currentPage - 1) * pageSize,
        p_department: deptParam,
      }));
      if (error) {
        console.warn('RPC get_jobs_feed failed, falling back to v_jobs_public view');
        const { data: viewData, error: viewError } = await supabase
          .from('v_jobs_public')
          .select('*')
          .order(sortCol, { ascending: sortDir === 'asc' })
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
        if (viewError) {
          error = viewError;
        } else {
          data = { items: viewData, total_count: viewData.length };
          error = null;
        }
      } else {
        serverFilteredByDepartment = !!deptParam;
      }
    }

    if (error) {
      console.error('Error fetching jobs via RPC:', error);
      toast.error('Failed to fetch jobs.');
      setJobs([]);
      setTotalJobs(0);
      setLoading(false);
      return;
    }

    // Normalize rows
    let rows = [];
    let totalCount = 0;
    if (!isEmployer) {
      rows = (data?.items ?? []).map(j => {
        // Prefer company_logo_url if present in row
        const company = {
          name: companyDisplay(j).name,
          logo_url: j.company_logo_url || companyDisplay(j).logo_url
        };
        const appUrl = coalesceAppUrl(j);
        const computedSource = getSourceType({ ...j, application_url: appUrl });
        return {
          ...j,
          companies: { name: company.name, logo_url: company.logo_url },
          application_url: appUrl,
          source_type: j?.source_type ?? computedSource,
        };
      });
      totalCount = data?.total_count ?? 0;
    } else {
      rows = (data || []).map(j => {
        const company = {
          name: companyDisplay(j).name,
          logo_url: j.company_logo_url || companyDisplay(j).logo_url
        };
        const appUrl = coalesceAppUrl(j);
        const computedSource = getSourceType({ ...j, application_url: appUrl });
        return {
          ...j,
          companies: { name: company.name, logo_url: company.logo_url },
          application_url: appUrl,
          source_type: j?.source_type ?? computedSource,
        };
      });
      totalCount = rows.length > 0 && typeof rows[0].total_count !== 'undefined' ? rows[0].total_count : rows.length;
    }

    // Unique/safety
    let uniqueRows = Array.from(new Map(rows.map(job => [job.id, job])).values());

    // Client filters (until server supports all)
    const matchesFilters = (j) => {
      // Guard: Students and general audience should only see approved & active
      if (!isEmployer) {
        const approved = j.is_approved === true;
        const active = j.is_active !== false;
        if (!(approved && active)) return false;
      }
      if (sourceFilter !== 'all') {
        const st = getSourceType(j);
        if (sourceFilter === 'quick_link' && st !== 'quick_link') return false;
        if (sourceFilter === 'in_app' && st !== 'in_app') return false;
      }
      if (filters.jobType !== 'all' && (j.job_type || '').toLowerCase() !== filters.jobType) return false;
      if (filters.experience !== 'all' && (j.experience_level || '').toLowerCase() !== filters.experience) return false;
      if (filters.location !== 'all' && !(j.location || '').toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.industry !== 'all' && (j.industry || '').toLowerCase() !== filters.industry) return false;
      if (!serverFilteredByDepartment) {
        if (filters.department !== 'all' && (j.department || '').toLowerCase() !== filters.department) return false;
      }
      if (filters.salaryRange !== 'all') {
        const [minStr, maxStr] = filters.salaryRange.split('-');
        const min = minStr ? parseInt(minStr, 10) : 0;
        const max = maxStr ? parseInt(maxStr, 10) : Infinity;
        const smin = j.salary_min || 0;
        const smax = j.salary_max || 0;
        const anyInRange = (smin >= min && smin <= max) || (smax >= min && smax <= max) || (smin <= min && smax >= max);
        if (!anyInRange) return false;
      }
      if (filters.postedWithin !== 'all') {
        const days = parseInt(filters.postedWithin, 10);
        const created = j.created_at ? new Date(j.created_at) : null;
        if (!created) return false;
        const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > days) return false;
      }
      return true;
    };
    uniqueRows = uniqueRows.filter(matchesFilters);

    // Set counts
    setTotalJobs(totalCount);
    setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));

    // Fetch bookmark ids explicitly (do NOT rely on feed flag)
    if (user?.id) {
      const { data: ids, error: idsErr } = await supabase
        .from('job_bookmarks')
        .select('job_id')
        .eq('user_id', user.id);

      if (!idsErr) {
        const idsList = (ids || []).map(r => r.job_id);
        setBookmarkedJobs(idsList);
        const idSet = new Set(idsList);
        // Keep bookmarked jobs at the top
        uniqueRows = [...uniqueRows].sort((a, b) => {
          const aB = idSet.has(a.id), bB = idSet.has(b.id);
          if (aB && !bB) return -1;
          if (!aB && bB) return 1;
          return 0;
        });
      }
    }

    setJobs(uniqueRows);
    setLoading(false);
  }, [searchQuery, sortBy, currentPage, user, userRole, pageSize, filters.department, filters.experience, filters.industry, filters.jobType, filters.location, filters.postedWithin, filters.salaryRange, sourceFilter]);

  // Realtime
  const handleRealtimeJobChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    setJobs(currentJobs => {
      if (eventType === 'INSERT') {
        toast('A new job has been posted.', { icon: 'ℹ️' });
        return [newRecord, ...currentJobs];
      }
      if (eventType === 'UPDATE') {
        toast('A job listing has been updated.', { icon: 'ℹ️' });
        return currentJobs.map(job => job.id === newRecord.id ? newRecord : job);
      }
      if (eventType === 'DELETE') {
        toast('A job listing has been removed.', { icon: 'ℹ️' });
        return currentJobs.filter(job => job.id !== oldRecord.id);
      }
      return currentJobs;
    });
  }, []);

  const handleRealtimeBookmarkChange = useCallback(async () => {
    // Light refresh of bookmark IDs
    if (!user?.id) return;
    const { data: ids } = await supabase
      .from('job_bookmarks')
      .select('job_id')
      .eq('user_id', user.id);
    const idsList = (ids || []).map(r => r.job_id);
    setBookmarkedJobs(idsList);
  }, [user?.id]);

  useJobsRealtime({
    userId: user?.id,
    onJobs: handleRealtimeJobChange,
    onBookmarks: handleRealtimeBookmarkChange,
  });

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set('q', searchQuery); else params.delete('q');
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, v); else params.delete(k); });
    if (sourceFilter && sourceFilter !== 'all') params.set('source', sourceFilter); else params.delete('source');
    params.set('page', String(currentPage));
    params.set('sort', sortBy);
    if (['admin', 'super_admin', 'employer'].includes(userRole)) {
      if (approvalFilter && approvalFilter !== 'all') params.set('approval', approvalFilter); else params.delete('approval');
    } else {
      params.delete('approval');
    }
    if (viewMode) params.set('view', viewMode);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters, currentPage, sortBy, approvalFilter, viewMode, sourceFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchTerm); setCurrentPage(1); }, 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ---------- FIXED: Optimistic toggle that doesn’t rely on feed flags ---------- */
  const handleBookmark = async (jobId) => {
    if (!user) {
      notification.showWarning('Please login to bookmark jobs');
      return;
    }

    const wasBookmarked = bookmarkedJobs.includes(jobId);

    // Cap before adding
    if (!wasBookmarked && bookmarkedJobs.length >= 3) {
      toast.error('You can only bookmark up to 3 jobs.');
      return;
    }

    // Optimistic update
    setBookmarkedJobs(prev => (wasBookmarked ? prev.filter(id => id !== jobId) : [...prev, jobId]));

    try {
      const nowBookmarked = await toggleBookmarkRPC(supabase, jobId);
      // Ensure state matches server outcome
      setBookmarkedJobs(prev => (nowBookmarked ? Array.from(new Set([...prev, jobId])) : prev.filter(id => id !== jobId)));
      toast.success(nowBookmarked ? 'Job bookmarked!' : 'Bookmark removed');
    } catch (e) {
      console.error('Error bookmarking job:', e);
      // Revert optimistic change
      setBookmarkedJobs(prev => (wasBookmarked ? Array.from(new Set([...prev, jobId])) : prev.filter(id => id !== jobId)));
      notification.showError(`Failed to update bookmark: ${e.message}`);
    }
  };

  const handleFilterChange = (filterType, value) => { setFilters(prev => ({ ...prev, [filterType]: value })); setCurrentPage(1); };
  const handleSearch = () => { setSearchQuery(searchTerm); setCurrentPage(1); };
  const paginate = (pageNumber) => { setCurrentPage(pageNumber); };
  const handleRefresh = async () => { setIsRefreshing(true); await fetchJobs(); setIsRefreshing(false); toast.success('Job listings have been refreshed!'); };

  const canPostJob = ['employer', 'admin', 'super_admin'].includes(userRole);

  if (authLoading) {
    return (<div className="flex justify-center items-center h-screen"><CircularProgress /></div>);
  }

  return (
    <main id="main-content" className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Find Your Next Opportunity</h1>
          </div>
          <p className="text-gray-600 mt-1">Showing {jobs.length} of {totalJobs} jobs</p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4 mt-4 md:mt-0 flex-wrap">
          <Link to="/jobs/applications" className="btn-secondary-outline text-sm">
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            My Applications
          </Link>
          <Link to="/jobs/alerts" className="btn-secondary-outline text-sm">
            <BellIcon className="w-4 h-4 mr-2" />
            My Job Alerts
          </Link>
          {canPostJob && (
            <button onClick={goPostJob} disabled={apprLoading || !isApprovedEmployer} aria-disabled={apprLoading || !isApprovedEmployer} title={!isApprovedEmployer ? 'Your profile is not approved. Kindly contact administrator.' : 'Post a Job'} className={"btn-primary text-sm " + ((apprLoading || !isApprovedEmployer) ? 'opacity-60 cursor-not-allowed' : '')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Post a Job
            </button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, skill, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
            />
          </div>
          <button onClick={handleSearch} className="btn-ocean px-6 py-2 rounded-lg text-sm w-full md:w-auto">Search</button>
          <button onClick={toggleFilters} aria-label="Toggle filters" aria-expanded={filtersOpen} aria-controls="job-filters" className="btn-ocean-outline px-4 py-2 rounded-lg text-sm w-full md:w-auto flex items-center justify-center min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2">
            <FunnelIcon className="w-4 h-4 mr-2" />
            {filtersOpen ? 'Hide Filters' : 'Filters'}
          </button>
        </div>
      </div>

      {filtersOpen && (
      <div id="job-filters" ref={filtersRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(filterOptions).map(([key, options]) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
          >
            {options.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
        ))}
        {['admin', 'super_admin', 'employer'].includes(userRole) && (
          <select
            value={approvalFilter}
            onChange={(e) => { setApprovalFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
            aria-label="Approval filter"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
        <button
          onClick={() => {
            setSearchTerm('');
            setSearchQuery('');
            setFilters({ jobType: 'all', experience: 'all', location: 'all', industry: 'all', department: 'all', salaryRange: 'all', postedWithin: 'all' });
            setApprovalFilter('all');
            setSortBy('created_at,desc');
            setCurrentPage(1);
          }}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border-2 border-ocean-600 text-ocean-600 hover:bg-ocean-600 hover:text-white text-sm transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
          aria-label="Reset filters"
        >
          Reset Filters
        </button>
      </div>
      )}

      {/* View + Sort */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-lg">
          <button onClick={() => setViewMode('grid')} className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg text-sm ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}>
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg text-sm ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}>
            <ListBulletIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg text-sm ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:shadow'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}
            title="Refresh job listings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644L6.166 16.46m11.668-11.668h-4.992v.001M21.015 4.356v4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0M21.015 4.356L17.834 7.54z" />
            </svg>
          </button>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500">
          <option value="created_at,desc">Sort by Newest</option>
          <option value="created_at,asc">Sort by Oldest</option>
          <option value="deadline,asc">Deadline (Soonest)</option>
          <option value="deadline,desc">Deadline (Latest)</option>
          <option value="title,asc">Title (A-Z)</option>
          <option value="title,desc">Title (Z-A)</option>
        </select>
      </div>

      {/* Jobs */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-ocean-100 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-ocean-100 rounded-lg w-1/2"></div>
                </div>
                <div className="h-8 w-8 bg-ocean-100 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-ocean-100 rounded-lg w-full"></div>
                <div className="h-4 bg-ocean-100 rounded-lg w-5/6"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-ocean-100 rounded-full w-16"></div>
                <div className="h-6 bg-ocean-100 rounded-full w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
          {jobs.map((job) => (
            viewMode === 'grid' ? (
              <JobCard
                key={job.id}
                job={job}
                handleBookmark={handleBookmark}
                isBookmarked={bookmarkedJobs.includes(job.id)}
              />
            ) : (
              <JobListItem
                key={job.id}
                job={job}
                handleBookmark={handleBookmark}
                isBookmarked={bookmarkedJobs.includes(job.id)}
              />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-card rounded-lg">
          <div className="w-16 h-16 bg-ocean-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlassIcon className="w-8 h-8 text-ocean-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchQuery('');
                setFilters({ jobType: 'all', experience: 'all', location: 'all', industry: 'all', department: 'all', salaryRange: 'all', postedWithin: 'all' });
                setCurrentPage(1);
                notification.showInfo('All filters cleared');
              }}
              className="btn-ocean-outline px-4 py-2 rounded-lg text-sm"
            >
              Clear all filters
            </button>
            <Link to="/jobs/alerts" className="btn-ocean px-4 py-2 rounded-lg text-sm flex items-center">
              <BellIcon className="w-4 h-4 mr-2" />
              Create Job Alert
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            className="inline-flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200"
          >
            Previous
          </button>

          <span aria-current="page" className="min-h-[44px] px-4 py-2 rounded-lg bg-ocean-600 text-white font-medium flex items-center">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            className="inline-flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200"
          >
            Next
          </button>
        </nav>
      )}
      </div>
    </main>
  );
};

export { JobCard };
export default JobListingsPage;
