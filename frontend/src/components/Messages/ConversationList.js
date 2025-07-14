import React, { useState } from 'react';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ 
  conversations, 
  loading, 
  selectedConversationId, 
  onSelectConversation,
  currentUser 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter conversations based on search query
  const filteredConversations = conversations
    ? conversations.filter(conversation =>
        conversation.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Format date to relative time (e.g., "2 hours ago")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // If date is invalid, throw an error
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  // Get preview text from latest message
  const getMessagePreview = (conversation) => {
    if (!conversation.latestMessage) return '';
    
    const { content, message_type, attachment_url } = conversation.latestMessage;
    
    if (message_type === 'file') {
      return attachment_url ? 'Sent an attachment' : 'File attachment';
    }
    
    return content.length > 35 ? `${content.substring(0, 35)}...` : content;
  };

  if (loading) {
    return (
      <div className="w-full sm:w-1/3 lg:w-1/4 border-r border-gray-200 bg-white p-4 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-1/3 lg:w-1/4 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Search input */}
      <div className="px-4 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Loading placeholders
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredConversations.length > 0 ? (
          // Conversation list items
          filteredConversations.map((conversation) => (
            <div 
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${selectedConversationId === conversation.id ? 'bg-gray-100' : ''}`}
            >
              <div className="flex items-center">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-ocean-100 rounded-full flex items-center justify-center text-ocean-600 font-bold overflow-hidden">
                    {conversation.avatar ? (
                      <img src={conversation.avatar} alt={conversation.name} className="w-full h-full object-cover" />
                    ) : (
                      conversation.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {/* Online status indicator */}
                  {conversation.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                
                {/* Name and timestamp */}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      {conversation.name}
                      {/* Unread indicator */}
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-ocean-500 text-white text-xs rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-500">{formatDate(conversation.lastMessageAt)}</span>
                  </div>
                  
                  {/* Message preview */}
                  <p className="text-sm text-gray-500 truncate">
                    {getMessagePreview(conversation) || 'Start a conversation'}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : searchQuery ? (
          // No search results
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations found</h3>
            <p className="mt-1 text-sm text-gray-500">No conversations match your search criteria.</p>
          </div>
        ) : (
          // Empty state
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
            <p className="mt-1 text-sm text-gray-500">Start a conversation with another alumni.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
