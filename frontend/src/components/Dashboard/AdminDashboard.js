import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/apiService';

const AdminDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_alumni: 0,
      total_jobs: 0,
      total_applications: 0,
      recent_activities: []
    },
    pendingApplications: [],
    loading: true,
    error: null
  });

  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true }));

        // Fetch dashboard stats and pending applications
        const [statsResponse, applicationsResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getPendingApplications()
        ]);

        setDashboardData({
          stats: statsResponse.data,
          pendingApplications: applicationsResponse.data,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data. Please try again.'
        }));
      }
    };

    fetchDashboardData();
  }, []);

  const handleReviewApplication = async (applicationId, status, notes = '') => {
    try {
      await apiService.reviewJobApplication(applicationId, { status, notes });
      
      // Remove the application from pending list
      setDashboardData(prev => ({
        ...prev,
        pendingApplications: prev.pendingApplications.filter(app => app.id !== applicationId)
      }));
      
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert('Failed to review application. Please try again.');
    }
  };

  const systemStats = [
    { 
      title: 'Total Alumni', 
      value: dashboardData.stats.total_alumni || '0', 
      change: '+12%', 
      icon: UsersIcon, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Active Jobs', 
      value: dashboardData.stats.total_jobs || '0', 
      change: '+3', 
      icon: BriefcaseIcon, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Applications', 
      value: dashboardData.stats.total_applications || '0', 
      change: '+8%', 
      icon: DocumentTextIcon, 
      color: 'bg-purple-500' 
    },
    { 
      title: 'Pending Reviews', 
      value: dashboardData.pendingApplications.length || '0', 
      change: dashboardData.pendingApplications.length > 0 ? 'Needs Attention' : 'All Clear', 
      icon: ExclamationTriangleIcon, 
      color: dashboardData.pendingApplications.length > 0 ? 'bg-red-500' : 'bg-gray-500' 
    }
  ];

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
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
      <div className="glass-card rounded-lg p-6 bg-gradient-to-r from-ocean-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Admin Dashboard 🚀
            </h1>
            <p className="mt-1 opacity-90">
              Manage and monitor the AMET Alumni System
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <CogIcon className="w-8 h-8 text-white ocean-wave" />
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card rounded-lg p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Job Applications */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Pending Job Applications</h2>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {dashboardData.pendingApplications.length} pending
              </span>
            </div>
            <div className="space-y-4">
              {dashboardData.pendingApplications.length > 0 ? (
                dashboardData.pendingApplications.map((application) => (
                  <div key={application.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-ocean-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Job Application for {application.job_id}
                      </p>
                      <p className="text-xs text-gray-500">Applied {formatTime(application.applied_at)}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Expected Salary: {application.expected_salary || 'Not specified'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200"
                      >
                        <EyeIcon className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleReviewApplication(application.id, 'approved')}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewApplication(application.id, 'rejected')}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium hover:bg-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No pending applications to review</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {dashboardData.stats.recent_activities.length > 0 ? (
                dashboardData.stats.recent_activities.slice(0, 4).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.title}</span>
                      </p>
                      <p className="text-xs text-gray-500">{formatTime(activity.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                to="/admin/users"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <UsersIcon className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Manage Users</span>
              </Link>
              <Link 
                to="/admin/analytics"
                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <ChartBarIcon className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Analytics</span>
              </Link>
              <Link 
                to="/jobs"
                className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <BriefcaseIcon className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Manage Jobs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Job Application Details</h2>
              <button 
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job ID
                </label>
                <p className="text-gray-900">{selectedApplication.job_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applicant ID
                </label>
                <p className="text-gray-900">{selectedApplication.applicant_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Salary
                </label>
                <p className="text-gray-900">{selectedApplication.expected_salary || 'Not specified'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Letter
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applied At
                </label>
                <p className="text-gray-900">{new Date(selectedApplication.applied_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedApplication(null)}
                className="btn-ocean-outline px-6 py-2 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => handleReviewApplication(selectedApplication.id, 'rejected')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleReviewApplication(selectedApplication.id, 'approved')}
                className="btn-ocean px-6 py-2 rounded-lg"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;