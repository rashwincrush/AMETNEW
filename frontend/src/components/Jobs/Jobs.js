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
  return (
    <div className="glass-card rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <img 
            src={job.companyLogo} 
            alt={job.company}
            className="w-12 h-12 rounded-lg object-cover mr-4"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{job.title}</h3>
            <p className="text-ocean-600 font-medium">{job.company}</p>
          </div>
        </div>
        <button
          onClick={() => handleBookmark(job.id)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <BookmarkIcon className={`w-5 h-5 ${isBookmarked ? 'text-ocean-500 fill-ocean-500' : 'text-ocean-500'}`} />
        </button>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 mr-1" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <BriefcaseIcon className="w-4 h-4 mr-1" />
          <span>{job.jobType}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="w-4 h-4 mr-1" />
          <span>{job.experience || 'Any Level'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
          <span>{job.salaryRange}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {job.skills.slice(0, 4).map((skill, index) => (
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
  return (
    <div className="glass-card rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <img 
            src={job.companyLogo} 
            alt={job.company}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                <p className="text-ocean-600 font-medium">{job.company}</p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{job.description}</p>
              </div>
              <button
                onClick={() => handleBookmark(job.id)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <BookmarkIcon className={`w-5 h-5 ${isBookmarked ? 'text-ocean-500 fill-ocean-500' : 'text-ocean-500'}`} />
              </button>
            </div>
            
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="w-4 h-4 mr-1" />
                <span>{job.jobType}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>{job.experience || 'Any Level'}</span>
              </div>
              <div className="flex items-center">
                <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                <span>{job.salaryRange}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-wrap gap-1">
                {job.skills.slice(0, 4).map((skill, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {job.applicants || 0} applicants
                </span>
                <Link 
                  to={`/jobs/${job.id}`}
                  className="btn-ocean-outline py-1 px-3 rounded text-sm"
                >
                  View Details
                </Link>
                <button className="btn-ocean py-1 px-3 rounded text-sm">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Jobs component
const Jobs = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    experience: 'all',
    location: 'all',
    industry: 'all',
    salaryRange: 'all',
    postedWithin: 'all'
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    totalCount: 0,
    hasMore: true
  });

  const fetchBookmarkedJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookmarked_jobs')
        .select('job_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const bookmarkedIds = data.map(item => item.job_id);
      setBookmarkedJobs(bookmarkedIds);
    } catch (error) {
      console.error('Error fetching bookmarked jobs:', error);
      // Do not toast here, as it might be too noisy during initial load
    }
  }, [user]);

  // Fetch jobs from Supabase
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        // .eq('is_approved', true) // Temporarily commented out to show all active jobs
        .eq('is_active', true);
      
      if (filters.jobType !== 'all') {
        query = query.eq('job_type', filters.jobType);
      }
      if (filters.location !== 'all' && filters.location !== 'remote') {
        query = query.ilike('location', `%${filters.location}%`);
      } else if (filters.location === 'remote'){
        query = query.eq('is_remote', true);
      }
      
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,skills.ilike.%${searchQuery}%`
        );
      }
      
      if (filters.postedWithin !== 'all') {
        const daysAgo = parseInt(filters.postedWithin);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        query = query.gte('created_at', date.toISOString());
      }

      if (filters.experience !== 'all') {
        query = query.eq('experience_level', filters.experience);
      }

      if (filters.industry !== 'all') {
        query = query.eq('industry', filters.industry);
      }
      
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      const formattedJobs = data.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company_name, // Ensure this matches your table column
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        jobType: job.job_type || 'full-time',
        salaryRange: job.salary_range || 'Not specified',
        experience: job.experience_level || 'Any Level',
        applicationDeadline: job.application_deadline,
        postedBy: job.posted_by,
        postedAt: job.created_at,
        companyLogo: job.company_logo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(job.company_name || 'Company') + '&background=0D8ABC&color=fff',
        skills: job.skills ? job.skills.split(',').map(s => s.trim()) : [],
        applicants: job.applicants_count || 0 // Assuming you have this field
      }));
      
      if (pagination.page === 0) {
        setJobs(formattedJobs);
      } else {
        setJobs(prevJobs => [...prevJobs, ...formattedJobs]);
      }

      setPagination(prev => ({
        ...prev,
        totalCount: count || 0,
        hasMore: (count || 0) > (from + formattedJobs.length)
      }));
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, pagination.page, pagination.pageSize, location]); // Removed user from deps, fetchBookmarkedJobs handles user changes

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (user) {
      fetchBookmarkedJobs();
    }
  }, [user, fetchBookmarkedJobs]);

  // Handle job bookmarking
  const handleBookmark = async (jobId) => {
    if (!user) {
      toast.error('Please login to bookmark jobs');
      return;
    }
    
    try {
      const isBookmarked = bookmarkedJobs.includes(jobId);
      
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarked_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId);
        
        if (error) throw error;
        setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
        toast.success('Job removed from bookmarks');
      } else {
        const { error } = await supabase
          .from('bookmarked_jobs')
          .insert({ user_id: user.id, job_id: jobId });
        
        if (error) throw error;
        setBookmarkedJobs(prev => [...prev, jobId]);
        toast.success('Job added to bookmarks');
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };
  
  const handleFilterChange = (filterType, value) => {
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page on filter change
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-ocean-100 via-sky-50 to-blue-100 min-h-screen">
      {/* Header */}
      <div className="glass-card rounded-lg p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ocean-700 mb-2">Job Portal</h1>
            <p className="text-gray-600">Discover career opportunities in the maritime industry</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Link 
              to="/jobs/alerts" 
              className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <BellIcon className="w-4 h-4 mr-2" />
              Job Alerts
            </Link>
            <Link 
              to="/jobs/post" 
              className="btn-ocean px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Post Job
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-lg p-6 shadow-md">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination(prev => ({ ...prev, page: 0 })); // Reset page on search
                }}
                className="form-input w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-ocean-500 focus:ring-ocean-500"
                placeholder="Search jobs, companies, or skills..."
              />
            </div>
          </div>
          
          <div className="flex border border-gray-300 rounded-lg p-1 bg-gray-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-ocean-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Grid View"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-ocean-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              title="List View"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(filterOptions).map(([filterType, options]) => (
            <select
              key={filterType}
              value={filters[filterType]}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              className="form-input px-3 py-2 rounded text-sm border-gray-300 focus:border-ocean-500 focus:ring-ocean-500"
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-gray-700">
          Showing <span className="font-medium text-ocean-600">{jobs.length}</span> of <span className="font-medium text-ocean-600">{pagination.totalCount}</span> jobs
        </p>
        {/* Add sort options if needed */}
      </div>

      {/* Jobs Grid/List */}
      {loading && pagination.page === 0 ? (
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
          <button 
            onClick={() => {
              setSearchQuery('');
              setFilters({
                jobType: 'all',
                experience: 'all',
                location: 'all',
                industry: 'all',
                salaryRange: 'all',
                postedWithin: 'all'
              });
              setPagination(prev => ({ ...prev, page: 0 }));
            }}
            className="btn-ocean-outline px-4 py-2 rounded-lg text-sm"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Load More */}
      {pagination.hasMore && jobs.length > 0 && (
        <div className="text-center mt-8">
          <button 
            className="btn-ocean px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading && pagination.page > 0 ? 'Loading...' : 'Load More Jobs'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs;
