import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, StarIcon, AcademicCapIcon, BuildingOfficeIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/solid';

const AlumniCard = ({ alumnus }) => {
  // Generate a color based on name for consistent avatar background
  const getInitials = () => {
    if (!alumnus.name || alumnus.name === 'Unknown') {
      return 'AM';
    }
    
    // Extract initials from full_name
    const nameParts = alumnus.name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return 'AM';
    
    if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    }
    
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials();
  
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
              alt={`${alumnus.name || 'User'}'s avatar`}
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
              {alumnus.isEmployer && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <BuildingOfficeIcon className="-ml-0.5 mr-1 h-3.5 w-3.5" />
                  Employer
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <AcademicCapIcon className="h-4 w-4 mr-1.5 text-gray-400" />
            <span>Graduation Year: {alumnus.graduationYear || 'N/A'}</span>
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
          
          {/* Detail 2: Headline */}
          <div className="flex items-start">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{alumnus.headline || alumnus.bio || 'Headline not specified'}</p>
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
              <p className="text-sm">{alumnus.degree || 'Degree not specified'}{alumnus.department ? `, ${alumnus.department}` : ''}</p>
            </div>
          </div>
          
          {/* Detail 5: Skills */}
          <div className="pt-1">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Skills & Interests</p>
            <div className="flex flex-wrap gap-1">
              {(() => {
                // Parse skills into a consistent format
                let skillsList = [];
                
                if (alumnus.skills) {
                  if (Array.isArray(alumnus.skills)) {
                    skillsList = alumnus.skills.filter(s => s && s.trim());
                  } else if (typeof alumnus.skills === 'string' && alumnus.skills.trim()) {
                    skillsList = alumnus.skills.split(',').map(s => s.trim()).filter(Boolean);
                  }
                }
                
                // Parse interests into a consistent format
                let interestsList = [];
                if (alumnus.interests) {
                  if (Array.isArray(alumnus.interests)) {
                    interestsList = alumnus.interests.filter(Boolean);
                  } else if (typeof alumnus.interests === 'string' && alumnus.interests.trim()) {
                    interestsList = alumnus.interests.split(',').map(s => s.trim()).filter(Boolean);
                  }
                }
                
                // Render skills first, then interests, or a placeholder if neither exists
                if (skillsList.length > 0) {
                  return (
                    <>
                      {skillsList.slice(0, 3).map((skill, index) => (
                        <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {skill}
                        </span>
                      ))}
                      {skillsList.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">+{skillsList.length - 3}</span>
                      )}
                    </>
                  );
                } else if (interestsList.length > 0) {
                  return (
                    <>
                      {interestsList.slice(0, 2).map((interest, index) => (
                        <span key={`interest-${index}`} className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-800 rounded-full">
                          {interest}
                        </span>
                      ))}
                      {interestsList.length > 2 && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">+{interestsList.length - 2} interests</span>
                      )}
                    </>
                  );
                } else {
                  return (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">No skills listed</span>
                  );
                }
              })()}
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
