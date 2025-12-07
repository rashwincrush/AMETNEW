import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import logger from '../utils/logger';

// Hook for loading directory profiles via the secure backend RPC.
// This is the only legal data source for directory listings going forward.
// Supports server-side sorting via sortBy (e.g. 'full_name,asc', 'full_name,desc',
// 'graduation_year,desc', 'graduation_year,asc').
export default function useDirectorySecure({ search = '', page = 1, pageSize = 24, sortBy = 'full_name,asc' } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async ({ searchArg, pageArg, pageSizeArg, sortByArg } = {}) => {
    const effectiveSearch = typeof searchArg === 'string' ? searchArg : search;
    const effectivePage = typeof pageArg === 'number' ? pageArg : page;
    const effectivePageSize = typeof pageSizeArg === 'number' ? pageSizeArg : pageSize;
    const effectiveSort = typeof sortByArg === 'string' ? sortByArg : sortBy;

    setLoading(true);
    setError(null);

    const trimmed = (effectiveSearch || '').trim();
    const p_search = trimmed.length > 0 ? trimmed : null;
    const p_limit = effectivePageSize;
    const p_offset = (effectivePage - 1) * effectivePageSize;

    // Derive sort fields for the backend RPC from sortBy.
    // UI uses values like 'full_name,asc' or 'graduation_year,desc'.
    const [field, dir] = (effectiveSort || 'full_name,asc').split(',');
    const p_sort_field = field === 'graduation_year' ? 'graduation_year' : 'name';
    const p_sort_dir = (dir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    try {
      let rows;

      // Primary path: new 5-arg signature with explicit sort parameters.
      try {
        const { data, error } = await supabase.rpc('get_directory_profiles_secure', {
          p_search,
          p_limit,
          p_offset,
          p_sort_field,
          p_sort_dir,
        });

        if (error) {
          throw error;
        }
        rows = data;
      } catch (primaryErr) {
        // Fallback: call legacy 3-arg RPC if sort-aware version is not available.
        // This keeps the directory functional even if the DB migration is not yet applied.
        // eslint-disable-next-line no-console
        logger.error('get_directory_profiles_secure with sort params failed, falling back to legacy signature', primaryErr);
        const { data, error } = await supabase.rpc('get_directory_profiles_secure', {
          p_search,
          p_limit,
          p_offset,
        });
        if (error) {
          throw error;
        }
        rows = data;
      }

      const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const hasTotal = arr.length > 0 && typeof arr[0]?.total_count === 'number';
      setData(arr);
      setTotalCount(hasTotal ? arr[0].total_count : 0);
    } catch (e) {
      logger.error('get_directory_profiles_secure failed', e);
      setError(e);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize, sortBy]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const refresh = useCallback(() => {
    return load();
  }, [load]);

  return { data, totalCount, loading, error, refresh };
}
