import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import logger from '../../utils/logger';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter) query = query.eq('action', actionFilter);
      if (fromDate) query = query.gte('created_at', new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      logger.error('Failed to fetch activity logs:', e);
      setError(e.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Activity Logs</h1>

      <div className="glass-card p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          className="form-input"
          placeholder="Filter by action (e.g., events_list_view)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        />
        <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn-ocean px-4 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2" onClick={fetchLogs}>Apply</button>
          <button className="btn-ocean-outline px-4 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2" onClick={() => { setActionFilter(''); setFromDate(''); setToDate(''); fetchLogs(); }}>Reset</button>
        </div>
      </div>
      {loading ? (
        <div>Loading logs...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2 text-sm text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.user_id}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{log.action}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.route}</td>
                  <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate" title={JSON.stringify(log.meta)}>
                    {(() => {
                      try {
                        return typeof log.meta === 'object' ? JSON.stringify(log.meta) : (log.meta || '');
                      } catch {
                        return String(log.meta || '');
                      }
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
