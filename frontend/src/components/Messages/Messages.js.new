import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  ArchiveBoxIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/apiService';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock current user - in real app this would come from auth context
  const currentUserId = "5371e2d5-0697-46c0-bf5b-aab2e4d88b58"; // Using the admin user from your database

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users and recent conversations
        const [usersResponse, conversationsResponse] = await Promise.all([
          apiService.getUsers(),
          apiService.getRecentConversations()
        ]);

        setUsers(usersResponse.data);
        
        // Transform conversations data to match the expected format
        const formattedConversations = conversationsResponse.data.map(msg => {
          const partnerId = msg.recipient_id === currentUserId ? msg.sender_id : msg.recipient_id;
          const partner = usersResponse.data.find(user => user.id === partnerId);
          
          return {
            id: partnerId,
            name: partner ? (partner.full_name || `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || partner.email) : 'Unknown User',
            avatar: partner?.avatar_url || `https://ui-avatars.com/api/?name=${partner?.email || 'Unknown'}&background=0ea5e9&color=fff`,
            lastMessage: msg.content,
            timestamp: msg.created_at,
            unreadCount: 0, // You can implement read status later
            isOnline: false, // You can implement online status later
            type: 'individual',
            role: partner?.role || 'alumni',
            company: partner?.current_company || 'AMET University'
          };
        });

        setConversations(formattedConversations);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages data:', error);
        setError('Failed to load messages. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  useEffect(() => {
    const fetchConversationMessages = async () => {
      if (selectedConversation) {
        try {
          const response = await apiService.getConversation(selectedConversation);
          
          // Transform messages to match expected format
          const formattedMessages = response.data.map(msg => {
            const sender = users.find(user => user.id === msg.sender_id);
            return {
              id: msg.id,
              senderId: msg.sender_id,
              senderName: sender ? (sender.full_name || `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email) : 'Unknown',
              senderAvatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=${sender?.email || 'Unknown'}&background=0ea5e9&color=fff`,
              message: msg.content,
              timestamp: msg.created_at,
              isOwn: msg.sender_id === currentUserId
            };
          });
          
          setMessages(formattedMessages);
        } catch (error) {
          console.error('Error fetching conversation messages:', error);
        }
      }
    };

    fetchConversationMessages();
  }, [selectedConversation, users, currentUserId]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation) {
      try {
        const messageData = {
          recipient_id: selectedConversation,
          content: newMessage.trim()
        };

        await apiService.sendMessage(messageData);
        
        // Add the message to local state immediately for better UX
        const sender = users.find(user => user.id === currentUserId);
        const newMsg = {
          id: Date.now().toString(),
          senderId: currentUserId,
          senderName: sender ? (sender.full_name || `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email) : 'You',
          senderAvatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=${sender?.email || 'You'}&background=0ea5e9&color=fff`,
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          isOwn: true
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Update last message in conversations
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: newMessage.trim(), timestamp: new Date().toISOString() }
            : conv
        ));
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Messages</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn-ocean px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen flex">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
              placeholder="Search conversations..."
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-ocean-50 border-r-2 border-ocean-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <img 
                      src={conversation.avatar} 
                      alt={conversation.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.timestamp)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-ocean-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-1">
                      {conversation.role} at {conversation.company}
                    </p>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No conversations yet</p>
                <p className="text-sm">Start messaging with other alumni!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={selectedConversationData.avatar} 
                      alt={selectedConversationData.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {selectedConversationData.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedConversationData.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversationData.isOnline ? 'Online' : 'Offline'} • {selectedConversationData.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!message.isOwn && (
                        <img 
                          src={message.senderAvatar} 
                          alt={message.senderName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div className={`px-4 py-2 rounded-lg ${
                        message.isOwn 
                          ? 'bg-ocean-500 text-white' 
                          : 'bg-white text-gray-900 shadow-sm'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.isOwn ? 'text-ocean-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      className="form-input w-full pr-20 py-3 rounded-lg resize-none"
                      rows="1"
                      placeholder="Type a message..."
                    />
                    <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <PaperClipIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <FaceSmileIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-ocean p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <ChatBubbleLeftRightIcon className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;