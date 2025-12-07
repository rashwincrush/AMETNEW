import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import { computeJobApplyState } from '../../utils/jobs';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, userRole, getUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState(null);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [formData, setFormData] = useState({
    coverLetter: ''
  });

  useEffect(() => {
    if (user) {
      const getUserResumes = async () => {
        try {
          const { data, error } = await supabase
            .from('user_resumes')
            .select('*')
            .eq('user_id', user.id)
            .order('is_primary', { ascending: false })
            .order('uploaded_at', { ascending: false });

          if (error) throw error;

          setUserResumes(data || []);

          const primaryResume = data?.find(resume => resume.is_primary);
          if (primaryResume) {
            setSelectedResumeId(primaryResume.id);
          } else if (data && data.length > 0) {
            setSelectedResumeId(data[0].id);
          }
        } catch (error) {
          logger.error('Error fetching user resumes:', error);
          toast.error('Failed to load your resumes');
        }
      };

      getUserResumes();
    }
  }, [user]);

  useEffect(() => {
    if (!jobId) {
      toast.error('No job specified');
      navigate('/jobs');
      return;
    }

    const fetchJobAndUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError) {
          logger.error('Error fetching job:', jobError);
          toast.error('Error loading job details');
          navigate('/jobs');
          return;
        }

        if (!jobData) {
          toast.error('Job not found');
          navigate('/jobs');
          return;
        }
        
        const applyState = computeJobApplyState(jobData);
        if (applyState.isQuickLink) {
          toast.error('This job only accepts external applications.');
          navigate(`/jobs/${jobId}`);
          return;
        }
        if (!applyState.canApplyInApp) {
          toast.error('Applications are closed for this job.');
          navigate(`/jobs/${jobId}`);
          return;
        }

        setJob(jobData);
        
        // Check if user already applied
        const { data: existingApplication, error: applicationError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('job_id', jobId)
          .eq('applicant_id', user.id);

        if (!applicationError && existingApplication && existingApplication.length > 0) {
          toast.error('You have already applied for this job');
          navigate(`/jobs/${jobId}`);
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        logger.error('Error in data fetching:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobAndUserData();
  }, [jobId, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const role = userRole || (typeof getUserRole === 'function' ? getUserRole() : null);
    if (role === 'employer') {
      toast.error('Employers cannot apply to jobs from this portal.');
      return;
    }

    // Session guard
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error('Please sign in to apply.');
      return;
    }

    if (!selectedResumeId && !resumeFile) {
      toast.error('Please select a resume to apply');
      return;
    }

    try {
      setIsSubmitting(true);

      let resumeUrl = null;
      let resumeName = null;

      if (selectedResumeId) {
        const selectedResume = userResumes.find(resume => resume.id === selectedResumeId);
        if (selectedResume) {
          resumeUrl = selectedResume.file_url;
          resumeName = selectedResume.filename;
        } else {
          throw new Error('Selected resume not found');
        }
      }

      if (resumeFile) {
        try {
          // Validate file extension
          const validExtensions = ['pdf', 'doc', 'docx'];
          const fileExt = resumeFile.name.split('.').pop().toLowerCase();
          
          if (!validExtensions.includes(fileExt)) {
            throw new Error('Invalid file type. Please upload a PDF or Word document.');
          }
          
          // Create a unique file path with timestamp to prevent conflicts
          const timestamp = new Date().getTime();
          const filePath = `${session.user.id}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          logger.log('Uploading resume file:', resumeFile.name);
          
          // Upload the file with better error handling
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, resumeFile, {
              cacheControl: '3600',
              upsert: true // Use upsert in case the file already exists
            });
          
          if (uploadError) {
            logger.error('Resume upload error:', uploadError);
            
            // Handle different types of storage errors
            if (uploadError.message.includes('JWT')) {
              throw new Error('Authentication error. Please try logging out and back in.');
            } else if (uploadError.message.includes('permission')) {
              throw new Error('You do not have permission to upload files.');
            } else if (uploadError.message.includes('bucket')) {
              throw new Error('Storage error. Please contact support.');
            }
            
            throw uploadError;
          }
          
          const storagePath = uploadData?.path || filePath;
          resumeUrl = storagePath;
          
          // Save the new resume to user_resumes table with error handling
          const { error: insertError } = await supabase.from('user_resumes').insert([{
            user_id: session.user.id,
            file_url: storagePath,
            filename: resumeFile.name,
            uploaded_at: new Date().toISOString(),
            is_primary: userResumes.length === 0 // Make primary if it's the first resume
          }]);
          
          if (insertError) {
            logger.error('Error saving resume to database:', insertError);
            // Continue with the application even if saving to user_resumes fails
            // The file was uploaded successfully, so we can still use it for this application
          }
          
          resumeName = resumeFile.name;
          logger.log('Resume uploaded successfully:', resumeName);
        } catch (uploadError) {
          logger.error('Resume upload process failed:', uploadError);
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }
      }

      // Build payload (do not include applicant_id - DB default handles it)
      const payload = {
        job_id: jobId,
        resume_url: resumeUrl,
        cover_letter: formData.coverLetter || null,
        // status: 'submitted' // include only if schema allows client-set
      };

      // Show a loading toast while submitting the application
      toast.loading('Submitting your application...', { id: 'job-application' });

      // Insert the application
      const { data, error } = await supabase
        .from('job_applications')
        .insert([payload])
        .select('*')
        .single();

      if (error) {
        logger.error('Application insert failed:', error);
        logger.error('Full error object:', JSON.stringify(error, null, 2));
        toast.dismiss('job-application');
        
        // Handle specific database errors
        if (error.code === '23505') { // Duplicate key violation
          toast.error('You have already applied for this job');
          setTimeout(() => navigate(`/jobs/${jobId}`), 1000);
          return;
        } else if (error.code === '23503') { // Foreign key violation
          toast.error('The job you are trying to apply for no longer exists');
          setTimeout(() => navigate('/jobs'), 1000);
          return;
        } else if (error.message.includes('permission')) {
          toast.error('You do not have permission to apply for this job. Please check your account type.');
          return;
        }
        
        throw new Error(error.message || 'RLS/validation error');
      }

      logger.log('Job application submitted successfully:', data);
      toast.dismiss('job-application');
      toast.success('Application submitted!');
      
      // Clear form
      setSelectedResumeId('');
      setResumeFile(null);
      setFormData({ coverLetter: '' });
      
      // Navigate to job details
      navigate(`/jobs/${jobId}`);
    } catch (error) {
      logger.error('Error applying for job:', error);
      toast.error(`Application failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading job details...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">You must be logged in to apply for jobs.</p>
        <button
          onClick={() => navigate('/login', { state: { returnTo: `/jobs/${jobId}/apply` } })}
          className="px-6 py-2 bg-gradient-to-b from-ocean-500 to-ocean-600 text-white rounded-lg min-h-[44px] hover:from-ocean-600 hover:to-ocean-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Apply for Position</h2>
      {job && <h3 className="text-xl font-semibold mb-6 text-ocean-600">{job.title} at {job.company_name}</h3>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resume Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
          <div className="space-y-4">
            {userResumes.length > 0 && (
              <div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="use-existing-resume"
                    name="resume-choice"
                    className="h-4 w-4 text-ocean-600 focus-visible:ring-2 focus-visible:ring-ocean-500"
                    checked={selectedResumeId !== ''}
                    onChange={() => setSelectedResumeId(userResumes[0].id)}
                  />
                  <label htmlFor="use-existing-resume" className="text-sm">
                    Use one of my saved resumes
                  </label>
                </div>

                {selectedResumeId && (
                  <div className="mt-2 pl-6">
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 border-ocean-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:border-ocean-500 sm:text-sm rounded-md"
                    >
                      {userResumes.map(resume => (
                        <option key={resume.id} value={resume.id}>
                          {resume.filename} {resume.is_primary ? '(Primary)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedResumeId && userResumes.find(r => r.id === selectedResumeId) && (
                      <div className="mt-1 text-xs text-gray-500">
                        Uploaded on {new Date(userResumes.find(r => r.id === selectedResumeId).uploaded_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="upload-resume"
                name="resume-choice"
                className="h-4 w-4 text-blue-600"
                checked={!selectedResumeId}
                onChange={() => setSelectedResumeId('')}
              />
              <label htmlFor="upload-resume" className="text-sm">
                Upload a new resume for this application
              </label>
            </div>

            {!selectedResumeId && (
              <div className="mt-2">
                <input
                  type="file"
                  id="resume-file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size > 5 * 1024 * 1024) {
                      toast.error('File size exceeds 5MB limit');
                      e.target.value = '';
                      return;
                    }
                    setResumeFile(file);
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-ocean-50 file:text-ocean-700
                    hover:file:bg-ocean-100"
                  required={!selectedResumeId}
                />
                <p className="mt-1 text-xs text-gray-500">PDF or Word documents, max 5MB</p>
              </div>
            )}

            {userResumes.length === 0 && !resumeFile && (
              <div className="mt-2 text-sm text-gray-600">
                <p>You can manage all your resumes in your <a href="/profile" className="text-ocean-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 rounded">Profile Settings</a>.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cover Letter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Letter (Optional)
          </label>
          <textarea
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleInputChange}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Include a personalized cover letter for this job..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg min-h-[44px] hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-b from-ocean-500 to-ocean-600 text-white rounded-lg min-h-[44px] hover:from-ocean-600 hover:to-ocean-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobApplication;
