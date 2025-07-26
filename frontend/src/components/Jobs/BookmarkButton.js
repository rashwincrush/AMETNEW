import React from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/**
 * BookmarkButton component to centralize bookmark logic and error handling
 * @param {string} jobId - The ID of the job to bookmark/unbookmark
 * @param {boolean} isBookmarked - Whether the job is currently bookmarked
 * @param {function} handleBookmark - Function to handle the bookmark action
 */
const BookmarkButton = ({ jobId, isBookmarked, handleBookmark }) => {
  const handleClick = () => {
    if (typeof handleBookmark === 'function') {
      handleBookmark(jobId);
    } else {
      console.error('handleBookmark is not a function');
      toast.error('Unable to save bookmark. Please try again later.');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors duration-200 ${isBookmarked ? 'bg-ocean-100 hover:bg-ocean-200' : 'hover:bg-gray-100'}`}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <BookmarkIcon 
        className={`w-5 h-5 transition-colors duration-200 ${isBookmarked ? 'text-ocean-600 fill-ocean-600' : 'text-gray-500'}`} 
      />
    </button>
  );
};

export default BookmarkButton;
