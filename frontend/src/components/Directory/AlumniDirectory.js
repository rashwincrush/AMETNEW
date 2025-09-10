import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { logActivity } from '../../utils/activityLogger';

// Filters for public_profiles_view
const FILTERABLE_COLUMNS = [
  { name: 'graduation_year', label: 'Graduation Year', type: 'number', placeholder: 'e.g., 2015' },
  { name: 'department', label: 'Department', type: 'text', placeholder: 'e.g., Marine Engineering' },
];

const AlumniDirectory = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalAlumni, setTotalAlumni] = useState(0);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'full_name,asc');
  const [approvedMentorIds, setApprovedMentorIds] = useState(new Set());
  const isDebouncing = searchTerm !== debouncedSearch;
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const initialLoadDoneRef = useRef(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const subscribedRef = useRef(false);
  const channelRef = useRef(null);

  useEffect(() => {
    const fetchMentorIds = async () => {
      try {
        const { data: mentorData, error: mentorError } = await supabase
          .from('mentors')
          .select('user_id')
          .eq('status', 'approved');
        
        if (mentorError) throw mentorError;
        setApprovedMentorIds(new Set(mentorData.map(m => m.user_id)));
      } catch (err) {
        console.error('Error fetching mentor IDs:', err);
        setError('Could not load mentor information.');
      }
    };

    fetchMentorIds();
  }, []);

  const fetchAlumniData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Query from public_profiles_view (public subset of profile fields)
      let query = supabase
        .from('public_profiles_view')
        .select('id,full_name,avatar_url,degree_program,graduation_year,current_job_title,company_name,location,department,skills', { count: 'exact' });

      if (debouncedSearch) {
        const q = debouncedSearch.replace(/%/g, '');
        const cols = ['full_name','location','degree_program','department'];
        const ors = cols.map((c) => `${c}.ilike.%${q}%`).join(',');
        if (ors) query = query.or(ors);
      }

      for (const { name, type } of FILTERABLE_COLUMNS) {
        const value = filters[name];
        if (value !== undefined && value !== '' && value !== null) {
          if (type === 'text') {
            query = query.ilike(name, `%${value}%`);
          } else if (type === 'number') {
            query = query.eq(name, Number(value));
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
      // Use raw rows from public_profiles_view
      setAlumni(data || []);
      setTotalAlumni(count || 0);

      // Log directory view activity (best-effort)
      logActivity({
        action: 'directory_list_view',
        meta: {
          q: searchTerm || null,
          filters,
          sortBy,
          page: currentPage,
          perPage: itemsPerPage,
          resultCount: (data || []).length,
          total: count || 0,
        },
        route: '/directory'
      });
    } catch (err) {
      console.error('Error fetching alumni data:', err);
      setError('Failed to fetch alumni data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, sortBy, debouncedSearch, refreshTrigger]);

  useEffect(() => {
    const run = async () => {
      await fetchAlumniData();
      // Mark initial load as done once
      if (!initialLoadDoneRef.current) initialLoadDoneRef.current = true;
      setInitialLoaded(true);
    };
    run();
  }, [fetchAlumniData]);

  // Restore from URL on first mount (search, sort, filters)
  useEffect(() => {
    const initialQ = searchParams.get('q');
    const initialSort = searchParams.get('sort');
    if (initialQ !== null && initialQ !== searchTerm) setSearchTerm(initialQ);
    if (initialSort && initialSort !== sortBy) setSortBy(initialSort);
    // Restore filters from URL
    const restored = {};
    FILTERABLE_COLUMNS.forEach(({ name }) => {
      const v = searchParams.get(name);
      if (v !== null) restored[name] = v;
    });
    if (Object.keys(restored).length) setFilters(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search term
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Sync to URL when search or sort changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) params.set('q', searchTerm); else params.delete('q');
    if (sortBy) params.set('sort', sortBy); else params.delete('sort');
    setSearchParams(params, { replace: true });
  }, [searchTerm, sortBy]);
  
  // Realtime refresh when profiles change; subscribe only after initial load and only once
  useEffect(() => {
    if (!initialLoadDoneRef.current || subscribedRef.current) return;
    subscribedRef.current = true;
    const channel = supabase
      .channel('alumni-directory-refresh')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        try {
          const evt = payload.eventType;
          if (evt === 'INSERT' || evt === 'DELETE') {
            setRefreshTrigger(prev => prev + 1);
            return;
          }
          if (evt === 'UPDATE') {
            const oldRow = payload.old || {};
            const newRow = payload.new || {};
            if (
              oldRow.is_approved !== newRow.is_approved ||
              oldRow.role !== newRow.role ||
              oldRow.is_employer !== newRow.is_employer ||
              oldRow.positions !== newRow.positions ||
              oldRow.first_name !== newRow.first_name ||
              oldRow.last_name !== newRow.last_name ||
              oldRow.degree !== newRow.degree ||
              oldRow.department !== newRow.department
            ) {
              setRefreshTrigger(prev => prev + 1);
            }
          }
        } catch (e) {
          console.error('Realtime directory refresh error:', e);
        }
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      } catch (e) {
        console.warn('Failed to remove channel', e);
      }
    };
  }, [initialLoaded]);

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
    setRefreshTrigger(prev => prev + 1); // Trigger a fetch with new filters
    // Write filters to URL
    const params = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params, { replace: true });
    setShowFilters(false);
  };

  const handleClearSingleFilter = (filterName) => {
    const { [filterName]: cleared, ...rest } = filters;
    setFilters(rest);
    setCurrentPage(1);
    setRefreshTrigger(prev => prev + 1);
    // Remove from URL
    const params = new URLSearchParams(searchParams);
    params.delete(filterName);
    setSearchParams(params, { replace: true });
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setCurrentPage(1);
    setRefreshTrigger(prev => prev + 1);
    // Remove all filter params from URL
    const params = new URLSearchParams(searchParams);
    FILTERABLE_COLUMNS.forEach(({ name }) => params.delete(name));
    setSearchParams(params, { replace: true });
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
              placeholder="Search by name, degree, location, or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
            {isDebouncing && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Searching…</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span>Filters</span>
            </button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
              <option value="full_name,asc">Name (A-Z)</option>
              <option value="full_name,desc">Name (Z-A)</option>
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
            const filterConfig = FILTERABLE_COLUMNS.find(f => f.name === key);
            return (
              <span key={key} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                {filterConfig?.label || key}: <span className="font-semibold">{String(value)}</span>
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
              <h3 className="text-2xl font-bold text-gray-800">{searchTerm ? `No results for ‘${searchTerm}’` : 'No Alumni Found'}</h3>
              <p className="mt-3 text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {alumni.map(user => {
                  // The user object is now pre-mapped by mapProfileToCard
                  const finalUser = {
                    ...user, // Contains all fields from CardProfile type
                    isMentor: approvedMentorIds.has(user.id),
                  };

                  return viewMode === 'grid' ? (
                    <AlumniCard key={user.id} alumnus={finalUser} />
                  ) : (
                    <AlumniListItem key={user.id} alumnus={finalUser} />
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
                  {FILTERABLE_COLUMNS.map(filter => (
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