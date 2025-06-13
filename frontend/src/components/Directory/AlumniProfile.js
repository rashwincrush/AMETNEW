import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alumnus, setAlumnus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAlumnusData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try fetching from backend API first
        try {
          // Use explicit URL to avoid environment variable caching issues
          const backendUrl = 'http://localhost:8003';
          console.log('Using backend URL:', backendUrl);
          const response = await fetch(`${backendUrl}/api/profiles/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch alumni profile');
          }
          
          const data = await response.json();
          console.log('Fetched alumni from backend:', data);
          
          // Transform data to match component structure
          const transformedAlumnus = {
            id: data.id,
            name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
            email: data.email || '',
            phone: data.phone || data.phone_number || '',
            graduationYear: data.graduation_year,
            degree: data.degree || 'Not specified',
            specialization: data.specialization || '',
            currentPosition: data.current_position || 'Not specified',
            company: data.current_company || data.company_name || 'Not specified',
            location: data.location || 'Not specified',
            avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || data.email || 'User')}&background=3B82F6&color=fff`,
            coverImage: data.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=300&fit=crop',
            verified: data.is_verified || false,
            joinedDate: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            about: data.bio || '',
            experience: data.experience || [],
            education: data.education || [],
            skills: data.skills || [],
            achievements: data.achievements || [],
            interests: data.interests || [],
            languages: data.languages || [],
            socialLinks: {
              linkedin: data.linkedin_url || '',
              website: data.website || '',
              twitter: data.twitter || ''
            }
          };
          
          setAlumnus(transformedAlumnus);
          
        } catch (apiError) {
          console.error('Backend API failed, trying direct Supabase:', apiError);
          
          // Fallback to direct Supabase if backend fails
          const { supabase } = await import('../../utils/supabase');
          
          const { data, error: supabaseError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

          if (supabaseError) {
            console.error('Error fetching alumni:', supabaseError);
            setError('Failed to load alumni profile');
            return;
          }

          if (!data) {
            setError('Alumni profile not found');
            return;
          }

          console.log('Fetched alumni from Supabase:', data);
          
          // Transform data to match component structure
          const transformedAlumnus = {
            id: data.id,
            name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
            email: data.email || '',
            phone: data.phone || data.phone_number || '',
            graduationYear: data.graduation_year,
            degree: data.degree || 'Not specified',
            specialization: data.specialization || '',
            currentPosition: data.current_position || 'Not specified',
            company: data.current_company || data.company_name || 'Not specified',
            location: data.location || 'Not specified',
            avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || data.email || 'User')}&background=3B82F6&color=fff`,
            coverImage: data.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=300&fit=crop',
            verified: data.is_verified || false,
            joinedDate: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            about: data.bio || '',
            experience: data.experience || [],
            education: data.education || [],
            skills: data.skills || [],
            achievements: data.achievements || [],
            interests: data.interests || [],
            languages: data.languages || [],
            socialLinks: {
              linkedin: data.linkedin_url || '',
              website: data.website || '',
              twitter: data.twitter || ''
            }
          };
          
          setAlumnus(transformedAlumnus);
        }
      } catch (err) {
        console.error('Error fetching alumni profile:', err);
        setError('Could not load alumni profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlumnusData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading alumni profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/directory')} 
          className="btn-ocean px-4 py-2 rounded-lg"
        >
          Back to Directory
        </button>
      </div>
    );
  }
  
  if (!alumnus) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-gray-500 text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Available</h2>
        <p className="text-gray-600 mb-6">The requested alumni profile could not be found.</p>
        <button 
          onClick={() => navigate('/directory')} 
          className="btn-ocean px-4 py-2 rounded-lg"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cover Image & Basic Info */}
      <div className="glass-card rounded-lg overflow-hidden">
        {/* Cover Image */}
        <div 
          className="h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${alumnus.coverImage})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        
        {/* Profile Info */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative -mt-20 md:-mt-16">
              <img 
                src={alumnus.avatar} 
                alt={alumnus.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {alumnus.verified && (
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{alumnus.name}</h1>
              <p className="text-xl text-ocean-600 font-medium">{alumnus.currentPosition}</p>
              <p className="text-gray-600">{alumnus.company}</p>
              
              <div className="flex flex-wrap items-center text-gray-600 mt-2 space-x-4">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{alumnus.location}</span>
                </div>
                <div className="flex items-center">
                  <AcademicCapIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{alumnus.degree} • Class of {alumnus.graduationYear}</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 mt-1">
                <span className="text-sm">{alumnus.connections} connections</span>
                {alumnus.mutualConnections > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-sm">{alumnus.mutualConnections} mutual connections</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button className="btn-ocean px-4 py-2 rounded-lg flex items-center">
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Connect
              </button>
              <Link 
                to="/messages" 
                className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                Message
              </Link>
              <button className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center">
                <ShareIcon className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{alumnus.about}</p>
          </div>

          {/* Experience */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience</h2>
            <div className="space-y-6">
              {alumnus.experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-ocean-200 pl-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-ocean-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                      <p className="text-ocean-600 font-medium">{exp.company}</p>
                      <p className="text-sm text-gray-600">{exp.duration} • {exp.location}</p>
                      <p className="text-gray-700 mt-2">{exp.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
            <div className="space-y-4">
              {alumnus.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-ocean-200 pl-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AcademicCapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-ocean-600 font-medium">{edu.institution}</p>
                      <p className="text-sm text-gray-600">{edu.year} • {edu.grade}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {edu.activities.map((activity, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Achievements</h2>
            <ul className="space-y-3">
              {alumnus.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-ocean-500 mr-3 mt-1">🏆</span>
                  <span className="text-gray-700">{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                <a href={`mailto:${alumnus.email}`} className="text-ocean-600 hover:text-ocean-700 text-sm">
                  {alumnus.email}
                </a>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-700 text-sm">{alumnus.phone}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-700 text-sm">{alumnus.location}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {alumnus.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {alumnus.interests.map((interest, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
            <div className="space-y-2">
              {alumnus.languages.map((language, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm">{language}</span>
                  <span className="text-xs text-gray-500">Fluent</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-2">
              {Object.entries(alumnus.socialLinks || {}).map(([platform, url]) => (
                url && (
                  <a 
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-ocean-600 hover:text-ocean-700 text-sm"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniProfile;