import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon, 
  UsersIcon, 
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const EmployerDashboard = ({ user }) => {
  const employerStats = [
    { title: 'Active Job Postings', value: '12', change: '+3', icon: BriefcaseIcon, color: 'bg-blue-500' },
    { title: 'Total Applications', value: '147', change: '+23%', icon: DocumentTextIcon, color: 'bg-green-500' },
    { title: 'Profile Views', value: '892', change: '+15%', icon: EyeIcon, color: 'bg-purple-500' },
    { title: 'Interviews Scheduled', value: '8', change: '+2', icon: ChatBubbleLeftRightIcon, color: 'bg-orange-500' }
  ];

  const recentApplications = [
    { 
      id: 1, 
      jobTitle: 'Senior Marine Engineer', 
      candidate: 'Rajesh Kumar', 
      experience: '8 years',
      location: 'Chennai',
      appliedDate: '2 hours ago',
      status: 'new'
    },
    { 
      id: 2, 
      jobTitle: 'Naval Architect', 
      candidate: 'Priya Sharma', 
      experience: '5 years',
      location: 'Mumbai',
      appliedDate: '4 hours ago',
      status: 'reviewing'
    },
    { 
      id: 3, 
      jobTitle: 'Port Operations Manager', 
      candidate: 'Mohammed Ali', 
      experience: '12 years',
      location: 'Kochi',
      appliedDate: '1 day ago',
      status: 'shortlisted'
    },
    { 
      id: 4, 
      jobTitle: 'Marine Engineer', 
      candidate: 'Sneha Patel', 
      experience: '3 years',
      location: 'Pune',
      appliedDate: '2 days ago',
      status: 'interview'
    }
  ];

  const jobPerformance = [
    { title: 'Senior Marine Engineer', views: 156, applications: 23, posted: '1 week ago' },
    { title: 'Naval Architect', views: 134, applications: 18, posted: '2 weeks ago' },
    { title: 'Port Operations Manager', views: 98, applications: 15, posted: '3 weeks ago' }
  ];

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
        {employerStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card rounded-lg p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change} this month</p>
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
              {recentApplications.map((application) => (
                <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:bg-ocean-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-ocean-gradient rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {application.candidate.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{application.candidate}</h3>
                          <p className="text-sm text-gray-600">{application.jobTitle}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>{application.experience} experience</span>
                        <span>•</span>
                        <span>{application.location}</span>
                        <span>•</span>
                        <span>{application.appliedDate}</span>
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
              ))}
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
              {jobPerformance.map((job, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex space-x-3 text-xs text-gray-600">
                      <span>{job.views} views</span>
                      <span>{job.applications} applications</span>
                    </div>
                    <p className="text-xs text-gray-500">{job.posted}</p>
                  </div>
                </div>
              ))}
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