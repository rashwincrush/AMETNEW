import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon,
  HomeIcon,
  InformationCircleIcon
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
              <Link to="/" className="flex items-center space-x-3">
                <img src="/logo.png" alt="AMET Alumni Logo" className="h-10 w-auto" />
                <div>
                  <span className="text-xl font-bold text-gray-900">AMET Alumni</span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-blue-600 font-medium flex items-center hover:text-blue-800 transition-colors">
                <HomeIcon className="w-5 h-5 mr-1.5" />
                Home
              </Link>
              <Link to="/directory" className="text-gray-600 hover:text-blue-600 font-medium flex items-center transition-colors">
                <UsersIcon className="w-5 h-5 mr-1.5" />
                Directory
              </Link>
              <Link to="/events" className="text-gray-600 hover:text-blue-600 font-medium flex items-center transition-colors">
                <CalendarIcon className="w-5 h-5 mr-1.5" />
                Events
              </Link>
              <Link to="/jobs" className="text-gray-600 hover:text-blue-600 font-medium flex items-center transition-colors">
                <BriefcaseIcon className="w-5 h-5 mr-1.5" />
                Jobs
              </Link>
              <Link to="/mentorship" className="text-gray-600 hover:text-blue-600 font-medium flex items-center transition-colors">
                <AcademicCapIcon className="w-5 h-5 mr-1.5" />
                Mentorship
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 font-medium flex items-center transition-colors">
                <InformationCircleIcon className="w-5 h-5 mr-1.5" />
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
        <div className="relative bg-ocean-700 text-white">
          <div className="absolute inset-0">
            {/* Placeholder for a background image */}
            <div className="absolute inset-0 bg-ocean-800 mix-blend-multiply" aria-hidden="true"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Everything You Need to Stay Connected
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-ocean-200">
              Our platform provides tools and resources to help alumni connect, collaborate, and grow together.
            </p>
            <div className="mt-10">
              <Link
                to="/register"
                className="bg-white text-ocean-700 font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-200 transition-colors shadow-lg"
              >
                Join the Community
              </Link>
            </div>
          </div>
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

      {/* Upcoming Events Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="mt-4 text-lg text-gray-600">Join us for our next series of events.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Placeholder Event 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <p className="text-sm text-blue-600 font-semibold">Oct 25, 2025</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">Annual Alumni Gala</h3>
                <p className="mt-3 text-gray-600">A night of celebration and networking.</p>
                <Link to="#" className="mt-4 inline-block text-blue-600 font-semibold hover:text-blue-800">Learn More &rarr;</Link>
              </div>
            </div>
            {/* Placeholder Event 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <p className="text-sm text-blue-600 font-semibold">Nov 12, 2025</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">Maritime Tech Webinar</h3>
                <p className="mt-3 text-gray-600">Exploring the future of maritime technology.</p>
                <Link to="#" className="mt-4 inline-block text-blue-600 font-semibold hover:text-blue-800">Learn More &rarr;</Link>
              </div>
            </div>
            {/* Placeholder Event 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <p className="text-sm text-blue-600 font-semibold">Dec 05, 2025</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">Career Development Workshop</h3>
                <p className="mt-3 text-gray-600">Enhance your skills with industry experts.</p>
                <Link to="#" className="mt-4 inline-block text-blue-600 font-semibold hover:text-blue-800">Learn More &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alumni Spotlight Section */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BuildingLibraryIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Alumni Spotlight</h2>
          <div className="mt-8">
            <img className="mx-auto h-24 w-24 rounded-full" src="/default-avatar.svg" alt="Alumni Spotlight Placeholder" />
            <blockquote className="mt-6 text-xl text-gray-900 font-medium">
              <p>"The AMET network has been instrumental in my career growth. The connections I've made are invaluable."
              </p>
            </blockquote>
            <footer className="mt-4">
              <div className="font-bold text-gray-900">Capt. Jane Doe</div>
              <div className="text-gray-600">Year of Completion : 2010, CEO at Maritime Innovations</div>
            </footer>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">What Our Alumni Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placeholder Testimonial 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <p className="text-gray-700 italic">"This platform is a fantastic resource for staying in touch with classmates and finding new opportunities. Highly recommended!"</p>
              <p className="mt-4 font-bold text-gray-900">- John Smith, Year of Completion : 2015</p>
            </div>
            {/* Placeholder Testimonial 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <p className="text-gray-700 italic">"The mentorship program connected me with an industry leader who provided incredible guidance for my career transition."
              </p>
              <p className="mt-4 font-bold text-gray-900">- Priya Sharma, Year of Completion : 2018</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo.png" alt="AMET Alumni Logo" className="h-10 w-auto" />
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
            <p>&copy; {new Date().getFullYear()} AMET Alumni Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;