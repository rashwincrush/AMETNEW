import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';
import { 
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  BookmarkIcon as BookmarkIconOutline,
  ShareIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import JobApplicationForm from './JobApplicationForm';
import { useAuth } from '../../contexts/AuthContext';

// Helper function to safely convert string data to arrays
const convertToArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    if (data.includes(',')) return data.split(',').map(item => item.trim());
    if (data.includes('|')) return data.split('|').map(item => item.trim());
    if (data.includes(';')) return data.split(';').map(item => item.trim());
    return [data];
  }
  return [];
};

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user, getUserRole } = useAuth();
  const [bookmarking, setBookmarking] = useState(false); // For loading state of bookmark action
  const [sharing, setSharing] = useState(false); // For loading state of share action
  


  // Fetch job data from Supabase
  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Process data to ensure arrays are handled properly
          const processedData = {
            ...data,
            requirements: convertToArray(data.requirements),
            responsibilities: convertToArray(data.responsibilities),
            preferredQualifications: convertToArray(data.preferredQualifications),
            benefits: convertToArray(data.benefits),
            applicationProcess: convertToArray(data.applicationProcess),
            skills: convertToArray(data.skills),
            companyInfo: data.companyInfo ? {
              ...data.companyInfo,
              values: data.companyInfo?.values ? convertToArray(data.companyInfo.values) : []
            } : null,
            similarJobs: Array.isArray(data.similarJobs) ? data.similarJobs : []
          };
          
          setJob(processedData);

        } else {
          setError('Job not found');
          toast.error('Job not found');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Failed to load job details');
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchBookmarkStatus = async (currentJobId, currentUserId) => {
      if (!currentJobId || !currentUserId) return;
      try {
        const { data: bookmark, error } = await supabase
          .from('bookmarked_jobs')
          .select('id')
          .eq('job_id', currentJobId)
          .eq('user_id', currentUserId)
          .maybeSingle(); // Use maybeSingle as a bookmark might not exist

        if (error) {
          console.error('Error fetching bookmark status:', error.message);
          // Don't set error state here, as it's not critical for job view
          // toast.error('Could not check bookmark status.');
          return;
        }
        setIsBookmarked(!!bookmark); // Set to true if bookmark exists, false otherwise

      } catch (err) {
        console.error('Exception fetching bookmark status:', err.message);
      }
    };

    if (id) {
      fetchJobDetails().then(() => {
        // After job details are fetched (or attempted), check user and then bookmark status
        // This 'then' block might need adjustment if fetchJobDetails doesn't directly reflect when 'job' state is set
        // A more robust way would be another useEffect dependent on 'job' and 'user'
      });
    }
  }, [id]); // Initial fetchJobDetails trigger

  // New useEffect to fetch bookmark status when job and user are available
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (job && job.id && user && user.id) {

        try {
          const { data: bookmark, error } = await supabase
            .from('bookmarked_jobs')
            .select('id')
            .eq('job_id', job.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching bookmark status:', error.message);
            // toast.error('Could not check bookmark status.');
            return;
          }
          setIsBookmarked(!!bookmark);

        } catch (err) {
          console.error('Exception fetching bookmark status:', err.message);
        }
      }
    };

    fetchBookmarkStatus();
  }, [job, user]); // Runs when job or user state changes

  const handleBookmark = async () => {
    if (!user) {
      toast.error('Please log in to bookmark jobs.');
      // Optionally, navigate to login: navigate('/login');
      return;
    }

    if (!job || !job.id) {
      toast.error('Job details not available to bookmark.');
      return;
    }

    setBookmarking(true);
    try {
      if (isBookmarked) {
        // User wants to unbookmark
        const { error } = await supabase
          .from('bookmarked_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', job.id);

        if (error) throw error;
        setIsBookmarked(false);
        toast.success('Bookmark removed!');
      } else {
        // User wants to bookmark
        const { error } = await supabase
          .from('bookmarked_jobs')
          .insert([{ user_id: user.id, job_id: job.id }]);
        
        if (error) throw error;
        setIsBookmarked(true);
        toast.success('Job bookmarked!');
      }
    } catch (error) {
      console.error('Error handling bookmark:', error.message);
      toast.error('Failed to update bookmark. Please try again.');
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (!job) {
      toast.error('Job details not available to share.');
      return;
    }
    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share({
          title: `${job.title} at ${job.company || 'our company'}`, // Ensure job.company has a fallback
          text: `Check out this job opportunity: ${job.title} at ${job.company || 'our company'}`,
          url: window.location.href
        });

      } catch (error) {
        if (error.name === 'AbortError') {

          // toast.info('Share canceled.'); // Optional: inform user
        } else {
          console.error('Error sharing:', error);
          toast.error('Could not share. Please try again.');
        }
      } finally {
        setSharing(false);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
        toast.error('Could not copy link.');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ocean-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading job details...</h2>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto glass-card p-8 rounded-lg shadow-lg">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Job</h2>
          <p className="text-gray-600 mb-6">{error || 'Job not found'}</p>
          <Link to="/jobs" className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-md inline-block">
            Return to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Job Header */}
        <div className="glass-card rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap lg:flex-nowrap gap-4">
            {/* Company Logo and Job Info */}
            <div className="flex items-start space-x-4 flex-1">
              {job.companyLogo && (
                <img 
                  src={job.companyLogo} 
                  alt={job.company || 'Company logo'}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-xl text-ocean-600 font-medium mb-2">{job.company || 'Company Name Not Available'}</p>
                <p className="text-gray-600 mb-4">{job.description || 'No summary available.'}</p>
                
                {/* Key Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                  <div className="flex items-center">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm md:text-base truncate">{job.location || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm md:text-base">{job.job_type || job.jobType || 'Full-time'}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm md:text-base">{job.experience_level || job.experience || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center">
                    <CurrencyRupeeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm md:text-base">{job.salary_range || job.salary || 'Salary not disclosed'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full">
                {/* Bookmark Button */}
                <button 
                  onClick={handleBookmark}
                  disabled={bookmarking || !job}
                  className={`flex items-center justify-center w-full px-4 py-2.5 border rounded-md shadow-sm text-sm font-medium transition-colors duration-150 
                    ${isBookmarked 
                      ? 'border-ocean-500 bg-ocean-50 text-ocean-700 hover:bg-ocean-100'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                    ${(bookmarking || !job) ? 'opacity-50 cursor-not-allowed' : ''}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500`}
                >
                  {bookmarking ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-ocean-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    isBookmarked ? 
                      <BookmarkIconSolid className="w-5 h-5 mr-2 text-ocean-600" /> : 
                      <BookmarkIconOutline className="w-5 h-5 mr-2 text-gray-500" />
                  )}
                  {bookmarking ? 'Updating...' : (isBookmarked ? 'Bookmarked' : 'Bookmark')}
                </button>
                {/* Share Button */}
                <button 
                  onClick={handleShare}
                  disabled={sharing || !job} 
                  className={`flex items-center justify-center w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 
                    ${(sharing || !job) ? 'opacity-50 cursor-not-allowed' : ''}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500 transition-colors duration-150`}
                >
                  {sharing ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <ShareIcon className="w-5 h-5 mr-2 text-gray-500" /> 
                  )}
                  {sharing ? 'Sharing...' : 'Share'}
                </button>

                {user && (getUserRole() === 'admin' || getUserRole() === 'super_admin' || (getUserRole() === 'employer' && job && user.id === job.user_id)) && (
                  <Link 
                    to={`/jobs/${job.id}/manage`}
                    className="flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Manage Applications
                  </Link>
                )}
              </div>
            </div>
          </div>
          {/* Job Meta Info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600 pt-4 mt-6 border-t border-gray-200">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
              <span>Posted: {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}</span>
            </div>
            <div className="flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
              <span>{job.applicants_count || 0} applicants</span>
            </div>
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
              <span>Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'Open until filled'}</span>
            </div>
            <div className="flex items-center">
              <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
              <span>Job ID: {job.id || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.long_description || job.description || 'No detailed description available.'}</p>
            </div>

            {/* Responsibilities */}
            {(job.responsibilities && job.responsibilities.length > 0) && (
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
            )}

            {/* Requirements */}
            {(job.requirements && job.requirements.length > 0) && (
              <div className="glass-card rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-3 mb-6">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1 text-lg font-bold">•</span>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
                
                {(job.preferredQualifications && job.preferredQualifications.length > 0) && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Qualifications</h3>
                    <ul className="space-y-2">
                      {job.preferredQualifications.map((qualification, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-500 mr-3 mt-1 text-lg">◦</span>
                          <span className="text-gray-700">{qualification}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Benefits */}
            {(job.benefits && job.benefits.length > 0) && (
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
            )}

            {/* Application Process */}
            {(job.applicationProcess && job.applicationProcess.length > 0) && (
              <div className="glass-card rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Process</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                  {job.applicationProcess.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Application Form */}
            <div className="mt-8">
              <JobApplicationForm jobId={id} />
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
                  <p className="text-gray-900">{job.industry || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-900">{job.department || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900">{job.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Job Type</label>
                  <p className="text-gray-900">{job.job_type || job.jobType || 'Full-time'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Experience Level</label>
                  <p className="text-gray-900">{job.experience_level || job.experience || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {(job.skills && job.skills.length > 0) && (
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-medium inline-flex items-center"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company Info */}
            {job.companyInfo && (
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.company || 'the Company'}</h3>
                <div className="space-y-4">
                  <p className="text-gray-700 text-sm">{job.companyInfo?.description || 'No description available.'}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Founded:</span>
                      <span className="text-gray-900">{job.companyInfo?.founded || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company Size:</span>
                      <span className="text-gray-900">{job.companyInfo?.size || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fleet Size:</span>
                      <span className="text-gray-900">{job.companyInfo?.fleetSize || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900">{job.companyInfo?.type || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Core Values</h4>
                    <div className="space-y-1">
                      {(job.companyInfo?.values || []).map((value, index) => (
                        <div key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-ocean-500 rounded-full mr-2"></span>
                          <span className="text-gray-700 text-sm">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a 
                    href={job.companyInfo?.website ? `https://${job.companyInfo.website}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center text-ocean-600 hover:text-ocean-700 text-sm ${!job.companyInfo?.website ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <GlobeAltIcon className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </div>
              </div>
            )}

            {/* Contact Person */}
            {job.contactPerson && (
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.contactPerson?.name || 'N/A'}</h4>
                    <p className="text-gray-600 text-sm">{job.contactPerson?.title || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <a 
                      href={job.contactPerson?.email ? `mailto:${job.contactPerson.email}` : '#'}
                      className={`flex items-center text-ocean-600 hover:text-ocean-700 text-sm ${!job.contactPerson?.email ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      {job.contactPerson?.email || 'Email not available'}
                    </a>
                    <a 
                      href={job.contactPerson?.phone ? `tel:${job.contactPerson.phone}` : '#'}
                      className={`flex items-center text-ocean-600 hover:text-ocean-700 text-sm ${!job.contactPerson?.phone ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      {job.contactPerson?.phone || 'Phone not available'}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Jobs */}
            {(job.similarJobs && job.similarJobs.length > 0) && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;