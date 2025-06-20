import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  BriefcaseIcon,
  DocumentCheckIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_dashboard_stats');

        if (error) {
          throw error;
        }

        setStats(data);
        setRecentActivity(data.recentActivity || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon, color }) => {
    const Icon = icon;
    return (
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
        <div className="flex items-center">
          <div className="mr-4">
            <Icon className="h-10 w-10 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value || '0'}</p>
          </div>
        </div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={UserGroupIcon}
          color="border-blue-500"
        />
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobs}
          icon={BriefcaseIcon}
          color="border-green-500"
        />
        <StatCard
          title="Pending Applications"
          value={stats?.pendingApplications}
          icon={DocumentCheckIcon}
          color="border-yellow-500"
        />
        <StatCard
          title="Total Applications"
          value={stats?.totalApplications}
          icon={ClockIcon}
          color="border-purple-500"
        />
        <StatCard
          title="Messages Today"
          value={stats?.messagesToday}
          icon={ChatBubbleLeftRightIcon}
          color="border-pink-500"
        />
      </div>

      {/* Users by Role */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-lg font-semibold mb-4">Users by Role</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
            <div key={role} className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-500 capitalize">{role}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {activity.activityType?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(activity.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity found.</p>
        )}
      </div>
      
      {/* Last Updated */}
      {stats?.lastUpdated && (
        <p className="text-xs text-gray-500 mt-4 text-right">
          Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default Dashboard;
