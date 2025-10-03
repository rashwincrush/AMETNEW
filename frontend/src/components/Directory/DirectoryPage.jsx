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
  const [activeFilter, setActiveFilter] = useState('all');
  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  // total is derived from filtered results later
  // Sort & Filters
  const [sortBy, setSortBy] = useState('full_name,asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ graduation_year: '', department: '' });
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
    if (activeFilter === 'all') return [];
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

  // Role-aware source: students use public view (no PII), others use existing RPC
  const { isAdmin, getUserRole } = useAuth();
  const source = (getUserRole && getUserRole() === 'student') ? 'public' : 'rpc';

  const { items, total, loading: dirLoading, error: dirError, dataset } = useDirectory({
    query: debouncedSearch,
    filters: { graduation_year: filters.graduation_year, department: filters.department },
    sort: sortKey,
    page: currentPage,
    pageSize: itemsPerPage,
    source
  });

  // Use hook loading directly
  const loading = dirLoading;

  // Auth context for admin flag (already destructured above)

  // Normalize dataset for consistent fields
  const base = useMemo(() => (dataset || []).map(normalizeProfile), [dataset]);

  // Build admin counts for All (non-employers) and Employers
  const allCount = useMemo(() => base.filter(p => !(p.is_employer || p.role === 'employer')).length, [base]);
  const employersCount = useMemo(() => base.filter(p => (p.is_employer || p.role === 'employer')).length, [base]);

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
        .in('status', ['accepted', 'connected'])
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
    if (activeFilter !== 'all' && !relsLoaded) return;
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
    if (filter === 'employers') return list.filter(p => (p.is_employer || p.role === 'employer'));
    if (filter === 'all') return list.filter(p => !(p.is_employer || p.role === 'employer'));
    if (filter === 'received') return list.filter(p => p.rel.status === 'pending' && p.rel.pending_side === 'received');
    if (filter === 'sent') return list.filter(p => p.rel.status === 'pending' && p.rel.pending_side === 'sent');
    if (filter === 'connected') return list.filter(p => ['accepted', 'connected'].includes(p.rel.status));
    return list;
  }, []);

  const filtered = useMemo(() => {
    const base = activeFilter === 'all' ? rest : withRel;
    return applyFilter(base, activeFilter);
  }, [withRel, rest, activeFilter, applyFilter]);

  // Derive totals and page slice from filtered results
  const totalAlumni = filtered.length;
  const pageStart = Math.max(0, (currentPage - 1) * itemsPerPage);
  const pageItems = filtered.slice(pageStart, pageStart + itemsPerPage);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 space-y-6">
      {/* Header and search controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Alumni Directory</h1>
          
          {/* Search + Filter controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, degree, company, city, or country"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-10 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:border-ocean-500"
              />
              {searchTerm ? (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <FunnelIcon className="h-4 w-4 text-slate-500" />
                Filters
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <option value="full_name,asc">Name (A–Z)</option>
                <option value="full_name,desc">Name (Z–A)</option>
                <option value="graduation_year,desc">Graduation (Newest)</option>
                <option value="graduation_year,asc">Graduation (Oldest)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Filter chips */}
        {(filters.graduation_year || filters.department) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filters.graduation_year && (
              <span className="flex items-center gap-1 rounded-full border border-ocean-200 bg-ocean-50 pl-2.5 pr-1 py-1 text-xs font-medium text-ocean-700">
                Batch: <span className="font-semibold">{filters.graduation_year}</span>
                <button 
                  onClick={() => { setFilters(f => ({ ...f, graduation_year: '' })); setCurrentPage(1); }} 
                  className="ml-1 rounded-full bg-ocean-100 hover:bg-ocean-200 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                >
                  <XMarkIcon className="h-3 w-3 text-ocean-600" />
                </button>
              </span>
            )}
            {filters.department && (
              <span className="flex items-center gap-1 rounded-full border border-ocean-200 bg-ocean-50 pl-2.5 pr-1 py-1 text-xs font-medium text-ocean-700">
                Department: <span className="font-semibold">{filters.department}</span>
                <button 
                  onClick={() => { setFilters(f => ({ ...f, department: '' })); setCurrentPage(1); }} 
                  className="ml-1 rounded-full bg-ocean-100 hover:bg-ocean-200 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                >
                  <XMarkIcon className="h-3 w-3 text-ocean-600" />
                </button>
              </span>
            )}
            <button 
              onClick={() => { setFilters({ graduation_year: '', department: '' }); setCurrentPage(1); }} 
              className="inline-flex items-center justify-center text-xs text-ocean-600 underline-offset-2 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
        
        {/* Tab navigation */}
        <div className="mt-4">
          <ChipBar
            counts={{ ...counts, all: allCount, employers: employersCount }}
            active={activeFilter}
            onChange={setActiveFilter}
            showEmployers={isAdmin}
          />
        </div>
      </div>
      
      {/* Priority strip */}
      {priority.length > 0 && activeFilter === 'all' && (
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl border border-sky-200 p-4 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500"></span>
            Priority Connections
          </h2>
          <DirectoryGrid items={priority} meId={me?.id} currentTab={activeFilter} onChanged={reloadRelsAndCounts} compact loading={loading} />
        </div>
      )}

      {/* Main grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            {activeFilter === 'all' ? 'All Profiles' : 
             activeFilter === 'connected' ? 'My Connections' :
             activeFilter === 'received' ? 'Received Requests' : 'Sent Requests'}
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs">Loading...</span>
            </div>
          )}
        </div>
        
        {/* Directory grid */}
        <DirectoryGrid items={pageItems} meId={me?.id} currentTab={activeFilter} onChanged={reloadRelsAndCounts} loading={loading} />
        
        {/* Pagination */}
        {totalAlumni > itemsPerPage && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="text-sm font-medium text-slate-700">
              Page <span className="text-indigo-600">{currentPage}</span> of <span>{Math.ceil((totalAlumni || 0) / itemsPerPage)}</span>
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil((totalAlumni || 0) / itemsPerPage)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Filters drawer */}
      {showFilters && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setShowFilters(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-hidden">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-xl font-semibold text-slate-900">Filter Alumni</h2>
                <button 
                  onClick={() => setShowFilters(false)} 
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <XMarkIcon className="h-6 w-6" />
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
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:border-ocean-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Department</label>
                    <input
                      type="text"
                      value={filters.department}
                      onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g., Marine Engineering"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => { setFilters({ graduation_year: '', department: '' }); }}
                    className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => { setShowFilters(false); setCurrentPage(1); }}
                    className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-gradient-to-b from-ocean-500 to-ocean-600 text-white hover:from-ocean-600 hover:to-ocean-700 transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
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
  );
}
