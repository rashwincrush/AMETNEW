import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import LoadingSpinner from '../common/LoadingSpinner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Process OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get session from URL hash fragment
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data?.session) {
          // Check if profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 means no rows returned - expected for new users
            console.error('Error checking profile:', profileError);
            setError('Error accessing your profile. Please try again.');
            return;
          }
          
          // If profile doesn't exist, user needs to complete registration
          if (!profileData) {
            navigate('/profile', { 
              state: { 
                newUser: true, 
                message: 'Please complete your profile to continue.' 
              } 
            });
          } else {
            // User already has a profile, redirect to dashboard
            navigate('/dashboard');
          }
        } else {
          // No session, redirect to login
          navigate('/login', { 
            state: { 
              message: 'Authentication failed. Please try logging in again.' 
            } 
          });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try logging in again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-ocean-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-50 flex items-center justify-center">
      <LoadingSpinner message="Completing authentication..." />
    </div>
  );
};

export default AuthCallback;
