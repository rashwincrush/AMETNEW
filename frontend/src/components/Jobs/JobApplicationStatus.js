import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';

const JobApplicationStatus = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            id,
            submitted_at,
            status,
            resume_url,
            job:jobs!inner (id, title, company_name, source_type)
          `)
          .eq('applicant_id', user.id)
          .eq('job.source_type', 'in_app')
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        setApplications(data);
      } catch (err) {
        setError('Failed to fetch application status.');
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading your applications..." />;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Job Applications</h1>
      {applications.length === 0 ? (
        <p>You have not applied to any jobs yet.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {applications.map((app) => (
              <li key={app.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Link to={`/jobs/${app.job.id}`} className="block">
                      <p className="text-lg font-semibold text-blue-600">{app.job.title}</p>
                    </Link>
                    <p className="text-sm text-gray-600">{app.job.company_name}</p>
                    <p className="text-xs text-gray-500 mt-1">Applied on: {new Date(app.submitted_at).toLocaleDateString()}</p>
                    {app.resume_url && (
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-ocean-600 hover:underline">
                        View Resume
                      </a>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'reviewed':
      return 'bg-blue-100 text-blue-800';
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'hired':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default JobApplicationStatus;
