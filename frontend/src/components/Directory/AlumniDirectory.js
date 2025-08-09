import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import AlumniCard from './AlumniCard';
import AlumniListItem from './AlumniListItem';

// Column names mapped to user-friendly labels
const FILTER_CONFIG = {
  batch: { label: 'Graduation Year', type: 'number', placeholder: 'e.g., 2015' },
  degree_program: { label: 'Degree', type: 'text', placeholder: 'e.g., Marine Engineering' },
  company_name: { label: 'Company', type: 'text', placeholder: 'e.g., Maersk' },
  city: { label: 'Location', type: 'text', placeholder: 'e.g., Singapore' },
  current_job_title: { label: 'Job Title', type: 'text', placeholder: 'e.g., Chief Engineer' },
  is_mentor: { label: 'Is a Mentor', type: 'boolean' },
  is_employer: { label: 'Is an Employer', type: 'boolean' },
};

const AlumniDirectory = () => {
  const { isAuthenticated, profile } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalAlumni, setTotalAlumni] = useState(0);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('first_name,asc');
  const [approvedMentorIds, setApprovedMentorIds] = useState(new Set());
  const [filterableColumns, setFilterableColumns] = useState([]);
  // Use this to force refresh when needed
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Watch for profile changes that might affect directory data
  useEffect(() => {
    if (profile) {
      // If profile changed, trigger a refresh of alumni data
      setRefreshTrigger(prev => prev + 1);
    }
  }, [profile]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (initialDataLoaded) return;
      try {
        const { data: columns, error: schemaError } = await supabase.rpc('get_view_columns', {
          view_name: 'public_profiles_view'
        });

        if (schemaError) {
          console.error('Error fetching view schema:', schemaError);
          throw new Error('Could not load filter configuration.');
        }

        const availableColumns = columns.map(c => c.column_name);
        const dynamicFilters = Object.entries(FILTER_CONFIG)
          .filter(([key]) => availableColumns.includes(key))
          .map(([key, config]) => ({ ...config, name: key }));

        setFilterableColumns(dynamicFilters);

        const { data: mentorData, error: mentorError } = await supabase
          .from('mentors')
          .select('user_id')
          .eq('status', 'approved');
        
        if (mentorError) throw mentorError;
        setApprovedMentorIds(new Set(mentorData.map(m => m.user_id)));
        setInitialDataLoaded(true);

      } catch (err) {
        console.error('Error initializing directory:', err);
        setError(err.message || 'An error occurred during setup.');
      }
    };

    fetchInitialData();
  }, [initialDataLoaded]);

  const fetchAlumniData = useCallback(async () => {
    // Only set loading if we're not already loading
    if (!loading) {
      setLoading(true);
    }
    setError(null);
    try {
      let query = supabase
        .from('public_profiles_view')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,degree_program.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,current_job_title.ilike.%${searchTerm}%`);
      }

      for (const { name, type } of filterableColumns) {
        const value = filters[name];

        if (value !== undefined && value !== '' && value !== null) {
          // Special case for is_mentor: filter using the approvedMentorIds
          if (name === 'is_mentor' && value === true) {
            // Only apply if there are approved mentor IDs
            if (approvedMentorIds.size > 0) {
              // Convert Set to Array for the 'in' query
              const mentorIdsArray = Array.from(approvedMentorIds);
              query = query.in('id', mentorIdsArray);
            }
          } else if (type === 'text') {
            query = query.ilike(name, `%${value}%`);
          } else if (type === 'number') {
            query = query.eq(name, value);
          } else if (type === 'boolean') {
            query = query.eq(name, value);
          }
        }
      }

      const [sortField, sortOrder] = sortBy.split(',');
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setAlumni(data || []);
      setTotalAlumni(count || 0);
    } catch (err) {
      console.error('Error fetching alumni data:', err);
      setError('Failed to fetch alumni data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, sortBy, searchTerm, filterableColumns, refreshTrigger]);

  useEffect(() => {
    if (filterableColumns.length > 0) { 
        fetchAlumniData();
    }
  }, [fetchAlumniData, filterableColumns]);
  
  // Separate useEffect for visibility change to avoid unnecessary data fetching
  useEffect(() => {
    // Setup visibility change detection to refresh data when user returns to page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing alumni data');
        // Instead of immediately triggering a refresh, check if we need to
        if (!loading) {
          setRefreshTrigger(prev => prev + 1);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalAlumni / itemsPerPage);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const filterValue = type === 'checkbox' ? checked : value;
    setFilters(prev => ({ ...prev, [name]: filterValue }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchAlumniData(); 
  };

  const handleClearSingleFilter = (filterName) => {
    const { [filterName]: cleared, ...rest } = filters;
    setFilters(rest);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const renderFilterInput = (filter) => {
    switch (filter.type) {
      case 'number':
      case 'text':
        return (
          <input
            type={filter.type}
            name={filter.name}
            value={filters[filter.name] || ''}
            onChange={handleFilterChange}
            placeholder={filter.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={filter.name}
              checked={!!filters[filter.name]}
              onChange={handleFilterChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="mt-4 text-gray-600">Please <Link to="/login" className="text-indigo-600 hover:underline">log in</Link> to view the alumni directory.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Alumni Directory</h1>
          <p className="mt-2 text-lg text-gray-600">Explore and connect with the AMET University alumni network.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, degree, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span>Filters</span>
            </button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
              <option value="first_name,asc">Name (A-Z)</option>
              <option value="first_name,desc">Name (Z-A)</option>
              <option value="graduation_year,desc">Graduation (Newest)</option>
              <option value="graduation_year,asc">Graduation (Oldest)</option>
            </select>
            <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            const filterConfig = filterableColumns.find(f => f.name === key);
            return (
              <span key={key} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                {filterConfig?.label || key}: <span className="font-semibold">{typeof value === 'boolean' ? 'Yes' : value}</span>
                <button onClick={() => handleClearSingleFilter(key)} className="p-0.5 bg-indigo-200 rounded-full hover:bg-indigo-300">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {Object.keys(filters).length > 0 && (
            <button onClick={handleClearAllFilters} className="text-sm text-gray-600 hover:text-indigo-600 hover:underline">Clear all</button>
          )}
        </div>

        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-grow py-20">
              <img src="/logo.png" alt="Loading..." className="h-24 w-24 animate-spin" />
              <p className="mt-4 text-lg text-gray-600">Loading Alumni...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-6 rounded-lg flex items-center gap-4">
              <ExclamationTriangleIcon className="h-8 w-8" />
              <div>
                <h3 className="font-bold">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : alumni.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-800">No Alumni Found</h3>
              <p className="mt-3 text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {alumni.map(user => {
                  // Transform fields to match component expectations
                  const transformedUser = {
                    ...user,
                    // Basic info
                    name: user.full_name || user.name || 'Unknown',
                    avatar: user.avatar_url || null,
                    email: user.email || null,
                    phone: user.phone || null,
                    // Set graduation year from batch field
                    graduationYear: user.graduation_year || 'Unknown',
                    // Work info
                    isMentor: approvedMentorIds.has(user.id),
                    isEmployer: user.is_employer || false,
                    company: user.company_name || 'Unknown',
                    currentPosition: user.current_job_title || 'Unknown',
                    headline: user.headline || null,
                    bio: user.about || null,
                    experience: user.experience || null,
                    // Location
                    location: user.city || 'Unknown',
                    country: user.country || null,
                    // Education
                    degree: user.degree_program || 'Unknown',
                    department: user.department || null,
                    student_id: user.student_id || null,
                    // Skills & achievements
                    skills: user.skills || [],
                    achievements: user.achievements || [],
                    interests: user.interests || [],
                    languages: user.languages || [],
                    // Social links
                    socialLinks: user.social_links || {
                      linkedin: user.linkedin_url || null,
                      github: user.github_url || null,
                      twitter: user.twitter_url || null,
                      website: user.website_url || null
                    }
                  };
                  
                  return viewMode === 'grid' ? (
                    <AlumniCard key={user.id} alumnus={transformedUser} />
                  ) : (
                    <AlumniListItem key={user.id} alumnus={transformedUser} />
                  );
                })}
              </div>
              {!loading && totalPages > 1 && (
                  <div className="mt-10 flex flex-col items-center">
                      <div className="border-t w-full pt-6">
                          <div className="flex justify-between items-center">
                              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                  Previous
                              </button>
                              <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                  Next
                              </button>
                          </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                          Showing <span className="font-medium">{alumni.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalAlumni)}</span> of <span className="font-medium">{totalAlumni}</span> alumni
                      </div>
                  </div>
              )}
            </>
          )}
        </main>
      </div>

      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowFilters(false)}></div>
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="p-2 rounded-full hover:bg-gray-100">
                      <XMarkIcon className="h-6 w-6 text-gray-600" />
                  </button>
              </div>
              <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                  {filterableColumns.map(filter => (
                      <div key={filter.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{filter.label}</label>
                          {renderFilterInput(filter)}
                      </div>
                  ))}
              </div>
              <div className="pt-6 border-t mt-auto flex justify-between">
                  <button onClick={handleClearAllFilters} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50">Clear All</button>
                  <button onClick={handleApplyFilters} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-indigo-700">Apply Filters</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AlumniDirectory;