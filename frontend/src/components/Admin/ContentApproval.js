import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import ContentDetailsModal from './ContentDetailsModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserCircleIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * ContentApproval - Component for moderating and approving user-generated content
 * Handles posts, comments, events, and other content that needs admin review
 */
const ContentApproval = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useAuth();
    const [pendingContent, setPendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  const fetchPendingContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch pending jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*, profiles:user_id(first_name, last_name, avatar_url, email)')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      if (jobsError) throw jobsError;

      // Fetch pending events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*, profiles:user_id(first_name, last_name, avatar_url, email)')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      if (eventsError) throw eventsError;

      // Fetch other pending content (posts, comments, etc.)
      const { data: otherContent, error: otherContentError } = await supabase
        .from('content_approvals')
        .select('*, profiles:creator_id(first_name, last_name, avatar_url, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (otherContentError) throw otherContentError;

      // Normalize and combine data
      const normalizedJobs = jobs.map(item => ({ ...item, type: 'Job', content_type: 'job', creator: item.profiles }));
      const normalizedEvents = events.map(item => ({ ...item, type: 'Event', content_type: 'event', creator: item.profiles }));
      const normalizedOther = otherContent.map(item => ({ ...item, type: item.content_type, creator: item.profiles }));

      const allContent = [...normalizedJobs, ...normalizedEvents, ...normalizedOther];
      allContent.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setPendingContent(allContent);
    } catch (err) {
      console.error('Error fetching pending content:', err);
      setError(err.message);
      toast.error(`Failed to load content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingContent();
  }, [fetchPendingContent]);
  
  
  
    const handleApprove = async (item) => {
    const { id, content_type } = item;
    let tableName, updateData;

    switch (content_type) {
      case 'job':
        tableName = 'jobs';
        updateData = { is_approved: true, updated_at: new Date().toISOString() };
        break;
      case 'event':
        tableName = 'events';
        updateData = { is_approved: true, updated_at: new Date().toISOString() };
        break;
      default:
        tableName = 'content_approvals';
        updateData = { status: 'approved', reviewer_id: profile?.id, reviewed_at: new Date().toISOString() };
    }

    try {
      const { error } = await supabase.from(tableName).update(updateData).eq('id', id);
      if (error) throw error;

      setPendingContent(current => current.filter(p => p.id !== id));
      toast.success(`${item.type} approved successfully.`);
    } catch (err) {
      console.error(`Error approving ${content_type}:`, err);
      toast.error(`Approval failed: ${err.message}`);
    }
  };
  
    const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleReject = async (item) => {
    const { id, content_type } = item;
    const reason = prompt(`Please provide a reason for rejecting this ${content_type}:`);
    if (reason === null) return; // User cancelled the prompt

    let tableName, updateData;

    switch (content_type) {
      case 'job':
      case 'event':
      {
        // For jobs and events, we might just delete them or mark as rejected
        // For now, let's delete them as an example of a different workflow
        const tableName = content_type === 'job' ? 'jobs' : 'events';
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
            toast.error(`Failed to delete ${content_type}: ${error.message}`);
            return;
        }
        toast.success(`${item.type} rejected and removed.`);
        break;
      }
      default:
      {
        const tableName = 'content_approvals';
        const updateData = { status: 'rejected', reviewer_id: profile?.id, reviewed_at: new Date().toISOString(), rejection_reason: reason };
        const { error: defaultError } = await supabase.from(tableName).update(updateData).eq('id', id);
        if (defaultError) {
            toast.error(`Failed to reject ${content_type}: ${defaultError.message}`);
            return;
        }
      }
        toast.success(`${item.type} rejected.`);
    }

    setPendingContent(current => current.filter(p => p.id !== id));
  };
  
  const getContentTypeIcon = (type) => {
    switch(type) {
            case 'post': return <DocumentTextIcon className="w-6 h-6 text-blue-500" />;
      case 'comment': return <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-500" />;
      case 'event': return <CalendarIcon className="w-6 h-6 text-red-500" />;
      case 'job': return <BriefcaseIcon className="w-6 h-6 text-indigo-500" />;
      case 'profile': return <UserCircleIcon className="w-5 h-5" />;
      case 'image': return <PhotoIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getContentTypeBadge = (type) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (type) {
      case 'post': return 'bg-blue-100 text-blue-800';
      case 'comment': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-red-100 text-red-800';
      case 'job': return 'bg-indigo-100 text-indigo-800';
      case 'profile': return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'image': return `${baseClasses} bg-pink-100 text-pink-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredContent = pendingContent.filter(item => filter === 'all' || item.content_type === filter);

  const renderGridItem = (item) => (
    <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-2">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getContentTypeBadge(item.content_type)}`}>
            {item.type}
          </span>
          <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
        <h4 className="text-md font-bold text-gray-800 truncate mb-1">{item.title || item.job_title || `${item.type} Submission`}</h4>
        <p className="text-sm text-gray-600 mb-2">
          by {item.creator?.first_name || 'Unknown User'}
        </p>
        <div className="text-sm text-gray-700 line-clamp-3">
          {item.description || item.content_summary || 'No description available.'}
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
        <button title="View Details" onClick={() => handleViewDetails(item)} className="text-gray-500 hover:text-indigo-600">
          <EyeIcon className="h-6 w-6" />
        </button>
        <button title="Approve" onClick={() => handleApprove(item)} className="text-green-600 hover:text-green-800">
          <CheckCircleIcon className="h-6 w-6" />
        </button>
        <button title="Reject" onClick={() => handleReject(item)} className="text-red-600 hover:text-red-800">
          <XCircleIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );

  const renderListItem = (item) => (
    <li key={item.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-shrink-0 flex items-center space-x-2">
            {getContentTypeIcon(item.content_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-md font-semibold text-gray-900 truncate">
              {item.title || item.job_title || `${item.type} Submission`}
            </p>
            <p className="text-sm text-gray-500 truncate flex items-center">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getContentTypeBadge(item.content_type)}`}>
                {item.type}
              </span>
              <span className="mx-2">•</span>
              <span>by {item.creator?.first_name || 'Unknown'}</span>
              <span className="mx-2">•</span>
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
          <button title="View Details" onClick={() => handleViewDetails(item)} className="text-gray-500 hover:text-indigo-600">
            <EyeIcon className="h-6 w-6" />
          </button>
          <button title="Approve" onClick={() => handleApprove(item)} className="text-green-600 hover:text-green-800">
            <CheckCircleIcon className="h-6 w-6" />
          </button>
          <button title="Reject" onClick={() => handleReject(item)} className="text-red-600 hover:text-red-800">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </li>
  );

  const contentFilters = [
    { value: 'all', label: 'All Content' },
    { value: 'job', label: 'Jobs' },
    { value: 'event', label: 'Events' },
    { value: 'post', label: 'Posts' },
    { value: 'comment', label: 'Comments' },
    { value: 'profile', label: 'Profiles' },
    { value: 'image', label: 'Images' }
  ];

  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Moderation</h2>
          <p className="text-sm text-gray-500">
            Review and manage all user-submitted content in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {contentFilters.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
          </div>

          <button
            onClick={fetchPendingContent}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Content display */}
      {loading ? (
        <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
                            <h3 className="text-lg font-semibold text-red-800">Failed to Load Content</h3>
                            <div className="mt-2 text-md text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredContent.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Queue Clear!</h3>
          <p className="mt-1 text-sm text-gray-500">There is no content awaiting moderation.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map(renderGridItem)}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredContent.map(renderListItem)}
          </ul>
        </div>
      )}
    
      <ContentDetailsModal 
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ContentApproval;
