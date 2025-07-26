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
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ProfileResume from './ProfileResume';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const Profile = ({ user }) => {
  const { updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(user.avatar || '/default-avatar.svg');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    about: '',
    company: '',
    position: '',
    experience: '',
    batch: '',
    degree: '',
    department: '',
    skills: [],
    achievements: [],
    interests: [],
    languages: [],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      website: ''
    }
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      const initializeForm = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          setFormData({
            first_name: profile.first_name || user.user_metadata?.first_name || '',
            last_name: profile.last_name || user.user_metadata?.last_name || '',
            email: profile.email || user.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            headline: profile.headline || '',
            about: profile.about || '',
            company: profile.company || '',
            position: profile.job_title || '',
            experience: profile.experience || '',
            batch: profile.batch || '',
            degree: profile.degree || '',
            department: profile.department || '',
            date_of_birth: profile.date_of_birth || '',
            skills: profile.skills || [],
            achievements: profile.achievements || [],
            interests: profile.interests || [],
            languages: profile.languages || [],
            socialLinks: profile.social_links || {
              linkedin: '',
              github: '',
              twitter: '',
              website: ''
            }
          });
          
          setImageUrl(profile.avatar_url || '/default-avatar.svg');
        } catch (err) {
          console.error('Error initializing profile:', err);
          toast.error('Failed to load profile data');
        }
      };

      initializeForm();
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      // First, try to delete any existing avatar for this user
      const { data: existingFiles } = await supabase
        .storage
        .from('avatars')
        .list('', {
          search: `${user.id}-`,
        });
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map(x => x.name);
        await supabase.storage
          .from('avatars')
          .remove(filesToRemove);
      }
      
      // Upload the new file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
        
      if (uploadError) throw uploadError;
      
      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add a timestamp to the URL to bypass browser cache
      const cacheBustedUrl = `${publicUrl}?t=${new Date().getTime()}`;
      setImageUrl(cacheBustedUrl);

      return publicUrl; // Return the original URL for the database
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new Error('Failed to upload profile picture');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    console.log('Starting form submission...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('Request timed out');
    }, 15000); // 15 second timeout

    setIsSubmitting(true);

    try {
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current profile:', fetchError);
        throw new Error('Failed to load profile data');
      }

      const possibleFields = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        location: formData.location,
        job_title: formData.position,
        about: formData.about,
        company: formData.company,
        headline: formData.headline,
        experience: formData.experience,
        batch: formData.batch,
        degree: formData.degree,
        department: formData.department,
        date_of_birth: formData.date_of_birth,
        skills: formData.skills,
        achievements: formData.achievements,
        interests: formData.interests,
        languages: formData.languages,
        social_links: formData.socialLinks,
      };

      const profileUpdates = { updated_at: new Date().toISOString() };

      Object.entries(possibleFields).forEach(([key, value]) => {
        if ((currentProfile && key in currentProfile) || value !== undefined) {
          profileUpdates[key] = value;
        }
      });

      // Handle empty date string before sending to Supabase
    if (profileUpdates.date_of_birth === '') {
      profileUpdates.date_of_birth = null;
    }

    if (formData.socialLinks) {
        profileUpdates.social_links = formData.socialLinks;
      } else if (currentProfile?.social_links) {
        profileUpdates.social_links = currentProfile.social_links;
      }

      if (imageFile) {
        console.log('Uploading new avatar...');
        try {
          const publicUrl = await Promise.race([
            uploadAvatar(imageFile),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Avatar upload timed out')), 10000)
            ),
          ]);

          console.log('Avatar uploaded successfully:', publicUrl);
          profileUpdates.avatar_url = publicUrl;
          setImageUrl(publicUrl);
        } catch (error) {
          console.error('Profile picture upload failed:', error);
          toast.error(error.message || 'Failed to upload profile picture');
          throw error;
        }
      }

      console.log('Updating profile in database...');
      const { data, error } = await Promise.race([
        supabase.from('profiles').update(profileUpdates).eq('id', user.id).select().single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database update timed out')), 10000)
        ),
      ]);

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database update');
      }

      console.log('Profile updated in database:', data);

      console.log('Updating auth context...');
      try {
        await Promise.race([
          updateProfile(profileUpdates),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth context update timed out')), 5000)
          ),
        ]);
        console.log('Auth context updated successfully');
      } catch (updateError) {
        console.error('Error updating auth context (non-critical):', updateError);
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      console.log('Form submission completed successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(
        error.message.includes('timed out')
          ? 'Request timed out. Please try again.'
          : `Failed to update profile: ${error.message || 'Unknown error'}`
      );
    } finally {
      clearTimeout(timeoutId);
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested socialLinks object
    if (name.startsWith('socialLinks.')) {
      const [_, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [field]: value
        }
      }));
    } 
    // Handle array fields
        else if (['skills', 'interests', 'languages'].includes(name)) {
      const items = value.split(',').map(item => item.trim()).filter(item => item);
      setFormData(prev => ({ ...prev, [name]: items }));
    } 
    // Handle all other fields
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

    const handleAddAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...(prev.achievements || []), { title: '', description: '' }]
    }));
  };

    const handleAchievementChange = (index, field, value) => {
    setFormData(prev => {
      const newAchievements = [...prev.achievements];
      newAchievements[index] = { ...newAchievements[index], [field]: value };
      return { ...prev, achievements: newAchievements };
    });
  };

  const handleRemoveAchievement = (index) => {
    setFormData(prev => {
      const newAchievements = [...prev.achievements];
      newAchievements.splice(index, 1);
      return { ...prev, achievements: newAchievements };
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
      </div>
      
      {/* Profile Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img 
                src={imageUrl} 
                alt={formData.name}
                className="w-32 h-32 rounded-full object-cover border-2 border-white shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.svg';
                }}
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-ocean-500 text-white p-2 rounded-full hover:bg-ocean-600 transition-colors cursor-pointer shadow-md">
                  <CameraIcon className="w-4 h-4" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg, image/png, image/gif, image/webp"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{formData.first_name} {formData.last_name}</h1>
              <p className="text-ocean-600 font-medium">{formData.headline}</p>
              <div className="flex items-center text-gray-600 mt-2 space-x-4">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formData.location || 'Not specified'}</span>
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
            className="btn-ocean px-4 py-2 rounded-lg flex items-center transition-all hover:scale-105"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Professional Headline</label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                placeholder="e.g., Senior Marine Engineer at Ocean Shipping Ltd."
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">About Me</label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows={4}
                className="form-textarea w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                placeholder="Tell us about yourself, your experience, and interests..."
              />
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="e.g., 10+ years in marine engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Batch</label>
                <input
                  type="number"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Degree</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="e.g., B.E. in Marine Engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="e.g., Ship Design and Construction"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Student ID <span className="text-xs text-gray-500">(optional)</span></label>
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="Enter your student ID for verification (optional)"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills.join(', ')}
                onChange={handleChange}
                className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                placeholder="e.g., Marine Engineering, Ship Design, Project Management"
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Achievements</label>
              <div className="space-y-3">
                {formData.achievements && formData.achievements.map((achievement, index) => (
                  <div key={index} className="p-3 border rounded-md bg-gray-50 relative space-y-2">
                    <input
                      type="text"
                      placeholder="Achievement Title (e.g., Employee of the Month)"
                      className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                      value={achievement.title || ''}
                      onChange={(e) => handleAchievementChange(index, 'title', e.target.value)}
                    />
                    <textarea
                      placeholder="Description (optional)"
                      rows={2}
                      className="form-textarea w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                      value={achievement.description || ''}
                      onChange={(e) => handleAchievementChange(index, 'description', e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => handleRemoveAchievement(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full bg-white"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={handleAddAchievement}
                className="mt-2 text-sm font-medium text-ocean-600 hover:text-ocean-800"
              >
                + Add Achievement
              </button>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Social Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                <input
                  type="url"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">GitHub</label>
                <input
                  type="url"
                  name="socialLinks.github"
                  value={formData.socialLinks.github}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="https://github.com/yourname"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Twitter/X</label>
                <input
                  type="url"
                  name="socialLinks.twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="https://twitter.com/yourname"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Personal Website</label>
                <input
                  type="url"
                  name="socialLinks.website"
                  value={formData.socialLinks.website}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-ocean px-6 py-2 rounded-lg disabled:opacity-70 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* About Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">View and manage your personal information</p>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="btn-primary-outline flex items-center"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Edit Profile
            </button>
          </div>

          {/* About Section */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">
              {formData.about || 'No information provided yet.'}
            </p>
          </div>

          {/* Professional Information */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <BriefcaseIcon className="w-5 h-5 text-ocean-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{formData.position || 'Not specified'}</p>
                    <p className="text-sm text-gray-600">{formData.company || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AcademicCapIcon className="w-5 h-5 text-ocean-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{formData.degree || 'Not specified'}</p>
                    <p className="text-sm text-gray-600">
                      {formData.batch ? `Year of Completion : ${formData.batch}` : 'Graduation year not specified'}
                    </p>
                    <p className="text-sm text-gray-600">{formData.department}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Experience</p>
                  <p className="text-gray-700">{formData.experience || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Contact Information</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{formData.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{formData.phone || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{formData.location || 'Not specified'}</span>
                    </div>
                    {formData.date_of_birth && (
                      <div className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>{new Date(formData.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {formData.skills.length > 0 ? (
                formData.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Achievements Section */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Achievements</h2>
            <ul className="space-y-3">
              {formData.achievements.length > 0 ? (
                formData.achievements.map((achievement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-ocean-500 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{achievement}</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 italic">No achievements added yet</p>
              )}
            </ul>
          </div>
          
          {/* Social Links Section */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.socialLinks).map(([platform, url]) => (
                url && (
                  <div key={platform} className="flex items-center">
                    <span className="capitalize font-medium text-gray-700 w-24">{platform}:</span>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ocean-600 hover:underline truncate"
                    >
                      {url}
                    </a>
                  </div>
                )
              ))}
            </div>
          </div>
          
          {/* Resume Management */}
          <ProfileResume />
        </div>
      )}
    </div>
  );
};

export default Profile;