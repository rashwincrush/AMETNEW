import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PostJob = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    department: '',
    jobType: 'full-time',
    location: '',
    workArrangement: 'office',
    remoteOptions: '',
    
    // Job Details
    description: '',
    responsibilities: [''],
    requirements: [''],
    preferredQualifications: [''],
    skills: '',
    
    // Experience & Compensation
    experienceLevel: 'mid-level',
    experienceYears: '',
    salaryType: 'range',
    salaryMin: '',
    salaryMax: '',
    salaryNegotiable: false,
    currency: 'INR',
    
    // Benefits & Perks
    benefits: [''],
    workingHours: '',
    workSchedule: '',
    travelRequired: 'none',
    
    // Application Settings
    applicationDeadline: '',
    maxApplications: '',
    requireCoverLetter: true,
    requirePortfolio: false,
    applicationMethod: 'internal',
    externalUrl: '',
    
    // Company Information
    companyName: '',
    companyDescription: '',
    companySize: '',
    companyType: 'private',
    companyWebsite: '',
    companyLogo: null,
    
    // Contact Information
    contactPersonName: '',
    contactPersonTitle: '',
    contactEmail: '',
    contactPhone: '',
    
    // Additional Settings
    isUrgent: false,
    isFeatured: false,
    isRemote: false,
    requiresApproval: true
  });

  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);

  const jobTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const experienceLevels = [
    { value: 'entry-level', label: 'Entry Level (0-2 years)' },
    { value: 'mid-level', label: 'Mid Level (3-7 years)' },
    { value: 'senior-level', label: 'Senior Level (8-15 years)' },
    { value: 'executive', label: 'Executive (15+ years)' }
  ];

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  const workArrangements = [
    { value: 'office', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const travelOptions = [
    { value: 'none', label: 'No travel required' },
    { value: 'occasional', label: 'Occasional travel (10-25%)' },
    { value: 'frequent', label: 'Frequent travel (25-50%)' },
    { value: 'extensive', label: 'Extensive travel (50%+)' }
  ];

  const handleInputChange = (e) => {
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, companyLogo: file }));
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleListChange = (field, index, value) => {
    const newList = [...formData[field]];
    newList[index] = value;
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const addListItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeListItem = (field, index) => {
    if (formData[field].length > 1) {
      const newList = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newList }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Basic Information
        if (!formData.title.trim()) newErrors.title = 'Job title is required';
        if (!formData.department.trim()) newErrors.department = 'Department is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        break;
      
      case 2: // Job Details
        if (!formData.description.trim()) newErrors.description = 'Job description is required';
        if (formData.responsibilities.every(r => !r.trim())) {
          newErrors.responsibilities = 'At least one responsibility is required';
        }
        if (formData.requirements.every(r => !r.trim())) {
          newErrors.requirements = 'At least one requirement is required';
        }
        break;
      
      case 3: // Experience & Compensation
        if (!formData.experienceYears) newErrors.experienceYears = 'Experience years is required';
        if (formData.salaryType === 'range') {
          if (!formData.salaryMin) newErrors.salaryMin = 'Minimum salary is required';
          if (!formData.salaryMax) newErrors.salaryMax = 'Maximum salary is required';
          if (formData.salaryMin && formData.salaryMax && 
              parseInt(formData.salaryMin) >= parseInt(formData.salaryMax)) {
            newErrors.salaryMax = 'Maximum salary must be greater than minimum';
          }
        }
        break;
      
      case 4: // Application Settings
        if (!formData.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
        if (formData.applicationMethod === 'external' && !formData.externalUrl.trim()) {
          newErrors.externalUrl = 'External application URL is required';
        }
        break;
      
      case 5: // Company Information
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.companyDescription.trim()) newErrors.companyDescription = 'Company description is required';
        if (!formData.contactPersonName.trim()) newErrors.contactPersonName = 'Contact person name is required';
        if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock submission - in real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Job posted:', formData);
      
      // Redirect to jobs list
      navigate('/jobs');
      
      // Show success message
      alert('Job posted successfully! It will be reviewed by our team.');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Error posting job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Job title, type, and location' },
    { number: 2, title: 'Job Details', description: 'Description and requirements' },
    { number: 3, title: 'Experience & Pay', description: 'Experience level and compensation' },
    { number: 4, title: 'Application Settings', description: 'How candidates apply' },
    { number: 5, title: 'Company & Contact', description: 'Company information and contact' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Post a Job</h1>
        <p className="text-gray-600">Create a job posting to attract qualified maritime professionals</p>
      </div>

      {/* Progress Steps */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-ocean-500 border-ocean-500 text-white' 
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="font-medium">{step.number}</span>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-ocean-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-ocean-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="e.g., Senior Marine Engineer"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.department ? 'border-red-500' : ''}`}
                  placeholder="e.g., Engineering, Operations"
                />
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type *
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                >
                  {jobTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.location ? 'border-red-500' : ''}`}
                  placeholder="e.g., Mumbai, Maharashtra"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Arrangement
                </label>
                <select
                  name="workArrangement"
                  value={formData.workArrangement}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                >
                  {workArrangements.map(arrangement => (
                    <option key={arrangement.value} value={arrangement.value}>
                      {arrangement.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Job Details */}
        {currentStep === 2 && (
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Job Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Provide a detailed description of the job role, expectations, and what the candidate will be doing..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Responsibilities *
                </label>
                {formData.responsibilities.map((responsibility, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={responsibility}
                      onChange={(e) => handleListChange('responsibilities', index, e.target.value)}
                      className="form-input flex-1 px-3 py-2 rounded-lg"
                      placeholder="Enter a key responsibility..."
                    />
                    {formData.responsibilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem('responsibilities', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addListItem('responsibilities')}
                  className="text-ocean-600 hover:text-ocean-700 text-sm"
                >
                  + Add Responsibility
                </button>
                {errors.responsibilities && <p className="text-red-500 text-sm mt-1">{errors.responsibilities}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements *
                </label>
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => handleListChange('requirements', index, e.target.value)}
                      className="form-input flex-1 px-3 py-2 rounded-lg"
                      placeholder="Enter a requirement..."
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem('requirements', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addListItem('requirements')}
                  className="text-ocean-600 hover:text-ocean-700 text-sm"
                >
                  + Add Requirement
                </button>
                {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                  placeholder="e.g., Marine Engineering, Leadership, Safety Management"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Experience & Compensation */}
        {currentStep === 3 && (
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Experience & Compensation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Experience (years) *
                </label>
                <input
                  type="text"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.experienceYears ? 'border-red-500' : ''}`}
                  placeholder="e.g., 5-8 years"
                />
                {errors.experienceYears && <p className="text-red-500 text-sm mt-1">{errors.experienceYears}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Information
                </label>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="salaryType"
                        value="range"
                        checked={formData.salaryType === 'range'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Salary Range
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="salaryType"
                        value="exact"
                        checked={formData.salaryType === 'exact'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Fixed Salary
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="salaryType"
                        value="negotiable"
                        checked={formData.salaryType === 'negotiable'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Negotiable
                    </label>
                  </div>

                  {formData.salaryType === 'range' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          name="salaryMin"
                          value={formData.salaryMin}
                          onChange={handleInputChange}
                          className={`form-input w-full px-3 py-2 rounded-lg ${errors.salaryMin ? 'border-red-500' : ''}`}
                          placeholder="Minimum (₹ LPA)"
                        />
                        {errors.salaryMin && <p className="text-red-500 text-sm mt-1">{errors.salaryMin}</p>}
                      </div>
                      <div>
                        <input
                          type="number"
                          name="salaryMax"
                          value={formData.salaryMax}
                          onChange={handleInputChange}
                          className={`form-input w-full px-3 py-2 rounded-lg ${errors.salaryMax ? 'border-red-500' : ''}`}
                          placeholder="Maximum (₹ LPA)"
                        />
                        {errors.salaryMax && <p className="text-red-500 text-sm mt-1">{errors.salaryMax}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Requirements
                </label>
                <select
                  name="travelRequired"
                  value={formData.travelRequired}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                >
                  {travelOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Application Settings */}
        {currentStep === 4 && (
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.applicationDeadline ? 'border-red-500' : ''}`}
                />
                {errors.applicationDeadline && <p className="text-red-500 text-sm mt-1">{errors.applicationDeadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Applications
                </label>
                <input
                  type="number"
                  name="maxApplications"
                  value={formData.maxApplications}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="applicationMethod"
                      value="internal"
                      checked={formData.applicationMethod === 'internal'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Through our platform
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="applicationMethod"
                      value="external"
                      checked={formData.applicationMethod === 'external'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    External application URL
                  </label>
                  
                  {formData.applicationMethod === 'external' && (
                    <input
                      type="url"
                      name="externalUrl"
                      value={formData.externalUrl}
                      onChange={handleInputChange}
                      className={`form-input w-full px-3 py-2 rounded-lg mt-2 ${errors.externalUrl ? 'border-red-500' : ''}`}
                      placeholder="https://company.com/careers/apply"
                    />
                  )}
                  {errors.externalUrl && <p className="text-red-500 text-sm mt-1">{errors.externalUrl}</p>}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Application Requirements
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="requireCoverLetter"
                      checked={formData.requireCoverLetter}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Require cover letter
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="requirePortfolio"
                      checked={formData.requirePortfolio}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Require portfolio/work samples
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Company & Contact Information */}
        {currentStep === 5 && (
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Company & Contact Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`form-input w-full px-3 py-2 rounded-lg ${errors.companyName ? 'border-red-500' : ''}`}
                    placeholder="e.g., Ocean Shipping Ltd."
                  />
                  {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className="form-input w-full px-3 py-2 rounded-lg"
                  >
                    <option value="">Select company size</option>
                    {companySizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description *
                </label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.companyDescription ? 'border-red-500' : ''}`}
                  placeholder="Tell candidates about your company, culture, and what makes it a great place to work..."
                />
                {errors.companyDescription && <p className="text-red-500 text-sm mt-1">{errors.companyDescription}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="form-input flex-1 px-3 py-2 rounded-lg"
                  />
                  {logoPreview && (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleInputChange}
                    className={`form-input w-full px-3 py-2 rounded-lg ${errors.contactPersonName ? 'border-red-500' : ''}`}
                    placeholder="HR Manager name"
                  />
                  {errors.contactPersonName && <p className="text-red-500 text-sm mt-1">{errors.contactPersonName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className={`form-input w-full px-3 py-2 rounded-lg ${errors.contactEmail ? 'border-red-500' : ''}`}
                    placeholder="hr@company.com"
                  />
                  {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="btn-ocean-outline px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-ocean px-6 py-2 rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-ocean px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="loading-wave"></div>
                  <div className="loading-wave"></div>
                  <div className="loading-wave"></div>
                  <span className="ml-2">Publishing Job...</span>
                </div>
              ) : (
                'Publish Job'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PostJob;