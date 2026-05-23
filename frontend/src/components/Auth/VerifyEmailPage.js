import logger from '../../utils/logger';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../constants/support';
import LoadingSpinner from '../common/LoadingSpinner';
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Get email from query params if not in state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromQuery = params.get('email');
    if (emailFromQuery && !email) {
      setEmail(emailFromQuery);
    }
  }, [location.search, email]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0 && resent) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, resent]);

  const handleResendEmail = async () => {
    if (!email || resendLoading) return;
    
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResent(true);
      setCountdown(60);
      toast.success('Verification email resent!');
    } catch (err) {
      logger.error('Error resending verification email:', err);
      toast.error('Failed to resend email: ' + (err.message || 'Please try again'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      // Check if user has verified their email by attempting to get session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user?.email_confirmed_at) {
        // Email is verified, redirect to pending approval page
        navigate('/pending-approval', { replace: true });
      } else {
        toast('Email not yet verified. Please check your inbox and click the link.');
      }
    } catch (err) {
      logger.error('Error checking verification status:', err);
      toast.error('Unable to check status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
        {/* Email Icon */}
        <div className="mx-auto w-20 h-20 bg-ocean-100 rounded-full flex items-center justify-center mb-6">
          <EnvelopeIcon className="w-10 h-10 text-ocean-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Email
        </h2>
        
        <p className="mb-4 text-gray-600">
          We've sent a verification email to:
        </p>
        
        {email ? (
          <p className="mb-6 text-lg font-medium text-ocean-700 bg-ocean-50 py-2 px-4 rounded-lg">
            {email}
          </p>
        ) : (
          <p className="mb-6 text-gray-500 italic">
            (Email address not provided)
          </p>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            What to do next:
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Check your inbox (and spam folder)</li>
            <li>Click the verification link in the email</li>
            <li>Return here and click "I've Verified My Email"</li>
            <li>Wait for admin approval to access the portal</li>
          </ol>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={loading}
            className="w-full px-4 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                I've Verified My Email
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleResendEmail}
              disabled={resendLoading || (resent && countdown > 0) || !email}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
              {resent && countdown > 0 
                ? `Resend in ${countdown}s` 
                : resendLoading 
                  ? 'Sending...' 
                  : 'Resend Email'
              }
            </button>

            <Link
              to="/login"
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center transition-colors"
            >
              Go to Login
            </Link>
          </div>

          <hr className="my-4" />

          <p className="text-sm text-gray-600">
            Need help? Contact us at{' '}
            <a href={SUPPORT_MAILTO} className="text-ocean-600 hover:text-ocean-700 font-medium">
              {SUPPORT_EMAIL}
            </a>
          </p>

          <p className="text-xs text-gray-500">
            Wrong email? You'll need to{' '}
            <Link to="/register" className="text-ocean-600 hover:underline">
              create a new account
            </Link>
            {' '}with the correct address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
