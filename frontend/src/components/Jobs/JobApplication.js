import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
          console.error('Error fetching user resumes:', error);
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
          console.error('Error fetching job:', jobError);
          toast.error('Error loading job details');
          navigate('/jobs');
          return;
        }

        if (!jobData) {
          toast.error('Job not found');
          navigate('/jobs');
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
        console.error('Error in data fetching:', error);
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

    if (!user) {
      toast.error('You must be logged in to apply for jobs');
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
        const fileExt = resumeFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(filePath);

        resumeUrl = publicUrl;
        // Save the new resume to user_resumes table
        await supabase.from('user_resumes').insert([{
          user_id: user.id,
          file_url: resumeUrl,
          filename: resumeFile.name,
          uploaded_at: new Date().toISOString(),
          is_primary: userResumes.length === 0 // Make primary if it's the first resume
        }]);

        resumeName = resumeFile.name;
      }

      const applicationData = {
        job_id: jobId,
        applicant_id: user.id,
        resume_url: resumeUrl,
        cover_letter: formData.coverLetter,
        status: 'submitted',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('job_applications')
        .insert([applicationData])
        .select();

      if (error) {
        console.error('Error applying for job:', error);
        throw error;
      }


      toast.success('Your application has been submitted successfully!');
      navigate(`/jobs/${jobId}/application-success`);
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error(`Error applying for job: ${error.message}`);
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Apply for Position</h2>
      {job && <h3 className="text-xl font-semibold mb-6 text-blue-600">{job.title} at {job.company_name}</h3>}

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
                    className="h-4 w-4 text-blue-600"
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
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  required={!selectedResumeId}
                />
                <p className="mt-1 text-xs text-gray-500">PDF or Word documents, max 5MB</p>
              </div>
            )}

            {userResumes.length === 0 && !resumeFile && (
              <div className="mt-2 text-sm text-gray-600">
                <p>You can manage all your resumes in your <a href="/profile" className="text-blue-600 hover:underline">Profile Settings</a>.</p>
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
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobApplication;
