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
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import JobApplicationForm from './JobApplicationForm';
import { useAuth } from '../../contexts/AuthContext';
import EmployerGuard from '../Auth/EmployerGuard';
import { coalesceAppUrl, isQuickLink, companyDisplay } from '../../utils/jobs';
import JobDetailsQuickLink from './JobDetailsQuickLink';
import JobDetailsInApp from './JobDetailsInApp';

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
  const { user, profile, getUserRole } = useAuth();
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
          .select('*, companies (name, logo_url)')
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
          console.log('Fetched job data:', processedData);
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
        // console.log('Bookmark status:', !!bookmark, 'for job:', currentJobId, 'user:', currentUserId); // For debugging
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
        // console.log(`Fetching bookmark status for job ${job.id} and user ${user.id}`); // For debugging
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
          // console.log('Bookmark status set to:', !!bookmark); // For debugging
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
        // console.log('Shared successfully'); // Optional: log success
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Share canceled by user.'); // Not an actual error, user dismissed UI
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

  // Compute props and delegate to minimal views
  const userRole = getUserRole();
  const isOwner = user?.id && (job?.posted_by === user.id || job?.user_id === user.id);
  const isAdminFlag = userRole === 'admin' || userRole === 'super_admin';
  const { name: companyName, logo_url: companyLogo } = companyDisplay(job);

  const viewProps = { job, companyName, companyLogo, isOwner, isAdmin: isAdminFlag };
  if (isQuickLink(job)) return <JobDetailsQuickLink {...viewProps} />;
  return <JobDetailsInApp {...viewProps} />;
};

export default JobDetails;