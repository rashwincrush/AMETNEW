import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LinkIcon,
  
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';
import { StarIcon } from '@heroicons/react/24/solid';
import ConnectionCTA from '../shared/ConnectionCTA';
import { TextPill } from '../shared/Chips';
import { useConnectionRel } from '../../hooks/useConnectionRel';
import { useAuth } from '../../contexts/AuthContext';
import MentorContactPanel from '../Mentorship/MentorContactPanel';

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
  // Connection rel (live)
  const rel = useConnectionRel(currentUser?.id, id);
  const { getUserRole } = useAuth();
  const role = getUserRole?.();
  
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
        let data = null;
        let supabaseError = null;
        if (role === 'student') {
          // Load from public view (no PII)
          const res = await supabase
            .from('alumni_directory_public')
            .select('*')
            .eq('id', id)
            .single();
          data = res.data;
          supabaseError = res.error;
        } else {
          const res = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          data = res.data;
          supabaseError = res.error;
        }

        if (supabaseError) {
          if (supabaseError.code === 'PGRST116') {
             setError("This profile isn’t publicly visible.");
          } else {
             setError("This profile isn’t publicly visible.");
          }
          console.error('Error fetching alumni:', supabaseError);
          return;
        }

        if (!data) {
          setError("This profile isn’t publicly visible.");
          return;
        }

        console.log('Fetched alumni from Supabase:', data);

        const transformedAlumnus = (() => {
          if (role === 'student') {
            const city = data.location_city || '';
            const country = data.location_country || '';
            return {
              id: data.id,
              name: data.full_name || 'Unknown',
              email: '',
              phone: '',
              graduationYear: data.graduation_year ?? 'Not specified',
              degree: data.degree_program ?? 'Not specified',
              department: data.department ?? '', // not provided by view; keep blank
              currentPosition: data.current_job_title ?? 'Not specified',
              company: data.company_name ?? 'Not specified',
              location: [city, country].filter(Boolean).join(', ') || 'Not specified',
              avatar: data.avatar_url || '/default-avatar.png',
              coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=300&fit=crop',
              verified: false,
              joinedDate: '',
              about: '',
              experience: [],
              education: [],
              skills: [],
              achievements: typeof data.achievements === 'string' ? [data.achievements] : (Array.isArray(data.achievements) ? data.achievements : []),
              interests: [],
              languages: [],
              socialLinks: {},
            };
          }
          return {
            id: data.id,
            name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
            email: data.email || '',
            phone: data.phone || '',
            graduationYear: data.graduation_year ?? 'Not specified',
            degree: data.degree_program ?? 'Not specified',
            department: data.department ?? 'Not specified',
            currentPosition: data.current_job_title ?? 'Not specified',
            company: data.company_name ?? 'Not specified',
            location: data.location ?? 'Not specified',
            avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || data.email || 'User')}&background=3B82F6&color=fff`,
            coverImage: data.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=300&fit=crop',
            verified: data.is_verified || false,
            joinedDate: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            about: data.about || '',
            experience: Array.isArray(data.experience) ? data.experience : [],
            education: Array.isArray(data.education) ? data.education : [],
            skills: Array.isArray(data.skills) ? data.skills : [],
            achievements: Array.isArray(data.achievements) ? data.achievements : [],
            interests: Array.isArray(data.interests) ? data.interests : [],
            languages: Array.isArray(data.languages) ? data.languages : [],
            socialLinks: {
              linkedin: data.linkedin_url || '',
              website: data.website || '',
              twitter: data.twitter || ''
            }
          };
        })();

        setAlumnus(transformedAlumnus);
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        setError("This profile isn’t publicly visible.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlumnusData();
  }, [id]);

  // Enrich contact details via RPC for non-students only
  useEffect(() => {
    if (!alumnus?.id) return;
    if (role === 'student') return; // never fetch contacts for students
    (async () => {
      try {
        const { data: contact, error } = await supabase
          .rpc('get_profile_contact_details', { target_user_id: alumnus.id });
        if (!error && contact) {
          const row = Array.isArray(contact) ? contact[0] : contact;
          if (row) {
            setAlumnus(prev => ({
              ...prev,
              email: row.email || prev.email || '',
              phone: row.phone || prev.phone || ''
            }));
          }
        }
      } catch (e) {
        console.error('contact rpc error', e);
      }
    })();
  }, [alumnus?.id, role]);

  const handleMessage = () => {
    if (!currentUser || !alumnus) return;
    navigate(`/messages?peer=${alumnus.id}`);
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
        {/* Profile Picture */}
        <div className="relative mb-4">
          <img
            src={alumnus.avatar}
            alt={`${alumnus.name}'s profile picture`}
            className="h-24 w-24 rounded-full object-cover ring-1 ring-slate-200 bg-slate-100"
          />
        </div>
        {/* Basic Info */}
        <div className="flex-1 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{alumnus.name}</h1>
          {/* Batch pill under name */}
          {(() => {
            const batch = alumnus.batch_year ?? alumnus.graduation_year ?? alumnus.batch ?? alumnus.graduationYear ?? null;
            return batch ? (
              <div className="mt-1 flex justify-center"><TextPill>Batch {batch}</TextPill></div>
            ) : null;
          })()}
        </div>

        {/* CTA: shared, scope=profile */}
        {currentUser && currentUser.id !== alumnus.id && (
          <div className="mt-3">
            <ConnectionCTA
              meId={currentUser?.id}
              peerId={alumnus.id}
              rel={rel}
              scope="profile"
              onMessage={handleMessage}
            />
          </div>
        )}

        {/* Chips intentionally hidden on Profile header per spec; kept only on Directory cards */}
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
          {/* Contact Info (no email/phone for students) */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">  
                <BriefcaseIcon className="w-6 h-6 mr-4 text-ocean-600" />
                <div>
                  <div className="text-sm text-gray-500">Currently</div>
                  <div className="font-medium">{alumnus.currentPosition} at {alumnus.company}</div>
                </div>
              </div>

              <div className="flex items-center">
                <MapPinIcon className="w-6 h-6 mr-4 text-ocean-600" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium">{alumnus.location}</div>
                </div>
              </div>

              <div className="flex items-center">
                <AcademicCapIcon className="w-6 h-6 mr-4 text-ocean-600" />
                <div>
                  <div className="text-sm text-gray-500">Education</div>
                  <div className="font-medium">{alumnus.degree}, {alumnus.department} ({alumnus.graduationYear})</div>
                </div>
              </div>

              {role !== 'student' && alumnus.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="w-6 h-6 mr-4 text-ocean-600" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <a href={`mailto:${alumnus.email}`} className="font-medium text-ocean-700 hover:underline">
                      {alumnus.email}
                    </a>
                  </div>
                </div>
              )}

              {role !== 'student' && alumnus.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="w-6 h-6 mr-4 text-ocean-600" />
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <a href={`tel:${alumnus.phone}`} className="font-medium text-ocean-700 hover:underline">
                      {alumnus.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mentor contact unlock panel for students */}
          {role === 'student' && <MentorContactPanel mentorId={alumnus.id} />}

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

          {/* Social Links (hidden for students) */}
          {role !== 'student' && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniProfile;