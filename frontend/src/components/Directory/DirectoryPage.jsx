import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase';
import ChipBar from './ChipBar';
import DirectoryGrid from './DirectoryGrid';
import { useConnectionsRealtime } from '../../hooks/useConnectionsRealtime';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import useDirectorySecure from '../../hooks/useDirectorySecure';
import useRoleCounts from '../../hooks/useRoleCounts';
import { ErrorState, PartialResultsBanner } from '../shared/ListStates';

export default function DirectoryPage() {
  const [me, setMe] = useState(null);
  // Profiles now come from RPC-only hook via `dataset`
  const [relMap, setRelMap] = useState(new Map());
  const [counts, setCounts] = useState({ received: 0, sent: 0, connected: 0 });
  const [activeFilter, setActiveFilter] = useState('alumni');
  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  // total is derived from filtered results later
  // Sort & Filters
  const [sortBy, setSortBy] = useState('full_name,asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    graduation_year: '',
    department: '',
    degree_program: '',
    current_job_title: '',
    location: ''
  });
  // Guard to avoid effect loop when rels arrive
  const [relsLoaded, setRelsLoaded] = useState(false);

  // Ensure page starts at the top when navigating from dashboard/other routes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    const main = document.getElementById('main-content');
    if (main) {
      try {
        if (typeof main.scrollTo === 'function') {
          main.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } else {
          main.scrollTop = 0;
        }
      } catch (_) {
        // best-effort only; ignore failures
      }
    }
  }, []);

  // Load current user once
  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setMe(user);
    })();
  }, []);

  // IDs to show when a chip is active (received/sent/connected)
  const tabIds = useMemo(() => {
    if (activeFilter === 'alumni' || activeFilter === 'students') return [];
    const arr = Array.from(relMap.entries());
    const filtered = arr
      .filter(([id, rel]) => {
        if (!rel) return false;
        if (activeFilter === 'received') return rel.status === 'pending' && rel.pending_side === 'received';
        if (activeFilter === 'sent') return rel.status === 'pending' && rel.pending_side === 'sent';
        if (activeFilter === 'connected') return ['accepted', 'connected'].includes(rel.status);
        return false;
      })
      .map(([id]) => id);
    // Stable order by name will be applied in the query
    return filtered;
  }, [activeFilter, relMap]);

  // Role-aware flags from auth; directory data always comes from secure RPC now
  const { isAdmin, getUserRole } = useAuth();
  const role = getUserRole ? getUserRole() : 'alumni';

  // Role-based counts for Alumni / Students / Employers
  const { displayCounts: roleCounts } = useRoleCounts();

  // Directory data via secure RPC (get_directory_profiles_secure)
  const {
    data: secureRows,
    totalCount,
    loading: dirLoading,
    error: dirError,
  } = useDirectorySecure({
    search: debouncedSearch,
    page: currentPage,
    pageSize: itemsPerPage,
    sortBy,
  });

  // Use hook loading directly
  const loading = dirLoading;

  // Helper predicates that categorize profiles by role; backend RPC enforces visibility/approval rules
  const isAlumniProfile = useCallback((raw = {}) => {
    if (raw.is_employer || raw.role === 'employer') return false;
    if (raw.role === 'student') return false;
    return true;
  }, []);

  const isStudentProfile = useCallback((raw = {}) => {
    return raw.role === 'student';
  }, []);

  const isEmployerProfile = useCallback((raw = {}) => {
    return !!(raw.is_employer || raw.role === 'employer');
  }, []);

  // Base directory rows from secure RPC; attach _raw for admin-only diagnostics
  const base = useMemo(
    () => (secureRows || []).map((row) => ({ ...row, _raw: row })),
    [secureRows]
  );

  // Counts passed to ChipBar; hide certain counts for non-admin roles per requirements.
  // Alumni / Students / Employers counts now come from role-aware backend RPCs via useRoleCounts.
  const countsForChips = useMemo(() => {
    const baseCounts = {
      ...counts,
      alumni: roleCounts.alumni,
      students: roleCounts.students,
      employers: roleCounts.employers,
    };

    if (!isAdmin) {
      if (role === 'alumni') {
        // Alumni should not see the number of students or employers
        baseCounts.students = undefined;
        baseCounts.employers = undefined;
      } else if (role === 'student') {
        // Students should not see the number of employers
        baseCounts.employers = undefined;
      }
      // Requests/connection counts remain but their chips are hidden via showConnections=false
    }

    return baseCounts;
  }, [counts, roleCounts.alumni, roleCounts.students, roleCounts.employers, isAdmin, role]);

  const loadRels = useCallback(async () => {
    // Relationship states for all others
    const { data, error } = await supabase
      .from('v_directory_connection_states')
      .select('other_user_id, status, pending_side, edge_ts');
    if (!error) {
      const map = new Map((data || []).map(r => [r.other_user_id, r]));
      setRelMap(map);
      setRelsLoaded(true);
    }
  }, []);

  const loadCounts = useCallback(async () => {
    if (!me?.id) return;
    // Use head:true exact counts to avoid transferring rows
    const [recvRes, sentRes, connRes] = await Promise.all([
      supabase
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', me.id)
        .eq('status', 'pending'),
      supabase
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .eq('requester_id', me.id)
        .eq('status', 'pending'),
      supabase
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .or(`requester_id.eq.${me.id},recipient_id.eq.${me.id}`)
        .eq('status', 'accepted')
    ]);
    setCounts({
      received: recvRes?.count ?? 0,
      sent: sentRes?.count ?? 0,
      connected: connRes?.count ?? 0,
    });
  }, [me?.id]);

  const reloadRelsAndCounts = useCallback(async () => {
    await Promise.all([loadRels(), loadCounts()]);
  }, [loadRels, loadCounts]);

  // Load rels and counts once user is known
  useEffect(() => {
    if (!me) return;
    loadRels();
    loadCounts();
  }, [me]);

  // Profiles are loaded by hook. Just ensure rels are loaded for tab filters.
  useEffect(() => {
    if (!me) return;
    if (!['alumni', 'students'].includes(activeFilter) && !relsLoaded) return;
    // No-op: hook handles data loading. We keep this effect to honor dependencies without warnings.
  }, [me, debouncedSearch, currentPage, itemsPerPage, activeFilter, filters.graduation_year, filters.department, sortBy, tabIds, relsLoaded]);

  // Realtime: refetch rels + counts on any connections change for me
  useConnectionsRealtime(me?.id, reloadRelsAndCounts);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset pagination when tab changes; also reload profiles
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const handleFilterChange = useCallback((nextFilter) => {
    setActiveFilter(nextFilter);
  }, []);

  // Merge profiles with relationship state
  const withRel = useMemo(
    () => (base || []).map((p) => ({
      ...p,
      // Relationship information from v_directory_connection_states
      rel: relMap.get(p.id) || { status: null, pending_side: null, edge_ts: null },
    })),
    [base, relMap]
  );

  // Priority strip: pending (sent or received), sort by newest edge_ts
  const priority = useMemo(() => {
    return withRel
      .filter(p => p.rel.status === 'pending')
      .sort((a, b) => new Date(b.rel.edge_ts || 0) - new Date(a.rel.edge_ts || 0))
      .slice(0, 8);
  }, [withRel]);

  const topIds = useMemo(() => new Set(priority.map(p => p.id)), [priority]);

  const rest = useMemo(() => withRel.filter(p => !topIds.has(p.id)), [withRel, topIds]);

  const applyFilter = useCallback((list, filter) => {
    if (filter === 'employers') return list.filter(p => isEmployerProfile(p._raw || p));
    if (filter === 'alumni') return list.filter(p => isAlumniProfile(p._raw || p));
    if (filter === 'students') return list.filter(p => isStudentProfile(p._raw || p));
    if (filter === 'received') return list.filter(p => p.rel.status === 'pending' && p.rel.pending_side === 'received');
    if (filter === 'sent') return list.filter(p => p.rel.status === 'pending' && p.rel.pending_side === 'sent');
    if (filter === 'connected') return list.filter(p => p.rel.status === 'accepted');
    return list;
  }, []);

  const filtered = useMemo(() => {
    const baseList = activeFilter === 'alumni' ? rest : withRel;
    let list = applyFilter(baseList, activeFilter);

    // Apply UI filters (batch year, department, degree, designation, location)
    const qYear = filters.graduation_year ? Number(filters.graduation_year) : null;
    const qDept = (filters.department || '').trim().toLowerCase();
    const qDegree = (filters.degree_program || '').trim().toLowerCase();
    const qTitle = (filters.current_job_title || '').trim().toLowerCase();
    const qLoc = (filters.location || '').trim().toLowerCase();

    if (qYear || qDept || qDegree || qTitle || qLoc) {
      list = list.filter((p) => {
        const raw = p._raw || p;

        const yearVal = raw.graduation_year ?? raw.batch_year ?? null;
        if (qYear !== null && Number(yearVal || 0) !== qYear) return false;

        const deptVal = String(raw.department || '').toLowerCase();
        if (qDept && !deptVal.includes(qDept)) return false;

        const degreeVal = String(raw.degree_program || raw.degree || '').toLowerCase();
        if (qDegree && !degreeVal.includes(qDegree)) return false;

        const titleVal = String(raw.current_job_title || raw.current_title || raw.job_title || '').toLowerCase();
        if (qTitle && !titleVal.includes(qTitle)) return false;

        const locVal = [raw.location, raw.location_city, raw.location_country]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (qLoc && !locVal.includes(qLoc)) return false;

        return true;
      });
    }

    return list;
  }, [withRel, rest, activeFilter, applyFilter, filters.graduation_year, filters.department, filters.degree_program, filters.current_job_title, filters.location]);

  // The secure RPC already applies pagination and sorting via page/pageSize/sortBy;
  // we only apply client-side filters (batch/department/degree/title/location).
  const pageItems = filtered;
  const hasNextPage = base.length >= itemsPerPage;
  const totalPages = totalCount
    ? Math.max(1, Math.ceil(totalCount / itemsPerPage))
    : null;

  if (role === 'employer') {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700 text-center">
          You do not have access to this directory with an employer account.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-600 via-indigo-600 to-purple-700 shadow-2xl">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        <div className="relative p-8 sm:p-12">
        {/* Centered title */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
              AMET Network directory
            </h1>
            <p className="text-lg text-indigo-100 max-w-2xl">
              Find members across batches, roles, and locations in the AMET community.
            </p>
          </div>
          {/* ChipBar with modern styling */}
        <div className="mb-6">
          <ChipBar counts={countsForChips} active={activeFilter} onChange={handleFilterChange} showEmployers={isAdmin} showConnections={isAdmin} />
        </div>
        </div>

        {/* Search and controls */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, role, company, or location"
                  aria-label="Search directory"
                  className="w-full min-h-[52px] rounded-xl border-2 border-white/40 bg-white/95 backdrop-blur-sm py-3 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-500 shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-600 focus-visible:border-white focus-visible:bg-white hover:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-xl border-2 border-white/40 bg-white/95 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg hover:bg-white hover:border-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-600"
                aria-label="Open filters"
              >
                <FunnelIcon className="h-5 w-5 text-slate-600" aria-hidden="true" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                aria-label="Sort alumni"
                className="min-h-[52px] rounded-xl border-2 border-white/40 bg-white/95 backdrop-blur-sm py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 shadow-lg hover:bg-white hover:border-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-600"
              >
                <option value="full_name,asc">Name (A–Z)</option>
                <option value="full_name,desc">Name (Z–A)</option>
                <option value="graduation_year,desc">Graduation (Newest)</option>
                <option value="graduation_year,asc">Graduation (Oldest)</option>
              </select>
            </div>
          </div>
        </div>
        </div>

      </div>

      {role === 'student' && (
        <div className="mx-auto max-w-3xl px-2 sm:px-0">
          <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-900 shadow-sm">
            <p className="font-medium">
              This directory shows approved member profiles that are visible in the AMET Network.
            </p>
            <p className="mt-1 text-sky-800/90">
              As a current student, your profile will appear here after you become an alumnus and your details are approved for the directory.
            </p>
          </div>
        </div>
      )}

      {/* Active filter chips (batch/department) below the header */}
      {(filters.graduation_year || filters.department) && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          {filters.graduation_year && (
            <span className="flex items-center gap-1.5 rounded-xl border border-ocean-300 bg-ocean-100 pl-3 pr-1.5 py-1.5 text-xs font-semibold text-ocean-800 shadow-sm">
              Batch: <span className="font-bold">{filters.graduation_year}</span>
              <button
                type="button"
                onClick={() => { setFilters(f => ({ ...f, graduation_year: '' })); setCurrentPage(1); }}
                className="ml-1 rounded-full bg-ocean-200 hover:bg-ocean-300 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-1"
                aria-label="Remove batch filter"
              >
                <XMarkIcon className="h-3.5 w-3.5 text-ocean-700" aria-hidden="true" />
              </button>
            </span>
          )}
          {filters.department && (
            <span className="flex items-center gap-1.5 rounded-xl border border-ocean-300 bg-ocean-100 pl-3 pr-1.5 py-1.5 text-xs font-semibold text-ocean-800 shadow-sm">
              Department: <span className="font-bold">{filters.department}</span>
              <button
                type="button"
                onClick={() => { setFilters(f => ({ ...f, department: '' })); setCurrentPage(1); }}
                className="ml-1 rounded-full bg-ocean-200 hover:bg-ocean-300 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-1"
                aria-label="Remove department filter"
              >
                <XMarkIcon className="h-3.5 w-3.5 text-ocean-700" aria-hidden="true" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => { setFilters({ graduation_year: '', department: '' }); setCurrentPage(1); }}
            className="inline-flex items-center justify-center min-h-[36px] px-3 text-xs font-semibold text-ocean-700 underline-offset-2 hover:underline rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
      
      {/* Priority strip */}
      {priority.length > 0 && activeFilter === 'alumni' && (
        <div className="bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 rounded-2xl border border-sky-200/60 shadow-lg p-6 sm:p-8" role="region" aria-label="Priority Connections">
          <div className="mb-6">
            <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sm" aria-hidden="true"></span>
              Priority Connections
            </h2>
            <p className="text-sm text-slate-600 pl-6">
              Highlighted profiles share your batch, department, or have recent interactions with you
            </p>
          </div>
          <DirectoryGrid items={priority} meId={me?.id} currentTab={activeFilter} onChanged={reloadRelsAndCounts} compact loading={loading} />
        </div>
      )}

      {/* Main grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900">
            {activeFilter === 'alumni' ? 'Alumni' :
             activeFilter === 'students' ? 'Students' :
             activeFilter === 'connected' ? 'My Connections' :
             activeFilter === 'received' ? 'Received Requests' : 'Sent Requests'}
          </h2>
          {loading && (
            <div className="flex items-center gap-2.5 text-slate-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Loading...</span>
            </div>
          )}
        </div>
        
        {/* Error state */}
        {dirError && !loading && (
          <ErrorState
            title="Unable to load directory"
            description="We encountered an error while loading the alumni directory. Please try again."
            error={dirError}
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Partial results banner - shows when filters are active */}
        {!loading && !dirError && pageItems.length > 0 && (debouncedSearch || filters.graduation_year || filters.department) && (
          <PartialResultsBanner
            count={pageItems.length}
            totalCount={totalCount}
            filterDescription={[
              debouncedSearch && `search: "${debouncedSearch}"`,
              filters.graduation_year && `batch: ${filters.graduation_year}`,
              filters.department && `department: ${filters.department}`,
            ].filter(Boolean).join(', ')}
            onClearFilters={() => {
              setSearchTerm('');
              setFilters({ graduation_year: '', department: '', degree_program: '', current_job_title: '', location: '' });
              setCurrentPage(1);
            }}
            className="mb-4"
          />
        )}

        {/* Directory grid */}
        {!loading && !dirError && pageItems.length === 0 ? (
          <div className="empty-state" role="status">
            <div className="empty-state-icon-wrapper">
              <svg className="w-8 h-8 text-ocean-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="empty-state-title">No members found</h3>
            <p className="empty-state-description">
              {isAdmin 
                ? 'No profiles match the current filters. Try adjusting your search or filters.'
                : role === 'student'
                  ? 'No matching profiles found. As a current student, your profile will appear here after you become an alumnus and your details are approved.'
                  : 'No approved profiles found. Profiles appear here after admin approval.'}
            </p>
            {(debouncedSearch || filters.graduation_year || filters.department) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ graduation_year: '', department: '', degree_program: '', current_job_title: '', location: '' });
                  setCurrentPage(1);
                }}
                className="btn-primary mt-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : !dirError && (
          <DirectoryGrid items={pageItems} meId={me?.id} currentTab={activeFilter} onChanged={reloadRelsAndCounts} loading={loading} />
        )}
        
        {/* Pagination: we only know if another page likely exists based on page size */}
        {pageItems.length > 0 && (
          <div className="mt-10 flex items-center justify-between border-t border-slate-200/60 pt-6 px-2">
            <button
              type="button"
              className="min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </button>
            <div className="text-sm font-semibold text-slate-700">
              Page <span className="text-lg text-indigo-600 font-bold">{currentPage}</span>
              {totalPages && (
                <span className="ml-1 text-sm text-slate-500">/ {totalPages}</span>
              )}
            </div>
            <button
              type="button"
              className="min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Filters drawer */}
      {showFilters && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setShowFilters(false)} aria-hidden="true"></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-hidden">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-xl font-semibold text-slate-900">Filter directory</h2>
                <button 
                  type="button"
                  onClick={() => setShowFilters(false)} 
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                  aria-label="Close filters"
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-grow overflow-y-auto p-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Batch Year</label>
                    <input
                      type="number"
                      value={filters.graduation_year}
                      onChange={(e) => setFilters(f => ({ ...f, graduation_year: e.target.value }))}
                      placeholder="e.g., 2015"
                      aria-label="Filter by batch year"
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:border-ocean-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Department</label>
                    <input
                      type="text"
                      value={filters.department}
                      onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g., Marine Engineering"
                      aria-label="Filter by department"
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:border-ocean-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Degree</label>
                    <input
                      type="text"
                      value={filters.degree_program}
                      onChange={(e) => setFilters(f => ({ ...f, degree_program: e.target.value }))}
                      placeholder="e.g., B.E. Marine"
                      aria-label="Filter by degree"
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:border-ocean-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Designation</label>
                    <input
                      type="text"
                      value={filters.current_job_title}
                      onChange={(e) => setFilters(f => ({ ...f, current_job_title: e.target.value }))}
                      placeholder="e.g., Chief Engineer"
                      aria-label="Filter by designation"
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:border-ocean-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Location</label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                      placeholder="e.g., Chennai"
                      aria-label="Filter by location"
                      className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:border-ocean-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => { setFilters({ graduation_year: '', department: '', degree_program: '', current_job_title: '', location: '' }); }}
                    className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowFilters(false); setCurrentPage(1); }}
                    className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-gradient-to-b from-ocean-500 to-ocean-600 text-white font-medium shadow-sm hover:from-ocean-600 hover:to-ocean-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
