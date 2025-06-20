import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserCircleIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

/**
 * ContentApproval - Component for moderating and approving user-generated content
 * Handles posts, comments, events, and other content that needs admin review
 */
const ContentApproval = () => {
  const { getUserRole, profile } = useAuth();
  const [pendingContent, setPendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentType, setContentType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  useEffect(() => {
    fetchPendingContent();
  }, [contentType]);
  
  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('content_approvals')
        .select(`
          *,
          profiles:creator_id(first_name, last_name, avatar_url, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (contentType !== 'all') {
        query = query.eq('content_type', contentType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setPendingContent(data || []);
    } catch (err) {
      console.error('Error fetching pending content:', err);
      setError(err.message);
      toast.error(`Failed to load content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (id) => {
    try {
      const { error } = await supabase
        .from('content_approvals')
        .update({
          status: 'approved',
          reviewer_id: profile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the specific item's status in local state
      setPendingContent(current =>
        current.map(item => 
          item.id === id ? { ...item, status: 'approved' } : item
        )
      );
      
      toast.success('Content approved');
      
      // Refresh the list after a short delay
      setTimeout(() => fetchPendingContent(), 1000);
    } catch (err) {
      console.error('Error approving content:', err);
      toast.error(`Approval failed: ${err.message}`);
    }
  };
  
  const handleReject = async (id, reason = 'Content violates community guidelines') => {
    try {
      const { error } = await supabase
        .from('content_approvals')
        .update({
          status: 'rejected',
          reviewer_id: profile?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the specific item's status in local state
      setPendingContent(current =>
        current.map(item => 
          item.id === id ? { ...item, status: 'rejected' } : item
        )
      );
      
      toast.success('Content rejected');
      
      // Refresh the list after a short delay
      setTimeout(() => fetchPendingContent(), 1000);
    } catch (err) {
      console.error('Error rejecting content:', err);
      toast.error(`Rejection failed: ${err.message}`);
    }
  };
  
  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'post': return <DocumentTextIcon className="w-5 h-5" />;
      case 'comment': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      case 'event': return <CalendarIcon className="w-5 h-5" />;
      case 'job': return <PencilIcon className="w-5 h-5" />;
      case 'profile': return <UserCircleIcon className="w-5 h-5" />;
      case 'image': return <PhotoIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };
  
  const getContentTypeBadge = (type) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch(type) {
      case 'post': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'comment': return `${baseClasses} bg-green-100 text-green-800`;
      case 'event': return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'job': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'profile': return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'image': return `${baseClasses} bg-pink-100 text-pink-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };
  
  const renderGridItem = (item) => (
    <div key={item.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={getContentTypeBadge(item.content_type)}>
          {getContentTypeIcon(item.content_type)}
          <span className="ml-1 capitalize">{item.content_type}</span>
        </span>
        <span className="text-xs text-gray-500">
          {new Date(item.created_at).toLocaleString()}
        </span>
      </div>
      
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 truncate">
          {item.title || 'Untitled Content'}
        </h3>
        <div className="mt-1 text-sm text-gray-600 line-clamp-3">
          {item.content}
        </div>
      </div>
      
      <div className="flex items-center text-xs text-gray-500 mb-4">
        <UserCircleIcon className="w-4 h-4 mr-1" />
        <span>
          {item.profiles?.first_name} {item.profiles?.last_name}
        </span>
      </div>
      
      <div className="flex space-x-2 mt-2">
        <button 
          onClick={() => handleApprove(item.id)}
          className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <CheckIcon className="w-4 h-4 mr-1" />
          Approve
        </button>
        <button 
          onClick={() => handleReject(item.id)}
          className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <XMarkIcon className="w-4 h-4 mr-1" />
          Reject
        </button>
      </div>
    </div>
  );
  
  const renderListItem = (item) => (
    <div key={item.id} className="bg-white p-4 rounded-lg shadow mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <span className={getContentTypeBadge(item.content_type)}>
              {item.content_type}
            </span>
            <h3 className="ml-2 font-medium text-gray-900">
              {item.title || 'Untitled Content'}
            </h3>
          </div>
          
          <div className="mt-1 text-sm text-gray-600">
            {item.content?.substring(0, 100)}
            {item.content?.length > 100 ? '...' : ''}
          </div>
          
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <UserCircleIcon className="w-4 h-4 mr-1" />
            <span className="mr-3">
              {item.profiles?.first_name} {item.profiles?.last_name}
            </span>
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button 
            onClick={() => handleApprove(item.id)}
            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleReject(item.id)}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
  
  const contentTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'post', label: 'Posts' },
    { value: 'comment', label: 'Comments' },
    { value: 'event', label: 'Events' },
    { value: 'job', label: 'Jobs' },
    { value: 'profile', label: 'Profile Updates' },
    { value: 'image', label: 'Images' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Content Approval</h2>
          <p className="text-sm text-gray-600">
            Review and approve user-generated content
          </p>
        </div>
        
        <div className="flex flex-wrap items-center space-x-2">
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {contentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
                viewMode === 'grid' 
                  ? 'bg-indigo-500 text-white border-indigo-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
                viewMode === 'list' 
                  ? 'bg-indigo-500 text-white border-indigo-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading content</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : pendingContent.length === 0 ? (
        <div className="bg-blue-50 p-8 text-center rounded-md">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-blue-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-blue-800">No pending content</h3>
          <p className="mt-1 text-blue-600">All content has been reviewed!</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingContent.map(renderGridItem)}
        </div>
      ) : (
        <div className="space-y-2">
          {pendingContent.map(renderListItem)}
        </div>
      )}
    </div>
  );
};

export default ContentApproval;
