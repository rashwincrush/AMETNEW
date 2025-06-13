import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { signUpWithEmail, signInWithGoogle, signInWithLinkedIn } from '../../utils/supabase';

const EnhancedRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Role & Verification
    primaryRole: '', // alumni, student, employer
    
    // Alumni/Student Specific
    graduationYear: '',
    expectedGraduationYear: '',
    degree: '',
    department: '',
    studentId: '',
    
    // Employer Specific
    companyName: '',
    jobTitle: '',
    companySize: '',
    industry: '',
    linkedinProfile: '',
    companyWebsite: '',
    
    // Mentorship Interest
    interestedInMentorship: false,
    mentorshipRole: '', // mentor, mentee, both
    experienceYears: '',
    skills: [],
    interests: [],
    mentorshipGoals: '',
    
    // Additional
    currentLocation: '',
    bio: '',
    agreeToTerms: false,
    agreeToMentorship: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  const skillOptions = [
    'Marine Engineering', 'Naval Architecture', 'Port Operations', 'Shipping Management',
    'Offshore Engineering', 'Maritime Law', 'Logistics', 'Project Management',
    'Leadership', 'Business Development', 'Technical Sales', 'Research & Development'
  ];

  const interestOptions = [
    'Career Development', 'Technical Skills', 'Leadership Training', 'Business Strategy',
    'International Markets', 'Sustainability', 'Digital Transformation', 'Entrepreneurship'
  ];

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.primaryRole) newErrors.primaryRole = 'Please select your role';
    }

    if (step === 2) {
      if (formData.primaryRole === 'alumni') {
        if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required';
        if (!formData.degree) newErrors.degree = 'Degree is required';
      }
      
      if (formData.primaryRole === 'student') {
        if (!formData.expectedGraduationYear) newErrors.expectedGraduationYear = 'Expected graduation year is required';
        if (!formData.studentId) newErrors.studentId = 'Student ID is required';
        if (!formData.degree) newErrors.degree = 'Degree program is required';
      }
      
      if (formData.primaryRole === 'employer') {
        if (!formData.companyName) newErrors.companyName = 'Company name is required';
        if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required';
        if (!formData.industry) newErrors.industry = 'Industry is required';
      }
    }

    if (step === 3) {
      if (formData.interestedInMentorship) {
        if (!formData.mentorshipRole) newErrors.mentorshipRole = 'Please select mentorship role';
        if (formData.mentorshipRole === 'mentor' && (!formData.experienceYears || formData.experienceYears < 3)) {
          newErrors.experienceYears = 'Mentors should have at least 3 years of experience';
        }
        if (formData.skills.length === 0) newErrors.skills = 'Please select at least one skill';
      }
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setIsLoading(true);
    setError('');

    try {
      // Prepare user metadata
      const userMetadata = {
        full_name: `${formData.firstName} ${formData.lastName}`,
        first_name: formData.firstName,
        last_name: formData.lastName,
        primary_role: formData.primaryRole,
        graduation_year: formData.graduationYear,
        expected_graduation_year: formData.expectedGraduationYear,
        degree: formData.degree,
        department: formData.department,
        student_id: formData.studentId,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        company_size: formData.companySize,
        industry: formData.industry,
        linkedin_profile: formData.linkedinProfile,
        company_website: formData.companyWebsite,
        phone: formData.phone,
        current_location: formData.currentLocation,
        bio: formData.bio,
        interested_in_mentorship: formData.interestedInMentorship,
        mentorship_role: formData.mentorshipRole,
        experience_years: formData.experienceYears,
        skills: formData.skills,
        interests: formData.interests,
        mentorship_goals: formData.mentorshipGoals,
        registration_status: formData.primaryRole === 'employer' ? 'pending_approval' : 'approved',
        mentorship_status: formData.interestedInMentorship ? 'pending_review' : 'not_applicable'
      };

      // Sign up with Supabase
      const { data, error } = await signUpWithEmail(
        formData.email, 
        formData.password,
        userMetadata
      );

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Show success message based on role
        let successMessage = 'Registration successful!';
        if (formData.primaryRole === 'employer') {
          successMessage = 'Registration submitted! Your account is pending admin approval. You will receive an email once approved.';
        } else if (formData.interestedInMentorship) {
          successMessage = 'Registration successful! Your mentorship application is under review.';
        }
        
        setError(successMessage);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to sign up with Google');
      console.error('Google signup error:', err);
    }
  };

  const handleLinkedInLogin = async () => {
    setError('');
    try {
      const { error } = await signInWithLinkedIn();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to sign up with LinkedIn');
      console.error('LinkedIn signup error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step < currentStep ? <CheckIcon className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div className={`w-16 h-1 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Social Registration */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleLinkedInLogin}
          className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-5 h-5 mr-2" fill="#0077B5" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Continue with LinkedIn
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or register with email</span>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="John"
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="john.doe@email.com"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+91 98765 43210"
        />
      </div>

      {/* Role Selection */}
      <div>
        <label htmlFor="primaryRole" className="block text-sm font-medium text-gray-700 mb-2">
          I am registering as a/an *
        </label>
        <div className="grid grid-cols-1 gap-3">
          {[
            { value: 'alumni', label: 'Alumni', desc: 'AMET graduate' },
            { value: 'student', label: 'Current Student', desc: 'Currently studying at AMET' },
            { value: 'employer', label: 'Employer', desc: 'Company/Organization looking to hire AMET graduates' }
          ].map((role) => (
            <label key={role.value} className="relative flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
              <input
                type="radio"
                name="primaryRole"
                value={role.value}
                checked={formData.primaryRole === role.value}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{role.label}</div>
                <div className="text-xs text-gray-500">{role.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.primaryRole && <p className="text-red-500 text-xs mt-1">{errors.primaryRole}</p>}
      </div>

      {/* Password Fields */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 pr-10 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password *
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {formData.primaryRole === 'alumni' && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alumni Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">
                Graduation Year *
              </label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="number"
                min="1980"
                max="2025"
                required
                value={formData.graduationYear}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.graduationYear ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="2020"
              />
              {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear}</p>}
            </div>
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
                Degree *
              </label>
              <select
                id="degree"
                name="degree"
                required
                value={formData.degree}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.degree ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Select Degree</option>
                <option value="B.Tech Naval Architecture">B.Tech Naval Architecture</option>
                <option value="B.Tech Marine Engineering">B.Tech Marine Engineering</option>
                <option value="B.Tech Offshore Engineering">B.Tech Offshore Engineering</option>
                <option value="M.Tech Naval Architecture">M.Tech Naval Architecture</option>
                <option value="M.Tech Marine Engineering">M.Tech Marine Engineering</option>
                <option value="MBA Maritime Management">MBA Maritime Management</option>
                <option value="Other">Other</option>
              </select>
              {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree}</p>}
            </div>
          </div>
        </>
      )}

      {formData.primaryRole === 'student' && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                Student ID *
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                required
                value={formData.studentId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.studentId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="AMT2023001"
              />
              {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
            </div>
            <div>
              <label htmlFor="expectedGraduationYear" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Graduation Year *
              </label>
              <input
                id="expectedGraduationYear"
                name="expectedGraduationYear"
                type="number"
                min="2024"
                max="2030"
                required
                value={formData.expectedGraduationYear}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.expectedGraduationYear ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="2025"
              />
              {errors.expectedGraduationYear && <p className="text-red-500 text-xs mt-1">{errors.expectedGraduationYear}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
              Degree Program *
            </label>
            <select
              id="degree"
              name="degree"
              required
              value={formData.degree}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.degree ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Select Degree Program</option>
              <option value="B.Tech Naval Architecture">B.Tech Naval Architecture</option>
              <option value="B.Tech Marine Engineering">B.Tech Marine Engineering</option>
              <option value="B.Tech Offshore Engineering">B.Tech Offshore Engineering</option>
              <option value="M.Tech Naval Architecture">M.Tech Naval Architecture</option>
              <option value="M.Tech Marine Engineering">M.Tech Marine Engineering</option>
              <option value="MBA Maritime Management">MBA Maritime Management</option>
            </select>
            {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree}</p>}
          </div>
        </>
      )}

      {formData.primaryRole === 'employer' && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Employer registrations require admin approval. You will receive an email confirmation once your account is verified.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.companyName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="ABC Shipping Ltd."
              />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
            </div>
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Your Job Title *
              </label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                required
                value={formData.jobTitle}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.jobTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="HR Manager"
              />
              {errors.jobTitle && <p className="text-red-500 text-xs mt-1">{errors.jobTitle}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry *
              </label>
              <select
                id="industry"
                name="industry"
                required
                value={formData.industry}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.industry ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Select Industry</option>
                <option value="Shipping & Logistics">Shipping & Logistics</option>
                <option value="Offshore & Oil Gas">Offshore & Oil Gas</option>
                <option value="Port Operations">Port Operations</option>
                <option value="Shipbuilding & Repair">Shipbuilding & Repair</option>
                <option value="Maritime Consulting">Maritime Consulting</option>
                <option value="Marine Insurance">Marine Insurance</option>
                <option value="Classification Society">Classification Society</option>
                <option value="Other">Other</option>
              </select>
              {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry}</p>}
            </div>
            <div>
              <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
                Company Size
              </label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
              Company Website
            </label>
            <input
              id="companyWebsite"
              name="companyWebsite"
              type="url"
              value={formData.companyWebsite}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.company.com"
            />
          </div>

          <div>
            <label htmlFor="linkedinProfile" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile
            </label>
            <input
              id="linkedinProfile"
              name="linkedinProfile"
              type="url"
              value={formData.linkedinProfile}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700 mb-1">
          Current Location
        </label>
        <input
          id="currentLocation"
          name="currentLocation"
          type="text"
          value={formData.currentLocation}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Chennai, India"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Brief Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={formData.bio}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tell us a bit about yourself..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Mentorship Program (Optional)</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">About AMET Mentorship Program</h4>
        <p className="text-sm text-blue-800 mb-2">
          Connect with experienced professionals for career guidance or share your expertise with students and junior alumni.
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Mentors:</strong> Experienced alumni (3+ years) who guide others</li>
          <li>• <strong>Mentees:</strong> Students and recent graduates seeking guidance</li>
          <li>• <strong>Matching:</strong> Based on industry, skills, and career goals</li>
        </ul>
      </div>

      <div>
        <label className="flex items-start">
          <input
            type="checkbox"
            name="interestedInMentorship"
            checked={formData.interestedInMentorship}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-900">
            I'm interested in participating in the AMET Mentorship Program
          </span>
        </label>
      </div>

      {formData.interestedInMentorship && (
        <div className="space-y-4 pl-6 border-l-2 border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I would like to be a *
            </label>
            <div className="space-y-2">
              {[
                { value: 'mentor', label: 'Mentor', desc: 'Guide and support students/junior alumni (requires 3+ years experience)' },
                { value: 'mentee', label: 'Mentee', desc: 'Receive guidance and career advice from experienced professionals' },
                { value: 'both', label: 'Both', desc: 'Mentor others while also seeking guidance in specific areas' }
              ].map((role) => (
                <label key={role.value} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                  <input
                    type="radio"
                    name="mentorshipRole"
                    value={role.value}
                    checked={formData.mentorshipRole === role.value}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.mentorshipRole && <p className="text-red-500 text-xs mt-1">{errors.mentorshipRole}</p>}
          </div>

          {(formData.mentorshipRole === 'mentor' || formData.mentorshipRole === 'both') && (
            <div>
              <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-1">
                Years of Professional Experience *
              </label>
              <input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min="0"
                max="50"
                value={formData.experienceYears}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.experienceYears ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="5"
              />
              {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills & Expertise *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {skillOptions.map((skill) => (
                <label key={skill} className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{skill}</span>
                </label>
              ))}
            </div>
            {errors.skills && <p className="text-red-500 text-xs mt-1">{errors.skills}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas of Interest
            </label>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => (
                <label key={interest} className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mentorshipGoals" className="block text-sm font-medium text-gray-700 mb-1">
              Mentorship Goals
            </label>
            <textarea
              id="mentorshipGoals"
              name="mentorshipGoals"
              rows={3}
              value={formData.mentorshipGoals}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What do you hope to achieve through mentorship?"
            />
          </div>

          <div className="flex items-start">
            <input
              id="agreeToMentorship"
              name="agreeToMentorship"
              type="checkbox"
              checked={formData.agreeToMentorship}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="agreeToMentorship" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/mentorship-guidelines" className="text-blue-600 hover:text-blue-700">
                Mentorship Program Guidelines
              </Link>{' '}
              and commit to participating actively in the program.
            </label>
          </div>
        </div>
      )}

      <div className="flex items-start">
        <input
          id="agreeToTerms"
          name="agreeToTerms"
          type="checkbox"
          checked={formData.agreeToTerms}
          onChange={handleChange}
          className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${errors.agreeToTerms ? 'border-red-500' : ''}`}
        />
        <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
          I agree to the{' '}
          <Link to="/terms" className="text-blue-600 hover:text-blue-700">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
            Privacy Policy
          </Link>
        </label>
      </div>
      {errors.agreeToTerms && <p className="text-red-500 text-xs">{errors.agreeToTerms}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg mb-6">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join AMET Alumni Network</h2>
          <p className="mt-2 text-gray-600">
            {currentStep === 1 && "Let's start with your basic information"}
            {currentStep === 2 && "Tell us about your background"}
            {currentStep === 3 && "Optional: Join our mentorship program"}
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <form onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}>
          <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className={`p-3 border rounded-lg ${
                error.includes('successful') || error.includes('submitted') 
                  ? 'bg-green-50 border-green-200 text-green-600' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <div className="ml-auto">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRegister;