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
        const { data, error: supabaseError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (supabaseError) {
          if (supabaseError.code === 'PGRST116') {
             setError('Alumni profile not found');
          } else {
             setError('Failed to load alumni profile');
          }
          console.error('Error fetching alumni:', supabaseError);
          return;
        }

        if (!data) {
          setError('Alumni profile not found');
          return;
        }

        console.log('Fetched alumni from Supabase:', data);

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

    try {
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        user_1_id: currentUser.id,
        user_2_id: alumnus.id
      });

      if (error) {
        throw error;
      }

      if (conversationId) {
        navigate(`/messages/${conversationId}`);
      } else {
        throw new Error('Could not get or create a conversation.');
      }
    } catch (error) {
      console.error('Error handling message action:', error);
      toast.error('There was an error trying to start a conversation. Please try again.');
    }
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
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white" title="Verified Alumnus">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Basic Info */}
        <div className="flex-1 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{alumnus.name}</h1>
          <p className="text-xl text-ocean-600 font-medium">{alumnus.currentPosition}</p>
          <p className="text-gray-600">{alumnus.company}</p>
          
          <div className="flex flex-wrap justify-center items-center text-gray-600 mt-2 gap-x-4 gap-y-1">
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">{alumnus.location}</span>
            </div>
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">{alumnus.degree} • {alumnus.graduationYear}</span>
            </div>
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
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{alumnus.about || 'No biography provided.'}</p>
          </div>

          {/* Experience */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience</h2>
            <div className="space-y-6">
              {Array.isArray(alumnus.experience) && alumnus.experience.length > 0 ? (
                alumnus.experience.map((exp, index) => (
                  <div key={index} className="flex items-start space-x-3">
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
                ))
              ) : (
                <p className="text-gray-500">No experience information available.</p>
              )}
            </div>
          </div>

          {/* Education */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
            <div className="space-y-4">
              {Array.isArray(alumnus.education) && alumnus.education.length > 0 ? (
                alumnus.education.map((edu, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AcademicCapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-ocean-600 font-medium">{edu.institution}</p>
                      <p className="text-sm text-gray-600">{edu.year} • {edu.grade}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No education information available.</p>
              )}
            </div>
          </div>

          {/* Achievements */}
          {Array.isArray(alumnus.achievements) && alumnus.achievements.length > 0 && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alumnus.achievements.map((achievement, index) => (
                  <AchievementCard key={index} achievement={achievement} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                <a href={`mailto:${alumnus.email}`} className="text-ocean-600 hover:text-ocean-700 text-sm truncate">
                  {alumnus.email}
                </a>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-700 text-sm">{alumnus.phone || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(alumnus.skills) && alumnus.skills.length > 0 ? (
                alumnus.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No skills listed.</p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-2">
              {alumnus.socialLinks && Object.values(alumnus.socialLinks).some(link => link) ? (
                Object.entries(alumnus.socialLinks).map(([platform, url]) => (
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
                ))
              ) : (
                <p className="text-gray-500 text-sm">No social links provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniProfile;