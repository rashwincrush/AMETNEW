import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LinkIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  HashtagIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const AchievementCard = ({ achievement }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <StarIcon className="w-6 h-6 text-yellow-500" />
      </div>
      <div className="ml-3">
        <p className="text-md font-semibold text-gray-800">{achievement.title || achievement}</p>
        {achievement.description && <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>}
      </div>
    </div>
  </div>
);

// Use shared mapper in utils

const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alumnus, setAlumnus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, pending, connected, error
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
    };
    getCurrentUser();

    const fetchAlumnusData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Core public profile fields
        const { data: core, error: coreErr } = await supabase
          .from('public_profiles_view')
          .select('id, full_name, avatar_url, current_job_title, company_name, location, degree_program, graduation_year, phone')
          .eq('id', id)
          .single();

        if (coreErr) throw coreErr;
        if (!core) throw new Error('Profile not found');

        // Ancillary views
        const [aboutRes, eduRes, achRes, socialRes] = await Promise.all([
          supabase.from('profile_about_view').select('about_display').eq('id', id).single(),
          supabase.from('profile_education_view').select('education_display').eq('id', id).single(),
          supabase.from('profile_achievements_view').select('achievements, skills').eq('id', id).single(),
          supabase.from('profile_social_links').select('social_links').eq('id', id).single(),
        ]);

        const about_display = aboutRes?.data?.about_display || '';
        const education_display = eduRes?.data?.education_display || '';
        const achievements = Array.isArray(achRes?.data?.achievements) ? achRes.data.achievements : [];
        const skills = Array.isArray(achRes?.data?.skills) ? achRes.data.skills : [];
        const social_links = (socialRes?.data?.social_links && typeof socialRes.data.social_links === 'object') ? socialRes.data.social_links : {};

        setAlumnus({
          id: core.id,
          name: core.full_name,
          avatar: core.avatar_url,
          current_job_title: core.current_job_title || '',
          company_name: core.company_name || '',
          location: core.location || '',
          degree_program: core.degree_program || '',
          graduation_year: core.graduation_year || '',
          phone: core.phone || '',
          about: about_display,
          education_display,
          achievements,
          skills,
          social_links,
        });
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        setError('An unexpected error occurred while fetching the profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlumnusData();
  }, [id]);

  useEffect(() => {
    if (!currentUser || !alumnus) return;

    const checkConnectionStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_connection_status', {
          user_1_id: currentUser.id,
          user_2_id: alumnus.id
        });

        if (error) throw error;

        setConnectionStatus(data || 'idle');
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectionStatus('error');
      }
    };

    checkConnectionStatus();
  }, [currentUser, alumnus]);

  const handleConnect = async () => {
    if (!currentUser || !alumnus) return;
    
    // If already pending, cancel the request
    if (connectionStatus === 'pending') {
      try {
        // Find the connection request
        const { data, error: findError } = await supabase
          .from('connections')
          .select('id')
          .eq('requester_id', currentUser.id)
          .eq('recipient_id', alumnus.id)
          .eq('status', 'pending')
          .single();
        
        if (findError) {
          console.error('Error finding connection request:', findError);
          throw new Error('Could not locate your connection request');
        }
        
        // Delete the connection request
        const { error: deleteError } = await supabase
          .from('connections')
          .delete()
          .eq('id', data.id);
          
        if (deleteError) {
          console.error('Error cancelling connection request:', deleteError);
          throw new Error('Failed to cancel connection request');
        }
        
        setConnectionStatus('idle');
        toast.success('Connection request cancelled successfully');
      } catch (error) {
        console.error('Error in connection cancellation:', error);
        toast.error(error.message || 'Failed to cancel connection request');
      }
    } else if (connectionStatus === 'idle') {
      // Send a new connection request
      const { error } = await supabase.from('connections').insert([
        { requester_id: currentUser.id, recipient_id: alumnus.id, status: 'pending' }
      ]);
  
      if (error) {
        console.error('Error sending connection request:', error);
        toast.error('Failed to send connection request');
      } else {
        setConnectionStatus('pending');
      }
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !alumnus) return;
    // With DM threads auto-created by backend, navigate to messages and request opening this user's thread
    navigate('/messages', { state: { openOtherUserId: alumnus.id } });
  };
  
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        {/* Centered Header */}
        <div className="glass-card rounded-lg p-6 flex flex-col items-center text-center">
          {/* Profile Picture */}
          <div className="relative mb-4">
            <img
              src={alumnus.avatar}
              alt={`${alumnus.name}'s profile picture`}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            {alumnus.verified && (
              <div
                className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
                title="Verified Alumnus"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Basic Info */}
        <div className="flex-1 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{alumnus.name}</h1>
          {alumnus.current_job_title && (
            <p className="text-xl text-ocean-600 font-medium">{alumnus.current_job_title}</p>
          )}
          {alumnus.company_name && (
            <p className="text-gray-600">{alumnus.company_name}</p>
          )}

          <div className="flex flex-wrap justify-center items-center text-gray-600 mt-2 gap-x-4 gap-y-1">
            {alumnus.location && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">{alumnus.location}</span>
              </div>
            )}
            {(alumnus.degree_program || alumnus.graduation_year) && (
              <div className="flex items-center">
                <AcademicCapIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">{[alumnus.degree_program, alumnus.graduation_year].filter(Boolean).join(' • ')}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        {currentUser && currentUser.id !== alumnus.id && (
        <div className="flex items-center justify-center space-x-2">
          <button 
            onClick={handleConnect}
            disabled={connectionStatus === 'accepted' || connectionStatus === 'error'}
            className={`${connectionStatus === 'pending' ? 'btn-yellow' : 'btn-ocean'} px-4 py-2 rounded-lg flex items-center ${(connectionStatus === 'accepted' || connectionStatus === 'error') ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <UserPlusIcon className="w-4 h-4 mr-2" />
            {connectionStatus === 'pending' ? 'Pending' : connectionStatus === 'accepted' ? 'Connected' : 'Connect'}
          </button>
          <button 
            onClick={handleMessage}
            className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
            Message
          </button>
          <button className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center">
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </button>
        </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {alumnus.about && (
            <div className="glass-card rounded-lg p-6" data-testid="about-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{alumnus.about}</p>
            </div>
          )}

          {/* Education */}
          {alumnus.education_display && (
            <div className="glass-card rounded-lg p-6" data-testid="education-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
              <div className="text-gray-700 whitespace-pre-line">{alumnus.education_display}</div>
            </div>
          )}

          {/* Achievements */}
          {Array.isArray(alumnus.achievements) && alumnus.achievements.length > 0 && (
            <div className="glass-card rounded-lg p-6" data-testid="achievements-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alumnus.achievements
                  .filter(achievement => achievement && (achievement.title || typeof achievement === 'string')) // Filter out empty/invalid achievements
                  .map((achievement, index) => (
                  <AchievementCard key={index} achievement={achievement} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          {(alumnus.phone || alumnus.location || alumnus.current_job_title || alumnus.company_name) && (
            <div className="glass-card rounded-lg p-6" data-testid="contact-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {alumnus.current_job_title && (
                  <div className="flex items-center">  
                    <BriefcaseIcon className="w-6 h-6 mr-4 text-ocean-600" />
                    <div className="font-medium">{alumnus.current_job_title}{alumnus.company_name ? ` at ${alumnus.company_name}` : ''}</div>
                  </div>
                )}

                {alumnus.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="w-6 h-6 mr-4 text-ocean-600" />
                    <a href={`tel:${alumnus.phone}`} className="font-medium text-ocean-600 hover:underline">{alumnus.phone}</a>
                  </div>
                )}

                {alumnus.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="w-6 h-6 mr-4 text-ocean-600" />
                    <div className="font-medium">{alumnus.location}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {Array.isArray(alumnus.skills) && alumnus.skills.length > 0 && (
            <div className="glass-card rounded-lg p-6" data-testid="skills-section">
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
          )}

          {/* Social Links */}
          {alumnus.social_links && Object.values(alumnus.social_links).some(link => link) && (
            <div className="glass-card rounded-lg p-6" data-testid="social-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
              <div className="space-y-2">
                {['linkedin', 'github', 'x', 'website'].map((key) => {
                  const url = alumnus.social_links?.[key];
                  if (!url) return null;
                  const Icon = key === 'linkedin' ? LinkIcon : key === 'github' ? CodeBracketIcon : key === 'x' ? HashtagIcon : GlobeAltIcon;
                  const label = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <a 
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-ocean-600 hover:text-ocean-700 text-sm break-all"
                      title={`${label} profile`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {/* Empty state if no optional sections */}
          {!(alumnus.about || alumnus.education_display || (Array.isArray(alumnus.achievements) && alumnus.achievements.length > 0) || (Array.isArray(alumnus.skills) && alumnus.skills.length > 0) || (alumnus.social_links && Object.values(alumnus.social_links).some(Boolean)) || alumnus.phone || alumnus.location || alumnus.current_job_title || alumnus.company_name) && (
            <div className="glass-card rounded-lg p-6" data-testid="empty-details">
              <p className="text-gray-600">This profile hasn’t added details yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniProfile;