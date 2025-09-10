import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, StarIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

const AlumniCard = ({ alumnus }) => {
  const getInitials = (name) => {
    if (!name) return 'AM';
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return 'AM';
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const fullName = alumnus.full_name || alumnus.fullName || '';
  const initials = getInitials(fullName);
  const avatarUrl = alumnus.avatar_url || alumnus.avatar || '';

  // Direct fields from public_profiles_view
  const position = (alumnus.current_job_title || '').toString().trim();
  const company = (alumnus.company_name || '').toString().trim();
  const location = (alumnus.location || alumnus.locationLabel || '').toString().trim();
  const degree = (alumnus.degree_program || alumnus.degree || '').toString().trim();
  const gradYear = alumnus.graduation_year || alumnus.gradYear || '';
  const degreeDisplay = [degree, gradYear].filter(Boolean).join(' • ');
  let skills = [];
  if (Array.isArray(alumnus.skills)) {
    skills = alumnus.skills.filter(Boolean);
  } else if (typeof alumnus.skills === 'string' && alumnus.skills.trim()) {
    try {
      const parsed = JSON.parse(alumnus.skills);
      if (Array.isArray(parsed)) skills = parsed.filter(Boolean);
    } catch (_) {
      // If not valid JSON, ignore (view should already provide array)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 border border-gray-200/80 flex flex-col h-full">
      {/* Card Header with Avatar */}
      <div className="relative pb-6 pt-10 px-6 flex flex-col items-center">
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        {avatarUrl ? (
          <div className="relative z-10">
            <img
              className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
              src={avatarUrl}
              alt={`${fullName || 'User'}'s avatar`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) fallback.style.display = 'flex';
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
            <h3 className="text-xl font-bold text-gray-800 truncate" title={fullName}>
              {fullName}
            </h3>
            {alumnus.isMentor && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                <StarIcon className="-ml-0.5 mr-1 h-3.5 w-3.5" />
                Mentor
              </span>
            )}
          </div>
          {position && (
            <p className="text-sm font-medium text-indigo-600 truncate" title={position}>{position}</p>
          )}
        </div>
      </div>
      
      {/* Card Body with Details */}
      <div className="px-6 py-4 flex-grow">
        <div className="space-y-3 text-gray-700">
          {/* Company */}
          {company && (
            <div className="flex items-start">
              <BriefcaseIcon className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium truncate" title={company}>{company}</p>
            </div>
          )}

          {/* Education */}
          {degreeDisplay && (
            <div className="flex items-start">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{degreeDisplay}</p>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-start">
              <MapPinIcon aria-label="Location" className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm break-words whitespace-normal">{location}</p>
            </div>
          )}

          
          {/* Skills */}
          {skills.length > 0 && !alumnus.isPrivate?.skills && (
            <div className="pt-1">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {skill}
                  </span>
                ))}
                {skills.length > 3 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">+{skills.length - 3}</span>
                )}
              </div>
            </div>
          )}
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
