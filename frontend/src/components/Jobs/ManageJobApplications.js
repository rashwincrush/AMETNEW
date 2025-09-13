import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import EmployerGuard from '../Auth/EmployerGuard';
import { getLatestEdge, idempotentConnect } from '../../utils/connections';
import { isQuickLink } from '../../utils/jobs';

const GuardReady = ({ onReady }) => { React.useEffect(() => { onReady && onReady(); }, [onReady]); return null; };

const ManageJobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connMap, setConnMap] = useState(new Map()); // applicant_id -> status

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
      // Load connection status for each applicant
      if (user?.id && Array.isArray(data)) {
        const entries = await Promise.all(
          data.map(async (app) => {
            const otherId = app.profiles?.id;
            if (!otherId) return [null, null];
            try {
              const edge = await getLatestEdge(user.id, otherId);
              return [otherId, edge?.status || null];
            } catch (e) {
              return [otherId, null];
            }
          })
        );
        const map = new Map(entries.filter(([k]) => !!k));
        setConnMap(map);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  // Fetch only after guard passes
  const [guardReady, setGuardReady] = useState(false);
  useEffect(() => {
    if (guardReady) fetchJobAndApplications();
  }, [guardReady, fetchJobAndApplications]);

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

  const handleRequestConnection = async (otherId) => {
    if (!user?.id || !otherId) return;
    try {
      await idempotentConnect(user.id, otherId);
      toast.success('Connection request sent');
      // Refresh connection map for this applicant
      const edge = await getLatestEdge(user.id, otherId);
      setConnMap(prev => new Map(prev).set(otherId, edge?.status || 'pending'));
    } catch (e) {
      // idempotentConnect already toasts on failure
    }
  };

  const canMessage = (otherId) => {
    const status = connMap.get(otherId);
    return status === 'accepted' || status === 'connected';
  };

  if (loading) return <LoadingSpinner message="Loading applications..." />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <EmployerGuard jobId={jobId} strict>
    {() => (
    <div className="container mx-auto px-4 py-8">
      <GuardReady onReady={() => setGuardReady(true)} />
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-4"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Applications</h1>
          <h2 className="text-xl text-gray-600">For: {job?.title}</h2>
        </div>
      </div>
      
      {(() => {
        const quick = isQuickLink(job);
        if (quick) {
          return (
            <div className="mb-6 p-4 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
              This is a Quick Link job. Applications are collected on the external site, so there may be no in-app applicants here.
            </div>
          );
        }
        return (
          applications.length === 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                            {canMessage(app.profiles.id) && (
                              <div className="text-sm text-gray-500">{app.profiles.email}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.submitted_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select 
                          value={app.status} 
                          onChange={(e) => handleStatusChange(app.id, e.target.value)} 
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offered">Offered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <Link to={`/profile/${app.profiles.id}`} className="text-ocean-600 hover:underline">View Profile</Link>
                        {canMessage(app.profiles.id) ? (
                          <button onClick={() => navigate(`/messages?peer=${app.profiles.id}&job=${jobId}`)} className="text-blue-600 hover:underline">Message</button>
                        ) : (
                          <button onClick={() => handleRequestConnection(app.profiles.id)} className="text-green-600 hover:underline">Request Connection</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        );
      })()}
    </div>
    )}
    </EmployerGuard>
  );
};

export default ManageJobApplications;
