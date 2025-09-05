import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, StarIcon, ChevronRightIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

const AlumniListItem = ({ alumnus }) => {
  const getInitials = (name) => {
    if (!name) return 'AM';
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return 'AM';
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(alumnus.fullName);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200/80 hover:shadow-md transition-all duration-300 group">
      <Link to={`/directory/${alumnus.id}`} className="block hover:bg-gray-50">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Avatar */}
            {alumnus.avatar ? (
              <div className="relative">
                <img
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-indigo-100 group-hover:ring-indigo-200 transition-all"
                  src={alumnus.avatar}
                  alt={`${alumnus.fullName || 'User'}'s avatar`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const fallback = e.target.nextSibling;
                    if (fallback) fallback.style.display = 'flex';
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
                <h3 className="text-lg font-bold text-gray-800 truncate" title={alumnus.fullName}>
                  {alumnus.fullName || 'Alumni Member'}
                </h3>
                {alumnus.isMentor && (
                  <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <StarIcon className="-ml-0.5 mr-1 h-3 w-3" />
                    Mentor
                  </span>
                )}
              </div>
              
              {alumnus.profession && !alumnus.isPrivate?.profession && (
                  <p className="text-sm font-medium text-indigo-600 truncate mt-0.5">{alumnus.profession}</p>
                )}

              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                {alumnus.titleAtCompany && !alumnus.isPrivate?.job_title && (
                  <p className="text-sm text-gray-600 truncate flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span>{alumnus.titleAtCompany}</span>
                  </p>
                )}
                {alumnus.degreeDepartment && !alumnus.isPrivate?.education && (
                  <p className="text-sm text-gray-600 truncate flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span>{alumnus.degreeDepartment}</span>
                  </p>
                )}
              </div>
              
              {/* Skills tags */}
              {alumnus.skills && alumnus.skills.length > 0 && !alumnus.isPrivate?.skills && (
                <div className="hidden md:flex flex-wrap gap-1.5 mt-2">
                  {alumnus.skills.slice(0, 4).map((skill, index) => (
                    <span key={index} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {skill}
                    </span>
                  ))}
                  {alumnus.skills.length > 4 && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">+{alumnus.skills.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location and Arrow */}
          <div className="hidden md:flex items-center space-x-4 ml-4 flex-shrink-0">
            {alumnus.locationLabel && !alumnus.isPrivate?.location && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPinIcon className="h-4 w-4 mr-1.5 text-indigo-400" />
                <span>{alumnus.locationLabel}</span>
              </div>
            )}
            <div className="h-8 w-8 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>
          
          {/* Arrow indicator on small screens */}
          <div className="ml-4 flex-shrink-0 md:hidden">
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
