import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { EnvelopeIcon, MapPinIcon, BriefcaseIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const UserProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError('Failed to fetch user profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600">{error || 'User not found.'}</p>
        <Link to="/admin/settings" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link to="/admin/settings" className="text-sm text-gray-600 hover:text-indigo-700 inline-flex items-center">
             <ArrowLeftIcon className="h-4 w-4 mr-2" />
             Back to User Management
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <img
                className="h-24 w-24 rounded-full object-cover border-4 border-white"
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`}
                alt={`${profile.full_name}'s avatar`}
              />
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                <p className="text-md text-indigo-200">{profile.current_position || 'Position not specified'}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 px-6 py-5 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Location
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.location || 'Not specified'}</dd>
              </div>
               <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile.bio || 'No bio available.'}</dd>
              </div>
            </dl>
          </div>
           <div className="border-t border-gray-200 px-6 py-5 sm:p-8">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
             <p className="text-sm text-gray-500">More details will be displayed here as they are added to user profiles.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
