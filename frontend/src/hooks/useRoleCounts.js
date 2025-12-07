import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import logger from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

export default function useRoleCounts() {
  const { isAdmin } = useAuth();
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      setLoading(true);
      setError(null);

      try {
        let rpcName = isAdmin ? 'get_all_profiles_count_by_role_admin' : 'get_directory_role_counts';
        const { data, error: rpcError } = await supabase.rpc(rpcName);
        if (rpcError) throw rpcError;
        if (!mounted) return;
        setCounts(data || null);
      } catch (err) {
        logger.error('Failed to fetch role counts:', err);
        if (mounted) {
          setError(err);
          setCounts(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCounts();

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const getDisplayCounts = () => {
    if (!counts) {
      return {
        alumni: 0,
        students: 0,
        employers: 0,
        alumniBreakdown: undefined,
        studentBreakdown: undefined,
        employerBreakdown: undefined,
      };
    }

    if (isAdmin && counts.alumni && typeof counts.alumni === 'object') {
      return {
        alumni: counts.alumni.total || 0,
        students: counts.student?.total || 0,
        employers: counts.employer?.total || 0,
        alumniBreakdown: counts.alumni,
        studentBreakdown: counts.student,
        employerBreakdown: counts.employer,
      };
    }

    return {
      alumni: Number(counts.alumni || 0),
      students: Number(counts.student || 0),
      employers: Number(counts.employer || 0),
      alumniBreakdown: undefined,
      studentBreakdown: undefined,
      employerBreakdown: undefined,
    };
  };

  const displayCounts = getDisplayCounts();

  return { counts, displayCounts, loading, error };
}
