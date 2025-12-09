import { useEffect, useState, memo } from "react";
import { supabase } from "../../utils/supabase";
import { 
  CalendarIcon, 
  BriefcaseIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

function ActivitiesWidget() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const refetch = async () => {
      const { data, error } = await supabase
        .from("v_recent_activities")
        .select("user_id, activity_type, activity_text, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!isMounted) return;
      if (error) setErr(error.message);
      else setRows(data ?? []);
    };

    refetch();

    const tables = [
      "event_attendees",
      "job_applications",
      "connections",
      "group_members",
      "mentorships",
    ];

    const channels = tables.map((t) =>
      supabase
        .channel(`realtime:${t}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: t },
          () => refetch()
        )
        .subscribe()
    );

    return () => {
      isMounted = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  const getActivityConfig = (type) => {
    const configs = {
      event_rsvp: { 
        icon: CalendarIcon, 
        color: 'bg-purple-100', 
        iconColor: 'text-purple-600',
        label: 'Event RSVP'
      },
      job_application: { 
        icon: BriefcaseIcon, 
        color: 'bg-orange-100', 
        iconColor: 'text-orange-600',
        label: 'Job Application'
      },
      connection_request: { 
        icon: UserGroupIcon, 
        color: 'bg-ocean-100', 
        iconColor: 'text-ocean-600',
        label: 'Connection'
      },
      group_joined: { 
        icon: UserGroupIcon, 
        color: 'bg-green-100', 
        iconColor: 'text-green-600',
        label: 'Group'
      },
      mentorship_accepted: { 
        icon: AcademicCapIcon, 
        color: 'bg-indigo-100', 
        iconColor: 'text-indigo-600',
        label: 'Mentorship'
      },
    };
    return configs[type] || { icon: ClockIcon, color: 'bg-gray-100', iconColor: 'text-gray-600', label: 'Activity' };
  };

  const renderLine = (a) => {
    switch (a.activity_type) {
      case "event_rsvp":
        return `You RSVP'd to event: ${a.activity_text}`;
      case "job_application":
        return `You applied for job: ${a.activity_text}`;
      case "connection_request":
        return `You sent a connection request to ${a.activity_text}`;
      case "group_joined":
        return `You joined group: ${a.activity_text}`;
      case "mentorship_accepted":
        return `${a.activity_text} accepted your mentorship request`;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Last 5</span>
      </div>

      {/* Loading */}
      {!rows && !err && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-2">
            <div className="spinner spinner-md" aria-hidden="true" />
            <span className="sr-only">Loading activities...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="text-center py-8">
          <p className="text-sm text-red-600">Failed to load activities.</p>
        </div>
      )}

      {/* Empty */}
      {rows && rows.length === 0 && (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No recent activities</p>
        </div>
      )}

      {/* List */}
      {rows && rows.length > 0 && (
        <ul className="space-y-3 page-enter">
          {rows.slice(0, 5).map((a, idx) => {
            const text = renderLine(a);
            if (!text) return null;
            const config = getActivityConfig(a.activity_type);
            const Icon = config.icon;
            
            return (
              <li 
                key={`${a.activity_type}-${a.created_at}-${idx}`} 
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-ocean-50 transition-colors duration-200 border border-transparent hover:border-ocean-200"
              >
                <div className={`flex-shrink-0 w-10 h-10 ${config.color} rounded-full flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-snug">{text}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(a.created_at)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{config.label}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default memo(ActivitiesWidget);
