import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const AlumniDashboard = ({ user }) => {
  const quickStats = [
    { title: 'Alumni Connections', value: '1,247', icon: UsersIcon, color: 'bg-blue-500' },
    { title: 'Upcoming Events', value: '8', icon: CalendarIcon, color: 'bg-green-500' },
    { title: 'Job Opportunities', value: '23', icon: BriefcaseIcon, color: 'bg-purple-500' },
    { title: 'Messages', value: '5', icon: ChatBubbleLeftRightIcon, color: 'bg-orange-500' }
  ];

  const recentActivities = [
    { id: 1, type: 'event', title: 'AMET Alumni Meetup 2024', time: '2 hours ago', status: 'registered' },
    { id: 2, type: 'job', title: 'Marine Engineer Position at Shipping Corp', time: '1 day ago', status: 'applied' },
    { id: 3, type: 'connection', title: 'Sarah Johnson sent you a connection request', time: '2 days ago', status: 'pending' },
    { id: 4, type: 'mentorship', title: 'Mentorship session with Dr. Smith', time: '3 days ago', status: 'completed' }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'AMET Alumni Meetup 2024',
      date: '2024-04-15',
      time: '6:00 PM',
      location: 'AMET Campus',
      attendees: 45
    },
    {
      id: 2,
      title: 'Career Development Workshop',
      date: '2024-04-20',
      time: '2:00 PM',
      location: 'Online',
      attendees: 78
    },
    {
      id: 3,
      title: 'Industry Networking Session',
      date: '2024-04-25',
      time: '5:30 PM',
      location: 'Chennai Maritime Center',
      attendees: 32
    }
  ];

  const jobRecommendations = [
    {
      id: 1,
      title: 'Senior Marine Engineer',
      company: 'Ocean Shipping Ltd.',
      location: 'Mumbai',
      salary: '₹12-15 LPA',
      posted: '2 days ago'
    },
    {
      id: 2,
      title: 'Naval Architect',
      company: 'Maritime Solutions',
      location: 'Chennai',
      salary: '₹10-12 LPA',
      posted: '4 days ago'
    },
    {
      id: 3,
      title: 'Port Operations Manager',
      company: 'Indian Ports Authority',
      location: 'Kochi',
      salary: '₹15-18 LPA',
      posted: '1 week ago'
    }
  ];

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
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v4.8l-2.787 5.574A1 1 0 003.68 15h7.84a.25.25 0 01.192.41l-.056.084-.808 1.212A3 3 0 0110 18h4a3 3 0 01-.857-1.294l-.808-1.212a.25.25 0 01.192-.494h7.84a1 1 0 00.467-1.626L18 7.8V3h-3v1.5a.5.5 0 01-.5.5h-6a.5.5 0 01-.5-.5V3H6zm.75 11a.75.75 0 100-1.5.75.75 0 000 1.5zm10.5 0a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              </svg>
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
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center p-4 bg-ocean-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-ocean-gradient rounded-full flex items-center justify-center">
                      {activity.type === 'event' && <CalendarIcon className="w-5 h-5 text-white" />}
                      {activity.type === 'job' && <BriefcaseIcon className="w-5 h-5 text-white" />}
                      {activity.type === 'connection' && <UsersIcon className="w-5 h-5 text-white" />}
                      {activity.type === 'mentorship' && <AcademicCapIcon className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'status-active' : 
                    activity.status === 'pending' ? 'status-pending' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link 
                to="/activity" 
                className="text-ocean-600 hover:text-ocean-700 text-sm font-medium"
              >
                View all activities →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="p-3 bg-ocean-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-600">{event.date} • {event.time}</p>
                  <p className="text-xs text-ocean-600">{event.attendees} attending</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link 
                to="/events" 
                className="btn-ocean-outline w-full py-2 px-4 rounded-lg text-center block text-sm"
              >
                View All Events
              </Link>
            </div>
          </div>

          {/* Job Recommendations */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Jobs</h3>
            <div className="space-y-3">
              {jobRecommendations.slice(0, 2).map((job) => (
                <div key={job.id} className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
                  <p className="text-xs text-gray-600">{job.company}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-green-600 font-medium">{job.salary}</p>
                    <p className="text-xs text-gray-500">{job.posted}</p>
                  </div>
                </div>
              ))}
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