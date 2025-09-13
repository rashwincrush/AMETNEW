// frontend/src/hooks/useDirectory.js
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function useDirectory({ query = '', filters = {}, sort = 'name_asc', page = 1, pageSize = 24 }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.rpc('get_directory_profiles');
      if (ignore) return;
      if (err || !Array.isArray(data)) {
        setAll([]);
        setError(err || new Error('Bad RPC payload'));
      } else {
        setAll(data);
      }
      setLoading(false);
    })();
    return () => { ignore = true; };
  }, []);

  // client search / filter / sort / paginate
  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    return all.filter(p => {
      const passesText = !q || [
        p.full_name, p.location, p.company_name, p.current_job_title, p.degree_program, p.department
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
