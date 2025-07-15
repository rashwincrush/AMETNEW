import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const JobApplicationForm = ({ jobId }) => {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to apply.');
      return;
    }
    if (!resumeFile) {
      toast.error('Please upload your resume.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting application...');

    try {
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
          user_id: user.id,
          cover_letter: coverLetter,
          resume_url: filePath,
          status: 'submitted',
        },
      ]);

      if (insertError) throw insertError;

      toast.success('Application submitted successfully!', { id: toastId });
      setCoverLetter('');
      setResumeFile(null);
      e.target.reset();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Apply for this Job</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="coverLetter" className="block text-gray-700 font-semibold mb-2">
            Cover Letter (Optional)
          </label>
          <textarea
            id="coverLetter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows="6"
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline"
            placeholder="Tell us why you're a great fit for this role..."
          ></textarea>
        </div>
        <div className="mb-6">
          <label htmlFor="resume" className="block text-gray-700 font-semibold mb-2">
            Resume (PDF, DOC, DOCX)
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
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default JobApplicationForm;
