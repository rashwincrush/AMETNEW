import React, { useState } from 'react';
import { 
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock analytics data
  const overviewStats = [
    {
      title: 'Total Alumni',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+8%',
      trend: 'up',
      icon: EyeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Events This Month',
      value: '15',
      change: '+3',
      trend: 'up',
      icon: CalendarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Job Postings',
      value: '89',
      change: '+15%',
      trend: 'up',
      icon: BriefcaseIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const userEngagementData = [
    { month: 'Jan', logins: 1200, profileViews: 3400, messages: 890 },
    { month: 'Feb', logins: 1350, profileViews: 3800, messages: 1020 },
    { month: 'Mar', logins: 1180, profileViews: 3200, messages: 950 },
    { month: 'Apr', logins: 1420, profileViews: 4100, messages: 1150 }
  ];

  const eventMetrics = [
    {
      title: 'Total Events',
      value: '47',
      change: '+18%',
      description: 'Events created this year'
    },
    {
      title: 'Total Attendees',
      value: '1,234',
      change: '+25%',
      description: 'People attended events'
    },
    {
      title: 'Average RSVP Rate',
      value: '78%',
      change: '+5%',
      description: 'RSVP to event ratio'
    },
    {
      title: 'Event Satisfaction',
      value: '4.6/5',
      change: '+0.3',
      description: 'Average rating'
    }
  ];

  const jobMetrics = [
    {
      title: 'Job Postings',
      value: '89',
      change: '+15%',
      description: 'Active job listings'
    },
    {
      title: 'Applications',
      value: '456',
      change: '+22%',
      description: 'Total applications'
    },
    {
      title: 'Success Rate',
      value: '34%',
      change: '+8%',
      description: 'Applications to hire ratio'
    },
    {
      title: 'Avg. Time to Fill',
      value: '18 days',
      change: '-3 days',
      description: 'Days to fill position'
    }
  ];

  const mentorshipMetrics = [
    {
      title: 'Active Mentors',
      value: '67',
      change: '+12%',
      description: 'Currently active mentors'
    },
    {
      title: 'Mentorship Requests',
      value: '123',
      change: '+28%',
      description: 'Total requests this month'
    },
    {
      title: 'Success Rate',
      value: '85%',
      change: '+7%',
      description: 'Completed mentorships'
    },
    {
      title: 'Avg. Session Rating',
      value: '4.8/5',
      change: '+0.2',
      description: 'Mentor session rating'
    }
  ];

  const topContent = [
    {
      title: 'AMET Alumni Meetup 2024',
      type: 'Event',
      views: 1234,
      engagement: '89%',
      category: 'Events'
    },
    {
      title: 'Senior Marine Engineer - Ocean Shipping',
      type: 'Job',
      views: 892,
      engagement: '76%',
      category: 'Jobs'
    },
    {
      title: 'Captain Rajesh Kumar - Mentorship',
      type: 'Profile',
      views: 756,
      engagement: '82%',
      category: 'Mentorship'
    },
    {
      title: 'Marine Engineers Mumbai Group',
      type: 'Group',
      views: 645,
      engagement: '71%',
      category: 'Networking'
    }
  ];

  const recentActivities = [
    {
      action: 'New user registration',
      user: 'Arjun Nair',
      timestamp: '2 minutes ago',
      type: 'user'
    },
    {
      action: 'Event created',
      user: 'Dr. Priya Sharma',
      timestamp: '15 minutes ago',
      type: 'event'
    },
    {
      action: 'Job application submitted',
      user: 'Sneha Patel',
      timestamp: '32 minutes ago',
      type: 'job'
    },
    {
      action: 'Group message posted',
      user: 'Mohammed Ali',
      timestamp: '1 hour ago',
      type: 'message'
    },
    {
      action: 'Mentorship session completed',
      user: 'Kavitha Menon',
      timestamp: '2 hours ago',
      type: 'mentorship'
    }
  ];

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'events', label: 'Events', icon: CalendarIcon },
    { id: 'jobs', label: 'Jobs', icon: BriefcaseIcon },
    { id: 'mentorship', label: 'Mentorship', icon: AcademicCapIcon }
  ];

  const MetricCard = ({ metric }) => (
    <div className="glass-card rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{metric.title}</p>
          <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          {metric.description && (
            <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
          )}
        </div>
        <div className={`flex items-center ${
          metric.change.startsWith('+') ? 'text-green-600' : 
          metric.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
        }`}>
          {metric.change.startsWith('+') ? (
            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
          ) : metric.change.startsWith('-') ? (
            <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
          ) : null}
          <span className="text-sm font-medium">{metric.change}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor platform performance and user engagement</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-input px-3 py-2 rounded-lg text-sm"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
            <button className="btn-ocean px-4 py-2 rounded-lg text-sm">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium ${
                    selectedTab === tab.id
                      ? 'text-ocean-600 border-b-2 border-ocean-600 bg-ocean-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="glass-card rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        {stat.trend === 'up' ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs last period</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Engagement Chart */}
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
                  <div className="space-y-4">
                    {userEngagementData.map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{data.month}</span>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span>Logins: {data.logins}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span>Views: {data.profileViews}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            <span>Messages: {data.messages}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Content */}
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Content</h3>
                  <div className="space-y-4">
                    {topContent.map((content, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{content.title}</h4>
                          <p className="text-xs text-gray-600">{content.type} • {content.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{content.views} views</p>
                          <p className="text-xs text-green-600">{content.engagement} engagement</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-ocean-100 rounded-full flex items-center justify-center">
                        {activity.type === 'user' && <UsersIcon className="w-4 h-4 text-ocean-600" />}
                        {activity.type === 'event' && <CalendarIcon className="w-4 h-4 text-ocean-600" />}
                        {activity.type === 'job' && <BriefcaseIcon className="w-4 h-4 text-ocean-600" />}
                        {activity.type === 'message' && <ChatBubbleLeftRightIcon className="w-4 h-4 text-ocean-600" />}
                        {activity.type === 'mentorship' && <AcademicCapIcon className="w-4 h-4 text-ocean-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.action}</span> by {activity.user}
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {selectedTab === 'events' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Event Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {eventMetrics.map((metric, index) => (
                  <MetricCard key={index} metric={metric} />
                ))}
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {selectedTab === 'jobs' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Portal Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {jobMetrics.map((metric, index) => (
                  <MetricCard key={index} metric={metric} />
                ))}
              </div>
            </div>
          )}

          {/* Mentorship Tab */}
          {selectedTab === 'mentorship' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Mentorship Program Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mentorshipMetrics.map((metric, index) => (
                  <MetricCard key={index} metric={metric} />
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {selectedTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">User Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">User Growth</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">New Users</span>
                      <span className="text-sm font-medium">+247 this month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Alumni</span>
                      <span className="text-sm font-medium">2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Users</span>
                      <span className="text-sm font-medium">1,234 (43%)</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">User Demographics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Marine Engineering</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Naval Architecture</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Port Management</span>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Other</span>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Geographic Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mumbai</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Chennai</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Kochi</span>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Other Cities</span>
                      <span className="text-sm font-medium">19%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;