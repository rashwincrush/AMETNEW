import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ManageJobApplications = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobAndApplications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // First, verify the current user is the owner of the job or an admin
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*, company_id')
        .eq('id', jobId)
        .single();

      if (jobError) throw new Error('Job not found or you do not have permission to view this page.');
      setJob(jobData);

      // TODO: Add more robust permission checks here based on user roles/company ownership

      const { data, error: applicationsError } = await supabase
        .from('job_applications')
        .select('id, submitted_at, status, cover_letter, resume_url, profiles(id, full_name, email, avatar_url))')
        .eq('job_id', jobId)
        .order('submitted_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      setApplications(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    fetchJobAndApplications();
  }, [fetchJobAndApplications]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(apps =>
        apps.map(app => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
      toast.success('Application status updated successfully!');
    } catch (err) {
      toast.error('Failed to update status.');
      console.error('Error updating status:', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading applications..." />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Manage Applications</h1>
      <h2 className="text-xl text-gray-600 mb-6">For: {job?.title}</h2>
      
      {applications.length === 0 ? (
        <p>No applications have been submitted for this job yet.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map(app => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/profile/${app.profiles.id}`} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={app.profiles.avatar_url || '/default-avatar.png'} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{app.profiles.full_name}</div>
                        <div className="text-sm text-gray-500">{app.profiles.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.submitted_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option>submitted</option>
                      <option>reviewed</option>
                      <option>in-progress</option>
                      <option>hired</option>
                      <option>rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageJobApplications;
