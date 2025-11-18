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
import Avatar from '../common/Avatar';
import { useAcademicsCatalog } from '../../hooks/useAcademicsCatalog';
import { loadProfileSocialLinks } from '../../services/socialLinks';

const AchievementCard = ({ achievement }) => (
  <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <StarIcon className="w-6 h-6 text-yellow-500" aria-hidden="true" />
      </div>
      <div className="ml-3">
        <p className="text-md font-semibold text-slate-900">{achievement.title || achievement}</p>
        {achievement.description && <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>}
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
  const { degrees, groups } = useAcademicsCatalog();
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
    };
    getCurrentUser();

    const fetchAlumnusData = async () => {
      if (!id || !role) return;

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
          if (supabaseError || !data) {
            const code = supabaseError?.code || '';
            const msg = supabaseError?.message || '';
            const isNoRow = code === 'PGRST116' || /no row/i.test(msg);
            if (isNoRow) {
              const pub = await supabase
                .from('alumni_directory_public')
                .select('*')
                .eq('id', id)
                .maybeSingle();
              if (!pub.error && pub.data) {
                data = pub.data;
                supabaseError = null;
                // Treat as student-safe view for transformation below
                // by overriding role locally
                // eslint-disable-next-line no-var
                var _usePublicTransform = true;
              }
            }
          }
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

        // Transform to a normalized alumnus object
        if (role === 'student' || typeof _usePublicTransform !== 'undefined') {
          const city = data.location_city || '';
          const country = data.location_country || '';
          const transformed = {
            id: data.id,
            name: data.full_name || 'Unknown',
            email: '',
            phone: '',
            graduationYear: data.graduation_year ?? 'Not specified',
            degreeLabel: data.degree_program ?? 'Not specified',
            departmentLabel: data.department ?? '',
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
            updated_at: data.updated_at || null,
          };
          setAlumnus(transformed);
        } else {
          // Private view: fetch social links from canonical view in parallel
          const socialLinks = await loadProfileSocialLinks(id);
          // Fallback: if linkedin_url exists on profile row but not in social_links view, include it
          const mergedSocialLinks = {
            ...socialLinks,
            ...(data.linkedin_url && !socialLinks?.linkedin ? { linkedin: data.linkedin_url } : {})
          };
          const transformed = {
            id: data.id,
            name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
            email: data.email || '',
            phone: data.phone || '',
            graduationYear: data.graduation_year ?? 'Not specified',
            degreeLabel: null,
            departmentLabel: null,
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
            socialLinks: mergedSocialLinks,
            updated_at: data.updated_at || null,
            degree_code: data.degree_code || null,
            department_id: data.department_id || null,
          };
          setAlumnus(transformed);
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        setError("This profile isn’t publicly visible.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlumnusData();
  }, [id, role]);

  // Compute degree/department labels in private view when catalog is ready
  useEffect(() => {
    if (!alumnus || role === 'student') return;
    const code = alumnus.degree_code;
    const depId = alumnus.department_id;
    const foundDegree = code ? degrees.find(d => d.degree_code === code) : null;
    const degreeLabel = foundDegree?.degree_label || (code ? String(code).toUpperCase() : 'Not specified');
    let departmentLabel = 'Not specified';
    const group = code ? (groups.find(g => g.degree_code === code) || null) : null;
    if (group && depId) {
      const dep = (group.departments || []).find(d => d.id === depId);
      if (dep) departmentLabel = dep.name;
    }
    setAlumnus(prev => prev ? { ...prev, degreeLabel, departmentLabel } : prev);
  }, [alumnus?.id, alumnus?.degree_code, alumnus?.department_id, degrees, groups, role]);

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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600 mb-4" aria-hidden="true"></div>
        <p className="text-slate-600">Loading alumni profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-red-500 text-5xl mb-4" aria-hidden="true">⚠️</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button 
          type="button"
          onClick={() => navigate('/directory')} 
          className="btn-ocean px-6 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
        >
          Back to Directory
        </button>
      </div>
    );
  }
  
  if (!alumnus) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-slate-500 text-5xl mb-4" aria-hidden="true">🔍</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Available</h2>
        <p className="text-slate-600 mb-6">The requested alumni profile could not be found.</p>
        <button 
          type="button"
          onClick={() => navigate('/directory')} 
          className="btn-ocean px-6 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Centered Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
        {/* Profile Picture */}
        <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full ring-1 ring-slate-200 bg-slate-100 flex items-center justify-center">
          <Avatar src={alumnus.avatar} alt={`${alumnus.name}'s profile picture`} size={96} version={alumnus.updated_at} />
        </div>
        {/* Basic Info */}
        <div className="flex-1 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">{alumnus.name}</h1>
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>
            <p className="text-slate-700 leading-relaxed">{alumnus.about || 'No biography provided.'}</p>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Experience</h2>
            <div className="space-y-6">
              {Array.isArray(alumnus.experience) && alumnus.experience.length > 0 ? (
                alumnus.experience.map((exp, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-ocean-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{exp.position}</h3>
                      <p className="text-ocean-600 font-medium">{exp.company}</p>
                      <p className="text-sm text-slate-600">{exp.duration} • {exp.location}</p>
                      <p className="text-slate-700 mt-2">{exp.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No experience information available.</p>
              )}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Education</h2>
            <div className="space-y-4">
              {Array.isArray(alumnus.education) && alumnus.education.length > 0 ? (
                alumnus.education.map((edu, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-slate-100 ring-1 ring-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AcademicCapIcon className="w-5 h-5 text-slate-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{edu.degree}</h3>
                      <p className="text-ocean-600 font-medium">{edu.institution}</p>
                      <p className="text-sm text-slate-600">{edu.year} • {edu.grade}</p>
                    </div>
                  </div>
                ))
              ) : (
                (alumnus.degreeLabel || alumnus.degree_code || alumnus.departmentLabel || alumnus.graduationYear) ? (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-slate-100 ring-1 ring-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AcademicCapIcon className="w-5 h-5 text-slate-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{alumnus.degreeLabel || (alumnus.degree_code ? String(alumnus.degree_code).toUpperCase() : 'Not specified')}</h3>
                      <p className="text-ocean-600 font-medium">{alumnus.departmentLabel || ''}</p>
                      <p className="text-sm text-slate-600">{alumnus.graduationYear ? `Batch ${alumnus.graduationYear}` : ''}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">No education information available.</p>
                )
              )}
            </div>
          </div>

          {/* Achievements */}
          {Array.isArray(alumnus.achievements) && alumnus.achievements.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Achievements</h2>
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">  
                <BriefcaseIcon className="w-6 h-6 mr-4 text-ocean-600" aria-hidden="true" />
                <div>
                  <div className="text-sm text-gray-500">Currently</div>
                  <div className="font-medium">{alumnus.currentPosition} at {alumnus.company}</div>
                </div>
              </div>

              <div className="flex items-center">
                <MapPinIcon className="w-6 h-6 mr-4 text-ocean-600" aria-hidden="true" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium">{alumnus.location}</div>
                </div>
              </div>

              {role !== 'student' && alumnus.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="w-6 h-6 mr-4 text-ocean-600" aria-hidden="true" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <a href={`mailto:${alumnus.email}`} className="font-medium text-ocean-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-1 rounded">
                      {alumnus.email}
                    </a>
                  </div>
                </div>
              )}

              {role !== 'student' && alumnus.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="w-6 h-6 mr-4 text-ocean-600" aria-hidden="true" />
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <a href={`tel:${alumnus.phone}`} className="font-medium text-ocean-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-1 rounded">
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Skills</h3>
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
                <p className="text-slate-500 text-sm">No skills listed.</p>
              )}
            </div>
          </div>

          {/* Social Links (hidden for students) */}
          {role !== 'student' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Social Links</h3>
              <div className="space-y-2">
                {alumnus.socialLinks && Object.values(alumnus.socialLinks).some(link => link) ? (
                  Object.entries(alumnus.socialLinks).map(([platform, url]) => (
                    url && (
                      <a 
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-ocean-600 hover:text-ocean-700 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-1 rounded"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </a>
                    )
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No social links provided.</p>
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