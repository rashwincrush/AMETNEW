// frontend/src/hooks/useDirectory.js
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function useDirectory({ query = '', filters = {}, sort = 'name_asc', page = 1, pageSize = 24, source = 'rpc' }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError(null);
      let data = [];
      let err = null;
      try {
        if (source === 'public') {
          // Load from public view (no PII)
          const res = await supabase
            .from('alumni_directory_public')
            .select('*');
          if (res.error) throw res.error;
          // Map location_city/country into a synthetic 'location' string for UI/search
          const rows = Array.isArray(res.data) ? res.data : [];
          data = rows.map(r => ({
            ...r,
            location: [r.location_city, r.location_country].filter(Boolean).join(', ')
          }));
        } else {
          // Default: existing RPC path
          const res = await supabase.rpc('get_directory_profiles');
          if (res.error || !Array.isArray(res.data)) {
            throw res.error || new Error('Bad RPC payload');
          }
          data = res.data;
        }
      } catch (e) {
        err = e;
      }

      if (ignore) return;
      if (err) {
        setAll([]);
        setError(err);
      } else {
        setAll(data);
      }
      setLoading(false);
    })();
    return () => { ignore = true; };
  }, [source]);

  // client search / filter / sort / paginate
  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    return all.filter(p => {
      const passesText = !q || [
        p.full_name,
        p.location,
        p.location_city,
        p.location_country,
        p.company_name,
        p.current_job_title,
        p.degree_program,
        p.department
      ].some(v => (v || '').toLowerCase().includes(q));
      const byYear = !filters.graduation_year || p.graduation_year === Number(filters.graduation_year);
      const byDept = !filters.department || p.department === filters.department;
      return passesText && byYear && byDept;
    });
  }, [all, query, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'name_asc') arr.sort((a,b)=> (a.full_name||'').localeCompare(b.full_name||''));
    if (sort === 'name_desc') arr.sort((a,b)=> (b.full_name||'').localeCompare(a.full_name||''));
    if (sort === 'year_desc') arr.sort((a,b)=> (b.graduation_year||0) - (a.graduation_year||0));
    if (sort === 'year_asc') arr.sort((a,b)=> (a.graduation_year||0) - (b.graduation_year||0));
    return arr;
  }, [filtered, sort]);

  const total = sorted.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const items = sorted.slice(start, start + pageSize);

  // Expose the sorted dataset to allow callers to apply custom filters (e.g., connection tabs)
  const dataset = sorted;

  return { items, total, loading, error, dataset };
}
