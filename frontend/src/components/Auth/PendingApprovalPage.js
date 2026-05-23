import logger from '../../utils/logger';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../constants/support';
import LoadingSpinner from '../common/LoadingSpinner';

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*, created_at, alumni_verification_status, approval_status, email')
          .eq('id', session.user.id)
          .single();

        if (error) {
          throw error;
        }

        // If user is approved, redirect to dashboard
        if (data.alumni_verification_status === 'approved' || data.approval_status === 'approved') {
          navigate('/dashboard', { replace: true });
          return;
        }

        // If user is rejected, redirect to rejection page
        if (data.alumni_verification_status === 'rejected' || data.approval_status === 'rejected') {
          navigate('/rejection', { replace: true });
          return;
        }

        setProfile(data);
        setSubmittedAt(data.created_at);
      } catch (err) {
        logger.error('Error fetching profile:', err);
        setError('Unable to fetch your profile information.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Re-fetch profile to check if approval status changed
      const { data, error } = await supabase
        .from('profiles')
        .select('alumni_verification_status, approval_status')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data.alumni_verification_status === 'approved' || data.approval_status === 'approved') {
        // Status changed to approved - reload the page to re-initialize auth
        window.location.href = '/dashboard';
      } else if (data.alumni_verification_status === 'rejected' || data.approval_status === 'rejected') {
        navigate('/rejection', { replace: true });
      } else {
        // Still pending - show message
        alert('Your account is still pending approval. Please check back later.');
      }
    } catch (err) {
      logger.error('Error refreshing status:', err);
      alert('Unable to check status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your account status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <svg 
            className="w-10 h-10 text-yellow-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Account Pending Approval
        </h2>
        
        {error ? (
          <p className="mb-4 text-red-600">{error}</p>
        ) : (
          <>
            <p className="mb-4 text-gray-600">
              Thank you for registering! Your account is currently being reviewed by our administrators.
            </p>
            
            {submittedAt && (
              <p className="mb-4 text-sm text-gray-500">
                Registration submitted on <span className="font-medium">{formatDate(submittedAt)}</span>
              </p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Our team will review your registration details</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>You will receive an email notification once approved</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>You can then access all features of the alumni portal</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {refreshing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Checking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Check Approval Status
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500">
                This usually takes 1-2 business days
              </p>

              <hr className="my-4" />

              <p className="text-sm text-gray-600">
                Need help? Contact us at{' '}
                <a href={SUPPORT_MAILTO} className="text-ocean-600 hover:text-ocean-700 font-medium">
                  {SUPPORT_EMAIL}
                </a>
              </p>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalPage;
