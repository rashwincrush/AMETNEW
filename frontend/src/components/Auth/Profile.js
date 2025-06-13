import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CameraIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const Profile = ({ user }) => {
  const { updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(user.avatar || '/default-avatar.svg');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || 'John Doe',
    email: user.email || 'john.doe@amet.ac.in',
    phone: '+91 98765 43210',
    location: 'Chennai, Tamil Nadu',
    headline: 'Senior Marine Engineer at Ocean Shipping Ltd.',
    about: 'Experienced marine engineer with 8+ years in the maritime industry. Passionate about sustainable shipping solutions and mentor to junior engineers.',
    company: 'Ocean Shipping Ltd.',
    position: 'Senior Marine Engineer',
    experience: '8 years',
    graduationYear: '2016',
    degree: 'B.Tech Naval Architecture',
    specialization: 'Marine Engineering',
    skills: ['Marine Engineering', 'Ship Design', 'Project Management', 'Leadership', 'Sustainability'],
    achievements: [
      'Led the design of eco-friendly cargo vessel',
      'Reduced fuel consumption by 15% through engine optimization',
      'Mentored 25+ junior engineers'
    ],
    interests: ['Sustainable Shipping', 'Marine Technology', 'Environmental Conservation'],
    languages: ['English', 'Tamil', 'Hindi'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      github: '',
      twitter: '',
      website: ''
    }
  });

  // Effect to update form data when user prop changes
  useEffect(() => {
    setFormData({
      name: user.full_name || user.name || 'John Doe',
      email: user.email || 'john.doe@amet.ac.in',
      phone: user.phone || '+91 98765 43210',
      location: user.location || 'Chennai, Tamil Nadu',
      headline: user.headline || 'Senior Marine Engineer at Ocean Shipping Ltd.',
      about: user.about || 'Experienced marine engineer with 8+ years in the maritime industry.',
      company: user.company || 'Ocean Shipping Ltd.',
      position: user.position || 'Senior Marine Engineer',
      experience: user.experience || '8 years',
      graduationYear: user.graduationYear || '2016',
      degree: user.degree || 'B.Tech Naval Architecture',
      specialization: user.specialization || 'Marine Engineering',
      skills: user.skills || ['Marine Engineering', 'Ship Design', 'Project Management', 'Leadership'],
      achievements: user.achievements || [
        'Led the design of eco-friendly cargo vessel',
        'Reduced fuel consumption by 15% through engine optimization'
      ],
      interests: user.interests || ['Sustainable Shipping', 'Marine Technology', 'Environmental Conservation'],
      languages: user.languages || ['English', 'Tamil', 'Hindi'],
      socialLinks: user.socialLinks || {
        linkedin: 'https://linkedin.com/in/johndoe',
        github: '',
        twitter: '',
        website: ''
      }
    });
    setImageUrl(user.avatar || '/default-avatar.svg');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // ONLY include fields that are 100% confirmed to exist in the database schema
      // Based on server.py registration function and error message
      const profileUpdates = {
        first_name: formData.name.split(' ')[0],
        last_name: formData.name.split(' ').slice(1).join(' '),
        phone: formData.phone,
        updated_at: new Date().toISOString()
      };
      
      // Upload image if a new one was selected
      if (imageFile) {
        const { supabase } = await import('../../utils/supabase');
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw uploadError;
        }
        
        // Get the public URL but DO NOT add avatar field if it doesn't exist in database
        const { data: { publicUrl } } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        // Store the URL for frontend display, but don't include in profileUpdates
        setImageUrl(publicUrl);
        // DO NOT add avatar field to profileUpdates as it may not exist in the database schema
      }
      
      // Update profile in Supabase
      const updatedProfile = await updateProfile(profileUpdates);
      console.log('Profile updated successfully:', updatedProfile);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillsChange = (value) => {
    const skills = value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({ ...prev, skills }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <img 
                src={imageUrl} 
                alt={formData.name}
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.svg';
                }}
              />
              <label className="absolute bottom-0 right-0 bg-ocean-500 text-white p-2 rounded-full hover:bg-ocean-600 transition-colors cursor-pointer">
                <CameraIcon className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageFile(file);
                      setImageUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            
            {/* Basic Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{formData.name}</h1>
              <p className="text-ocean-600 font-medium">{formData.headline}</p>
              <div className="flex items-center text-gray-600 mt-2 space-x-4">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formData.location}</span>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formData.email}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="btn-ocean px-4 py-2 rounded-lg flex items-center"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Headline</label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                className="form-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., Senior Marine Engineer at Ocean Shipping Ltd."
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows={4}
                className="form-input w-full px-3 py-2 rounded-lg"
                placeholder="Tell us about yourself, your experience, and interests..."
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
              <input
                type="text"
                value={formData.skills.join(', ')}
                onChange={(e) => handleSkillsChange(e.target.value)}
                className="form-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., Marine Engineering, Ship Design, Project Management"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-ocean px-6 py-2 rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* About */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{formData.about}</p>
          </div>

          {/* Professional Information */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <BriefcaseIcon className="w-5 h-5 text-ocean-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{formData.position}</p>
                    <p className="text-sm text-gray-600">{formData.company}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <AcademicCapIcon className="w-5 h-5 text-ocean-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{formData.degree}</p>
                    <p className="text-sm text-gray-600">Graduated {formData.graduationYear}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Experience</p>
                  <p className="text-gray-700">{formData.experience}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Contact</p>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      {formData.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      {formData.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Achievements</h2>
            <ul className="space-y-2">
              {formData.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-ocean-500 mr-2">•</span>
                  <span className="text-gray-700">{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;