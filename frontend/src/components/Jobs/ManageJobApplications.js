import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import EmployerGuard from '../Auth/EmployerGuard';
import { getLatestEdge, idempotentConnect } from '../../utils/connections';
import { log } from '../../utils/log';
import { isQuickLink } from '../../utils/jobs';

const GuardReady = ({ onReady }) => { React.useEffect(() => { onReady && onReady(); }, [onReady]); return null; };

const ManageJobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connMap, setConnMap] = useState(new Map()); // applicant_id -> status

  const fetchJobAndApplications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Session snapshot
      const { data: { session } } = await supabase.auth.getSession();
      log.group('[APPS] session', { hasSession: !!session, userId: session?.user?.id, jobId });

      // Owner-scope fetch from base table
      const t0 = performance.now();
      const jobResp = await supabase
        .from('jobs')
        .select('id, title, posted_by, user_id, created_by, company_id')
        .eq('id', jobId)
        .single();
      const jobData = jobResp.data; const jobError = jobResp.error;
      log.group('[APPS] job fetch', {
        ms: +(performance.now() - t0).toFixed(1),
        error: jobError ? { code: jobError.code, message: jobError.message, details: jobError.details } : null,
        gotRow: !!jobData
      });

      if (jobError || !jobData) {
        setError("This job either doesn’t exist or you’re not authorized to view its applications.");
        setJob(null);
        setApplications([]);
        return;
      }

      setJob(jobData);

      // Determine ownership (posted_by OR user_id OR created_by) or admin
      const ownerIds = [jobData.posted_by, jobData.user_id, jobData.created_by].filter(Boolean);
      const isOwner = ownerIds.includes(user.id) || isAdmin;

      // Prefer owner-scoped RPC; if missing, fallback to base table
      let apps = [];
      try {
        const t1 = performance.now();
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_job_applications_for_owner', { p_job_id: jobId, p_limit: 100, p_offset: 0 });
        log.group('[APPS] list via RPC', {
          ms: +(performance.now() - t1).toFixed(1),
          error: rpcError ? { code: rpcError.code, message: rpcError.message, details: rpcError.details } : null,
          rows: Array.isArray(rpcData) ? rpcData.length : 0
        });
        if (rpcError) throw rpcError;
        apps = Array.isArray(rpcData) ? rpcData : [];
      } catch (rpcErr) {
        // Fallback to base table with join if RPC not available
        const t2 = performance.now();
        const { data: tblData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('id, applicant_id, status, created_at, submitted_at, resume_url, cover_letter, applicant:profiles!job_applications_applicant_id_fkey(id, first_name, last_name, avatar_url, email)')
          .eq('job_id', jobId)
          .order('created_at', { ascending: false });
        log.group('[APPS] list via base table', {
          ms: +(performance.now() - t2).toFixed(1),
          error: applicationsError ? { code: applicationsError.code, message: applicationsError.message, details: applicationsError.details } : null,
          rows: Array.isArray(tblData) ? tblData.length : 0
        });
        if (applicationsError) throw applicationsError;
        apps = Array.isArray(tblData) ? tblData : [];
      }

      setApplications(apps);
      // Load connection status for each applicant
      if (user?.id && Array.isArray(apps)) {
        const entries = await Promise.all(
          apps.map(async (app) => {
            const otherId = app.applicant?.id;
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
  }, [jobId, user, isAdmin]);

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

  return (
    <EmployerGuard jobId={jobId} strict>
    {() => (
    <div className="container mx-auto px-4 py-8">
      <GuardReady onReady={() => setGuardReady(true)} />
      {loading && (
        <div className="py-10"><LoadingSpinner message="Loading applications..." /></div>
      )}
      {(!loading && error) && (
        <div className="text-center py-10 text-red-500">{error}</div>
      )}
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
          <h2 className="text-xl text-gray-600">For: {job?.title || 'Unknown job'}</h2>
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
        const ownerIds = [job?.posted_by, job?.user_id, job?.created_by].filter(Boolean);
        console.debug('[MANAGE DEBUG] auth.user.id =', user?.id);
        console.debug('[MANAGE DEBUG] job ownerIds =', ownerIds);
        const isOwner = user?.id && ownerIds.includes(user.id);
        if (!isOwner && !isAdmin) {
          return (
            <div className="mb-6 p-4 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-100">
              You’re not authorized to view applications for this job.
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
                        <Link to={`/profile/${app.applicant?.id}`} className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={app.applicant?.avatar_url || '/default-avatar.png'} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{[app.applicant?.first_name, app.applicant?.last_name].filter(Boolean).join(' ')}</div>
                            {canMessage(app.applicant?.id) && (
                              <div className="text-sm text-gray-500">{app.applicant?.email}</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.created_at || app.submitted_at).toLocaleDateString()}</td>
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
                        <Link to={`/profile/${app.applicant?.id}`} className="text-ocean-600 hover:underline">View Profile</Link>
                        {canMessage(app.applicant?.id) ? (
                          <button onClick={() => navigate(`/messages?peer=${app.applicant?.id}&job=${jobId}`)} className="text-blue-600 hover:underline">Message</button>
                        ) : (
                          <button onClick={() => handleRequestConnection(app.applicant?.id)} className="text-green-600 hover:underline">Request Connection</button>
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
