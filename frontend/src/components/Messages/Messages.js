import React, { useState } from 'react';
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

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock conversations data
  const conversations = [
    {
      id: 1,
      name: 'Captain Rajesh Kumar',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      lastMessage: 'Thanks for the mentoring session yesterday! It was really helpful.',
      timestamp: '2024-04-11T10:30:00Z',
      unreadCount: 2,
      isOnline: true,
      type: 'individual',
      role: 'Mentor',
      company: 'Ocean Shipping Ltd.'
    },
    {
      id: 2,
      name: 'Dr. Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=50&h=50&fit=crop&crop=face',
      lastMessage: 'I found some interesting research papers on sustainable ship design that might interest you.',
      timestamp: '2024-04-11T09:15:00Z',
      unreadCount: 0,
      isOnline: false,
      type: 'individual',
      role: 'Researcher',
      company: 'Maritime Design Solutions'
    },
    {
      id: 3,
      name: 'Marine Engineers Mumbai',
      avatar: 'https://images.unsplash.com/photo-1581093458791-9f3c3250e3b4?w=50&h=50&fit=crop',
      lastMessage: 'New job opening at Shipping Corp for Senior Marine Engineer position.',
      timestamp: '2024-04-11T08:45:00Z',
      unreadCount: 5,
      isOnline: false,
      type: 'group',
      members: 247,
      category: 'Professional Group'
    },
    {
      id: 4,
      name: 'Mohammed Ali',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      lastMessage: 'Let me know when you\'re available for a call about the port operations role.',
      timestamp: '2024-04-10T16:20:00Z',
      unreadCount: 1,
      isOnline: true,
      type: 'individual',
      role: 'Port Manager',
      company: 'Indian Ports Authority'
    },
    {
      id: 5,
      name: 'AMET Alumni Chennai',
      avatar: 'https://images.unsplash.com/photo-1515587388823-942ec5ca9ee7?w=50&h=50&fit=crop',
      lastMessage: 'Alumni meetup scheduled for next weekend. See you all there!',
      timestamp: '2024-04-10T14:30:00Z',
      unreadCount: 0,
      isOnline: false,
      type: 'group',
      members: 389,
      category: 'Alumni Group'
    },
    {
      id: 6,
      name: 'Kavitha Menon',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      lastMessage: 'The maritime law seminar was excellent. Thank you for the recommendation!',
      timestamp: '2024-04-09T11:10:00Z',
      unreadCount: 0,
      isOnline: false,
      type: 'individual',
      role: 'Maritime Lawyer',
      company: 'Coastal Legal Associates'
    }
  ];

  // Mock messages for selected conversation
  const getMessages = (conversationId) => {
    const messagesByConversation = {
      1: [
        {
          id: 1,
          senderId: 1,
          senderName: 'Captain Rajesh Kumar',
          senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
          message: 'Hi! I saw your request for mentorship. I\'d be happy to help guide you in your marine engineering career.',
          timestamp: '2024-04-10T10:00:00Z',
          isOwn: false
        },
        {
          id: 2,
          senderId: 'me',
          senderName: 'You',
          senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
          message: 'Thank you so much! I really appreciate your willingness to mentor me. I have some questions about career progression in the maritime industry.',
          timestamp: '2024-04-10T10:05:00Z',
          isOwn: true
        },
        {
          id: 3,
          senderId: 1,
          senderName: 'Captain Rajesh Kumar',
          senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
          message: 'Of course! Let\'s schedule a call this week. What days work best for you?',
          timestamp: '2024-04-10T10:10:00Z',
          isOwn: false
        },
        {
          id: 4,
          senderId: 'me',
          senderName: 'You',
          senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
          message: 'I\'m available Tuesday or Wednesday afternoon. Would either of those work for you?',
          timestamp: '2024-04-10T10:15:00Z',
          isOwn: true
        },
        {
          id: 5,
          senderId: 1,
          senderName: 'Captain Rajesh Kumar',
          senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
          message: 'Wednesday at 2 PM works perfect for me. I\'ll send you a calendar invite.',
          timestamp: '2024-04-10T10:20:00Z',
          isOwn: false
        },
        {
          id: 6,
          senderId: 'me',
          senderName: 'You',
          senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
          message: 'Perfect! Looking forward to our conversation.',
          timestamp: '2024-04-10T10:25:00Z',
          isOwn: true
        },
        {
          id: 7,
          senderId: 1,
          senderName: 'Captain Rajesh Kumar',
          senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
          message: 'Thanks for the mentoring session yesterday! It was really helpful.',
          timestamp: '2024-04-11T10:30:00Z',
          isOwn: false
        },
        {
          id: 8,
          senderId: 1,
          senderName: 'Captain Rajesh Kumar',
          senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
          message: 'I\'ll send you some industry resources and contacts that might be useful.',
          timestamp: '2024-04-11T10:32:00Z',
          isOwn: false
        }
      ],
      2: [
        {
          id: 1,
          senderId: 2,
          senderName: 'Dr. Priya Sharma',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face',
          message: 'Hello! I noticed your interest in sustainable ship design from your profile.',
          timestamp: '2024-04-10T14:00:00Z',
          isOwn: false
        },
        {
          id: 2,
          senderId: 'me',
          senderName: 'You',
          senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
          message: 'Yes! It\'s one of my main areas of interest. I\'m particularly interested in green propulsion systems.',
          timestamp: '2024-04-10T14:05:00Z',
          isOwn: true
        },
        {
          id: 3,
          senderId: 2,
          senderName: 'Dr. Priya Sharma',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face',
          message: 'I found some interesting research papers on sustainable ship design that might interest you.',
          timestamp: '2024-04-11T09:15:00Z',
          isOwn: false
        }
      ]
    };
    
    return messagesByConversation[conversationId] || [];
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  const messages = getMessages(selectedConversation);

  const formatTime = (timestamp) => {
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {filteredConversations.map((conversation) => (
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
                  {conversation.type === 'individual' && conversation.isOnline && (
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
                  
                  {conversation.type === 'individual' && (
                    <p className="text-xs text-gray-500 mb-1">
                      {conversation.role} at {conversation.company}
                    </p>
                  )}
                  
                  {conversation.type === 'group' && (
                    <p className="text-xs text-gray-500 mb-1">
                      {conversation.members} members • {conversation.category}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
                    {selectedConversationData.type === 'individual' && selectedConversationData.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedConversationData.name}</h2>
                    {selectedConversationData.type === 'individual' ? (
                      <p className="text-sm text-gray-500">
                        {selectedConversationData.isOnline ? 'Online' : 'Offline'} • {selectedConversationData.role}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {selectedConversationData.members} members
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedConversationData.type === 'individual' && (
                    <>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <PhoneIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <VideoCameraIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
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
              {messages.map((message) => (
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
              ))}
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
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <PaperClipIcon className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <FaceSmileIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-ocean p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-600">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;