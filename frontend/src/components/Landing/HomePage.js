import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const features = [
    {
      icon: UsersIcon,
      title: 'Alumni Directory',
      description: 'Connect with fellow alumni across industries, locations, and graduation years.',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: CalendarIcon,
      title: 'Events Calendar',
      description: 'Stay updated with reunions, webinars, and networking opportunities.',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: BriefcaseIcon,
      title: 'Job Board',
      description: 'Explore career opportunities shared by alumni and industry partners.',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      button: true
    },
    {
      icon: AcademicCapIcon,
      title: 'Mentorship Program',
      description: 'Participate in our structured mentorship program for growth and guidance.',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  const jobOpportunities = [
    {
      id: 1,
      title: 'Senior Marine Engineer',
      company: 'Ocean Shipping Ltd.',
      location: 'Mumbai, India',
      type: 'Full-time',
      posted: '2 days ago'
    },
    {
      id: 2,
      title: 'Naval Architect',
      company: 'Maritime Solutions',
      location: 'Chennai, India',
      type: 'Full-time',
      posted: '4 days ago'
    },
    {
      id: 3,
      title: 'Port Operations Manager',
      company: 'Indian Ports Authority',
      location: 'Kochi, India',
      type: 'Full-time',
      posted: '1 week ago'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">AMET</span>
                  <span className="text-sm text-blue-600 ml-1">Alumni</span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-blue-600 font-medium flex items-center">
                <span className="mr-1">🏠</span>
                Home
              </Link>
              <Link to="/directory" className="text-gray-600 hover:text-blue-600 font-medium flex items-center">
                <span className="mr-1">👥</span>
                Directory
              </Link>
              <Link to="/events" className="text-gray-600 hover:text-blue-600 font-medium flex items-center">
                <span className="mr-1">📅</span>
                Events
              </Link>
              <Link to="/jobs" className="text-gray-600 hover:text-blue-600 font-medium flex items-center">
                <span className="mr-1">💼</span>
                Jobs
              </Link>
              <Link to="/mentorship" className="text-gray-600 hover:text-blue-600 font-medium flex items-center">
                <span className="mr-1">🎓</span>
                Mentorship
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 font-medium flex items-center">
                <span className="mr-1">ℹ️</span>
                About
              </Link>
            </div>

            {/* Search and Auth */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search alumni, events..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <Link
                to="/login"
                className="text-gray-600 hover:text-blue-600 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Stay Connected
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform provides tools and resources to help alumni connect, 
            collaborate, and grow together.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className={`${feature.bgColor} rounded-2xl p-8 text-center h-80 flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
                
                {feature.button && (
                  <div className="mt-6">
                    <Link
                      to="/jobs"
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors inline-block"
                    >
                      View Jobs
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Latest Job Opportunities Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Latest Job Opportunities
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore exclusive career opportunities shared by our alumni network and 
            industry partners.
          </p>
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {jobOpportunities.map((job) => (
            <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                  <p className="text-gray-600 text-sm mb-1">{job.company}</p>
                  <p className="text-gray-500 text-sm mb-1">{job.location}</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  {job.type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">{job.posted}</span>
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  View Details
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Jobs Button */}
        <div className="text-center">
          <Link
            to="/jobs"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            View All Jobs
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">AMET Alumni Portal</span>
                </div>
              </div>
              <p className="text-gray-600 max-w-md">
                Connecting AMET graduates worldwide through professional networking, 
                career opportunities, and lifelong learning.
              </p>
            </div>
            
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/about" className="hover:text-blue-600 transition-colors">About AMET</Link></li>
                <li><Link to="/events" className="hover:text-blue-600 transition-colors">Events</Link></li>
                <li><Link to="/jobs" className="hover:text-blue-600 transition-colors">Career Center</Link></li>
                <li><Link to="/directory" className="hover:text-blue-600 transition-colors">Alumni Directory</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/help" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 AMET Alumni Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;