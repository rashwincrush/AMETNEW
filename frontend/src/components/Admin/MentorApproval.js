import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { UserCircleIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * MentorApproval component - Allows administrators to approve or reject mentor applications
 */
const MentorApproval = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchMentors();
  }, [activeTab]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('mentors')
        .select(`
          *,
          profiles:user_id (
            full_name, 
            avatar_url,
            email
          )
        `);
        
      // Filter based on active tab
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setMentors(data || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to load mentor applications');
    } finally {
      setLoading(false);
    }
  };

  const updateMentorStatus = async (mentorId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .update({ status: newStatus })
        .eq('id', mentorId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setMentors(mentors.map(mentor => 
        mentor.id === mentorId ? { ...mentor, status: newStatus } : mentor
      ));
      
      toast.success(`Mentor ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error updating mentor status:', error);
      toast.error('Failed to update mentor status');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending Review</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Mentor Applications</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      ) : mentors.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No mentor applications found</h3>
          <p className="text-gray-600 mt-1">
            {activeTab === 'all' 
              ? 'There are no mentor applications in the system.' 
              : `There are no ${activeTab} mentor applications at this time.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mentor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expertise
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mentors.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {mentor.profiles?.avatar_url ? (
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={mentor.profiles.avatar_url} 
                            alt={mentor.profiles?.full_name || "User profile"}
                          />
                        ) : (
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {mentor.profiles?.full_name || "Anonymous User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {mentor.profiles?.email || mentor.user_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise && mentor.expertise.map((skill, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {mentor.mentoring_experience_years} {mentor.mentoring_experience_years === 1 ? 'year' : 'years'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mentor.max_mentees || 0} max mentees · {mentor.mentoring_capacity_hours_per_month || 0} hrs/month
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(mentor.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {mentor.status !== 'approved' && (
                        <button
                          onClick={() => updateMentorStatus(mentor.id, 'approved')}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 p-2 rounded-full"
                          title="Approve"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      {mentor.status !== 'rejected' && (
                        <button
                          onClick={() => updateMentorStatus(mentor.id, 'rejected')}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-2 rounded-full"
                          title="Reject"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      {mentor.status === 'rejected' && (
                        <button
                          onClick={() => updateMentorStatus(mentor.id, 'pending')}
                          className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 p-2 rounded-full"
                          title="Move to Pending"
                        >
                          <InformationCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
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

export default MentorApproval;
