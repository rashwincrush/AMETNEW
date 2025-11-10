import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { ALLOWED_TYPES } from '../../api/notifications';

const TYPE_LABELS = {
  system: 'System',
  connection: 'Connections',
  message: 'Messages',
  event: 'Events',
  job: 'Jobs',
  application: 'Applications',
  mentorship: 'Mentorship',
  group: 'Groups',
  alert: 'Alerts',
};

export default function NotificationSettings() {
  const { user } = useAuth();
  const [rows, setRows] = useState({}); // type -> { in_app_enabled }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const types = useMemo(() => Array.from(ALLOWED_TYPES).filter((t) => !t.startsWith('event_') && !t.startsWith('job_') && t !== 'event' && t !== 'job' ? ['system','connection','message','event','job','application','mentorship','group','alert'].includes(t) : true), []);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('type,in_app_enabled')
        .eq('user_id', user.id);
      if (!mounted) return;
      if (error) {
        setRows({});
      } else {
        const map = {};
        (data || []).forEach((r) => { map[r.type] = { in_app_enabled: r.in_app_enabled } });
        setRows(map);
      }
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [user?.id]);

  const getEnabled = (t) => (rows[t]?.in_app_enabled ?? true);

  const toggle = async (t) => {
    if (!user) return;
    const next = !getEnabled(t);
    setRows((prev) => ({ ...prev, [t]: { in_app_enabled: next } }));
    setSaving(true);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, type: t, in_app_enabled: next }, { onConflict: 'user_id,type' });
    setSaving(false);
    if (error) {
      // revert on error
      setRows((prev) => ({ ...prev, [t]: { in_app_enabled: !next } }));
    }
  };

  const restoreDefaults = async () => {
    if (!user) return;
    setSaving(true);
    const payload = ['system','connection','message','event','job','application','mentorship','group','alert']
      .map((t) => ({ user_id: user.id, type: t, in_app_enabled: true }));
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id,type' });
    if (!error) {
      const map = {};
      payload.forEach((r) => { map[r.type] = { in_app_enabled: true } });
      setRows(map);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Notification Settings</h1>
      <p className="text-sm text-gray-600 mb-6">Control which notifications you receive in the app. Defaults are enabled.</p>

      <div className="bg-white rounded-lg shadow border divide-y">
        {['system','connection','message','event','job','application','mentorship','group','alert'].map((t) => (
          <div key={t} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">{TYPE_LABELS[t] || t}</p>
              <p className="text-xs text-gray-500">In-app delivery</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={getEnabled(t)}
                onChange={() => toggle(t)}
                aria-label={`Toggle ${TYPE_LABELS[t] || t} notifications`}
              />
              <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 transition ${getEnabled(t) ? 'bg-ocean-500' : 'bg-gray-300'}`}>
                <span className={`bg-white w-4 h-4 rounded-full shadow transform transition ${getEnabled(t) ? 'translate-x-5' : ''}`} />
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={restoreDefaults} className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50">Restore defaults</button>
        {saving && <span className="text-xs text-gray-500">Saving…</span>}
      </div>
    </div>
  );
}
