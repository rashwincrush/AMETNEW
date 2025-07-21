import React, { useState, useEffect, useCallback } from 'react';
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
  BellIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNotification } from '../common/NotificationCenter';
import SocialShareButtons from '../common/SocialShareButtons';

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
const JobCard = ({ job, handleBookmark, isBookmarked }) => {
  const [showShare, setShowShare] = useState(false);
  if (!job) return null;


  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified';
    if (min && !max) return `From ${min / 100000}L`;
    if (!min && max) return `Up to ${max / 100000}L`;
    return `${min / 100000}L - ${max / 100000}L`;
  };

  return (
    <div className="glass-card rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <img 
            src={job.companies?.logo_url || '/placeholder-logo.png'} 
            alt={job.companies?.name || 'Company'}
            className="w-12 h-12 rounded-lg object-cover mr-4"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{job.title}</h3>
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
          <button
            onClick={() => handleBookmark(job.id)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <BookmarkIcon className={`w-5 h-5 ${isBookmarked ? 'text-ocean-500 fill-ocean-500' : 'text-ocean-500'}`} />
          </button>
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
          {job.applicants || 0} applicants
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
const JobListItem = ({ job, handleBookmark, isBookmarked }) => {
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
    <div className="glass-card rounded-lg p-4 hover:shadow-lg transition-shadow flex flex-col sm:flex-row items-start gap-4">
      <img 
        src={job.companies?.logo_url || '/placeholder-logo.png'} 
        alt={job.companies?.name || 'Company'}
        className="w-16 h-16 rounded-lg object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{job.title}</h3>
          <span className="text-xs text-gray-500">{timeAgo(job.created_at)}</span>
        </div>
        <p className="text-ocean-600 font-medium mb-2">{job.companies?.name || job.company_name}</p>
        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{job.description ? `${job.description.slice(0, 150)}...` : 'No description provided.'}</p>
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
          <button
            onClick={() => handleBookmark(job.id)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <BookmarkIcon className={`w-5 h-5 ${isBookmarked ? 'text-ocean-500 fill-ocean-500' : 'text-ocean-500'}`} />
          </button>
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

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {




      
      // Start building query
      let query = supabase
        .from('jobs')
        .select('*, companies(*)', { count: 'exact' });

      // Apply search query if present
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,required_skills.ilike.%${searchQuery}%`);
      }

      // Apply filters
      if (filters.jobType !== 'all') {
        query = query.eq('job_type', filters.jobType);
      }
      
      if (filters.location !== 'all') {
        if (filters.location === 'remote') {
          // Special case for remote jobs that might be indicated in different ways
          query = query.or('location.ilike.%remote%,location.ilike.%anywhere%,remote.eq.true');
        } else {
          query = query.ilike('location', `%${filters.location}%`);
        }
      }
      
      if (filters.experience !== 'all') {
        query = query.eq('experience_level', filters.experience);
      }
      
      if (filters.industry !== 'all') {
        query = query.or(`industry.ilike.%${filters.industry}%,required_skills.ilike.%${filters.industry}%`);
      }
      
      if (filters.salaryRange !== 'all') {
        const [min, max] = filters.salaryRange.split('-');
        if (min && max) {
          query = query.gte('salary_min', parseInt(min)).lte('salary_max', parseInt(max));
        } else if (min) {
          query = query.gte('salary_min', parseInt(min));
        } else if (max) {
          query = query.lte('salary_max', parseInt(max));
        }
      }
      
      if (filters.postedWithin !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.postedWithin));
        query = query.gte('created_at', daysAgo.toISOString());
      }

      // Apply sorting
      const [sortField, sortDirection] = sortBy.split(',');
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Get count before pagination
      const { count, error: countError } = await query;
      
      if (countError) {
        console.error('Error counting jobs:', countError);
        throw countError;
      }

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Fetch paginated results
      const { data, error } = await query.range(from, to);

      if (error) {
        console.error('Error fetching jobs:', error);
        throw error;
      }


      setJobs(data || []);
      setTotalJobs(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      notification.showError(`Failed to load jobs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, currentPage, pageSize, notification, totalJobs]);

  const fetchBookmarkedJobs = useCallback(async () => {
    if (!user) return;
    try {
      // Check if job_bookmarks table exists first
      const { data, error } = await supabase
        .from('job_bookmarks')
        .select('job_id')
        .eq('user_id', user.id);
      
      if (error) {
        // If the table doesn't exist, just set an empty array
        if (error.code === '42P01') { // PostgreSQL code for 'relation does not exist'
          console.warn('Job bookmarks table does not exist yet. This is normal if the feature is not implemented.');
          setBookmarkedJobs([]);
          return;
        }
        throw error;
      }
      
      setBookmarkedJobs(data.map(b => b.job_id));
    } catch (error) {
      console.error('Error fetching bookmarked jobs:', error);
      // Set empty array as fallback
      setBookmarkedJobs([]);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchBookmarkedJobs();
  }, [fetchBookmarkedJobs, user]);

  const handleBookmark = async (jobId) => {
    if (!user) {
      notification.showWarning('Please login to bookmark jobs');
      return;
    }

    try {
      if (bookmarkedJobs.includes(jobId)) {
        // Remove bookmark
        const { error } = await supabase
          .from('job_bookmarks')
          .delete()
          .match({ user_id: user.id, job_id: jobId });

        if (error) throw error;

        setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
        toast.success('Bookmark removed');
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('job_bookmarks')
          .insert({ user_id: user.id, job_id: jobId });

        if (error) throw error;

        setBookmarkedJobs(prev => [...prev, jobId]);
        toast.success('Job bookmarked!');
      }
    } catch (error) {
      console.error('Error bookmarking job:', error);
      notification.showError('Failed to update bookmark.');
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
          <h1 className="text-3xl font-bold text-gray-900">Job Portal</h1>
          <p className="text-gray-600 mt-1">Showing {jobs.length} of {totalJobs} jobs</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Link to="/jobs/alerts" className="btn-secondary-outline text-sm">
            <BellIcon className="w-4 h-4 mr-2" />
            My Job Alerts
          </Link>
          <Link to="/jobs/post/select" className="btn-primary text-sm">
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
          {jobs.map((job) => 
            viewMode === 'grid' 
              ? <JobCard key={job.id} job={job} handleBookmark={handleBookmark} isBookmarked={bookmarkedJobs.includes(job.id)} />
              : <JobListItem key={job.id} job={job} handleBookmark={handleBookmark} isBookmarked={bookmarkedJobs.includes(job.id)} />
          )}
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

export default JobListingsPage;
