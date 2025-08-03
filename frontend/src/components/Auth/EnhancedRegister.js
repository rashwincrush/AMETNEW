import React, { useState, useEffect } from 'react';
import Logo from '../common/Logo';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'; // Removed XMarkIcon as it's not used in the final version
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(''); // For general form errors or success messages
  const [roles, setRoles] = useState([]);

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
      { name: 'mentor', description: 'Mentor' },
      { name: 'employer', description: 'Employer' },
      { name: 'student', description: 'Mentee/Student' },
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear specific error when user starts typing/changing value
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
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
    if (stepToValidate === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email address is invalid.';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long.';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
      if (!formData.primaryRole) newErrors.primaryRole = 'Please select your primary role.';
    }

    if (stepToValidate === 2) {
      if (formData.primaryRole === 'alumni') {
        if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required.';
        else if (isNaN(parseInt(formData.graduationYear)) || parseInt(formData.graduationYear) < 1950 || parseInt(formData.graduationYear) > new Date().getFullYear()) newErrors.graduationYear = 'Please enter a valid year.';
        if (!formData.degree.trim()) newErrors.degree = 'Degree obtained is required.';
      } else if (formData.primaryRole === 'student') {
        if (!formData.expectedGraduationYear) newErrors.expectedGraduationYear = 'Expected graduation year is required.';
        else if (isNaN(parseInt(formData.expectedGraduationYear)) || parseInt(formData.expectedGraduationYear) < new Date().getFullYear() || parseInt(formData.expectedGraduationYear) > new Date().getFullYear() + 10) newErrors.expectedGraduationYear = 'Please enter a valid year.';
        if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required.';
        if (!formData.degree.trim()) newErrors.degree = 'Degree program is required.';
      } else if (formData.primaryRole === 'employer') {
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required.';
        if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Your job title is required.';
        if (!formData.industry.trim()) newErrors.industry = 'Industry is required.';
      }
    }

    if (stepToValidate === 3) {
      if (formData.interestedInMentorship) {
        if (!formData.mentorshipRole) newErrors.mentorshipRole = 'Please select your mentorship preference (Mentor, Mentee, or Both).';
        if ((formData.mentorshipRole === 'mentor' || formData.mentorshipRole === 'both') && (!formData.experienceYears || parseInt(formData.experienceYears, 10) < 3)) {
          newErrors.experienceYears = 'Mentors require at least 3 years of professional experience.';
        }
        if (formData.skills.length === 0) newErrors.skills = 'Please select at least one skill or area of expertise.';
        if (!formData.agreeToMentorship) newErrors.agreeToMentorship = 'You must agree to the Mentorship Program Guidelines to participate.';
      }
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy.';
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
    setCurrentStep(currentStep - 1);
    setError(''); // Clear general error message when moving to previous step
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) {
      setError('Please fill out all required fields before submitting.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Sign up the user
      const { data: authData, error: signUpError } = await signUpWithEmail(
        formData.email,
        formData.password,
        {
          // Metadata for the auth.users table - using standardized keys
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          role: formData.primaryRole, // This will be used by the DB trigger to set profile.role
          account_type: formData.primaryRole, // Adding account_type for consistency
        }
      );
      
      console.log('Registration metadata sent:', {
        role: formData.primaryRole,
        account_type: formData.primaryRole,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim()
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('A user with this email already exists. Please try logging in.');
        } else {
          throw signUpError;
        }
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // No need to create a separate company record - store employer data directly in profiles
        
        // Insert the detailed profile into the 'profiles' table with employer data directly embedded
        const profileData = {
          id: authData.user.id, // Links profile to the auth user
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email,
          phone: formData.phone.trim() || null,
          // role field removed - will be set by DB trigger from auth metadata
          graduation_year: formData.primaryRole === 'alumni' ? formData.graduationYear : null,
          expected_graduation_year: formData.primaryRole === 'student' ? formData.expectedGraduationYear : null,
          degree: (formData.primaryRole === 'alumni' || formData.primaryRole === 'student') ? formData.degree.trim() : null,
          department: (formData.primaryRole === 'alumni' || formData.primaryRole === 'student') ? formData.department.trim() : null,
          student_id: formData.primaryRole === 'student' ? formData.studentId.trim() : null,
          
          // Store employer data directly in profiles
          is_employer: formData.primaryRole === 'employer',
          company_name: formData.primaryRole === 'employer' ? formData.companyName.trim() : null,
          company_website: formData.primaryRole === 'employer' ? formData.companyWebsite.trim() : null,
          industry: formData.primaryRole === 'employer' ? formData.industry.trim() : null,
          company_location: formData.primaryRole === 'employer' ? formData.currentLocation.trim() : null,
          company_size: formData.primaryRole === 'employer' ? formData.companySize || null : null,
          
          // Other profile fields
          job_title: formData.primaryRole === 'employer' ? formData.jobTitle.trim() : null,
          linkedin_profile: formData.linkedinProfile.trim() || null,
          skills: formData.skills,
          interests: formData.interests,
          bio: formData.bio.trim() || null,
          location: formData.currentLocation.trim() || null,
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          console.error('Error saving profile:', profileError);
          // Log role information for debugging
          console.error('Role data during failed profile creation:', {
            primaryRole: formData.primaryRole,
            metadataRole: authData.user?.user_metadata?.role,
            profileData
          });
          setError('Your account was created, but we failed to save your profile details. Please contact support.');
          setIsLoading(false);
          return;
        }
        
        // Verify role was properly set
        const { data: profileCheck, error: checkError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();
          
        if (checkError || !profileCheck || profileCheck.role !== formData.primaryRole) {
          console.warn('Role mismatch after registration:', {
            expected: formData.primaryRole,
            actual: profileCheck?.role,
            error: checkError
          });
        } else {
          console.log('Role successfully set to:', profileCheck.role);
        }

        setError('Registration successful! Please check your email to verify your account.');
      } else {
        setError('An unexpected error occurred during registration. Please try again.');
      }

    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
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
          <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} placeholder="Suresh" className={commonInputClass(errors.firstName)} />
          {errors.firstName && <p className={commonErrorClass}>{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className={commonLabelClass}>Last Name *</label>
          <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} placeholder="Kumar" className={commonInputClass(errors.lastName)} />
          {errors.lastName && <p className={commonErrorClass}>{errors.lastName}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="email" className={commonLabelClass}>Email Address *</label>
        <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} placeholder="suresh.kumar@example.com" className={commonInputClass(errors.email)} />
        {errors.email && <p className={commonErrorClass}>{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="phone" className={commonLabelClass}>Phone Number</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" className={commonInputClass(false)} />
      </div>
      <div>
        <label htmlFor="primaryRole" className={commonLabelClass}>I am registering as a/an *</label>
        <select id="primaryRole" name="primaryRole" value={formData.primaryRole} onChange={handleChange} required className={`${commonInputClass(errors.primaryRole)} bg-white`}>
          <option value="" disabled>Select your role...</option>
          {roles.map(role => (<option key={role.name} value={role.name}>{role.description}</option>))}
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
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={commonInputClass(errors.confirmPassword)} />
          {errors.confirmPassword && <p className={commonErrorClass}>{errors.confirmPassword}</p>}
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
              <input id="degree" name="degree" type="text" required value={formData.degree} onChange={handleChange} placeholder="e.g., B.Tech Marine Engineering" className={commonInputClass(errors.degree)} />
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
            <input id="degree" name="degree" type="text" required value={formData.degree} onChange={handleChange} placeholder="e.g., B.Tech Naval Architecture" className={commonInputClass(errors.degree)} />
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
        <input id="linkedinProfile" name="linkedinProfile" type="url" value={formData.linkedinProfile} onChange={handleChange} placeholder="https://linkedin.com/in/yourname" className={commonInputClass(false)} />
      </div>
      <div>
        <label htmlFor="currentLocation" className={commonLabelClass}>Current Location</label>
        <input id="currentLocation" name="currentLocation" type="text" value={formData.currentLocation} onChange={handleChange} placeholder="e.g., Chennai, India" className={commonInputClass(false)} />
      </div>
      <div>
        <label htmlFor="bio" className={commonLabelClass}>Brief Bio (Optional)</label>
        <textarea id="bio" name="bio" rows={3} value={formData.bio} onChange={handleChange} placeholder="Tell us a bit about yourself, your experience, or interests..." className={`${commonInputClass(false)} min-h-[80px]`}></textarea>
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
            <div className="space-y-3">
              {[
                { value: 'mentor', label: 'Mentor', desc: 'Guide and support students/junior alumni.' },
                { value: 'mentee', label: 'Mentee', desc: 'Receive guidance and career advice.' },
                { value: 'both', label: 'Both Mentor & Mentee', desc: 'Mentor others while also seeking guidance.' }
              ].map((roleOpt) => (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skillOptions.map((skill) => (
                <label key={skill} className="flex items-center p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    disabled={formData.skills.length >= 5 && !formData.skills.includes(skill)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 truncate" title={skill}>{skill}</span>
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
                <label key={interest} className="flex items-center p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                    disabled={formData.interests.length >= 5 && !formData.interests.includes(interest)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 truncate" title={interest}>{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mentorshipGoals" className={commonLabelClass}>Mentorship Goals (Optional)</label>
            <textarea id="mentorshipGoals" name="mentorshipGoals" rows={3} value={formData.mentorshipGoals} onChange={handleChange} placeholder="What do you hope to achieve or offer through mentorship?" className={`${commonInputClass(false)} min-h-[80px]`}></textarea>
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
          <Link to="/" className="inline-flex items-center text-sm font-medium text-ocean-600 hover:text-ocean-800">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-3 mb-6">
            <Logo className="h-12 w-auto" />
            <span className="text-2xl font-bold text-gray-900">AMET Alumni</span>
          </Link>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Join the AMET Network</h2>
          <p className="mt-2 text-md text-gray-600">
            {currentStep === 1 && "Create your account to get started."}
            {currentStep === 2 && "Tell us more about yourself."}
            {currentStep === 3 && "Finalize your registration."}
          </p>
        </div>

        {renderStepIndicator()}

        <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-10 space-y-8">
            {error && (
              <div className={`p-4 border rounded-lg text-sm ${ 
                error.toLowerCase().includes('successful') || error.toLowerCase().includes('submitted') || error.toLowerCase().includes('verify')
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
    </div>
  );
};

export default EnhancedRegister;
