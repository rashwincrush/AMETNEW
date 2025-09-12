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
import { loadProfileSocialLinks, saveProfileSocialLinks } from '../../services/socialLinks.js';
import { validateLinkedIn, validateGitHub, validateX, validateWebsite, findDuplicateProvider } from '../../services/socialLinks.validation';
import DegreeComboBox, { FALLBACK_CODES as DEGREE_FALLBACK_CODES } from '../forms/DegreeComboBox';
import DepartmentInput, { isValidDepartment } from '../forms/DepartmentInput';

// Normalize phone to E.164 or null to satisfy DB constraint chk_phone_e164
const normalizePhone = (raw) => {
  const input = (raw ?? '').trim();
  if (!input) return null; // empty -> NULL passes CHECK
  const hasPlus = input.startsWith('+');
  const digits = input.replace(/[^0-9]/g, '');
  const normalized = hasPlus ? `+${digits}` : digits;
  const isValid = /^\+?\d{7,15}$/.test(normalized);
  return isValid ? normalized : { error: 'Please enter a valid phone in international format (E.164), e.g. +14155552671 or 9876543210 (7-15 digits).' };
};

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
  const initialFormRef = useRef(null);
  // Strict degree enforcement
  const [allowedDegreeCodes, setAllowedDegreeCodes] = useState(null);
  const degreeInputRef = useRef(null);
  const [skillInput, setSkillInput] = useState('');
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

  // Track validation errors for form fields
  const [validationErrors, setValidationErrors] = useState({});

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
      if (loading) {
        setIsComponentLoading(true);
        return;
      }
      // Finalize initial load even if profile is null so we render the empty state
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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.first_name) {
      errors.first_name = 'First name is required';
    }
    
    if (!formData.last_name) {
      errors.last_name = 'Last name is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Validate achievements if any exist
    if (Array.isArray(formData.achievements)) {
      // Filter out empty achievements
      const validAchievements = formData.achievements.filter(achievement => 
        achievement && typeof achievement === 'object' && achievement.title && achievement.title.trim() !== ''
      );
      
      // Replace achievements array with only valid ones
      formData.achievements = validAchievements;
    } else {
      // Ensure achievements is an array
      formData.achievements = [];
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
              // Handle null or undefined achievement
              if (achievement === null || achievement === undefined) {
                return { title: '', description: '' };
              }
              
              // Handle achievement as object
              if (typeof achievement === 'object' && achievement !== null) {
                return {
                  title: achievement.title || '',
                  description: achievement.description || ''
                };
              } 
              
              // Handle achievement as string (possibly JSON)
              if (typeof achievement === 'string') {
                if (achievement.trim() === '') {
                  return { title: '', description: '' };
                }
                
                try {
                  // Try to parse if it's a JSON string
                  const parsed = JSON.parse(achievement);
                  if (parsed && typeof parsed === 'object') {
                    return {
                      title: parsed.title || '',
                      description: parsed.description || ''
                    };
                  }
                } catch (e) {
                  // If not valid JSON, use as title
                  return { title: achievement, description: '' };
                }
              }
              
              // Default fallback for any other type
              return { title: String(achievement || ''), description: '' };
            }) : [],
            interests: Array.isArray(cleanedProfile.interests) ? cleanedProfile.interests : [],
            languages: Array.isArray(cleanedProfile.languages) ? cleanedProfile.languages : [],
            // Load social links from dedicated table/view
            socialLinks: (() => {
              // placeholder; will be replaced below after async load
              return { linkedin: '', github: '', twitter: '', website: '' };
            })()
          };
          // Replace social links by fetching from view/table
          try {
            const links = await loadProfileSocialLinks(user.id);
            formDataInitial.socialLinks = {
              linkedin: links.linkedin || '',
              github: links.github || '',
              // UI uses 'twitter' field; map X -> twitter
              twitter: links.x || '',
              website: links.website || '',
            };
          } catch (e) {
            console.warn('Failed to load social links (non-fatal):', e);
          }
          
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

  // Track initial snapshot when entering edit mode and guard before unload
  useEffect(() => {
    if (isEditing) {
      // Snapshot current form data to compare for unsaved changes
      initialFormRef.current = formData;
    }
  }, [isEditing]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      try {
        const hasInitial = !!initialFormRef.current;
        const hasUnsaved = hasInitial && JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
        if (isEditing && hasUnsaved) {
          e.preventDefault();
          e.returnValue = '';
          return '';
        }
      } catch (_) {
        // no-op
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, formData]);

  // Intercept in-app navigations (anchor clicks and browser back) when there are unsaved changes
  useEffect(() => {
    const hasUnsaved = () => {
      try {
        const hasInitial = !!initialFormRef.current;
        return isEditing && hasInitial && JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
      } catch {
        return false;
      }
    };

    const onDocumentClick = (e) => {
      if (!hasUnsaved()) return;
      // Find closest anchor
      const anchor = e.target && typeof e.target.closest === 'function' ? e.target.closest('a') : null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return;
      // Same-origin or internal route
      if (href.startsWith('/') || href.startsWith(window.location.origin)) {
        const confirmLeave = window.confirm('You have unsaved changes. Leave this page?');
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const onPopState = () => {
      if (!hasUnsaved()) return;
      const confirmLeave = window.confirm('You have unsaved changes. Leave this page?');
      if (!confirmLeave) {
        // push current URL back to effectively cancel the back navigation
        window.history.pushState(null, '', window.location.href);
      }
    };

    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, [isEditing, formData]);

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
    // Block save if social link validation errors exist
    const socialErrors = Object.keys(validationErrors || {}).filter(k => k.startsWith('socialLinks.'));
    if (socialErrors.length > 0) {
      toast.error('Please fix social link URLs before saving');
      return;
    }

    console.log('Starting form submission...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('Request timed out');
    }, 15000); // 15 second timeout

    setIsSubmitting(true);

    try {
      // Normalize phone to E.164 or null to satisfy DB constraint chk_phone_e164
      const normalizePhone = (raw) => {
        const input = (raw ?? '').trim();
        if (!input) return null; // empty -> NULL passes CHECK
        const hasPlus = input.startsWith('+');
        const digits = input.replace(/[^0-9]/g, '');
        const normalized = hasPlus ? `+${digits}` : digits;
        const isValid = /^\+?\d{7,15}$/.test(normalized);
        return isValid ? normalized : { error: 'Please enter a valid phone in international format (E.164), e.g. +14155552671 or 9876543210 (7-15 digits).' };
      };

      const phoneNorm = normalizePhone(formData.phone);
      if (phoneNorm && typeof phoneNorm === 'object' && phoneNorm.error) {
        toast.error(phoneNorm.error);
        setIsSubmitting(false);
        return;
      }

      // ---- Phone uniqueness pre-check (avoid 409) ----
      if (phoneNorm) {
        const { data: existing, error: phoneErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phoneNorm)
          .neq('id', user.id)
          .maybeSingle();

        if (phoneErr) {
          toast.error('Could not validate phone uniqueness. Please try again.');
          setIsSubmitting(false);
          return;
        }
        if (existing) {
          toast.error('This phone number is already registered to another account.');
          setIsSubmitting(false);
          return;
        }
      }

      // Strict degree: only allow canonical codes in degree_programs
      const codes = Array.isArray(allowedDegreeCodes) && allowedDegreeCodes.length
        ? allowedDegreeCodes
        : ['BBA','BCA','BE','BSC','BTECH','MBA','MCA','ME','MSC','MTECH','PHD'];
      const degreeRaw = (formData.degree || '').trim().toUpperCase();
      const degreeCode = degreeRaw === '' ? null : (codes.includes(degreeRaw) ? degreeRaw : { error: true });
      if (degreeCode && typeof degreeCode === 'object' && degreeCode.error) {
        const listText = 'BE, BTECH, BSC, ME, MCA, MSC, MTECH, MBA, BBA, BCA, PHD';
        toast.error(`Please pick a valid degree. Allowed: ${listText}.`);
        degreeInputRef.current?.focus?.();
        setIsSubmitting(false);
        return;
      }

      // Required field checks
      const missing = [];
      if (!formData.location || !String(formData.location).trim()) missing.push('Location');
      if (!formData.company || !String(formData.company).trim()) missing.push('Company');
      if (!formData.position || !String(formData.position).trim()) missing.push('Position');
      if (degreeCode === null) missing.push('Degree');
      if (!isValidDepartment(formData.department)) missing.push('Department');
      if (missing.length) {
        toast.error(`Please fill: ${missing.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Debug logging for QA
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Profile] Degree validation', {
          allowedCount: codes.length,
          chosen: degreeCode,
        });
      }

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
        phone: phoneNorm, // normalized to E.164 or null
        location: formData.location,
        current_job_title: formData.position, // Map to backend field
        about: formData.about,
        company_name: formData.company, // Map to backend field
        headline: formData.headline,
        experience: formData.experience,
        degree_program: degreeCode, // strict code or null
        department: formData.department,
        graduation_year: formData.graduation_year,
        student_id: formData.student_id,
        date_of_birth: formData.date_of_birth,
        skills: formData.skills,
        achievements: Array.isArray(formData.achievements) ? formData.achievements.filter(a => a && typeof a === 'object' && a.title) : [],
        interests: formData.interests,
        languages: formData.languages,
      };

      const profileUpdates = { updated_at: new Date().toISOString() };

      Object.entries(possibleFields).forEach(([key, value]) => {
        if ((currentProfile && key in currentProfile) || value !== undefined) {
          // Handle empty strings for integer fields
          if (key === 'graduation_year' && (value === '' || value === undefined)) {
            profileUpdates[key] = null;
          } else {
            profileUpdates[key] = value;
          }
        }
      });

      // Handle empty strings for fields that need to be null in the database
    ['date_of_birth', 'graduation_year', 'student_id'].forEach(field => {
      if (profileUpdates[field] === '') {
        profileUpdates[field] = null;
      }
    });

    // Ensure degree_program is NULL when Degree field is empty (avoids CHECK constraint violations)
    if (profileUpdates.degree_program === '' || profileUpdates.degree_program === undefined) {
      profileUpdates.degree_program = null;
    }
    
    // Convert graduation_year to integer if it exists and is not null
    if (profileUpdates.graduation_year !== null && profileUpdates.graduation_year !== undefined) {
      const yearValue = parseInt(profileUpdates.graduation_year, 10);
      profileUpdates.graduation_year = isNaN(yearValue) ? null : yearValue;
    }

    // Do not write JSON social_links back to profiles; managed via table

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

      // Save social links to dedicated table (view-managed elsewhere)
      try {
        await saveProfileSocialLinks(user.id, {
          linkedin: formData.socialLinks?.linkedin || null,
          github: formData.socialLinks?.github || null,
          x: formData.socialLinks?.twitter || null,
          website: formData.socialLinks?.website || null,
        });
      } catch (e) {
        console.error('Saving social links failed:', e);
        toast.error('Failed to update social links');
      }

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
            // Keep UI social links from form (table-managed)
            socialLinks: formData.socialLinks,
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
    
    // Handle nested socialLinks object and validate for duplicate URLs
    if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      let trimmedValue = value.trim();
      let validationError = null;
      
      // If URL is not empty, validate and check for duplicates
      if (trimmedValue !== '') {
        // Ensure http(s) prefix
        if (!/^https?:\/\//i.test(trimmedValue)) {
          trimmedValue = 'https://' + trimmedValue;
        }
        // Use shared validators
        const validators = {
          linkedin: validateLinkedIn,
          github: validateGitHub,
          twitter: validateX, // UI field 'twitter' maps to X
          website: validateWebsite,
        };
        const fn = validators[field];
        if (!fn) {
          validationError = null;
        } else if (!fn(trimmedValue)) {
          if (field === 'linkedin') validationError = 'Invalid LinkedIn URL. Use https://www.linkedin.com/(in|pub|company|school)/...';
          else if (field === 'github') validationError = 'Use a valid GitHub profile URL (e.g., https://github.com/username)';
          else if (field === 'twitter') validationError = 'Use https://twitter.com/handle or https://x.com/handle';
          else if (field === 'website') validationError = 'Website must start with http:// or https://';
        }
        
        // Check if same URL is used in other fields
        if (!validationError) {
          const prospective = {
            ...(formData.socialLinks || {}),
            [field]: trimmedValue,
          };
          const dup = findDuplicateProvider(prospective);
          if (dup) {
            validationError = `This URL is already used for your ${dup.fields.find(f => f !== field)}`;
          }
        }
      }
      
      // Update validation errors
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (validationError) {
          newErrors[name] = validationError;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
      
      // Update form data with potentially modified URL
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [field]: trimmedValue
        }
      }));
    }
    // Handle array fields that need to be split (comma-separated values)
    else if (['skills', 'interests', 'languages'].includes(name)) {
      const items = value.split(/[\s,]+/).map(item => item.trim()).filter(item => item);
      setFormData(prev => ({ ...prev, [name]: items }));
    } 
    // Handle all other fields
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Skills tokenizer handlers
  const addSkill = (val) => {
    const v = (val || '').trim();
    if (!v) return;
    setFormData(prev => ({
      ...prev,
      skills: Array.from(new Set([...(prev.skills || []), v]))
    }));
    setSkillInput('');
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
    // Support backspace to delete last chip when input empty
    if (e.key === 'Backspace' && !skillInput && Array.isArray(formData.skills) && formData.skills.length) {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.slice(0, -1)
      }));
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s !== skill)
    }));
  };

    const handleAddAchievement = () => {
    setFormData(prev => {
      // Ensure achievements array exists
      const currentAchievements = Array.isArray(prev.achievements) ? prev.achievements : [];
      return {
        ...prev,
        achievements: [...currentAchievements, { title: '', description: '' }]
      };
    });
  };

    const handleAchievementChange = (index, field, value) => {
    setFormData(prev => {
      // Ensure achievements array exists
      const currentAchievements = Array.isArray(prev.achievements) ? [...prev.achievements] : [];
      
      // Ensure the achievement at this index exists
      if (!currentAchievements[index]) {
        currentAchievements[index] = { title: '', description: '' };
      }
      
      // Update the field
      currentAchievements[index] = { 
        ...currentAchievements[index], 
        [field]: value 
      };
      
      return { ...prev, achievements: currentAchievements };
    });
  };

  const handleRemoveAchievement = (index) => {
    setFormData(prev => {
      // Ensure achievements array exists
      const currentAchievements = Array.isArray(prev.achievements) ? [...prev.achievements] : [];
      
      return {
        ...prev,
        achievements: currentAchievements.filter((_, i) => i !== index)
      };
    });
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
  // Compute approval status badge styles
  const approvalStatus = profile?.approval_status || profile?.alumni_verification_status || (profile?.is_approved ? 'approved' : undefined);
  const statusLabel = approvalStatus ? (approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)) : null;
  const statusColor = approvalStatus === 'approved'
    ? 'bg-green-100 text-green-800'
    : approvalStatus === 'rejected'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';

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
              {statusLabel && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
              )}
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
                  onBlur={(e) => setFormData(prev => ({ ...prev, phone: (normalizePhone(e.target.value) || '') }))}
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
                onChange={(e) => {
                  // Handle empty string specifically for number inputs
                  const val = e.target.value;
                  const fieldName = e.target.name;
                  setFormData(prev => ({
                    ...prev,
                    [fieldName]: val === '' ? '' : val
                  }));
                }}
                min="1900"
                max={new Date().getFullYear()}
                className="form-input w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                placeholder="Enter your graduation year (e.g. 2020)"
              />
            </div>
            <div className="space-y-2">
              <DegreeComboBox
                label="Degree"
                value={formData.degree || ''}
                onChange={(code) => setFormData(prev => ({ ...prev, degree: code || '' }))}
                placeholder="Select your degree"
                onCodesLoaded={(codes) => setAllowedDegreeCodes(codes)}
                ref={degreeInputRef}
                required
              />
            </div>
            <div className="space-y-2">
              <DepartmentInput
                value={formData.department || ''}
                onChange={(v) => setFormData(prev => ({ ...prev, department: v }))}
                required
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
              <label className="block text-sm font-medium text-gray-700">Skills</label>
              <div className="w-full px-3 py-2 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-ocean-500">
                <div className="flex flex-wrap gap-2">
                  {(formData.skills || []).map((skill, idx) => (
                    <span key={`${skill}-${idx}`} className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {skill}
                      <button type="button" className="ml-1 text-blue-600 hover:text-blue-800" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="flex-1 min-w-[160px] outline-none text-sm"
                    placeholder="Type a skill and press Enter"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Achievements</label>
              <div className="space-y-3">
                {Array.isArray(formData.achievements) && formData.achievements.map((achievement, index) => (
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
                {validationErrors['socialLinks.linkedin'] ? (
                  <p className="text-red-500 text-xs mt-1">{validationErrors['socialLinks.linkedin']}</p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">Use https://linkedin.com/in/... (no www).</p>
                )}
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
              onClick={() => {
                const hasInitial = !!initialFormRef.current;
                const hasUnsaved = hasInitial && JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
                if (!hasUnsaved || window.confirm('Discard unsaved changes?')) {
                  setIsEditing(false);
                }
              }}
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
                            <a href={`tel:${formData.phone}`} className="text-ocean-600 hover:underline">{formData.phone}</a>
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
                {Array.isArray(formData.achievements) && formData.achievements.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Achievements</h3>
                    <div className="space-y-3">
                      {Array.isArray(formData.achievements) && formData.achievements.map((achievement, index) => (
                        <div key={index} className="border-l-4 border-ocean-500 pl-3">
                          <h4 className="font-medium">{typeof achievement === 'object' ? achievement.title || '' : achievement}</h4>
                          {typeof achievement === 'object' && achievement.description && 
                            <p className="text-sm text-gray-700">{achievement.description}</p>
                          }
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