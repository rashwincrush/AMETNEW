import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  BookmarkIcon,
  ShareIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const JobDetails = () => {
  const { id } = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  // Mock detailed job data
  const job = {
    id: 1,
    title: 'Senior Marine Engineer',
    company: 'Ocean Shipping Ltd.',
    companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    location: 'Mumbai, Maharashtra',
    jobType: 'Full-time',
    experience: '5-8 years',
    salary: '₹12-15 LPA',
    description: 'Leading maritime company seeking experienced marine engineer for vessel operations and maintenance.',
    longDescription: `We are looking for a Senior Marine Engineer to join our fleet operations team. The successful candidate will be responsible for the safe and efficient operation of marine engines and related equipment aboard our vessels.

The role offers excellent opportunities for career advancement in a dynamic maritime environment. You will work with state-of-the-art equipment and be part of a team committed to excellence in maritime operations.`,
    responsibilities: [
      'Supervise and maintain marine propulsion systems and auxiliary machinery',
      'Ensure compliance with international maritime regulations (SOLAS, MARPOL)',
      'Lead engineering teams during voyage operations and port calls',
      'Conduct regular inspections and preventive maintenance schedules',
      'Manage fuel efficiency optimization and environmental compliance',
      'Coordinate with port authorities and classification societies',
      'Mentor junior engineers and deck officers',
      'Maintain detailed engineering logs and reports'
    ],
    requirements: [
      'Bachelor\'s degree in Marine Engineering from recognized institution',
      'Valid Chief Engineer license (Class 1 preferred)',
      'Minimum 5 years of sea-going experience on merchant vessels',
      'Knowledge of international maritime laws and regulations',
      'Strong leadership and communication skills',
      'Experience with modern marine propulsion systems',
      'Proficiency in English (verbal and written)',
      'Valid STCW certificates and medical fitness'
    ],
    preferredQualifications: [
      'MBA or advanced degree in maritime studies',
      'Experience with LNG or specialized vessel types',
      'Knowledge of ship management software (AMOS, DANAOS)',
      'Previous experience in fleet management or superintendency',
      'Additional language skills (especially for international routes)'
    ],
    benefits: [
      'Competitive salary with performance-based bonuses',
      'Comprehensive health and life insurance',
      'Annual leave as per maritime regulations (4 months)',
      'Career advancement opportunities within the organization',
      'Training and certification support for professional development',
      'Family accommodation allowance for shore positions',
      'Retirement benefits and provident fund',
      'International exposure and travel opportunities'
    ],
    industry: 'Shipping & Maritime',
    skills: ['Marine Engineering', 'Ship Operations', 'Leadership', 'Safety Management', 'Regulatory Compliance'],
    postedDate: '2024-04-10',
    applicationDeadline: '2024-05-10',
    applicants: 23,
    jobId: 'OSL-ME-2024-001',
    reportingTo: 'Fleet Technical Manager',
    department: 'Technical Operations',
    workSchedule: 'Rotation-based (4 months on/off)',
    travelRequired: 'Extensive (International voyages)',
    companyInfo: {
      name: 'Ocean Shipping Ltd.',
      founded: '1994',
      size: '1000-5000 employees',
      type: 'Private Company',
      headquarters: 'Mumbai, India',
      website: 'www.oceanshipping.com',
      description: 'Ocean Shipping Ltd. is a leading international shipping company with over 30 years of experience in maritime transportation. We operate a modern fleet of vessels serving global trade routes and are committed to sustainable shipping practices.',
      values: ['Safety First', 'Environmental Responsibility', 'Excellence in Service', 'Innovation'],
      fleetSize: '50+ vessels',
      routes: 'Asia-Europe, Trans-Pacific, Indian Ocean',
      certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001', 'MLC 2006']
    },
    contactPerson: {
      name: 'Rajesh Kapoor',
      title: 'HR Manager - Maritime Operations',
      email: 'hr@oceanshipping.com',
      phone: '+91 98765 43210',
      linkedin: 'linkedin.com/in/rajeshkapoor'
    },
    applicationProcess: [
      'Submit online application with resume and cover letter',
      'Initial screening and document verification',
      'Technical interview with Fleet Technical Manager',
      'Medical examination and background check',
      'Final interview with senior management',
      'Job offer and contract negotiation'
    ],
    similarJobs: [
      {
        id: 2,
        title: 'Chief Engineer',
        company: 'Maritime Services Corp',
        location: 'Chennai',
        salary: '₹18-22 LPA'
      },
      {
        id: 3,
        title: 'Marine Superintendent',
        company: 'Global Fleet Management',
        location: 'Mumbai',
        salary: '₹15-20 LPA'
      },
      {
        id: 4,
        title: 'Fleet Engineer',
        company: 'Indian Shipping Lines',
        location: 'Kochi',
        salary: '₹10-14 LPA'
      }
    ]
  };

  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    expectedSalary: '',
    availableFrom: '',
    resumeFile: null,
    experience: '',
    whyInterested: ''
  });

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    console.log('Job bookmarked:', job.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `${job.title} at ${job.company}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Job link copied to clipboard!');
    }
  };

  const handleApplicationSubmit = (e) => {
    e.preventDefault();
    console.log('Application submitted:', applicationData);
    alert('Application submitted successfully!');
    setShowApplicationForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setApplicationData(prev => ({
      ...prev,
      resumeFile: e.target.files[0]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Job Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4 flex-1">
            <img 
              src={job.companyLogo} 
              alt={job.company}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl text-ocean-600 font-medium mb-2">{job.company}</p>
              <p className="text-gray-600 mb-4">{job.description}</p>
              
              {/* Key Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">{job.location}</span>
                </div>
                <div className="flex items-center">
                  <BriefcaseIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">{job.jobType}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">{job.experience}</span>
                </div>
                <div className="flex items-center">
                  <CurrencyRupeeIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">{job.salary}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 ml-6">
            <button 
              onClick={() => setShowApplicationForm(true)}
              className="btn-ocean px-6 py-3 rounded-lg font-medium"
            >
              Apply Now
            </button>
            <div className="flex space-x-2">
              <button 
                onClick={handleBookmark}
                className={`p-2 rounded-lg border transition-colors ${
                  isBookmarked 
                    ? 'bg-ocean-100 text-ocean-600 border-ocean-200' 
                    : 'hover:bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                <BookmarkIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={handleShare}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Job Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <UserGroupIcon className="w-4 h-4 mr-1" />
            <span>{job.applicants} applicants</span>
          </div>
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            <span>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <DocumentTextIcon className="w-4 h-4 mr-1" />
            <span>Job ID: {job.jobId}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.longDescription}</p>
          </div>

          {/* Responsibilities */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Responsibilities</h2>
            <ul className="space-y-3">
              {job.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{responsibility}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
            <ul className="space-y-3 mb-6">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Qualifications</h3>
            <ul className="space-y-2">
              {job.preferredQualifications.map((qualification, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-3 mt-1">◦</span>
                  <span className="text-gray-700">{qualification}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits & Perks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {job.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Application Process */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Process</h2>
            <div className="space-y-4">
              {job.applicationProcess.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-8 h-8 bg-ocean-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4 flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 mt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Overview */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Overview</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Industry</label>
                <p className="text-gray-900">{job.industry}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-900">{job.department}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Reports To</label>
                <p className="text-gray-900">{job.reportingTo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Work Schedule</label>
                <p className="text-gray-900">{job.workSchedule}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Travel Required</label>
                <p className="text-gray-900">{job.travelRequired}</p>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Company Info */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.company}</h3>
            <div className="space-y-4">
              <p className="text-gray-700 text-sm">{job.companyInfo.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Founded:</span>
                  <span className="text-gray-900">{job.companyInfo.founded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Company Size:</span>
                  <span className="text-gray-900">{job.companyInfo.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fleet Size:</span>
                  <span className="text-gray-900">{job.companyInfo.fleetSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900">{job.companyInfo.type}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Core Values</h4>
                <div className="space-y-1">
                  {job.companyInfo.values.map((value, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-ocean-500 rounded-full mr-2"></span>
                      <span className="text-gray-700 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a 
                href={`https://${job.companyInfo.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-ocean-600 hover:text-ocean-700 text-sm"
              >
                <GlobeAltIcon className="w-4 h-4 mr-2" />
                Visit Website
              </a>
            </div>
          </div>

          {/* Contact Person */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{job.contactPerson.name}</h4>
                <p className="text-gray-600 text-sm">{job.contactPerson.title}</p>
              </div>
              
              <div className="space-y-2">
                <a 
                  href={`mailto:${job.contactPerson.email}`}
                  className="flex items-center text-ocean-600 hover:text-ocean-700 text-sm"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  {job.contactPerson.email}
                </a>
                <a 
                  href={`tel:${job.contactPerson.phone}`}
                  className="flex items-center text-ocean-600 hover:text-ocean-700 text-sm"
                >
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  {job.contactPerson.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Similar Jobs */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h3>
            <div className="space-y-3">
              {job.similarJobs.map((similarJob) => (
                <Link 
                  key={similarJob.id}
                  to={`/jobs/${similarJob.id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-ocean-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 text-sm">{similarJob.title}</h4>
                  <p className="text-gray-600 text-xs">{similarJob.company}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-500 text-xs">{similarJob.location}</span>
                    <span className="text-ocean-600 text-xs font-medium">{similarJob.salary}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Apply for {job.title}</h2>
              <button 
                onClick={() => setShowApplicationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplicationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter *
                </label>
                <textarea
                  name="coverLetter"
                  value={applicationData.coverLetter}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  className="form-input w-full px-3 py-2 rounded-lg"
                  placeholder="Explain why you're interested in this position..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Salary
                  </label>
                  <input
                    type="text"
                    name="expectedSalary"
                    value={applicationData.expectedSalary}
                    onChange={handleInputChange}
                    className="form-input w-full px-3 py-2 rounded-lg"
                    placeholder="₹12-15 LPA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available From
                  </label>
                  <input
                    type="date"
                    name="availableFrom"
                    value={applicationData.availableFrom}
                    onChange={handleInputChange}
                    className="form-input w-full px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relevant Experience
                </label>
                <textarea
                  name="experience"
                  value={applicationData.experience}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-input w-full px-3 py-2 rounded-lg"
                  placeholder="Briefly describe your relevant experience..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="btn-ocean-outline px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ocean px-6 py-2 rounded-lg"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;