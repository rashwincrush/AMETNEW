import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { LinkIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../common/NotificationCenter';

const JobPostingForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const notification = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' or 'link'
  const [jobLink, setJobLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    location: '',
    jobType: 'full-time',
    experienceRequired: '',
    educationLevel: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requiredSkills: '',
    applicationDeadline: '',
    contactEmail: '',
    contactPhone: '',
    externalUrl: '',
    industry: '',
    applicationInstructions: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const jobTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.title) newErrors.title = 'Job title is required';
    if (!formData.companyName) newErrors.companyName = 'Company name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.jobType) newErrors.jobType = 'Employment type is required';
    if (!formData.experienceRequired) newErrors.experienceRequired = 'Experience level is required';
    if (!formData.description) newErrors.description = 'Job description is required';
    if (!formData.requiredSkills) newErrors.requiredSkills = 'At least one required skill is needed';
    if (!formData.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
    // Require contact email only if no external URL is provided
    if (!formData.externalUrl && !formData.contactEmail) {
      newErrors.contactEmail = 'Contact email is required if no application URL is provided.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to post a job.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Starting job submission process...');
      
      // Format the deadline date as ISO string
      const deadline = formData.applicationDeadline ? 
        new Date(formData.applicationDeadline).toISOString() : null;
      
      // Format salary range
      const salaryRange = (formData.salaryMin && formData.salaryMax) ? 
        `${formData.salaryMin} - ${formData.salaryMax}` : 
        (formData.salaryMin ? `From ${formData.salaryMin}` : 
         (formData.salaryMax ? `Up to ${formData.salaryMax}` : null));
      
      // Create skills array from comma-separated string
      const skillsArray = formData.requiredSkills.split(',')
        .map(skill => skill.trim())
        .filter(Boolean)
        .join(', ');
      
      // Prepare job data with correct column names that match the database
      const jobData = {
        title: formData.title,
        company_name: formData.companyName,
        location: formData.location,
        job_type: formData.jobType,
        experience_required: formData.experienceRequired,
        education_level: formData.educationLevel,
        salary_range: salaryRange,
        description: formData.description,
        required_skills: skillsArray,
        deadline: deadline,
        expires_at: deadline,
        contact_email: formData.contactEmail,
        application_url: formData.externalUrl,
        external_url: formData.externalUrl, 
        industry: formData.industry,
        application_instructions: formData.applicationInstructions,
        user_id: user.id,
        is_active: true
      };
      
      console.log('Submitting job data to Supabase:', jobData);
      
      const { data, error } = await supabase.from('jobs').insert(jobData);
      
      if (error) {
        console.error('Error creating job:', error);
        notification.showError('Failed to create job posting: ' + error.message);
        return;
      }
      
      notification.showSuccess('Job posting created successfully!');
      navigate('/jobs');
    } catch (error) {
      console.error('Error posting job:', error);
      notification.showError(`Error posting job: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle job data extraction from a URL
  const handleJobImport = async () => {
    if (!jobLink) {
      setLinkError('Please enter a job URL');
      return;
    }
    
    if (!jobLink.startsWith('http://') && !jobLink.startsWith('https://')) {
      setLinkError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setLinkError('');
    setIsImporting(true);
    
    try {
      // In a real implementation, this would call a backend service to scrape the job details
      // For now, we'll simulate a delay and show a success message
      toast.loading('Extracting job details...');
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, set some sample data
      // In a real implementation, this data would come from the scraping service
      const extractedData = {
        title: 'Extracted Job Title',
        companyName: 'Example Company',
        location: 'Remote',
        jobType: 'full-time',
        description: 'This is an example job description extracted from the provided URL.',
        requiredSkills: 'Communication, Teamwork, Leadership',
        externalUrl: jobLink
      };
      
      // Update the form with extracted data
      setFormData(prev => ({
        ...prev,
        ...extractedData
      }));
      
      toast.dismiss();
      notification.showSuccess('Job details extracted successfully!');
      setEntryMode('manual'); // Switch to manual mode to show the populated form
    } catch (error) {
      console.error('Error importing job details:', error);
      toast.dismiss();
      notification.showError('Failed to extract job details. Please try again or enter details manually.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Post a New Job</h2>
      
      {/* Entry Mode Toggle */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setEntryMode('manual')} 
            className={`flex items-center px-4 py-2 rounded-md ${entryMode === 'manual' 
              ? 'bg-white shadow-sm text-ocean-600' 
              : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Manual Entry
          </button>
          <button 
            type="button"
            onClick={() => setEntryMode('link')} 
            className={`flex items-center px-4 py-2 rounded-md ${entryMode === 'link' 
              ? 'bg-white shadow-sm text-ocean-600' 
              : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <LinkIcon className="w-5 h-5 mr-2" />
            Job Link Import
          </button>
        </div>
      </div>
      
      {entryMode === 'link' ? (
        <div className="glass-card p-6 rounded-lg mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Import Job from URL</h3>
          <p className="text-gray-600 mb-4">Paste a job posting URL below and we'll try to extract the job details automatically.</p>
          
          <div className="flex items-start space-x-2">
            <div className="flex-grow">
              <input
                type="url"
                value={jobLink}
                onChange={(e) => {
                  setJobLink(e.target.value);
                  if (linkError) setLinkError('');
                }}
                placeholder="https://example.com/jobs/software-engineer"
                className={`w-full px-4 py-2 border ${linkError ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
              />
              {linkError && <p className="mt-1 text-sm text-red-500">{linkError}</p>}
            </div>
            <button
              type="button"
              onClick={handleJobImport}
              disabled={isImporting}
              className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors duration-200 disabled:bg-ocean-400 flex items-center"
            >
              {isImporting ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Job'
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">Note: Automatic extraction may not be 100% accurate. You can edit the extracted details after import.</p>
        </div>
      ) : null}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Senior Software Developer"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>
          
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Acme Corporation"
            />
            {errors.companyName && <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>}
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., New York, NY (or Remote)"
            />
            {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
          </div>
          
          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Type *
            </label>
            <select
              name="jobType"
              value={formData.jobType}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.jobType ? 'border-red-500' : 'border-gray-300'}`}
            >
              {jobTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.jobType && <p className="mt-1 text-sm text-red-500">{errors.jobType}</p>}
          </div>
          
          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level Required *
            </label>
            <input
              type="text"
              name="experienceRequired"
              value={formData.experienceRequired}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.experienceRequired ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., 3-5 years"
            />
            {errors.experienceRequired && <p className="mt-1 text-sm text-red-500">{errors.experienceRequired}</p>}
          </div>
          
          {/* Education Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Education Level
            </label>
            <input
              type="text"
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Bachelor's in Computer Science"
            />
          </div>
          
          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Range (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleInputChange}
                className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Min"
              />
              <input
                type="text"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleInputChange}
                className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Max"
              />
            </div>
          </div>
          
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Technology, Healthcare"
            />
          </div>
          
          {/* Application Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Deadline *
            </label>
            <input
              type="date"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.applicationDeadline ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.applicationDeadline && <p className="mt-1 text-sm text-red-500">{errors.applicationDeadline}</p>}
          </div>
          
          {/* External URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application URL (Optional)
            </label>
            <input
              type="url"
              name="externalUrl"
              value={formData.externalUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., https://careers.company.com/job123"
            />
            <p className="mt-1 text-xs text-gray-500">Provide a link for direct applications. If provided, contact email is not required.</p>
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email {formData.externalUrl ? '(Optional)' : '*'}
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., jobs@company.com"
            />
            {errors.contactEmail && <p className="mt-1 text-sm text-red-500">{errors.contactEmail}</p>}
          </div>
        </div>
        
        {/* Job Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={6}
            className={`w-full px-4 py-2 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Detailed description of the job and responsibilities..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>
        
        {/* Required Skills */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Skills * (comma separated)
          </label>
          <textarea
            name="requiredSkills"
            value={formData.requiredSkills}
            onChange={handleInputChange}
            rows={2}
            className={`w-full px-4 py-2 border rounded-lg ${errors.requiredSkills ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g., JavaScript, React, Node.js"
          />
          {errors.requiredSkills && <p className="mt-1 text-sm text-red-500">{errors.requiredSkills}</p>}
        </div>
        
        {/* Application Instructions */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application Instructions (Optional)
          </label>
          <textarea
            name="applicationInstructions"
            value={formData.applicationInstructions}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Instructions for applicants on how to apply..."
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
          >
            {isSubmitting ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPostingForm;
