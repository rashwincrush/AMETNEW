import React, { useState, useEffect } from 'react';
import Logo from '../common/Logo';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckIcon, ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'; 
import { supabase, signUpWithEmail, signInWithGoogle, signInWithLinkedIn } from '../../utils/supabase';

const EnhancedRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    primaryRole: '', // alumni, student, employer, user
    graduationYear: '',
    expectedGraduationYear: '',
    degree: '',
    department: '',
    studentId: '',
    companyName: '',
    jobTitle: '',
    companySize: '',
    industry: '',
    linkedinProfile: '',
    githubProfile: '',
    websiteUrl: '',
    companyWebsite: '',
    interestedInMentorship: false,
    mentorshipRole: '', // mentor, mentee, both
    experienceYears: '',
    skills: [],
    interests: [],
    mentorshipGoals: '',
    currentLocation: '',
    bio: '',
    agreeToTerms: false,
    agreeToMentorship: false, // Specific to mentorship section
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Retained for general loading if needed elsewhere
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(''); // For general form errors or success messages
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const STORAGE_KEY = 'onboarding_registration_v1';

  // Degree program options (consolidated exact set provided)
  const degreeProgramOptions = [
    // Undergraduate/Cert/Diploma
    'HND Marine',
    'HND Nautical Science',
    'B.E. Petroleum Engineering',
    'B.E. Mining Engineering',
    'B.Sc. Nautical Science',
    'B.E. Marine Engineering',
    'B.E. Marine Technology',
    'B.E. Naval Architecture and Offshore Engineering',
    'B.E. Mechanical Engineering',
    'B.E. Electrical and Electronics Engineering – Marine',
    'B.Com',
    'B.B.A. Shipping & Logistics',
    'Electro Technical Officers (ETO)',
    'Graduate Marine Engineering (GME)',
    'GP Rating',
    // P.G. Programmes
    'M.B.A. Shipping & Logistics Management',
    'M.E. Naval Architecture and Offshore Engineering',
    'M.E. Petroleum Engineering',
    'M.E. Power Systems',
    'M.E. Marine Engineering',
    // Additional listed items
    'HND Marine Engineering',
    'MBA – Shipping and Logistics Management',
    'B.E. Harbour Engineer'
  ];

  const skillOptions = [
    'Marine Engineering', 'Naval Architecture', 'Port Operations', 'Shipping Management',
    'Offshore Engineering', 'Maritime Law', 'Logistics & Supply Chain', 'Project Management',
    'Leadership & Management', 'Business Development', 'Technical Sales & Marketing', 'Research & Development',
    'Vessel Operations', 'Chartering & Broking', 'Marine Surveying', 'HSEQ',
  ];

  const interestOptions = [
    'Career Advancement', 'Technical Skill Development', 'Leadership & Management Skills', 'Business & Entrepreneurship',
    'Networking Opportunities', 'Industry Trends & Insights', 'Further Education & Certifications', 'Innovation & Technology',
    'Sustainability in Maritime', 'Maritime Policy & Regulation', 'Personal Development', 'International Maritime Markets',
  ];

  useEffect(() => {
    // Set the roles to the fixed list as per requirements.
    setRoles([
      { name: 'alumni', description: 'Alumni' },
      { name: 'employer', description: 'Employer' },
      { name: 'student', description: 'Student' },
    ]);
  }, []);

  // Restore persisted onboarding state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.formData && typeof parsed.formData === 'object') {
            setFormData(prev => ({ ...prev, ...parsed.formData }));
          }
          if (parsed.currentStep && [1,2,3].includes(parsed.currentStep)) {
            setCurrentStep(parsed.currentStep);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore onboarding state:', e);
    }
  }, []);

  // Persist onboarding state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep }));
    } catch (e) {
      // Ignore write errors (e.g., storage full)
    }
  }, [formData, currentStep]);

  // Warn on unsaved changes if navigating away
  useEffect(() => {
    const isDirty = () => {
      // Consider the form dirty if any input has a value or any array has length
      const { firstName, lastName, email, password, phone, primaryRole, graduationYear, expectedGraduationYear, degree, department, studentId, companyName, jobTitle, linkedinProfile, githubProfile, websiteUrl, bio } = formData;
      return [firstName, lastName, email, password, phone, primaryRole, graduationYear, expectedGraduationYear, degree, department, studentId, companyName, jobTitle, linkedinProfile, githubProfile, websiteUrl, bio].some(v => (Array.isArray(v) ? v.length > 0 : (v && String(v).trim() !== '')));
    };
    const beforeUnload = (e) => {
      if (!showSuccessModal && isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [formData, showSuccessModal]);
  
  // Reset mentorship role when primaryRole changes to ensure compatibility
  useEffect(() => {
    if (formData.mentorshipRole) {
      // Define which mentorship roles are valid for each primary role
      const validRoles = {
        'alumni': ['mentor', 'mentee', 'both'],
        'employer': ['mentor', 'mentee', 'both'],
        'student': ['mentee']
      };
      
      const validForCurrentRole = validRoles[formData.primaryRole] || [];
      
      // If current mentorship role is not valid for selected primary role, reset it
      if (!validForCurrentRole.includes(formData.mentorshipRole)) {
        setFormData(prev => ({
          ...prev,
          mentorshipRole: ''
        }));
      }
    }
  }, [formData.primaryRole]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // Handle special validation cases
    if (name === 'firstName' || name === 'lastName') {
      // Only allow letters and spaces, no numbers or special characters
      processedValue = value.replace(/[^A-Za-z ]/g, '');

      if (processedValue !== value) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Only letters and spaces are allowed.'
        }));
      } else if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else if (name === 'email') {
      // Convert email to lowercase
      processedValue = value.toLowerCase();
      
      // Check if uppercase letters were used and show warning
      if (value !== value.toLowerCase()) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Email will be saved in lowercase format'
        }));
      }
      
      // Check and warn about .co domain
      if (/\.co$/i.test(processedValue)) {
        processedValue = processedValue.replace(/\.co$/i, '');
        setErrors(prev => ({
          ...prev,
          [name]: '".co" domains are not accepted - did you mean ".com"?'
        }));
      }
    } else if (name === 'primaryRole') {
      // When primary role changes, we may need to reset mentorship role
      // This is handled in the useEffect hook, but we should clear errors
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.mentorshipRole;
        return newErrors;
      });
    } else if (name === 'phone') {
      // Allow only numbers and starting + symbol
      // First, strip all non-digit and non-plus characters
      let strippedValue = value.replace(/[^0-9+]/g, '');
      
      // Ensure + is only at the beginning if present
      if (strippedValue.includes('+')) {
        const plusIndex = strippedValue.indexOf('+');
        if (plusIndex > 0) {
          // If + is not at the start, move it to the start
          strippedValue = '+' + strippedValue.replace(/\+/g, '');
          setErrors(prev => ({
            ...prev,
            [name]: 'Plus sign (+) is only allowed at the beginning of the number'
          }));
        } else if (strippedValue.lastIndexOf('+') !== plusIndex) {
          // If there are multiple + signs, keep only the first one
          strippedValue = '+' + strippedValue.substring(1).replace(/\+/g, '');
          setErrors(prev => ({
            ...prev,
            [name]: 'Only one plus sign (+) is allowed at the beginning'
          }));
        }
      }
      
      processedValue = strippedValue;
      
      // Give feedback if any characters were removed
      if (processedValue !== value && !errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Phone can only contain digits and an optional leading +'
        }));
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }));
    
    // Clear specific error when user starts typing/changing value and input is valid
    if (errors[name] && processedValue === value) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Prevent unintended form submission via Enter key across steps
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTextarea = tag === 'textarea';
      const isButtonOrLink = tag === 'button' || tag === 'a';
      if (!isTextarea && !isButtonOrLink) {
        e.preventDefault();
      }
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: '' }));
    }
  };
  
  const [customSkill, setCustomSkill] = useState('');
  
  const handleCustomSkillChange = (e) => {
    setCustomSkill(e.target.value);
  };
  
  const handleCustomSkillAdd = () => {
    if (customSkill.trim()) {
      // Split by comma and/or space and filter out empty items
      const newSkills = customSkill.split(/[,\s]+/).filter(skill => skill.trim());
      
      // Add each new skill if not already included and if under the 5-skill limit
      setFormData(prev => {
        const updatedSkills = [...prev.skills];
        
        for (const skill of newSkills) {
          if (!updatedSkills.includes(skill) && updatedSkills.length < 5) {
            updatedSkills.push(skill);
          }
        }
        
        return {
          ...prev,
          skills: updatedSkills
        };
      });
      
      // Clear input after adding
      setCustomSkill('');
      
      if (errors.skills) {
        setErrors((prev) => ({ ...prev, skills: '' }));
      }
    }
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const validateStep = (stepToValidate) => {
    const newErrors = {};
    
    // Step 1: Basic info validation
    if (stepToValidate === 1) {
      // Name validations
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required.';
      } else if (!/^[A-Za-z ]+$/.test(formData.firstName)) {
        newErrors.firstName = 'First name must contain only letters and spaces.';
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required.';
      } else if (!/^[A-Za-z ]+$/.test(formData.lastName)) {
        newErrors.lastName = 'Last name must contain only letters and spaces.';
      }
      
      // Email validations
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email address is invalid.';
      } else if (/\.co$/i.test(formData.email)) {
        newErrors.email = '".co" domains are not accepted. Please use a ".com" or other valid domain.';
      } else if (formData.email !== formData.email.toLowerCase()) {
        // This is a safety check - the handleChange should already convert to lowercase
        newErrors.email = 'Email must be in lowercase format.';
      }
      
      // Password validations
      if (!formData.password) {
        newErrors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long.';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
      
      // Role and phone validations
      if (!formData.primaryRole) newErrors.primaryRole = 'Please select your primary role.';
      if (formData.phone) {
        if (!/^\+?[0-9]{7,15}$/.test(formData.phone)) {
          newErrors.phone = 'Phone number must contain 7-15 digits with an optional leading + symbol.';
        } else if (formData.phone.indexOf('+') > 0) {
          // This is a safety check that shouldn't be needed due to handleChange processing
          newErrors.phone = 'Plus sign (+) is only allowed at the beginning of the number';
        }
      }
    }
    
    // Step 2: Role-specific details validation
    else if (stepToValidate === 2) {
      if (
        formData.linkedinProfile &&
        !/^https:\/\/(www\.)?linkedin\.com\/(in|pub|company|school)\/.+/i.test(formData.linkedinProfile)
      ) {
        newErrors.linkedinProfile = 'LinkedIn URL must start with https:// and be on linkedin.com (e.g., https://linkedin.com/in/yourname)';
      }

      if (
        formData.githubProfile &&
        !/^https:\/\/(www\.)?github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?(?:\/.*)?$/i.test(formData.githubProfile)
      ) {
        newErrors.githubProfile = 'GitHub URL must start with https://github.com/<username>';
      }

      if (
        formData.websiteUrl &&
        !/^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/.+)?$/i.test(formData.websiteUrl)
      ) {
        newErrors.websiteUrl = 'Website must be a valid https URL (e.g., https://example.com)';
      }
      
      if (formData.primaryRole === 'alumni') {
        if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required.';
        else if (isNaN(parseInt(formData.graduationYear)) || parseInt(formData.graduationYear) < 1950 || parseInt(formData.graduationYear) > new Date().getFullYear()) newErrors.graduationYear = 'Please enter a valid year.';
        if (!formData.degree || formData.degree === '') newErrors.degree = 'Degree obtained is required.';
      } else if (formData.primaryRole === 'student') {
        if (!formData.expectedGraduationYear) newErrors.expectedGraduationYear = 'Expected graduation year is required.';
        else if (isNaN(parseInt(formData.expectedGraduationYear)) || parseInt(formData.expectedGraduationYear) < new Date().getFullYear() || parseInt(formData.expectedGraduationYear) > new Date().getFullYear() + 10) newErrors.expectedGraduationYear = 'Please enter a valid year.';
        if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required.';
        if (!formData.degree || formData.degree === '') newErrors.degree = 'Degree program is required.';
      } else if (formData.primaryRole === 'employer') {
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required.';
        if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Your job title is required.';
        if (!formData.industry.trim()) newErrors.industry = 'Industry is required.';
      }
    }
    
    // Step 3: Mentorship and terms validation
    else if (stepToValidate === 3) {
      if (formData.interestedInMentorship) {
        if (!formData.mentorshipRole) {
          newErrors.mentorshipRole = 'Please select your desired mentorship role.';
        } else {
          // Validate that the mentorship role is compatible with the primary role
          const validRoles = {
            'alumni': ['mentor', 'mentee', 'both'],
            'employer': ['mentor', 'mentee', 'both'],
            'student': ['mentee']
          };
          
          const validForCurrentRole = validRoles[formData.primaryRole] || [];
          
          if (!validForCurrentRole.includes(formData.mentorshipRole)) {
            newErrors.mentorshipRole = `This mentorship role is not valid for ${formData.primaryRole} users.`;
          }
        }
        
        if ((formData.mentorshipRole === 'mentor' || formData.mentorshipRole === 'both') && (!formData.experienceYears || parseInt(formData.experienceYears, 10) < 3)) {
          newErrors.experienceYears = 'Mentors require at least 3 years of professional experience.';
        }
        if (formData.mentorInterests && formData.mentorInterests.length === 0) {
          newErrors.mentorInterests = 'Please select at least one interest area.';
        }
        if (!formData.agreeToMentorship) newErrors.agreeToMentorship = 'You must agree to the Mentorship Program Guidelines to participate.';
      }
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError(''); // Clear general error message when moving to next step
    }
  };

  const handlePrevious = () => {
    // Keep the form data when going back a step
    setCurrentStep(currentStep - 1);
    setError(''); // Clear general error message when moving to previous step
    
    // Clear specific errors related to the current step
    if (currentStep === 3) {
      setErrors(prev => {
        const newErrors = {...prev};
        // Clear T&C related errors
        delete newErrors.agreeToTerms;
        delete newErrors.agreeToMentorship;
        return newErrors;
      });
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-submit

    if (!validateStep(3)) {
      setError('Please fill out all required fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Consolidate all user data into one object for the signUp call
      const allUserData = {
        // Auth data
        role: formData.primaryRole,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        // Profile data
        phone: formData.phone.trim() || null,
        // Safely handle integer fields by checking for empty values
        graduation_year: (formData.primaryRole === 'alumni' && formData.graduationYear) ? 
          (formData.graduationYear.trim ? formData.graduationYear.trim() : formData.graduationYear) : null,
        expected_graduation_year: (formData.primaryRole === 'student' && formData.expectedGraduationYear) ?
          (formData.expectedGraduationYear.trim ? formData.expectedGraduationYear.trim() : formData.expectedGraduationYear) : null,
        // Store degree under both keys for compatibility; backend uses degree_program
        degree: (formData.primaryRole === 'alumni' || formData.primaryRole === 'student') ? formData.degree : null,
        degree_program: (formData.primaryRole === 'alumni' || formData.primaryRole === 'student') ? formData.degree : null,
        department: (formData.primaryRole === 'alumni' || formData.primaryRole === 'student') ? formData.department.trim() : null,
        student_id: formData.primaryRole === 'student' ? formData.studentId.trim() : null,
        is_employer: formData.primaryRole === 'employer',
        company_name: formData.primaryRole === 'employer' ? formData.companyName.trim() : null,
        company_website: formData.primaryRole === 'employer' ? formData.companyWebsite.trim() : null,
        industry: formData.primaryRole === 'employer' ? formData.industry.trim() : null,
        company_size: formData.primaryRole === 'employer' ? formData.companySize : null,
        job_title: formData.jobTitle?.trim() || null,
        linkedin_url: formData.linkedinProfile.trim() || null,
        about: formData.bio.trim() || null,
        social_links: {
          ...(formData.linkedinProfile ? { linkedin: formData.linkedinProfile.trim() } : {}),
          ...(formData.githubProfile ? { github: formData.githubProfile.trim() } : {}),
          ...(formData.websiteUrl ? { website: formData.websiteUrl.trim() } : {}),
        },
        skills: formData.skills,
        interests: formData.interests,
        bio: formData.bio.trim() || null,
        location: formData.currentLocation.trim() || null,
        interested_in_mentorship: formData.interestedInMentorship,
        mentorship_role: formData.interestedInMentorship ? formData.mentorshipRole : null,
        mentorship_experience_years: (formData.mentorshipRole === 'mentor' || formData.mentorshipRole === 'both' && formData.experienceYears) ?
          (formData.experienceYears.trim ? formData.experienceYears.trim() : formData.experienceYears) : null,
        mentorship_goals: formData.mentorshipGoals.trim() || null,
      };

      const { data: { user }, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: allUserData,
        },
      });

      if (error) {
        console.error('Supabase signup error:', error.message);
        throw new Error(error.message.includes('User already registered')
          ? 'A user with this email already exists. Please try logging in.'
          : 'Registration failed. If this keeps happening, try again later or contact support.');
      }

      if (!user) {
        // This case might happen if email confirmation is enabled and the user object is not returned immediately.
        // The backend trigger will still handle profile creation.
        console.log('Signup successful. User needs to confirm their email.');
      }

      // On success, show the success modal. The user will be redirected to login after confirming their email.
      // Clear persisted state on success and show success modal
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { console.warn('Failed to clear registration cache', e); }
      setShowSuccessModal(true);

    } catch (err) {
      console.error('Registration process error:', err.message);
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerAction) => {
    setIsLoading(true);
    setError('');
    try {
      const { error: socialError } = await providerAction();
      if (socialError) throw socialError;
      // Supabase handles redirection or session creation.
      // If direct navigation is needed post-social-login (e.g. to a profile completion step), handle it here or in App.js based on auth state.
      // navigate('/dashboard'); // Example navigation
    } catch (err) {
      setError(err.message || 'Social login failed. Please try again or use email registration.');
      console.error('Social login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
      {[1, 2, 3].map((stepNum, index, arr) => (
        <React.Fragment key={stepNum}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ease-in-out
                ${stepNum <= currentStep ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : 'bg-gray-200 text-gray-500'}`}
            >
              {stepNum < currentStep ? <CheckIcon className="w-6 h-6" /> : stepNum}
            </div>
            <p className={`mt-2 text-xs ${stepNum <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              {stepNum === 1 && 'Basic Info'}
              {stepNum === 2 && 'Details'}
              {stepNum === 3 && 'Mentorship'}
            </p>
          </div>
          {index < arr.length - 1 && (
            <div className={`flex-1 h-1 mx-2 transition-all duration-300 ease-in-out ${stepNum < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const commonInputClass = (hasError) =>
    `w-full px-3 py-2 border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm`;
  const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
  const commonErrorClass = "text-red-500 text-xs mt-1";

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <button type="button" onClick={() => handleSocialLogin(signInWithGoogle)} className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5 mr-3" />
          Continue with Google
        </button>
        {/* LinkedIn button can be added similarly if configured */}
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
        <div className="relative flex justify-center"><span className="px-3 bg-white text-sm text-gray-500">Or register with email</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label htmlFor="firstName" className={commonLabelClass}>First Name *</label>
          <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} placeholder="Suresh" className={commonInputClass(errors.firstName)} autoCapitalize="off" autoCorrect="off" style={{ textTransform: 'none' }} />
          {errors.firstName && <p className={commonErrorClass}>{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className={commonLabelClass}>Last Name *</label>
          <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} placeholder="Kumar" className={commonInputClass(errors.lastName)} autoCapitalize="off" autoCorrect="off" style={{ textTransform: 'none' }} />
          {errors.lastName && <p className={commonErrorClass}>{errors.lastName}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="email" className={commonLabelClass}>Email Address *</label>
        <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} placeholder="suresh.kumar@example.com" className={commonInputClass(errors.email)} />
        {errors.email && <p className={commonErrorClass}>{errors.email}</p>}
        <p className="text-xs text-gray-500 mt-1">Email will be stored in lowercase. '.co' domains are not allowed.</p>
      </div>
      <div>
        <label htmlFor="phone" className={commonLabelClass}>Phone Number</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" className={commonInputClass(errors.phone)} />
        {errors.phone && <p className={commonErrorClass}>{errors.phone}</p>}
        <p className="text-xs text-gray-500 mt-1">Phone can only contain digits with an optional leading + symbol</p>
      </div>
      <div>
        <label htmlFor="primaryRole" className={commonLabelClass}>I am registering as a/an *</label>
        <select id="primaryRole" name="primaryRole" value={formData.primaryRole} onChange={handleChange} required className={`${commonInputClass(errors.primaryRole)} bg-white`}>
          <option value="" disabled>Select your role...</option>
          {roles.map((role) => (<option key={role.name} value={role.name}>{role.description}</option>))}
        </select>
        {errors.primaryRole && <p className={commonErrorClass}>{errors.primaryRole}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label htmlFor="password" className={commonLabelClass}>Password *</label>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className={commonInputClass(errors.password)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none">
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className={commonErrorClass}>{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className={commonLabelClass}>Confirm Password *</label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              onPaste={(e) => {
                e.preventDefault();
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword: 'Pasting is disabled for security reasons. Please type your password again.',
                }));
                // Clear error after 3 seconds
                setTimeout(() => {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    if (newErrors.confirmPassword === 'Pasting is disabled for security reasons. Please type your password again.') {
                      delete newErrors.confirmPassword;
                    }
                    return newErrors;
                  });
                }, 3000);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword: 'Dropping text is disabled for security reasons.',
                }));
              }}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              placeholder="••••••••"
              className={commonInputClass(errors.confirmPassword)}
            />
            {showPassword ? (
              <button type="button" onClick={() => setShowPassword(false)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none">
                <EyeSlashIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          {errors.confirmPassword && <p className={commonErrorClass}>{errors.confirmPassword}</p>}
          <div className="flex items-center text-xs text-yellow-700 mt-1 bg-yellow-50 p-1 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Copy-paste is disabled for security reasons - type your password again
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {formData.primaryRole === 'alumni' && (
        <>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Alumni Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="graduationYear" className={commonLabelClass}>Graduation Year *</label>
              <input id="graduationYear" name="graduationYear" type="number" min="1950" max={new Date().getFullYear()} required value={formData.graduationYear} onChange={handleChange} placeholder="YYYY" className={commonInputClass(errors.graduationYear)} />
              {errors.graduationYear && <p className={commonErrorClass}>{errors.graduationYear}</p>}
            </div>
            <div>
              <label htmlFor="degree" className={commonLabelClass}>Degree Obtained *</label>
              <select
                id="degree"
                name="degree"
                required
                value={formData.degree}
                onChange={handleChange}
                className={`${commonInputClass(errors.degree)} bg-white`}
              >
                <option value="" disabled>Select your program</option>
                {degreeProgramOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.degree && <p className={commonErrorClass}>{errors.degree}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="department" className={commonLabelClass}>Department</label>
            <input id="department" name="department" type="text" value={formData.department} onChange={handleChange} placeholder="e.g., Marine Engineering" className={commonInputClass(false)} />
          </div>
        </>
      )}
      {formData.primaryRole === 'student' && (
        <>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Student Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="studentId" className={commonLabelClass}>Student ID <span className="text-xs text-gray-500">(optional)</span></label>
              <input id="studentId" name="studentId" type="text" value={formData.studentId} onChange={handleChange} placeholder="AMET12345 (optional)" className={commonInputClass(errors.studentId)} />
              {errors.studentId && <p className={commonErrorClass}>{errors.studentId}</p>}
            </div>
            <div>
              <label htmlFor="expectedGraduationYear" className={commonLabelClass}>Expected Graduation Year *</label>
              <input id="expectedGraduationYear" name="expectedGraduationYear" type="number" min={new Date().getFullYear()} max={new Date().getFullYear() + 10} required value={formData.expectedGraduationYear} onChange={handleChange} placeholder="YYYY" className={commonInputClass(errors.expectedGraduationYear)} />
              {errors.expectedGraduationYear && <p className={commonErrorClass}>{errors.expectedGraduationYear}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="degree" className={commonLabelClass}>Degree Program *</label>
            <select
              id="degree"
              name="degree"
              required
              value={formData.degree}
              onChange={handleChange}
              className={`${commonInputClass(errors.degree)} bg-white`}
            >
              <option value="" disabled>Select your program</option>
              {degreeProgramOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.degree && <p className={commonErrorClass}>{errors.degree}</p>}
          </div>
          <div>
            <label htmlFor="department" className={commonLabelClass}>Department</label>
            <input id="department" name="department" type="text" value={formData.department} onChange={handleChange} placeholder="e.g., Naval Architecture" className={commonInputClass(false)} />
          </div>
        </>
      )}
      {formData.primaryRole === 'employer' && (
        <>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Company Details</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-md">
            <p className="text-sm text-blue-700">Employer registrations require admin approval. You will be notified by email once your account is active.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="companyName" className={commonLabelClass}>Company Name *</label>
              <input id="companyName" name="companyName" type="text" required value={formData.companyName} onChange={handleChange} placeholder="Maritime Solutions Inc." className={commonInputClass(errors.companyName)} />
              {errors.companyName && <p className={commonErrorClass}>{errors.companyName}</p>}
            </div>
            <div>
              <label htmlFor="jobTitle" className={commonLabelClass}>Your Job Title *</label>
              <input id="jobTitle" name="jobTitle" type="text" required value={formData.jobTitle} onChange={handleChange} placeholder="HR Manager" className={commonInputClass(errors.jobTitle)} />
              {errors.jobTitle && <p className={commonErrorClass}>{errors.jobTitle}</p>}
            </div>
            <div>
              <label htmlFor="industry" className={commonLabelClass}>Industry *</label>
              <input id="industry" name="industry" type="text" required value={formData.industry} onChange={handleChange} placeholder="e.g., Shipping, Logistics, Offshore" className={commonInputClass(errors.industry)} />
              {errors.industry && <p className={commonErrorClass}>{errors.industry}</p>}
            </div>
            <div>
              <label htmlFor="companySize" className={commonLabelClass}>Company Size</label>
              <select id="companySize" name="companySize" value={formData.companySize} onChange={handleChange} className={`${commonInputClass(false)} bg-white`}>
                <option value="">Select size...</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="companyWebsite" className={commonLabelClass}>Company Website</label>
            <input id="companyWebsite" name="companyWebsite" type="url" value={formData.companyWebsite} onChange={handleChange} placeholder="https://www.maritimesolutions.com" className={commonInputClass(false)} />
          </div>
        </>
      )}
      {/* Common fields for Step 2 - can be placed outside role-specific blocks if applicable to all */}
      <div>
        <label htmlFor="linkedinProfile" className={commonLabelClass}>LinkedIn Profile URL</label>
        <input id="linkedinProfile" name="linkedinProfile" type="url" value={formData.linkedinProfile} onChange={handleChange} placeholder="https://linkedin.com/in/yourname" className={commonInputClass(errors.linkedinProfile)} />
        <p className="text-xs text-gray-500 mt-1">Must start with https:// and be on linkedin.com</p>
        {errors.linkedinProfile && <p className={commonErrorClass}>{errors.linkedinProfile}</p>}
      </div>
      <div>
        <label htmlFor="githubProfile" className={commonLabelClass}>GitHub Profile URL</label>
        <input id="githubProfile" name="githubProfile" type="url" value={formData.githubProfile} onChange={handleChange} placeholder="https://github.com/yourusername" className={commonInputClass(errors.githubProfile)} />
        <p className="text-xs text-gray-500 mt-1">Must start with https://github.com/</p>
        {errors.githubProfile && <p className={commonErrorClass}>{errors.githubProfile}</p>}
      </div>
      <div>
        <label htmlFor="websiteUrl" className={commonLabelClass}>Personal or Company Website</label>
        <input id="websiteUrl" name="websiteUrl" type="url" value={formData.websiteUrl} onChange={handleChange} placeholder="https://example.com" className={commonInputClass(errors.websiteUrl)} />
        <p className="text-xs text-gray-500 mt-1">Must be a valid https URL</p>
        {errors.websiteUrl && <p className={commonErrorClass}>{errors.websiteUrl}</p>}
      </div>
      <div>
        <label htmlFor="currentLocation" className={commonLabelClass}>Current Location</label>
        <input id="currentLocation" name="currentLocation" type="text" value={formData.currentLocation} onChange={handleChange} placeholder="e.g., Chennai, India" className={commonInputClass(false)} />
      </div>
      <div>
        <label htmlFor="bio" className={commonLabelClass}>Brief Bio (Optional)</label>
        <textarea id="bio" name="bio" rows={3} value={formData.bio} onChange={handleChange} placeholder="Tell us a bit about yourself, your experience, or interests..." className={`${commonInputClass(false)} min-h-[96px] max-h-[256px] resize-y`}></textarea>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Mentorship Program (Optional)</h3>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <h4 className="text-sm font-semibold text-blue-800 mb-1">Join the AMET Mentorship Network!</h4>
        <p className="text-sm text-blue-700 mb-2">
          Connect with experienced professionals for career guidance, or share your expertise to guide students and junior alumni.
        </p>
        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
          <li><strong>Mentors:</strong> Experienced alumni & professionals (3+ years) ready to guide.</li>
          <li><strong>Mentees:</strong> Students & recent graduates seeking career advice and support.</li>
          <li><strong>Flexible:</strong> Participate as a mentor, mentee, or both!</li>
        </ul>
      </div>

      <label className="flex items-start cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <input
          type="checkbox"
          name="interestedInMentorship"
          checked={formData.interestedInMentorship}
          onChange={handleChange}
          className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shadow-sm"
        />
        <span className="ml-3 text-sm font-medium text-gray-800">
          Yes, I'm interested in participating in the AMET Mentorship Program.
        </span>
      </label>

      {formData.interestedInMentorship && (
        <div className="space-y-6 pl-6 border-l-2 border-blue-200 ml-2 py-4">
          <div>
            <label className={`${commonLabelClass} mb-2`}>I would like to be a: *</label>
            {formData.primaryRole === 'student' && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-md">
                <p className="text-sm text-blue-700">As a Student, you can participate as a Mentee to receive guidance from experienced professionals.</p>
              </div>
            )}
            <div className="space-y-3">
              {
                [
                  { value: 'mentor', label: 'Mentor', desc: 'Guide and support students/junior alumni.', showFor: ['alumni', 'employer', 'mentor'] },
                  { value: 'mentee', label: 'Mentee', desc: 'Receive guidance and career advice.', showFor: ['student', 'alumni', 'employer'] },
                  { value: 'both', label: 'Both Mentor & Mentee', desc: 'Mentor others while also seeking guidance.', showFor: ['alumni', 'employer'] }
                ].filter((roleOpt) => roleOpt.showFor.includes(formData.primaryRole)).map((roleOpt) => (
                  <label key={roleOpt.value} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="mentorshipRole"
                      value={roleOpt.value}
                      checked={formData.mentorshipRole === roleOpt.value}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">{roleOpt.label}</span>
                      <p className="text-xs text-gray-500">{roleOpt.desc}</p>
                    </div>
                  </label>
                ))}
            </div>
            {errors.mentorshipRole && <p className={commonErrorClass}>{errors.mentorshipRole}</p>}
          </div>

          {(formData.mentorshipRole === 'mentor' || formData.mentorshipRole === 'both') && (
            <div>
              <label htmlFor="experienceYears" className={commonLabelClass}>Years of Professional Experience *</label>
              <input id="experienceYears" name="experienceYears" type="number" min="0" max="60" value={formData.experienceYears} onChange={handleChange} placeholder="e.g., 5" className={commonInputClass(errors.experienceYears)} />
              {errors.experienceYears && <p className={commonErrorClass}>{errors.experienceYears}</p>}
              <p className="text-xs text-gray-500 mt-1">Minimum 3 years required to be a mentor.</p>
            </div>
          )}

          <div>
            <label className={`${commonLabelClass} mb-2`}>Skills & Expertise (select up to 5) *</label>

            {/* Custom Skill Input */}
            <div className="mb-3">
              <div className="flex">
                <input
                  type="text"
                  value={customSkill}
                  onChange={handleCustomSkillChange}
                  placeholder="Add your own skills (separate by comma or space)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={formData.skills.length >= 5}
                />
                <button
                  type="button"
                  onClick={handleCustomSkillAdd}
                  disabled={!customSkill.trim() || formData.skills.length >= 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Add custom skills with commas or spaces (e.g., "Naval Architecture, Ship Design")</p>
            </div>

            {/* Selected Skills */}
            {formData.skills.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Your selected skills ({formData.skills.length}/5):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className="ml-1 inline-flex text-blue-500 hover:text-blue-700 focus:outline-none"
                      >
                        <XMarkIcon className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Predefined Skills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skillOptions.map((skill) => (
                <label key={skill} className="flex items-center p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    disabled={formData.skills.length >= 5 && !formData.skills.includes(skill)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 leading-snug truncate" title={skill}>{skill}</span>
                </label>
              ))}
            </div>
            {errors.skills && <p className={commonErrorClass}>{errors.skills}</p>}
            <p className="text-xs text-gray-500 mt-1">Relevant for mentor/mentee matching.</p>
          </div>

          <div>
            <label className={`${commonLabelClass} mb-2`}>Areas of Interest for Mentorship (select up to 5)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {interestOptions.map((interest) => (
                <label key={interest} className="flex items-center p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                    disabled={formData.interests.length >= 5 && !formData.interests.includes(interest)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 leading-snug truncate" title={interest}>{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mentorshipGoals" className={commonLabelClass}>Mentorship Goals (Optional)</label>
            <textarea id="mentorshipGoals" name="mentorshipGoals" rows={3} value={formData.mentorshipGoals} onChange={handleChange} placeholder="What do you hope to achieve or offer through mentorship?" className={`${commonInputClass(false)} min-h-[96px] max-h-[256px] resize-y`}></textarea>
          </div>

          <div className="flex items-start mt-4">
            <input
              id="agreeToMentorship"
              name="agreeToMentorship"
              type="checkbox"
              checked={formData.agreeToMentorship}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shadow-sm"
            />
            <label htmlFor="agreeToMentorship" className="ml-2 block text-sm text-gray-700">
              I have read and agree to the{' '}
              <Link to="/mentorship-guidelines" target="_blank" className="font-medium text-blue-600 hover:text-blue-700 underline">
                Mentorship Program Guidelines
              </Link> and commit to participating actively and respectfully. *
            </label>
          </div>
          {errors.agreeToMentorship && <p className={commonErrorClass}>{errors.agreeToMentorship}</p>}
        </div>
      )}

      <div className="flex items-start pt-4 border-t border-gray-200">
        <input
          id="agreeToTerms"
          name="agreeToTerms"
          type="checkbox"
          checked={formData.agreeToTerms}
          onChange={handleChange}
          className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shadow-sm ${errors.agreeToTerms ? 'border-red-500' : ''}`}
        />
        <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
          I agree to the AMET Alumni Network's{' '}
          <Link to="/terms-of-service" target="_blank" className="font-medium text-blue-600 hover:text-blue-700 underline">Terms of Service</Link> and
          <Link to="/privacy-policy" target="_blank" className="font-medium text-blue-600 hover:text-blue-700 underline"> Privacy Policy</Link>. *
        </label>
      </div>
      {errors.agreeToTerms && <p className={commonErrorClass}>{errors.agreeToTerms}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-ocean-600 hover:text-ocean-800">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </a>
        </div>
      </div>
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-3 mb-6" aria-label="Open AMET home page in a new tab">
            <Logo className="h-12 w-auto" />
            <span className="text-2xl font-bold text-gray-900">AMET Alumni</span>
          </a>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Join the AMET Network</h2>
          <p className="mt-2 text-md text-gray-600">
            {currentStep === 1 && "Create your account to get started."}
            {currentStep === 2 && "Tell us more about yourself."}
            {currentStep === 3 && "Finalize your registration."}
          </p>
        </div>

        {renderStepIndicator()}

        <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} onKeyDown={handleFormKeyDown}>
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-10 space-y-8">
            {error && (
              <div className={`p-4 border rounded-lg text-sm ${error.toLowerCase().includes('successful') || error.toLowerCase().includes('submitted') || error.toLowerCase().includes('verify')
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-red-50 border-red-300 text-red-700'
              }`} role="alert">
                {error}
              </div>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex pt-6 space-x-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
              )}
              <button
                type={currentStep === 3 ? "submit" : "button"}
                onClick={currentStep < 3 ? handleNext : undefined} // handleSubmit is called by form's onSubmit for last step
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading && currentStep === 3 ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : currentStep < 3 ? 'Next' : 'Create Account'}
              </button>
            </div>
          </div>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Registration Successful!</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">Please check your email to verify your account. You can now log in.</p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRegister;
