import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, updateProfile, getUserRole, fetchUserProfile } = useAuth();
  
  // Additional component loading state for transitional periods
  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const initialLoadComplete = useRef(false);
  
  // All useState hooks must be at the top level, before any conditional returns
  const [companyId, setCompanyId] = useState(null);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    industry: '',
    website_url: '',
    location: '',
    description: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState('/default-avatar.svg'); // Default value without user dependency
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    degree: '',
    department: '',
    batch: '',
    student_id: '',
    date_of_birth: '',
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

  // Define isEmployer constant
  const isEmployer = getUserRole() === 'employer';
  
  // Handle changes to company form fields
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to fetch company data for employer users
  const fetchCompanyData = async (userId) => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (error) {
        // It's okay if no company is found, just log other errors
        if (error.code !== 'PGRST116') { 
          console.error('Error fetching company data:', error);
        }
        return null;
      }
      return companies;
    } catch (error) {
      console.error('Error in fetchCompanyData:', error);
      return null;
    }
  };
  
  // Track authentication state changes to manage component loading
  useEffect(() => {
    console.log('Profile component auth state effect:', { loading, user, profile });
    
    // Only show loading on initial load, not on subsequent updates
    if (!initialLoadComplete.current) {
      // Set component as loading when auth is loading or when we have a user but no profile yet
      if (loading || (user && !profile)) {
        setIsComponentLoading(true);
        return;
      }
      
      // When auth is no longer loading and we have necessary data, finish loading
      setIsComponentLoading(false);
      initialLoadComplete.current = true;
    }
  }, [loading, user, profile]);
  
  // Update imageUrl when user/profile is available
  useEffect(() => {
    if (user && user.avatar) {
      setImageUrl(user.avatar);
    } else if (profile && profile.avatar_url) {
      setImageUrl(profile.avatar_url);
    }
  }, [user, profile]);
  
  // Helper functions to deeply clean "Not specified" values
  const cleanValue = (value) => {
    // Return empty string for any 'Not specified' value
    if (value === 'Not specified' || value === null || value === undefined) {
      return '';
    }
    return value;
  };
  
  // Recursively clean an object or array
  const deepClean = (obj) => {
    if (!obj) return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          return deepClean(item);
        }
        return cleanValue(item);
      });
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = deepClean(value);
        } else {
          cleaned[key] = cleanValue(value);
        }
      }
      return cleaned;
    }
    
    return cleanValue(obj);
  };
  
  // Check if a value should be displayed
  const hasValue = (value) => {
    if (value === undefined || value === null || value === '' || value === 'Not specified') {
      return false;
    }
    
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    
    return true;
  };

  // Initialize form with user data
  useEffect(() => {
    if (user && profile) {
      const initializeForm = async () => {
        setIsComponentLoading(true);
        try {
          // Deep clean the profile data first to remove all 'Not specified' values
          const cleanedProfile = deepClean(profile);
          let initialCompany = cleanedProfile.company || '';

          // Fetch and integrate company data if the user is an employer
          let companyFormDataClean = {};
          if (isEmployer) {
            const companyData = await fetchCompanyData(user.id);
            if (companyData) {
              // Clean company data
              companyFormDataClean = deepClean(companyData);
              setCompanyFormData(companyFormDataClean);
              setCompanyId(companyData.id);
              
              // Set the authoritative company name
              initialCompany = companyFormDataClean.name || initialCompany;
            }
          }

          console.log('Setting initial company name:', initialCompany);
          console.log('Cleaned profile data:', cleanedProfile);

          // Set the main form data with potentially updated company name
          const formDataInitial = {
            first_name: cleanedProfile.first_name || '',
            last_name: cleanedProfile.last_name || '',
            email: cleanedProfile.email || user.email || '',
            phone: cleanedProfile.phone || '',
            location: cleanedProfile.location || '',
            headline: cleanedProfile.headline || '',
            about: cleanedProfile.about || '',
            company: cleanedProfile.company_name || initialCompany, // Map to company_name from backend
            position: cleanedProfile.current_job_title || '', // Map to current_job_title from backend
            experience: cleanedProfile.experience || '',
            degree: cleanedProfile.degree_program || '', // Map to degree_program from backend
            department: cleanedProfile.department || '',
            graduation_year: cleanedProfile.graduation_year || '',
            student_id: cleanedProfile.student_id || '',
            date_of_birth: cleanedProfile.date_of_birth || '',
            skills: Array.isArray(cleanedProfile.skills) ? cleanedProfile.skills : [],
            achievements: Array.isArray(cleanedProfile.achievements) ? cleanedProfile.achievements.map(achievement => {
              if (typeof achievement === 'object' && achievement !== null) {
                return {
                  title: achievement.title || '',
                  description: achievement.description || ''
                };
              }
              return { title: String(achievement), description: '' };
            }) : [],
            interests: Array.isArray(cleanedProfile.interests) ? cleanedProfile.interests : [],
            languages: Array.isArray(cleanedProfile.languages) ? cleanedProfile.languages : [],
            socialLinks: cleanedProfile.social_links || { linkedin: '', github: '', twitter: '', website: '' }
          };
          
          console.log('Final form data being set:', formDataInitial);
          setFormData(formDataInitial);

        } catch (error) {
          console.error('Error in profile initialization:', error);
          toast.error('Failed to initialize profile data');
        } finally {
          setIsComponentLoading(false);
        }
      };

      initializeForm();
    }
  }, [user, profile, isEmployer]);

  // Add conditional rendering AFTER all hooks are defined
  if (isComponentLoading || loading) {
    return (
      <div className="text-center p-8 mt-12">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ocean-600 mb-4"></div>
          <p className="text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center p-8">Profile not found.</div>;
  }

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
        current_job_title: formData.position, // Map to backend field
        about: formData.about,
        company_name: formData.company, // Map to backend field
        headline: formData.headline,
        experience: formData.experience,
        degree_program: formData.degree, // Map to backend field
        department: formData.department,
        graduation_year: formData.graduation_year,
        student_id: formData.student_id,
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
          // Use the upload function directly without a race condition
          const publicUrl = await uploadAvatar(imageFile);

          console.log('Avatar uploaded successfully:', publicUrl);
          profileUpdates.avatar_url = publicUrl;
          setImageUrl(publicUrl);
        } catch (error) {
          console.error('Profile picture upload failed:', error);
          toast.error(error.message || 'Failed to upload profile picture');
          // Don't throw the error - let the profile save even if avatar upload fails
          // This way the form submission won't be blocked by avatar issues
        }
      }

      // Remove is_profile_complete as it's a generated column in the database
      // This avoids the error: column "is_profile_complete" can only be updated to DEFAULT
      delete profileUpdates.is_profile_complete;

      console.log('Updating profile in database with:', JSON.stringify(profileUpdates));
      // Removed Promise.race to ensure the update completes
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database update');
      }

      console.log('Profile updated in database:', data);

      if (isEmployer && companyId) {
        const { error: companyUpdateError } = await supabase
          .from('companies')
          .update(companyFormData)
          .eq('id', companyId);

        if (companyUpdateError) throw new Error(`Failed to update company: ${companyUpdateError.message}`);
      }

      console.log('Updating auth context...');
      try {
        console.log('Calling updateProfile with:', profileUpdates);
        // Don't race this with a timeout - let it complete normally
        const updatedProfile = await updateProfile(profileUpdates);
        console.log('Auth context updated successfully', updatedProfile);
        
        // Apply the updated data to the form
        if (updatedProfile) {
          const mappedData = {
            ...formData,
            // Map backend field names to form field names
            first_name: updatedProfile.first_name || formData.first_name,
            last_name: updatedProfile.last_name || formData.last_name,
            phone: updatedProfile.phone || formData.phone,
            location: updatedProfile.location || formData.location,
            position: updatedProfile.current_job_title || formData.position,
            about: updatedProfile.about || formData.about,
            company: updatedProfile.company_name || formData.company,
            headline: updatedProfile.headline || formData.headline,
            experience: updatedProfile.experience || formData.experience,
            degree: updatedProfile.degree_program || formData.degree,
            department: updatedProfile.department || formData.department,
            batch: updatedProfile.batch || formData.batch,
            student_id: updatedProfile.student_id || formData.student_id,
            date_of_birth: updatedProfile.date_of_birth || formData.date_of_birth,
            skills: updatedProfile.skills || formData.skills,
            achievements: updatedProfile.achievements || formData.achievements,
            interests: updatedProfile.interests || formData.interests,
            languages: updatedProfile.languages || formData.languages,
            socialLinks: updatedProfile.social_links || formData.socialLinks,
          };
          setFormData(mappedData);
        }
      } catch (updateError) {
        console.error('Error updating auth context (non-critical):', updateError);
        // Continue even if auth context update fails - the database update was successful
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      if (isEmployer) {
        navigate('/jobs');
      }
      console.log('Form submission completed successfully');
      // Force refresh of profile data from server
      if (fetchUserProfile) {
        await fetchUserProfile(user.id);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(
        error.message && error.message.includes('timed out')
          ? 'Request timed out. Please try again.'
          : `Failed to update profile: ${error.message || 'Unknown error'}`
      );
    } finally {
      clearTimeout(timeoutId);
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
      
      // Reset image file state to prevent duplicate uploads
      setImageFile(null);
      
      // Force UI refresh
      setTimeout(() => {
        setFormData(prev => ({...prev}));
      }, 100);
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
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const uploadAvatar = async (file) => {
    if (!file) {
      throw new Error('No file provided for avatar upload.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${new Date().getTime()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log(`Uploading to: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Error during avatar upload:', uploadError);
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    console.log('Upload successful, getting public URL...');

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      console.error('Could not get public URL for avatar.');
      throw new Error('Could not get public URL for avatar.');
    }

    console.log('Public URL received:', data.publicUrl);
    return data.publicUrl;
  };

  // Main render logic
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Profile Settings</h1>
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
              {/* Contact information removed from here to avoid duplication */}
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
                  value={formData.first_name || ''}
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
                  value={formData.last_name || ''}
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
                  value={formData.email || ''}
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
                  value={formData.phone || ''}
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
                  value={formData.location || ''}
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
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                value={formData.graduation_year || ''}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                placeholder="Enter your graduation year (e.g. 2020)"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <input
                type="text"
                name="degree"
                value={formData.degree || ''}
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
                value={formData.department || ''}
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
                value={formData.student_id || ''}
                onChange={handleChange}
                className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                placeholder="Enter your student ID for verification (optional)"
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">About Me</label>
              <textarea
                name="about"
                value={formData.about || ''}
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
                  value={formData.company || ''}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position || ''}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience || ''}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="e.g., 10+ years in marine engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Professional Headline</label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline || ''}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  placeholder="e.g., Senior Marine Engineer at Ocean Shipping Ltd."
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
                  value={formData.socialLinks?.linkedin || ''}
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
                  value={formData.socialLinks?.github || ''}
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
                  value={formData.socialLinks?.twitter || ''}
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
                  value={formData.socialLinks?.website || ''}
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
        <div className="space-y-6">
          {/* About Section */}
          {hasValue(formData.about) && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{formData.about}</p>
            </div>
          )}

          {/* Professional Information */}
          {(hasValue(formData.position) || hasValue(formData.company) || hasValue(formData.degree) || hasValue(formData.experience)) && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {hasValue(formData.position) && (
                    <div className="flex items-start">
                      <BriefcaseIcon className="w-5 h-5 text-ocean-500 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{formData.position}</p>
                        {hasValue(formData.company) && (
                          <p className="text-sm text-gray-600">{formData.company}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {hasValue(formData.degree) && (
                    <div className="flex items-start">
                      <AcademicCapIcon className="w-5 h-5 text-ocean-500 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{formData.degree}</p>
                        {hasValue(formData.department) && (
                          <p className="text-sm text-gray-600">{formData.department}</p>
                        )}
                        {hasValue(formData.batch) && (
                          <p className="text-sm text-gray-600">{`Batch of ${formData.batch}`}</p>
                        )}
                        {hasValue(formData.student_id) && (
                          <p className="text-sm text-gray-600">Student ID: {formData.student_id}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {hasValue(formData.experience) && (
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Experience</p>
                      <p className="text-gray-700">{formData.experience}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {(hasValue(formData.email) || hasValue(formData.phone) || hasValue(formData.location) || hasValue(formData.date_of_birth)) && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Contact Information</p>
                      <div className="space-y-2">
                        {hasValue(formData.email) && (
                          <div className="flex items-center text-gray-600">
                            <EnvelopeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{formData.email}</span>
                          </div>
                        )}
                        {hasValue(formData.phone) && (
                          <div className="flex items-center text-gray-600">
                            <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{formData.phone}</span>
                          </div>
                        )}
                        {hasValue(formData.location) && (
                          <div className="flex items-center text-gray-600">
                            <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{formData.location}</span>
                          </div>
                        )}
                        {hasValue(formData.date_of_birth) && (
                          <div className="flex items-center text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <span>{new Date(formData.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Skills & Achievements */}
          {(hasValue(formData.skills) || hasValue(formData.achievements)) && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills & Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hasValue(formData.skills) && formData.skills.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {hasValue(formData.achievements) && formData.achievements.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Achievements</h3>
                    <div className="space-y-3">
                      {formData.achievements.map((achievement, index) => (
                        <div key={index} className="border-l-4 border-ocean-500 pl-3">
                          <h4 className="font-medium">{achievement.title || ''}</h4>
                          <p className="text-sm text-gray-700">{achievement.description || ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links Section */}
          {hasValue(formData.socialLinks) && Object.values(formData.socialLinks).some(link => hasValue(link)) && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.socialLinks).map(([platform, url]) => (
                  hasValue(url) && (
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
          )}
          
          {/* Resume Management */}
          <ProfileResume />
        </div>
      )}
    </div>
  );
};

export default Profile;