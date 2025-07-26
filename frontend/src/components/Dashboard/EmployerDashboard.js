import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon, 
  UsersIcon, 
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  BuildingOfficeIcon,
  ClockIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';

const StatCardSkeleton = () => (
  <div className="glass-card rounded-lg p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
  </div>
);

const EmployerDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [jobPerformance, setJobPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const fetchDashboardData = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      setError('User not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || !profile.company_id) {
        throw new Error('Could not find a company associated with this employer account.');
      }
      const companyId = profile.company_id;

      const { data: companyJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, created_at, is_active, views')
        .eq('company_id', companyId);

      if (jobsError) throw jobsError;

      const jobIds = companyJobs.map(job => job.id);
      const activeJobsCount = companyJobs.filter(job => job.is_active).length;

      const { count: totalApplicationsCount, error: appsCountError } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds);

      if (appsCountError) throw appsCountError;

      setStats({
        activeJobPostings: activeJobsCount,
        totalApplications: totalApplicationsCount || 0,
        profileViews: 0, // Placeholder for now
        interviewsScheduled: 0, // Placeholder for now
      });

      if (jobIds.length > 0) {
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('id, created_at, status, jobs(title), profiles(full_name, location, experience)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(4);

        if (applicationsError) throw applicationsError;
        setRecentApplications(applicationsData);
      }

      const performanceWithApps = await Promise.all(
        companyJobs.slice(0, 3).map(async (job) => {
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);
          return {
            title: job.title,
            views: job.views || 0,
            applications: count || 0,
            posted: new Date(job.created_at).toLocaleDateString(),
          };
        })
      );
      setJobPerformance(performanceWithApps);

    } catch (err) {
      console.error("Error fetching employer dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);



    // TODO: Replace with dynamic data when interviews feature is complete
  const upcomingInterviews = [
    {
      id: 1,
      candidate: 'Arjun Nair',
      position: 'Senior Marine Engineer',
      date: '2024-04-16',
      time: '10:00 AM',
      type: 'Video Call'
    },
    {
      id: 2,
      candidate: 'Kavitha Menon',
      position: 'Naval Architect',
      date: '2024-04-17',
      time: '2:00 PM',
      type: 'In-person'
    },
    {
      id: 3,
      candidate: 'Suresh Reddy',
      position: 'Port Operations Manager',
      date: '2024-04-18',
      time: '11:00 AM',
      type: 'Phone Call'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

    const statIcons = {
    activeJobPostings: { icon: BriefcaseIcon, color: 'bg-blue-500' },
    totalApplications: { icon: DocumentTextIcon, color: 'bg-green-500' },
    profileViews: { icon: EyeIcon, color: 'bg-purple-500' },
    interviewsScheduled: { icon: ChatBubbleLeftRightIcon, color: 'bg-orange-500' },
  };

  const statTitles = {
    activeJobPostings: 'Active Job Postings',
    totalApplications: 'Total Applications',
    profileViews: 'Profile Views',
    interviewsScheduled: 'Interviews Scheduled',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-lg p-6 text-center text-red-500">
        <h3 className="font-bold">An Error Occurred</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="mt-4 btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-lg p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Employer Dashboard 💼
            </h1>
            <p className="mt-1 opacity-90">
              Find and hire the best AMET alumni talent
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-8 h-8 text-white ocean-wave" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats && Object.entries(stats).map(([key, value]) => {
          const Icon = statIcons[key].icon;
          return (
            <div key={key} className="glass-card rounded-lg p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{statTitles[key]}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${statIcons[key].color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link 
                to="/jobs" 
                className="text-ocean-600 hover:text-ocean-700 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:bg-ocean-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-ocean-gradient rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {application.profiles.full_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{application.profiles.full_name}</h3>
                            <p className="text-sm text-gray-600">Applied for: {application.jobs.title}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          <span>{application.profiles.experience || 'N/A'}</span>
                          <span>•</span>
                          <span>{application.profiles.location}</span>
                          <span>•</span>
                          <span>{new Date(application.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded text-xs font-medium hover:bg-ocean-200">
                        View Resume
                      </button>
                      <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200">
                        Schedule Interview
                      </button>
                      <button className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200">
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Recent Applications</h3>
                  <p className="mt-1 text-sm text-gray-500">New applications for your jobs will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
            <div className="space-y-3">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm">{interview.candidate}</h4>
                  <p className="text-xs text-gray-600">{interview.position}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-purple-600">{interview.date} • {interview.time}</p>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {interview.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link 
                to="/interviews" 
                className="btn-ocean-outline w-full py-2 px-4 rounded-lg text-center block text-sm"
              >
                Manage Interviews
              </Link>
            </div>
          </div>

          {/* Job Performance */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Performance</h3>
            <div className="space-y-3">
              {jobPerformance.length > 0 ? (
                jobPerformance.map((job, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{job.title}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex space-x-3 text-xs text-gray-600">
                        <span>{job.views} views</span>
                        <span>{job.applications} apps</span>
                      </div>
                      <p className="text-xs text-gray-500">Posted: {job.posted}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-5">
                   <p className="mt-1 text-sm text-gray-500">Post a job to see its performance.</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link 
                to="/admin/analytics" 
                className="btn-ocean-outline w-full py-2 px-4 rounded-lg text-center block text-sm"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/jobs/post" className="glass-card rounded-lg p-4 text-center card-hover">
          <PlusIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Post New Job</p>
        </Link>
        <Link to="/company/edit" className="glass-card rounded-lg p-4 text-center card-hover">
          <PencilSquareIcon className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Edit Company Profile</p>
        </Link>
        <Link to="/directory" className="glass-card rounded-lg p-4 text-center card-hover">
          <UsersIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Browse Alumni</p>
        </Link>
        <Link to="/messages" className="glass-card rounded-lg p-4 text-center card-hover">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Messages</p>
        </Link>
        <Link to="/admin/analytics" className="glass-card rounded-lg p-4 text-center card-hover">
          <ChartBarIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Analytics</p>
        </Link>
      </div>
    </div>
  );
};

export default EmployerDashboard;