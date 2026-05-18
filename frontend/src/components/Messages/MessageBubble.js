import React from 'react';
import { CheckCircleIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const MessageBubble = ({ message, isOwn, timestamp, readStatus }) => {
  // Helper function to determine if a URL is an image
  const isImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith('.' + ext));
  };

  // Helper function to get file name from URL
  const getFileName = (url) => {
    if (!url) return 'file';
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Max file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const isFileMessage = message.message_type === 'file';
  const fileUrl = message.attachment_url || message.file_url;
  const fileSize = message.file_size || message.attachment_size;
  const isOversized = fileSize && fileSize > MAX_FILE_SIZE;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div 
        className={`
          relative
          max-w-xs md:max-w-md lg:max-w-lg 
          rounded-lg 
          px-4 py-3 
          ${isOwn ? 'bg-ocean-500 text-white' : 'bg-gray-100 text-gray-800'}
        `}
      >
        {/* File message */}
        {isFileMessage && fileUrl && (
          <div className="mb-2">
            {isOversized && (
              <div className={`text-xs mb-1 px-2 py-1 rounded ${isOwn ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                ⚠️ File exceeds 10MB limit
              </div>
            )}
            {isImageUrl(fileUrl) ? (
              // Image file
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img 
                  src={fileUrl} 
                  alt="Attachment" 
                  className="max-w-full h-auto rounded mb-1" 
                  style={{ maxHeight: '200px' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/200x150?text=Image+not+available';
                  }}
                />
                <div className="text-xs truncate flex items-center gap-1">
                  <PaperClipIcon className="w-3 h-3" />
                  {getFileName(fileUrl)}
                  {fileSize > 0 && <span className="opacity-75">({formatFileSize(fileSize)})</span>}
                </div>
              </a>
            ) : (
              // Other file types
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`
                  flex items-center p-2 border rounded 
                  ${isOwn ? 'border-ocean-300 bg-ocean-600' : 'border-gray-300 bg-gray-200'}
                `}
              >
                <PaperClipIcon className={`h-5 w-5 ${isOwn ? 'text-ocean-200' : 'text-gray-600'}`} />
                <div className="ml-2 min-w-0">
                  <div className="text-sm truncate max-w-[200px]">{getFileName(fileUrl)}</div>
                  {fileSize > 0 && (
                    <div className={`text-xs ${isOwn ? 'text-ocean-200' : 'text-gray-500'}`}>
                      {formatFileSize(fileSize)}
                    </div>
                  )}
                </div>
              </a>
            )}
          </div>
        )}
        
        {/* Text content */}
        {(message.body || message.content) && (
          <p className="break-words">{message.body || message.content}</p>
        )}
        
        {/* Timestamp and read receipt */}
        <div className="flex items-center justify-end mt-1 space-x-1">
          {isOwn && readStatus && (
            <span className="text-xs">
              <CheckCircleIcon className="h-3 w-3 inline" /> Read
            </span>
          )}
          <span className="text-xs">{timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
