import React from 'react';
import { useParams, Link } from 'react-router-dom';
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
  
  // Mock detailed alumni data
  const alumnus = {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    graduationYear: 2018,
    degree: 'B.Tech Naval Architecture',
    specialization: 'Marine Engineering',
    currentPosition: 'Senior Marine Engineer',
    company: 'Ocean Shipping Ltd.',
    location: 'Mumbai, Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=300&fit=crop',
    verified: true,
    joinedDate: 'March 2018',
    about: 'Experienced marine engineer with 6+ years in the maritime industry. Passionate about sustainable shipping solutions and innovative vessel design. Currently leading engineering projects at Ocean Shipping Ltd. with a focus on reducing environmental impact through advanced propulsion systems.',
    experience: [
      {
        position: 'Senior Marine Engineer',
        company: 'Ocean Shipping Ltd.',
        duration: '2021 - Present',
        location: 'Mumbai, Maharashtra',
        description: 'Leading engineering teams in vessel design and maintenance projects. Implemented sustainable propulsion systems resulting in 15% fuel efficiency improvement.'
      },
      {
        position: 'Marine Engineer',
        company: 'Coastal Engineering Corp',
        duration: '2019 - 2021',
        location: 'Chennai, Tamil Nadu',
        description: 'Designed and maintained marine propulsion systems. Collaborated with international teams on offshore platform projects.'
      },
      {
        position: 'Junior Engineer',
        company: 'Maritime Solutions',
        duration: '2018 - 2019',
        location: 'Kochi, Kerala',
        description: 'Entry-level position focusing on vessel inspection and maintenance protocols. Gained expertise in marine safety regulations.'
      }
    ],
    education: [
      {
        degree: 'B.Tech Naval Architecture',
        institution: 'Academy of Maritime Education and Training (AMET)',
        year: '2014 - 2018',
        grade: 'First Class with Distinction',
        activities: ['Student Council President', 'Maritime Engineering Society', 'Research Assistant']
      }
    ],
    skills: [
      'Marine Engineering', 'Ship Design', 'Naval Architecture', 'Project Management', 
      'AutoCAD', 'SolidWorks', 'MATLAB', 'Sustainability', 'Leadership', 'Safety Protocols'
    ],
    achievements: [
      'Led the design of eco-friendly cargo vessel prototype',
      'Reduced fuel consumption by 15% through engine optimization',
      'Published 3 research papers on sustainable marine technology',
      'Mentored 25+ junior engineers across the industry',
      'Recipient of "Young Engineer of the Year" award (2022)'
    ],
    interests: ['Sustainable Shipping', 'Marine Technology', 'Environmental Conservation', 'Mentorship'],
    languages: ['English', 'Tamil', 'Hindi', 'Malayalam'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/rajeshkumar',
      website: 'https://rajeshkumar.dev',
      twitter: 'https://twitter.com/rajesh_marine'
    },
    connections: 245,
    mutualConnections: 12
  };

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
              {Object.entries(alumnus.socialLinks).map(([platform, url]) => (
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