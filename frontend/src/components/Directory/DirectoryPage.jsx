import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase';
import ChipBar from './ChipBar';
import DirectoryGrid from './DirectoryGrid';
import { useConnectionsRealtime } from '../../hooks/useConnectionsRealtime';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DirectoryPage() {
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [relMap, setRelMap] = useState(new Map());
  const [counts, setCounts] = useState({ received: 0, sent: 0, connected: 0 });
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [totalAlumni, setTotalAlumni] = useState(0);
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

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      if (activeFilter !== 'all') {
        // Load only the profiles that belong to this tab (ignore text search)
        const ids = tabIds;
        const pageIds = ids.slice(from, to + 1);
        if (pageIds.length === 0) {
          setProfiles([]);
          setTotalAlumni(ids.length);
          return;
        }
        let base = supabase
          .from('profiles')
          .select('id, full_name, avatar_url, graduation_year, department, headline')
          .in('id', pageIds);

        // Apply filters
        if (filters.graduation_year) base = base.eq('graduation_year', Number(filters.graduation_year));
        if (filters.department) base = base.ilike('department', `%${filters.department}%`);

        // Apply sort
        const [sf, so] = sortBy.split(',');
        base = base.order(sf === 'graduation_year' ? 'graduation_year' : 'full_name', { ascending: so === 'asc' });

        const { data, error } = await base;
        if (error) throw error;
        setProfiles((data || []).filter(p => p.id !== me?.id));
        // For accuracy, compute count with head query on full ids and filters
        let countQ = supabase
          .from('profiles')
          .select('id', { head: true, count: 'exact' })
          .in('id', ids);
        if (filters.graduation_year) countQ = countQ.eq('graduation_year', Number(filters.graduation_year));
        if (filters.department) countQ = countQ.ilike('department', `%${filters.department}%`);
        const { count: c } = await countQ;
        setTotalAlumni(c || 0);
        return;
      }

      // All tab: Query from public_profiles_view with search like legacy directory
      let query = supabase
        .from('public_profiles_view')
        .select('id, full_name, avatar_url, graduation_year, degree_program, current_job_title, company_name, location, department', { count: 'exact' });

      if (debouncedSearch) {
        const q = debouncedSearch.replace(/%/g, '');
        const cols = ['full_name', 'location', 'degree_program', 'department'];
        const ors = cols.map((c) => `${c}.ilike.%${q}%`).join(',');
        if (ors) query = query.or(ors);
      }

      // Apply filters
      if (filters.graduation_year) query = query.eq('graduation_year', Number(filters.graduation_year));
      if (filters.department) query = query.ilike('department', `%${filters.department}%`);

      // Apply sort
      const [sf, so] = sortBy.split(',');
      query = query.order(sf, { ascending: so === 'asc' });

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      setProfiles((data || []).filter(p => p.id !== me?.id));
      setTotalAlumni(count || 0);
    } catch (e) {
      console.error('Directory loadProfiles error:', e);
    } finally {
      setLoading(false);
    }
  }, [me?.id, debouncedSearch, currentPage, itemsPerPage, activeFilter, tabIds]);

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
        .in('status', ['accepted', 'connected'])
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

  // Load profiles when inputs change; for tab views wait until rels are loaded
  useEffect(() => {
    if (!me) return;
    if (activeFilter !== 'all' && !relsLoaded) return;
    loadProfiles();
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
    return (profiles || []).map(p => ({
      ...p,
      rel: relMap.get(p.id) || { status: null, pending_side: null, edge_ts: null }
    }));
  }, [profiles, relMap]);

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
    if (filter === 'received') return list.filter(p => p.rel.status === 'pending' && p.rel.pending_side === 'received');
    if (filter === 'sent') return list.filter(p => p.rel.status === 'pending' && p.rel.pending_side === 'sent');
    if (filter === 'connected') return list.filter(p => ['accepted', 'connected'].includes(p.rel.status));
    return list;
  }, []);

  const filtered = useMemo(() => {
    const base = activeFilter === 'all' ? rest : withRel;
    return applyFilter(base, activeFilter);
  }, [withRel, rest, activeFilter, applyFilter]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Directory</h1>
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by name, degree, department, or location"
            className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
        >
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          Filters
        </button>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
        >
          <option value="full_name,asc">Name (A–Z)</option>
          <option value="full_name,desc">Name (Z–A)</option>
          <option value="graduation_year,desc">Graduation (Newest)</option>
          <option value="graduation_year,asc">Graduation (Oldest)</option>
        </select>
      </div>

      {/* Chips */}
      <ChipBar counts={counts} active={activeFilter} onChange={setActiveFilter} />

      {/* Priority strip */}
      {priority.length > 0 && activeFilter === 'all' && (
        <div>
          <h2 className="text-sm font-medium text-gray-600 mb-2">Priority</h2>
          {/* Render compact grid directly (avoid nested grids) */}
          <DirectoryGrid items={priority} meId={me?.id} onChanged={reloadRelsAndCounts} compact />
        </div>
      )}

      {/* Main grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-600">All Profiles</h2>
          {loading && <span className="text-xs text-gray-400">Loading…</span>}
        </div>
        {/* Active filter chips */}
        {(filters.graduation_year || filters.department) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {filters.graduation_year && (
              <span className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                Graduation: <span className="font-semibold">{filters.graduation_year}</span>
                <button onClick={() => { setFilters(f => ({ ...f, graduation_year: '' })); setCurrentPage(1); }} className="p-0.5 bg-indigo-200 rounded-full hover:bg-indigo-300">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.department && (
              <span className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                Department: <span className="font-semibold">{filters.department}</span>
                <button onClick={() => { setFilters(f => ({ ...f, department: '' })); setCurrentPage(1); }} className="p-0.5 bg-indigo-200 rounded-full hover:bg-indigo-300">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            <button onClick={() => { setFilters({ graduation_year: '', department: '' }); setCurrentPage(1); }} className="text-xs text-gray-600 hover:text-indigo-600 hover:underline">
              Clear all
            </button>
          </div>
        )}
        <DirectoryGrid items={filtered} meId={me?.id} onChanged={reloadRelsAndCounts} />
        {/* Pagination */}
        {totalAlumni > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between">
            <button
              className="btn-outline px-3 py-1.5 rounded-lg disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="text-sm text-gray-600">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{Math.ceil((totalAlumni || 0) / itemsPerPage)}</span>
            </div>
            <button
              className="btn-outline px-3 py-1.5 rounded-lg disabled:opacity-50"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil((totalAlumni || 0) / itemsPerPage)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowFilters(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={filters.graduation_year}
                    onChange={(e) => setFilters(f => ({ ...f, graduation_year: e.target.value }))}
                    placeholder="e.g., 2015"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={filters.department}
                    onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                    placeholder="e.g., Marine Engineering"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="pt-6 border-t mt-auto flex justify-between">
                <button
                  onClick={() => { setFilters({ graduation_year: '', department: '' }); }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => { setShowFilters(false); setCurrentPage(1); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
