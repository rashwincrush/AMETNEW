import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/apiService';

const AlumniDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_alumni: 0,
      total_jobs: 0,
      total_applications: 0,
      recent_activities: []
    },
    jobs: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true }));

        // Fetch dashboard stats and jobs in parallel
        const [statsResponse, jobsResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getJobs()
        ]);

        setDashboardData({
          stats: statsResponse.data,
          jobs: jobsResponse.data.slice(0, 3), // Get first 3 jobs for recommendations
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data. Please try again.'
        }));
      }
    };

    fetchDashboardData();
  }, []);

  const quickStats = [
    { 
      title: 'Alumni Connections', 
      value: dashboardData.stats.total_alumni || '0', 
      icon: UsersIcon, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Job Opportunities', 
      value: dashboardData.stats.total_jobs || '0', 
      icon: BriefcaseIcon, 
      color: 'bg-purple-500' 
    },
    { 
      title: 'Applications', 
      value: dashboardData.stats.total_applications || '0', 
      icon: ChatBubbleLeftRightIcon, 
      color: 'bg-orange-500' 
    },
    { 
      title: 'Recent Activities', 
      value: dashboardData.stats.recent_activities.length || '0', 
      icon: CalendarIcon, 
      color: 'bg-green-500' 
    }
  ];

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (dashboardData.loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-lg p-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold mb-2">Error Loading Dashboard</p>
            <p>{dashboardData.error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 btn-ocean px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}! 🌊
            </h1>
            <p className="text-gray-600 mt-1">
              Stay connected with your AMET alumni network
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-ocean-gradient rounded-full flex items-center justify-center ocean-wave">
              <TrophyIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card rounded-lg p-6 card-hover">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <ArrowTrendingUpIcon className="w-5 h-5 text-ocean-500" />
            </div>
            <div className="space-y-4">
              {dashboardData.stats.recent_activities.length > 0 ? (
                dashboardData.stats.recent_activities.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center p-4 bg-ocean-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-ocean-gradient rounded-full flex items-center justify-center">
                        <BriefcaseIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{formatTime(activity.time)}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {activity.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No recent activities to display</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Job Recommendations */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Jobs</h3>
            <div className="space-y-3">
              {dashboardData.jobs.length > 0 ? (
                dashboardData.jobs.map((job) => (
                  <div key={job.id} className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
                    <p className="text-xs text-gray-600">{job.company}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-green-600 font-medium">{job.salary}</p>
                      <p className="text-xs text-gray-500">{formatTime(job.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">No job recommendations available</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link 
                to="/jobs" 
                className="btn-ocean-outline w-full py-2 px-4 rounded-lg text-center block text-sm"
              >
                Browse All Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/directory" className="glass-card rounded-lg p-4 text-center card-hover">
          <UsersIcon className="w-8 h-8 text-ocean-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Find Alumni</p>
        </Link>
        <Link to="/events/create" className="glass-card rounded-lg p-4 text-center card-hover">
          <CalendarIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Create Event</p>
        </Link>
        <Link to="/mentorship" className="glass-card rounded-lg p-4 text-center card-hover">
          <AcademicCapIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Find Mentor</p>
        </Link>
        <Link to="/networking" className="glass-card rounded-lg p-4 text-center card-hover">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Join Groups</p>
        </Link>
      </div>
    </div>
  );
};

export default AlumniDashboard;