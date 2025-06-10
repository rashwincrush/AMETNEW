import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  BookmarkIcon,
  ShareIcon,
  PlusIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const Jobs = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    experience: 'all',
    location: 'all',
    industry: 'all',
    salaryRange: 'all',
    postedWithin: 'all'
  });

  // Mock jobs data
  const jobs = [
    {
      id: 1,
      title: 'Senior Marine Engineer',
      company: 'Ocean Shipping Ltd.',
      companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
      location: 'Mumbai, Maharashtra',
      jobType: 'Full-time',
      experience: '5-8 years',
      salary: '₹12-15 LPA',
      description: 'Leading maritime company seeking experienced marine engineer for vessel operations and maintenance.',
      longDescription: `We are looking for a Senior Marine Engineer to join our fleet operations team. The successful candidate will be responsible for the safe and efficient operation of marine engines and related equipment aboard our vessels.

Key Responsibilities:
• Supervise and maintain marine propulsion systems
• Ensure compliance with international maritime regulations
• Lead engineering teams during voyage operations
• Conduct regular inspections and preventive maintenance
• Manage fuel efficiency and environmental compliance

Requirements:
• Bachelor's degree in Marine Engineering
• 5+ years of sea-going experience
• Valid Chief Engineer license
• Knowledge of international maritime laws
• Strong leadership and communication skills

Benefits:
• Competitive salary with performance bonuses
• Comprehensive health insurance
• Career advancement opportunities
• Training and certification support`,
      industry: 'Shipping & Maritime',
      requirements: ['Marine Engineering Degree', 'Chief Engineer License', '5+ years experience'],
      skills: ['Marine Engineering', 'Ship Operations', 'Leadership', 'Safety Management'],
      postedDate: '2024-04-10',
      applicationDeadline: '2024-05-10',
      applicants: 23,
      isBookmarked: false,
      companyInfo: {
        name: 'Ocean Shipping Ltd.',
        size: '1000-5000 employees',
        type: 'Private Company',
        website: 'www.oceanshipping.com',
        description: 'Leading international shipping company with 30+ years of experience'
      },
      contactPerson: {
        name: 'Hr Manager',
        email: 'hr@oceanshipping.com',
        phone: '+91 98765 43210'
      }
    },
    {
      id: 2,
      title: 'Naval Architect',
      company: 'Maritime Design Solutions',
      companyLogo: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=100&h=100&fit=crop',
      location: 'Chennai, Tamil Nadu',
      jobType: 'Full-time',
      experience: '3-5 years',
      salary: '₹8-12 LPA',
      description: 'Innovative design firm seeking naval architect for cutting-edge vessel design projects.',
      longDescription: `Join our dynamic team of naval architects working on innovative vessel designs. We specialize in eco-friendly ship designs and sustainable maritime solutions.

Key Responsibilities:
• Design and develop vessel concepts using CAD software
• Perform structural analysis and stability calculations
• Collaborate with engineering teams on project delivery
• Ensure designs meet regulatory standards
• Research and implement sustainable design practices

Requirements:
• B.Tech/M.Tech in Naval Architecture
• Proficiency in AutoCAD, SolidWorks, and ANSYS
• Understanding of ship design principles
• Knowledge of classification society rules
• Strong analytical and problem-solving skills`,
      industry: 'Design & Engineering',
      requirements: ['Naval Architecture Degree', 'CAD Software Proficiency', '3+ years experience'],
      skills: ['Naval Architecture', 'CAD Design', 'Structural Analysis', 'Project Management'],
      postedDate: '2024-04-08',
      applicationDeadline: '2024-05-08',
      applicants: 18,
      isBookmarked: true,
      companyInfo: {
        name: 'Maritime Design Solutions',
        size: '100-500 employees',
        type: 'Private Company',
        website: 'www.maritimedesign.com',
        description: 'Specialized naval architecture and marine engineering consultancy'
      }
    },
    {
      id: 3,
      title: 'Port Operations Manager',
      company: 'Indian Ports Authority',
      companyLogo: 'https://images.unsplash.com/photo-1541746972996-4e0b0f93e586?w=100&h=100&fit=crop',
      location: 'Kochi, Kerala',
      jobType: 'Full-time',
      experience: '8-12 years',
      salary: '₹15-20 LPA',
      description: 'Government position managing port operations and logistics for major Indian port.',
      longDescription: `Lead port operations for one of India's busiest commercial ports. This role involves strategic planning, operational management, and ensuring efficient cargo handling.

Key Responsibilities:
• Oversee daily port operations and logistics
• Manage cargo handling and vessel scheduling
• Ensure compliance with port regulations
• Coordinate with shipping lines and logistics companies
• Implement efficiency improvement initiatives

Requirements:
• MBA in Operations/Logistics or related field
• 8+ years of port/logistics management experience
• Knowledge of port operations and maritime regulations
• Strong leadership and decision-making skills
• Government sector experience preferred`,
      industry: 'Port Operations',
      requirements: ['MBA/Engineering Degree', 'Port Management Experience', 'Leadership Skills'],
      skills: ['Port Operations', 'Logistics Management', 'Strategic Planning', 'Team Leadership'],
      postedDate: '2024-04-05',
      applicationDeadline: '2024-04-25',
      applicants: 45,
      isBookmarked: false,
      companyInfo: {
        name: 'Indian Ports Authority',
        size: '5000+ employees',
        type: 'Government',
        website: 'www.indianports.gov.in',
        description: 'Central government body managing major ports across India'
      }
    },
    {
      id: 4,
      title: 'Marine Superintendent',
      company: 'Global Fleet Management',
      companyLogo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=100&fit=crop',
      location: 'Mumbai, Maharashtra',
      jobType: 'Full-time',
      experience: '10+ years',
      salary: '₹18-25 LPA',
      description: 'Senior position overseeing fleet operations and vessel technical management.',
      longDescription: `Senior leadership role in fleet management company overseeing technical operations of international vessel fleet.

Key Responsibilities:
• Manage technical operations of 50+ vessel fleet
• Oversee dry-docking and maintenance schedules
• Ensure regulatory compliance and safety standards
• Manage relationships with classification societies
• Lead technical teams and development programs

Requirements:
• Chief Engineer license with sailing experience
• 10+ years in fleet management or ship management
• Strong knowledge of maritime regulations
• Experience with ship management software
• Excellent communication and leadership skills`,
      industry: 'Fleet Management',
      requirements: ['Chief Engineer License', '10+ years experience', 'Fleet Management'],
      skills: ['Fleet Management', 'Technical Operations', 'Regulatory Compliance', 'Leadership'],
      postedDate: '2024-04-12',
      applicationDeadline: '2024-05-15',
      applicants: 12,
      isBookmarked: false,
      companyInfo: {
        name: 'Global Fleet Management',
        size: '500-1000 employees',
        type: 'Private Company',
        website: 'www.globalfleet.com',
        description: 'International ship management and maritime services company'
      }
    },
    {
      id: 5,
      title: 'Maritime Lawyer',
      company: 'Coastal Legal Associates',
      companyLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      location: 'Chennai, Tamil Nadu',
      jobType: 'Full-time',
      experience: '5-7 years',
      salary: '₹10-15 LPA',
      description: 'Law firm specializing in maritime law seeking experienced lawyer for complex cases.',
      longDescription: `Join our specialized maritime law practice handling complex admiralty and shipping law cases for international clients.

Key Responsibilities:
• Handle maritime law cases and disputes
• Draft and review charter party agreements
• Represent clients in admiralty courts
• Provide legal advisory on maritime regulations
• Manage international shipping law matters

Requirements:
• LLB with specialization in Maritime Law
• 5+ years of maritime law practice
• Knowledge of international maritime conventions
• Experience with charter parties and bills of lading
• Strong litigation and negotiation skills`,
      industry: 'Legal Services',
      requirements: ['LLB Maritime Law', '5+ years practice', 'Litigation Experience'],
      skills: ['Maritime Law', 'Legal Research', 'Litigation', 'Contract Drafting'],
      postedDate: '2024-04-07',
      applicationDeadline: '2024-05-07',
      applicants: 8,
      isBookmarked: true,
      companyInfo: {
        name: 'Coastal Legal Associates',
        size: '50-100 employees',
        type: 'Partnership',
        website: 'www.coastallegal.com',
        description: 'Specialized maritime and admiralty law firm'
      }
    },
    {
      id: 6,
      title: 'Junior Marine Engineer',
      company: 'Coastal Engineering Corp',
      companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&h=100&fit=crop',
      location: 'Visakhapatnam, Andhra Pradesh',
      jobType: 'Full-time',
      experience: '0-2 years',
      salary: '₹4-6 LPA',
      description: 'Entry-level position for fresh graduates in marine engineering with growth opportunities.',
      longDescription: `Excellent opportunity for fresh marine engineering graduates to start their career with a leading engineering company.

Key Responsibilities:
• Assist in marine equipment maintenance
• Support senior engineers in project execution
• Learn vessel operations and safety procedures
• Participate in training and development programs
• Maintain technical documentation

Requirements:
• B.Tech in Marine Engineering
• Fresh graduate or up to 2 years experience
• Strong technical and analytical skills
• Willingness to work in ship/offshore environments
• Good communication and teamwork abilities`,
      industry: 'Marine Engineering',
      requirements: ['Marine Engineering Degree', 'Fresh Graduate', 'Technical Skills'],
      skills: ['Marine Engineering', 'Technical Analysis', 'Learning Agility', 'Teamwork'],
      postedDate: '2024-04-09',
      applicationDeadline: '2024-05-09',
      applicants: 67,
      isBookmarked: false,
      companyInfo: {
        name: 'Coastal Engineering Corp',
        size: '200-500 employees',
        type: 'Private Company',
        website: 'www.coastalengineering.com',
        description: 'Marine engineering and offshore services company'
      }
    }
  ];

  const filterOptions = {
    jobType: [
      { value: 'all', label: 'All Job Types' },
      { value: 'full-time', label: 'Full-time' },
      { value: 'part-time', label: 'Part-time' },
      { value: 'contract', label: 'Contract' },
      { value: 'internship', label: 'Internship' }
    ],
    experience: [
      { value: 'all', label: 'All Experience Levels' },
      { value: 'entry', label: 'Entry Level (0-2 years)' },
      { value: 'mid', label: 'Mid Level (3-7 years)' },
      { value: 'senior', label: 'Senior Level (8+ years)' }
    ],
    location: [
      { value: 'all', label: 'All Locations' },
      { value: 'mumbai', label: 'Mumbai' },
      { value: 'chennai', label: 'Chennai' },
      { value: 'kochi', label: 'Kochi' },
      { value: 'visakhapatnam', label: 'Visakhapatnam' },
      { value: 'goa', label: 'Goa' }
    ],
    industry: [
      { value: 'all', label: 'All Industries' },
      { value: 'shipping', label: 'Shipping & Maritime' },
      { value: 'ports', label: 'Port Operations' },
      { value: 'offshore', label: 'Offshore' },
      { value: 'naval', label: 'Naval & Defense' },
      { value: 'legal', label: 'Maritime Legal' }
    ],
    salaryRange: [
      { value: 'all', label: 'All Salary Ranges' },
      { value: '0-5', label: '₹0-5 LPA' },
      { value: '5-10', label: '₹5-10 LPA' },
      { value: '10-15', label: '₹10-15 LPA' },
      { value: '15-20', label: '₹15-20 LPA' },
      { value: '20+', label: '₹20+ LPA' }
    ],
    postedWithin: [
      { value: 'all', label: 'Any Time' },
      { value: '1', label: 'Last 24 hours' },
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last 30 days' }
    ]
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesJobType = filters.jobType === 'all' || 
                          job.jobType.toLowerCase().includes(filters.jobType);
    
    const matchesLocation = filters.location === 'all' || 
                           job.location.toLowerCase().includes(filters.location);
    
    const matchesIndustry = filters.industry === 'all' || 
                           job.industry.toLowerCase().includes(filters.industry);

    return matchesSearch && matchesJobType && matchesLocation && matchesIndustry;
  });

  const handleBookmark = (jobId) => {
    // Mock bookmark functionality
    console.log('Bookmark job:', jobId);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const JobCard = ({ job }) => (
    <div className="glass-card rounded-lg p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <img 
            src={job.companyLogo} 
            alt={job.company}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{job.title}</h3>
            <p className="text-ocean-600 font-medium">{job.company}</p>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span>{job.location}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => handleBookmark(job.id)}
          className={`p-2 rounded-lg transition-colors ${
            job.isBookmarked 
              ? 'bg-ocean-100 text-ocean-600' 
              : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <BookmarkIcon className="w-5 h-5" />
        </button>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{job.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <BriefcaseIcon className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-gray-600">{job.jobType}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-gray-600">{job.experience}</span>
        </div>
        <div className="flex items-center">
          <CurrencyRupeeIcon className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-gray-600">{job.salary}</span>
        </div>
        <div className="flex items-center">
          <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-gray-600">{job.industry}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {job.skills.slice(0, 3).map((skill, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs"
          >
            {skill}
          </span>
        ))}
        {job.skills.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            +{job.skills.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {job.applicants} applicants • Posted {new Date(job.postedDate).toLocaleDateString()}
        </div>
        <div className="flex space-x-2">
          <Link 
            to={`/jobs/${job.id}`}
            className="btn-ocean-outline py-1 px-3 rounded text-sm"
          >
            View Details
          </Link>
          <button className="btn-ocean py-1 px-3 rounded text-sm">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );

  const JobListItem = ({ job }) => (
    <div className="glass-card rounded-lg p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <img 
            src={job.companyLogo} 
            alt={job.company}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                <p className="text-ocean-600 font-medium">{job.company}</p>
                <p className="text-gray-600 text-sm mt-1">{job.description}</p>
              </div>
              <button 
                onClick={() => handleBookmark(job.id)}
                className={`p-2 rounded-lg transition-colors ${
                  job.isBookmarked 
                    ? 'bg-ocean-100 text-ocean-600' 
                    : 'hover:bg-gray-100 text-gray-400'
                }`}
              >
                <BookmarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="w-4 h-4 mr-1" />
                <span>{job.jobType}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>{job.experience}</span>
              </div>
              <div className="flex items-center">
                <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                <span>{job.salary}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-wrap gap-1">
                {job.skills.slice(0, 4).map((skill, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {job.applicants} applicants
                </span>
                <Link 
                  to={`/jobs/${job.id}`}
                  className="btn-ocean-outline py-1 px-3 rounded text-sm"
                >
                  View Details
                </Link>
                <button className="btn-ocean py-1 px-3 rounded text-sm">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Portal</h1>
            <p className="text-gray-600">Discover career opportunities in the maritime industry</p>
          </div>
          <div className="flex space-x-2">
            <Link 
              to="/jobs/alerts" 
              className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center"
            >
              <BellIcon className="w-4 h-4 mr-2" />
              Job Alerts
            </Link>
            <Link 
              to="/jobs/post" 
              className="btn-ocean px-4 py-2 rounded-lg flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Post Job
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input w-full pl-10 pr-4 py-2 rounded-lg"
                placeholder="Search jobs, companies, or skills..."
              />
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-ocean-500 text-white' : 'text-gray-600'}`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-ocean-500 text-white' : 'text-gray-600'}`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(filterOptions).map(([filterType, options]) => (
            <select
              key={filterType}
              value={filters[filterType]}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              className="form-input px-3 py-2 rounded text-sm"
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-medium">{filteredJobs.length}</span> jobs
        </p>
        <select className="form-input px-3 py-1 rounded text-sm">
          <option>Sort by Relevance</option>
          <option>Sort by Date Posted</option>
          <option>Sort by Salary</option>
          <option>Sort by Company</option>
        </select>
      </div>

      {/* Jobs Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
        : 'space-y-4'
      }>
        {filteredJobs.map((job) => 
          viewMode === 'grid' 
            ? <JobCard key={job.id} job={job} />
            : <JobListItem key={job.id} job={job} />
        )}
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="btn-ocean-outline px-6 py-2 rounded-lg">
          Load More Jobs
        </button>
      </div>
    </div>
  );
};

export default Jobs;