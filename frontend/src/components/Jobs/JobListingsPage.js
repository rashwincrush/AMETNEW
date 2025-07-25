import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  BookmarkIcon,
  ShareIcon,
  PlusIcon,
  BellIcon,
  UsersIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNotification } from '../common/NotificationCenter';
import SocialShareButtons from '../common/SocialShareButtons';
import BookmarkButton from './BookmarkButton';



// Define the filterOptions outside of the component to prevent re-creating on each render
const filterOptions = {
  jobType: [
    { value: 'all', label: 'All Job Types' },
    { value: 'full-time', label: 'Full-Time' },
    { value: 'part-time', label: 'Part-Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
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

// Job card component for grid view
const JobCard = ({ job, handleBookmark, isBookmarked, isPinned }) => {
  const [showShare, setShowShare] = useState(false);
  if (!job) return null;

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified';
    if (min && !max) return `From ${min / 100000}L`;
    if (!min && max) return `Up to ${max / 100000}L`;
    return `${min / 100000}L - ${max / 100000}L`;
  };

  return (
    <div className={`glass-card rounded-lg p-6 hover:shadow-lg transition-shadow border ${isPinned ? 'border-ocean-500' : 'border-transparent'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <img 
            src={job.companies?.logo_url || '/logo.png'} 
            alt={job.companies?.name || 'Company'}
            className="w-12 h-12 rounded-lg object-cover mr-4"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              {isPinned && (
                  <div className="bg-ocean-100 text-ocean-800 text-xs font-semibold px-2 py-0.5 rounded-full">Pinned</div>
              )}
            </div>
            <p className="text-ocean-600 font-medium">{job.companies?.name || job.company_name}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <button onClick={() => setShowShare(!showShare)} className="p-2 rounded-full hover:bg-gray-100">
              <ShareIcon className="w-5 h-5 text-gray-500" />
            </button>
            {showShare && (
              <div className="absolute right-0 top-full mt-2 z-10 bg-white p-2 rounded-lg shadow-lg">
                 <SocialShareButtons shareUrl={`${window.location.origin}/jobs/${job.id}`} title={job.title} />
              </div>
            )}
          </div>
          <BookmarkButton
            jobId={job.id}
            isBookmarked={isBookmarked}
            handleBookmark={handleBookmark}
          />
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description || 'No description provided.'}</p>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 mr-1" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <BriefcaseIcon className="w-4 h-4 mr-1" />
          <span className="capitalize">{job.job_type}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 mr-1" />
          <span className="capitalize">{job.experience_level || 'Any Level'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {(job.skills || []).slice(0, 4).map((skill, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs"
          >
            {skill}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {job.applicant_count || (job.applicants && Array.isArray(job.applicants) && job.applicants.length > 0 ? job.applicants[0].count : 0)} applicants
        </span>
        <div className="space-x-2">
          <Link 
            to={`/jobs/${job.id}`}
            className="btn-ocean-outline py-1 px-3 rounded text-sm"
          >
            View Details
          </Link>
          <Link 
            to={`/jobs/${job.id}/apply`}
            className="btn-ocean py-1 px-3 rounded text-sm"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
};

// Job list item component for list view
const JobListItem = ({ job, handleBookmark, isBookmarked, isPinned }) => {
  const [showShare, setShowShare] = useState(false);
  if (!job) return null;

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified';
    if (min && !max) return `From ${min / 100000}L`;
    if (!min && max) return `Up to ${max / 100000}L`;
    return `${min / 100000}L - ${max / 100000}L`;
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  return (
    <div className={`glass-card rounded-lg p-4 hover:shadow-lg transition-shadow flex flex-col sm:flex-row items-start gap-4 border ${isPinned ? 'border-ocean-500' : 'border-transparent'}`}>
      <img 
        src={job.companies?.logo_url || '/logo.png'} 
        alt={job.companies?.name || 'Company'}
        className="w-16 h-16 rounded-lg object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Link to={`/jobs/${job.id}`} className="text-lg font-bold text-gray-900 hover:text-ocean-600 transition-colors duration-200">
                    {job.title}
                </Link>
                {isPinned && (
                    <div className="bg-ocean-100 text-ocean-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pinned</div>
                )}
            </div>
            <span className="text-xs text-gray-500">{timeAgo(job.created_at)}</span>
        </div>
        <p className="text-ocean-600 font-medium mb-2">{job.companies?.name || job.company_name}</p>
        <p className="text-gray-600 text-sm mt-2 mb-3 line-clamp-2">{job.description ? `${job.description.slice(0, 150)}...` : 'No description provided.'}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center">
            <BriefcaseIcon className="w-4 h-4 mr-1" />
            <span className="capitalize">{job.job_type}</span>
          </div>
          <div className="flex items-center">
            <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
            <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-1" />
            <span>{job.applicants && Array.isArray(job.applicants) && job.applicants.length > 0 ? job.applicants[0].count : 0} applicants</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between self-stretch pt-2 sm:pt-0">
        <div className="flex items-center">
          <div className="relative">
            <button onClick={() => setShowShare(!showShare)} className="p-2 rounded-full hover:bg-gray-100">
              <ShareIcon className="w-5 h-5 text-gray-500" />
            </button>
            {showShare && (
              <div className="absolute right-0 top-full mt-2 z-10 bg-white p-2 rounded-lg shadow-lg">
                <SocialShareButtons shareUrl={`${window.location.origin}/jobs/${job.id}`} title={job.title} />
              </div>
            )}
          </div>
          <BookmarkButton
            jobId={job.id}
            isBookmarked={isBookmarked}
            handleBookmark={handleBookmark}
          />
        </div>
        <Link to={`/jobs/${job.id}`} className="btn-ocean-outline px-4 py-2 rounded-lg text-sm mt-4">
          View Details
        </Link>
      </div>
    </div>
  );
};

// Main JobListingsPage component
const JobListingsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const notification = useNotification();
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    experience: 'all',
    location: 'all',
    industry: 'all',
    salaryRange: 'all',
    postedWithin: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('created_at,desc');
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchController = useRef(null);
  const initialFetchDone = useRef(false);

  const fetchJobs = useCallback(async () => {
    if (fetchController.current) {
      fetchController.current.abort();
    }
    fetchController.current = new AbortController();
    const { signal } = fetchController.current;

    setLoading(true);
    // Log only in development environment
    if (process.env.NODE_ENV !== 'production') {
      console.log('Fetching jobs with filters:', { searchQuery, sortBy, currentPage });
    }

    const [sortField, sortOrder] = sortBy.split(',');

    const { data, error } = await supabase.rpc('get_jobs_with_bookmarks', {
      p_search_query: searchQuery,
      p_sort_by: sortField,
      p_sort_order: sortOrder,
      p_limit: pageSize,
      p_offset: (currentPage - 1) * pageSize
    });

    if (error) {
      console.error('Error fetching jobs via RPC:', error);
      toast.error('Failed to fetch jobs.');
      setJobs([]);
      setTotalJobs(0);
    } else {
      console.log('Jobs fetched successfully:', data);
      const fetchedJobs = data.map(j => ({ ...j, companies: { name: j.company_name, logo_url: j.company_logo_url } }));
      const uniqueJobs = Array.from(new Map(fetchedJobs.map(job => [job.id, job])).values());
      setJobs(uniqueJobs);
      setTotalJobs(data[0]?.total_count || 0);
      // Also update bookmarked jobs state from the fetched data
      const newBookmarkedJobs = data.filter(j => j.is_bookmarked).map(j => j.id);
      setBookmarkedJobs(newBookmarkedJobs);
    }

    setLoading(false);
  }, [searchQuery, sortBy, currentPage, user, supabase, pageSize]);

  useEffect(() => {
    if (initialFetchDone.current) {
      fetchJobs();
    } else {
      initialFetchDone.current = true;
      fetchJobs();
    }

    let channel;
    try {
      channel = supabase
        .channel('job-applications-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_applications' }, (payload) => {
          // Reduce verbose logging in production
          if (process.env.NODE_ENV !== 'production') {
            console.log('New application detected, refetching jobs');
          }
          toast.success('A new application was submitted. Refreshing list...');
          fetchJobs();
        })
        .subscribe()
        .catch(error => {
          console.error('Error subscribing to realtime channel:', error);
        });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchJobs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setIsRefreshing(false);
    toast.success('Job listings have been updated!');
  };

  const handleBookmark = async (jobId) => {
    if (!user) {
      notification.showWarning('Please login to bookmark jobs');
      return;
    }

    try {
      const isBookmarked = bookmarkedJobs.includes(jobId);

      if (isBookmarked) {
        // Always allow un-bookmarking
        const { error } = await supabase
          .from('job_bookmarks')
          .delete()
          .match({ user_id: user.id, job_id: jobId });

        if (error) throw error;
        toast.success('Bookmark removed');
      } else {
        // Check limit before adding a new bookmark
        if (bookmarkedJobs.length >= 3) {
          toast.error('You can only bookmark up to 3 jobs.');
          return;
        }

        const { error } = await supabase
          .from('job_bookmarks')
          .insert({ user_id: user.id, job_id: jobId });

        if (error) {
            // Handle the case where the DB trigger prevents insertion
            if (error.message.includes('Users can only bookmark up to 3 jobs')) {
                toast.error('You can only bookmark up to 3 jobs.');
            } else {
                throw error;
            }
        } else {
            toast.success('Job bookmarked and pinned to top!');
        }
      }

      // Refresh the job list to show the new pinned order and state
      fetchJobs();

    } catch (error) {
      console.error('Error bookmarking job:', error);
      notification.showError(`Failed to update bookmark: ${error.message}`);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchQuery(searchTerm);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
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
          <Link to="/jobs/post" className="btn-primary text-sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Post a Job
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
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
          <button 
            onClick={handleSearch}
            className="btn-ocean px-6 py-2 rounded-lg text-sm w-full md:w-auto"
          >
            Search
          </button>
          <button className="btn-ocean-outline px-4 py-2 rounded-lg text-sm w-full md:w-auto flex items-center justify-center">
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filter Dropdowns - This can be a separate component */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(filterOptions).map(([key, options]) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ))}
      </div>

      {/* View mode toggle and sort */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-600'}`}
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'}`}
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-3 py-1 rounded-md text-sm ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:shadow'}`}
            title="Refresh job listings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644L6.166 16.46m11.668-11.668h-4.992v.001M21.015 4.356v4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0M21.015 4.356L17.834 7.54z" />
            </svg>
          </button>
        </div>
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
        >
          <option value="created_at,desc">Sort by Newest</option>
          <option value="created_at,asc">Sort by Oldest</option>
          <option value="salary_min,desc">Sort by Salary (High-Low)</option>
          <option value="salary_min,asc">Sort by Salary (Low-High)</option>
        </select>
      </div>

      {/* Jobs Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500"></div>
          <p className="ml-4 text-ocean-600">Loading Jobs...</p>
        </div>
      ) : jobs.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {jobs.map((job) => (
            viewMode === 'grid' ? (
              <JobCard 
                key={job.id} 
                job={job} 
                handleBookmark={handleBookmark} 
                isBookmarked={bookmarkedJobs.includes(job.id)} 
                isPinned={bookmarkedJobs.includes(job.id)}
              />
            ) : (
              <JobListItem 
                key={job.id} 
                job={job} 
                handleBookmark={handleBookmark} 
                isBookmarked={bookmarkedJobs.includes(job.id)} 
                isPinned={bookmarkedJobs.includes(job.id)}
              />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-10 glass-card rounded-lg p-6 shadow-md">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-2">No jobs found matching your criteria</p>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters.</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => {
                setSearchTerm('');
                setSearchQuery('');
                setFilters({
                  jobType: 'all',
                  experience: 'all',
                  location: 'all',
                  industry: 'all',
                  salaryRange: 'all',
                  postedWithin: 'all'
                });
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
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={`px-3 py-2 ${currentPage === pageNum 
                  ? 'bg-ocean-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'} rounded-lg text-sm`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export { JobCard };
export default JobListingsPage;
