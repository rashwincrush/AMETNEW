import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const JobApplicationForm = ({ jobId, deadline }) => {
  const { user, userRole, getUserRole } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDeadlinePassed = deadline ? new Date(deadline) < new Date() : false;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > MAX_SIZE_BYTES) {
        toast.error('Your file is too large (max 5 MB). Please upload a smaller resume.');
        return;
      }
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error('Invalid file type. Upload a PDF, DOC, or DOCX resume.');
        return;
      }
      setResumeFile(f);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to apply.');
      return;
    }
    const role = userRole || (typeof getUserRole === 'function' ? getUserRole() : null);
    if (role === 'employer') {
      toast.error('Employer accounts cannot apply to jobs from this portal.');
      return;
    }
    if (!resumeFile) {
      toast.error('Please upload your resume to continue.');
      return;
    }
    if (isDeadlinePassed) {
      toast.error('Applications are closed for this role.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting your application...');

    try {
      // 0. Check if already applied
      const { count: existingCount, error: existingErr } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', jobId)
        .eq('applicant_id', user.id);
      if (existingErr) throw existingErr;
      if ((existingCount || 0) > 0) {
        toast.dismiss(toastId);
        toast.success('You have already applied to this role. Check My applications for your status.');
        return;
      }

      // 1. Upload resume to storage
      const filePath = `${user.id}/${jobId}-${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) throw uploadError;

      // 2. Insert application into the database
      const { error: insertError } = await supabase.from('job_applications').insert([
        {
          job_id: jobId,
          applicant_id: user.id,
          cover_letter: coverLetter,
          resume_url: filePath,
          status: 'submitted',
        },
      ], { returning: 'minimal' });

      if (insertError) throw insertError;

      toast.success('Your application has been submitted successfully.', { id: toastId });
      setCoverLetter('');
      setResumeFile(null);
      e.target.reset();
    } catch (error) {
      logger.error('Error submitting application:', error);
      toast.error(`We could not submit your application: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Apply for this role</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="coverLetter" className="block text-gray-700 font-semibold mb-2">
            Cover letter (optional)
          </label>
          <textarea
            id="coverLetter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows="6"
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline"
            placeholder="Explain briefly why you are a great fit for this role."
          ></textarea>
        </div>
        <div className="mb-6">
          <label htmlFor="resume" className="block text-gray-700 font-semibold mb-2">
            Resume (PDF, DOC, or DOCX)
          </label>
          <input
            type="file"
            id="resume"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept=".pdf,.doc,.docx"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting application...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
};

export default JobApplicationForm;
