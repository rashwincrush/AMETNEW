import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, StarIcon, ChevronRightIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

const AlumniListItem = ({ alumnus }) => {
  // Generate initials for avatar fallback
  const getInitials = (name) => {
    if (!name || name === 'Unknown') return 'AM';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const initials = getInitials(alumnus.name);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200/80 hover:shadow-md transition-all duration-300 group">
      <Link to={`/directory/${alumnus.id}`} className="block hover:bg-gray-50">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Avatar with fallback */}
            {alumnus.avatar ? (
              <div className="relative">
                <img
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-indigo-100 group-hover:ring-indigo-200 transition-all"
                  src={alumnus.avatar}
                  alt={`${alumnus.name}'s avatar`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold items-center justify-center ring-2 ring-indigo-100">
                  {initials}
                </div>
              </div>
            ) : (
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold flex items-center justify-center ring-2 ring-indigo-100">
                {initials}
              </div>
            )}
            
            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-800 truncate">
                  {alumnus.name || 'Unknown'}
                </h3>
                <div className="flex gap-1.5">
                  {alumnus.isMentor && (
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <StarIcon className="-ml-0.5 mr-1 h-3 w-3" />
                      Mentor
                    </span>
                  )}
                  {alumnus.student_id && (
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <AcademicCapIcon className="-ml-0.5 mr-1 h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-6">
                <p className="text-sm text-gray-600 truncate flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                  <span>Batch of {alumnus.batchYear || 'N/A'}</span>
                  {alumnus.department && <span className="mx-1.5">·</span>}
                  {alumnus.department && <span>{alumnus.department}</span>}
                </p>
                
                <p className="text-sm text-gray-600 truncate flex items-center mt-1 sm:mt-0">
                  <BriefcaseIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                  <span>{alumnus.currentPosition || 'Position not specified'} {alumnus.company ? `at ${alumnus.company}` : ''}</span>
                </p>
              </div>
              
              {/* Skills tags - only visible on larger screens */}
              {alumnus.skills && Array.isArray(alumnus.skills) && alumnus.skills.length > 0 && (
                <div className="hidden md:flex flex-wrap gap-1 mt-2">
                  {alumnus.skills.slice(0, 2).map((skill, index) => (
                    <span key={index} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {skill}
                    </span>
                  ))}
                  {alumnus.skills.length > 2 && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">+{alumnus.skills.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location - only visible on medium screens and up */}
          <div className="hidden md:flex items-center space-x-4 ml-4 flex-shrink-0">
            <div className="flex items-center text-sm text-gray-500">
              <MapPinIcon className="h-4 w-4 mr-1.5 text-indigo-400" />
              <span>{alumnus.location || 'Location not specified'}</span>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="ml-4 flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default AlumniListItem;
