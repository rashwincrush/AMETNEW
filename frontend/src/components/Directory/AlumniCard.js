import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, StarIcon, AcademicCapIcon, BuildingOfficeIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/solid';

const AlumniCard = ({ alumnus }) => {
  // Generate a color based on name for consistent avatar background
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
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 border border-gray-200/80 flex flex-col h-full">
      {/* Card Header with Avatar */}
      <div className="relative pb-6 pt-10 px-6 flex flex-col items-center">
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        {alumnus.avatar ? (
          <div className="relative z-10">
            <img
              className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
              src={alumnus.avatar}
              alt={`${alumnus.name}'s avatar`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold items-center justify-center ring-4 ring-white shadow-lg">
              {initials}
            </div>
          </div>
        ) : (
          <div className="relative z-10 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold flex items-center justify-center ring-4 ring-white shadow-lg">
            {initials}
          </div>
        )}
        
        <div className="mt-4 text-center w-full">
          <div className="flex justify-center items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-800">
              {alumnus.name || 'Unknown'}
            </h3>
            <div className="flex gap-1.5">
              {alumnus.isMentor && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <StarIcon className="-ml-0.5 mr-1 h-3.5 w-3.5" />
                  Mentor
                </span>
              )}
              {alumnus.student_id && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <AcademicCapIcon className="-ml-0.5 mr-1 h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <AcademicCapIcon className="h-4 w-4 mr-1.5 text-gray-400" />
            <span>Batch of {alumnus.batchYear || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      {/* Card Body with Details - 5 Important Details */}
      <div className="px-6 py-4 flex-grow">
        <div className="space-y-3 text-gray-700">
          {/* Detail 1: Current Position & Company */}
          <div className="flex items-start">
            <BriefcaseIcon className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{alumnus.currentPosition || 'Position not specified'}</p>
              <p className="text-sm text-gray-500">{alumnus.company || 'Company not specified'}</p>
            </div>
          </div>
          
          {/* Detail 2: Industry */}
          <div className="flex items-start">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{alumnus.industry || 'Industry not specified'}</p>
          </div>
          
          {/* Detail 3: Location */}
          <div className="flex items-start">
            <MapPinIcon className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{alumnus.location || 'Location not specified'}</p>
          </div>
          
          {/* Detail 4: Education */}
          <div className="flex items-start">
            <AcademicCapIcon className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">{alumnus.degree || 'Degree not specified'}</p>
              <p className="text-sm text-gray-500">{alumnus.department || 'Department not specified'}</p>
            </div>
          </div>
          
          {/* Detail 5: Skills */}
          <div className="pt-1">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(alumnus.skills) && alumnus.skills.length > 0 ? 
                alumnus.skills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {skill}
                  </span>
                )) : 
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">No skills listed</span>
              }
              {Array.isArray(alumnus.skills) && alumnus.skills.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">+{alumnus.skills.length - 3}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Card Footer with Action Button */}
      <div className="px-6 pb-6 pt-2 mt-auto">
        <Link 
          to={`/directory/${alumnus.id}`}
          className="w-full block text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default AlumniCard;
