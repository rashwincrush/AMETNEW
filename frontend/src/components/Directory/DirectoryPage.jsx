import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase';
import ChipBar from './ChipBar';
import DirectoryGrid from './DirectoryGrid';
import { useConnectionsRealtime } from '../../hooks/useConnectionsRealtime';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useDirectory from '../../hooks/useDirectory';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeProfile } from '../../lib/normalizeProfile';

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

  // Directory data via RPC-only hook
  const sortKey = useMemo(() => {
    const [sf, so] = sortBy.split(',');
    if (sf === 'full_name' && so === 'asc') return 'name_asc';
    if (sf === 'full_name' && so === 'desc') return 'name_desc';
    if (sf === 'graduation_year' && so === 'asc') return 'year_asc';
    if (sf === 'graduation_year' && so === 'desc') return 'year_desc';
    return 'name_asc';
  }, [sortBy]);

  // Role-aware flags from auth; directory data always comes from RPC now
  const { isAdmin, getUserRole } = useAuth();
  const role = getUserRole ? getUserRole() : 'alumni';
  const source = 'rpc';

  const { items, total, loading: dirLoading, error: dirError, dataset } = useDirectory({
    query: debouncedSearch,
    filters: {
      graduation_year: filters.graduation_year,
      department: filters.department,
      degree_program: filters.degree_program,
      current_job_title: filters.current_job_title,
      location: filters.location,
    },
    sort: sortKey,
    page: currentPage,
    pageSize: itemsPerPage,
    source,
    // Only admins should fall back to the public view if the RPC fails or returns empty.
    // Alumni/students must always use the RPC, which enforces approval/visibility rules.
    adminFallback: isAdmin
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

  // Normalize dataset for consistent fields while preserving the raw row
  const base = useMemo(
    () => (dataset || []).map((row) => {
      const normalized = normalizeProfile(row);
      return { ...normalized, _raw: row };
    }),
    [dataset]
  );

  // Build counts for Alumni, Students, and Employers using canonical rules
  const alumniCount = useMemo(
    () =>
      base.filter(p => {
        const raw = p._raw || p;
        return isAlumniProfile(raw);
      }).length,
    [base, isAlumniProfile]
  );
  const studentsCount = useMemo(
    () =>
      base.filter(p => {
        const raw = p._raw || p;
        return isStudentProfile(raw);
      }).length,
    [base, isStudentProfile]
  );
  const employersCount = useMemo(
    () =>
      base.filter(p => {
        const raw = p._raw || p;
        return isEmployerProfile(raw);
      }).length,
    [base, isEmployerProfile]
  );

  // Counts passed to ChipBar; hide certain counts for non-admin roles per requirements
  const countsForChips = useMemo(() => {
    const baseCounts = {
      ...counts,
      alumni: alumniCount,
      students: studentsCount,
      employers: employersCount,
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
  }, [counts, alumniCount, studentsCount, employersCount, isAdmin, role]);

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
    // Use head:true exact counts and read the 'count' property
    const [recvRes, sentRes, connRes] = await Promise.all([
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('recipient_id', me.id)
        .eq('status', 'pending')
        .limit(0),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('requester_id', me.id)
        .eq('status', 'pending')
        .limit(0),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .or(`requester_id.eq.${me.id},recipient_id.eq.${me.id}`)
        .eq('status', 'accepted')
        .limit(0)
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
  useConnectionsRealtime(me?.id, () => {
    loadRels();
    loadCounts();
  });

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
  const withRel = useMemo(() => {
    const parseDegreeDept = (label) => {
      if (!label || typeof label !== 'string') return { degree_program: null, department: null };
      // Try to split "DEGREE, Department" or "DEGREE - Department"
      const byComma = label.split(',').map(s => s.trim());
      if (byComma.length >= 2) {
        const degree_program = byComma[0].toUpperCase();
        const department = byComma.slice(1).join(', ');
        return { degree_program, department };
      }
      const byDash = label.split(' - ').map(s => s.trim());
      if (byDash.length >= 2) {
        const degree_program = byDash[0].toUpperCase();
        const department = byDash.slice(1).join(' - ');
        return { degree_program, department };
      }
      // Fallback: if it matches known codes exactly, treat as degree only
      const upper = label.toUpperCase();
      const KNOWN = ['BBA','BCA','BE','BSC','BTECH','MBA','MCA','ME','MSC','MTECH','PHD'];
      if (KNOWN.includes(upper)) return { degree_program: upper, department: null };
      return { degree_program: null, department: label };
    };

    const computeName = (row) => {
      // Prefer backend-computed full_name
      if (row.full_name && String(row.full_name).trim().length > 0) return row.full_name;
      // Some RPCs return `name` instead of `full_name`
      if (row.name && String(row.name).trim().length > 0) return row.name;
      const first = (row.first_name || '').trim();
      const last = (row.last_name || '').trim();
      const combined = `${first} ${last}`.trim();
      if (combined) return combined;
      const email = (row.email || '').trim();
      if (email) return email.split('@')[0];
      return 'Alumni';
    };

    const normalizeProfile = (row) => {
      const { degree_program, department } = parseDegreeDept(row.degree_department);
      return {
        ...row,
        full_name: computeName(row),
        // Map fields that DirectoryCard expects
        current_job_title: row.current_job_title ?? row.current_title ?? row.job_title ?? row.currentPosition ?? null,
        company_name: row.company_name ?? row.current_company ?? row.company ?? null,
        location: row.location ?? row.location_label ?? null,
        degree_program: row.degree_program ?? degree_program ?? null,
        department: row.department ?? department ?? null,
        batch: row.batch_year ?? row.graduation_year ?? row.batch ?? null,
      };
    };
    return (base || []).map(p => ({
      ...normalizeProfile(p),
      rel: relMap.get(p.id) || { status: null, pending_side: null, edge_ts: null }
    }));
  }, [base, relMap]);

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
    return applyFilter(baseList, activeFilter);
  }, [withRel, rest, activeFilter, applyFilter]);

  // Derive totals and page slice from filtered results
  const totalAlumni = filtered.length;
  const pageStart = Math.max(0, (currentPage - 1) * itemsPerPage);
  const pageItems = filtered.slice(pageStart, pageStart + itemsPerPage);

  if (role === 'employer') {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700 text-center">
          Access denied. Employers do not have access to the people directory.
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
              Alumni Directory
            </h1>
            <p className="text-lg text-indigo-100 max-w-2xl">
              Connect with fellow alumni, expand your network, and discover opportunities
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
                  placeholder="Search by name, company, or designation..."
                  aria-label="Search alumni"
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
        
        {/* Directory grid */}
        {!loading && !dirError && pageItems.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700 text-center">
            {isAdmin ? (
              <p>No profiles match the current filters. Try adjusting your search or filters.</p>
            ) : (
              <p>No approved profiles found. Profiles appear here after admin approval and when they are visible in the directory.</p>
            )}
          </div>
        ) : (
          <DirectoryGrid items={pageItems} meId={me?.id} currentTab={activeFilter} onChanged={reloadRelsAndCounts} loading={loading} />
        )}
        
        {/* Pagination */}
        {totalAlumni > itemsPerPage && pageItems.length > 0 && (
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
              Page <span className="text-lg text-indigo-600 font-bold">{currentPage}</span> of <span className="font-bold">{Math.ceil((totalAlumni || 0) / itemsPerPage)}</span>
            </div>
            <button
              type="button"
              className="min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil((totalAlumni || 0) / itemsPerPage)}
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
                <h2 className="text-xl font-semibold text-slate-900">Filter Alumni</h2>
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
