import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Work as WorkIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AttachMoney as SalaryIcon
} from '@mui/icons-material';

const steps = ['Core Info', 'Job Content', 'Details & Contact'];

const PostJob = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [showSelectionScreen, setShowSelectionScreen] = useState(true);
  const [postingType, setPostingType] = useState(null); // 'link' or 'form'

  useEffect(() => {
    if (profile && profile.primary_role === 'employer') {
      setFormData(prev => ({
        ...prev,
        company_name: profile.company_name || '',
        logo_url: profile.logo_url || ''
      }));
    }
  }, [profile]);

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    work_mode: 'On-site',
    job_type: 'Full-time',
    experience_level: 'Entry',
    department: '',
    industry: '',
    salary_min: '',
    salary_max: '',
    currency: 'USD',
    application_deadline: '',
    openings: 1,
    summary: '',
    responsibilities: '',
    qualifications: '',
    nice_to_have_skills: '',
    benefits: '',
    about_the_company: '',
    company_website: '',
    hiring_contact_email: '',
    equal_opportunity_note: 'Our company is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.',
    // Internal fields
    company_id: null,
    logo_url: '',
    // Quick Link specific
    external_application_url: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PNG, JPG, JPEG, or SVG are allowed.');
      return;
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 2MB. Please upload a smaller image.');
      return;
    }
    
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validateStep = () => {
    const newErrors = {};
    if (activeStep === 0) { // Core Info validation
      if (!formData.title.trim()) newErrors.title = 'Job Title is required.';
      if (!formData.company_name.trim()) newErrors.company_name = 'Company Name is required.';
      if (!formData.location.trim()) newErrors.location = 'Location is required.';
      // Work Mode, Job Type, and Experience Level have defaults, but you could add validation if needed.
    }
    // No validation for step 1 (Job Content) or step 2 (Details & Contact) as fields are optional.
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleQuickLinkSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job Title is required.';
    if (!formData.company_name.trim()) newErrors.company_name = 'Company Name is required.';
    if (!formData.external_application_url.trim()) {
      newErrors.external_application_url = 'External Application URL is required.';
    } else {
      try {
        const url = new URL(formData.external_application_url);
        if (url.protocol !== 'https:' && url.protocol !== 'mailto:') {
          newErrors.external_application_url = 'URL must start with https:// or mailto:';
        }
      } catch (_) {
        newErrors.external_application_url = 'Please enter a valid URL.';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error('Please sign in to post a job.');
        return;
      }

      // Find or create company
      const { data: existingCompany } = await supabase.from('companies').select('id').eq('name', formData.company_name.trim()).single();
      let companyId = existingCompany?.id;
      if (!companyId) {
        const { data: newCompany, error: createError } = await supabase.from('companies').insert({ name: formData.company_name.trim(), created_by: session.user.id }).select('id').single();
        if (createError) throw createError;
        companyId = newCompany.id;
      }

      const jobData = {
        title: formData.title.trim(),
        company_id: companyId,
        application_url: formData.external_application_url.trim(), // The key field for Quick Links
        summary: formData.summary?.trim(),
        // Let the backend handle posted_by, is_approved, etc.
      };

      const { error: jobError } = await supabase.from('jobs').insert(jobData);
      if (jobError) throw jobError;

      toast.success('Quick Link job posted successfully!');
      navigate('/jobs');

    } catch (err) {
      console.error('Error submitting Quick Link job:', err);
      toast.error(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) {
      toast.error('Please fix the errors on the current step.');
      return;
    }

    // Additional validation for fields not in the stepper validation
    const { salary_min, salary_max, application_deadline } = formData;
    if (salary_min && salary_max && parseFloat(salary_min) > parseFloat(salary_max)) {
      toast.error('Salary minimum cannot be greater than the maximum.');
      setErrors(prev => ({ ...prev, salary_min: 'Invalid range', salary_max: 'Invalid range' }));
      return;
    }

    if (application_deadline) {
      const today = new Date();
      const deadlineDate = new Date(application_deadline);
      today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
      if (deadlineDate < today) {
        toast.error('Application deadline cannot be in the past.');
        setErrors(prev => ({ ...prev, application_deadline: 'Date cannot be in the past' }));
        return;
      }
    }

    // Session guard
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error('Please sign in to post a job.');
      return;
    }

    setIsSubmitting(true);
    try {
      let companyId = formData.company_id;
      let logoUrl = formData.logo_url;

      // 1. Handle logo upload if a file is selected
      if (logoFile) {
        try {
          // Sanitize filename: remove spaces and special characters
          const cleanFileName = logoFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const fileName = `${session.user.id}/${Date.now()}_${cleanFileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('company-logos')
            .upload(fileName, logoFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Failed to upload logo: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('company-logos')
            .getPublicUrl(fileName);
          logoUrl = urlData.publicUrl;
        } catch (err) {
          console.error('Logo upload failed:', err);
          toast.error(`Logo upload failed: ${err.message || 'Unknown error'}`); 
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Find or create the company - CRITICAL for getting a valid company_id
      console.log("Finding or creating company with name:", formData.company_name.trim());
      
      // First try to find the company by exact name match
      const { data: existingCompanies, error: findError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', formData.company_name.trim());

      if (findError) {
        console.error("Error finding company:", findError);
        throw new Error(`Failed to find company: ${findError.message}`);
      }

      // Check if we found an existing company
      if (existingCompanies && existingCompanies.length > 0) {
        companyId = existingCompanies[0].id;
        console.log("Found existing company with ID:", companyId);
        
        // If there's a new logo, update the existing company's logo
        if (logoUrl) {
          console.log("Updating company logo for ID:", companyId);
          const { error: updateError } = await supabase
            .from('companies')
            .update({ logo_url: logoUrl })
            .eq('id', companyId);
            
          if (updateError) {
            console.error("Error updating company logo:", updateError);
            throw new Error(`Failed to update company logo: ${updateError.message}`);
          }
        }
      } else {
        // Create a new company since it doesn't exist
        console.log("Creating new company with name:", formData.company_name.trim());
        
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: formData.company_name.trim(),
            logo_url: logoUrl,
            created_by: session.user.id // Ensure we set the created_by field
          })
          .select();
          
        if (createError) {
          console.error("Error creating company:", createError);
          throw new Error(`Failed to create company: ${createError.message}`);
        }
        
        if (!newCompany || newCompany.length === 0) {
          console.error("No company data returned after creation");
          throw new Error("Failed to create company: No data returned");
        }
        
        companyId = newCompany[0].id;
        console.log("Created new company with ID:", companyId);
      }
      
      // Verify we have a valid company_id before proceeding
      if (!companyId) {
        console.error("No valid company_id after company creation/lookup");
        throw new Error("Cannot create job without a valid company ID");
      }

      // 3. Prepare and submit the job data
      console.log("Preparing job data with company_id:", companyId);

      // Explicitly remove the offending field from the form data to prevent it from being included
      if (formData.primary_role) {
        delete formData.primary_role;
      }
      
      // Format the deadline properly
      const rawDeadline = formData.deadline;
      let deadline = null;
      
      if (rawDeadline) {
        try {
          const parts = rawDeadline.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            // Convert to strings and pad if needed
            const dayStr = String(day).padStart(2, '0');
            const monthStr = String(month).padStart(2, '0');
            // Create a valid ISO date string
            deadline = new Date(`${year}-${monthStr}-${dayStr}T00:00:00Z`).toISOString();
          } else {
            deadline = new Date(rawDeadline).toISOString();
          }
          console.log("Formatted deadline:", deadline);
        } catch (dateError) {
          console.error("Error formatting deadline:", dateError);
          throw new Error(`Invalid date format for deadline: ${rawDeadline}`);
        }
      }

      const jobData = {
        company_id: companyId,
        title: formData.title?.trim(),
        location: formData.location?.trim(),
        work_mode: formData.work_mode,
        job_type: formData.job_type,
        experience_level: formData.experience_level,
        department: formData.department?.trim(),
        industry: formData.industry?.trim(),
        salary_min: formData.salary_min || null,
        salary_max: formData.salary_max || null,
        currency: formData.currency,
        application_deadline: formData.application_deadline || null,
        openings: formData.openings || 1,
        summary: formData.summary?.trim(),
        description: formData.summary?.trim(), // Using summary as the main description for now.
        responsibilities: formData.responsibilities?.trim(),
        qualifications: formData.qualifications?.trim(),
        nice_to_have_skills: formData.nice_to_have_skills?.split(',').map(s => s.trim()),
        benefits: formData.benefits?.trim(),
        about_the_company: formData.about_the_company?.trim(),
        company_website: formData.company_website?.trim(),
        hiring_contact_email: formData.hiring_contact_email?.trim(),
        // application_url is intentionally omitted for In-App jobs
      };
      
      // Log the exact payload we're sending
      console.log("Submitting job with payload:", jobData);
      
      // Insert the job with a specific select call to avoid issues with non-existent columns
      const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        .insert([jobData])
        .select('id'); // Only return the ID to avoid column issues
        
      // Check for errors
      if (jobError) {
        console.error("Error creating job:", jobError);
        // Log the full error for debugging
        console.error('Full job creation error:', JSON.stringify(jobError, null, 2));
        throw new Error(`Failed to create job: ${jobError.message || 'RLS/validation error'}`);
      }
      
      console.log("Job created successfully");
      toast.success('Job posted!');

      // Navigate to the new job details page
      if (newJob && newJob[0]?.id) {
        navigate(`/jobs/${newJob[0].id}`);
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      console.error('Error submitting job:', err);
      toast.error(`Error submitting job: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0: // Core Info
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField required fullWidth name="title" label="Job Title" value={formData.title} onChange={handleChange} error={!!errors.title} helperText={errors.title} placeholder="e.g., Mechanical Engineer – Shipyard" />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth name="company_name" label="Company Name" value={formData.company_name} onChange={handleChange} error={!!errors.company_name} helperText={errors.company_name} />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth name="location" label="Location" value={formData.location} onChange={handleChange} error={!!errors.location} helperText={errors.location} placeholder="e.g., Mumbai, Maharashtra, India" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth required name="work_mode" label="Work Mode" value={formData.work_mode} onChange={handleChange}>
                <MenuItem value="On-site">On-site</MenuItem>
                <MenuItem value="Hybrid">Hybrid</MenuItem>
                <MenuItem value="Remote">Remote</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth required name="job_type" label="Job Type" value={formData.job_type} onChange={handleChange}>
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
                <MenuItem value="Temporary">Temporary</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth required name="experience_level" label="Experience Level" value={formData.experience_level} onChange={handleChange}>
                <MenuItem value="Entry">Entry</MenuItem>
                <MenuItem value="Mid">Mid-level</MenuItem>
                <MenuItem value="Senior">Senior</MenuItem>
                <MenuItem value="Director+">Director+</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );
      case 1: // Job Content
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} name="summary" label="Summary (Short, 1-2 sentences)" value={formData.summary} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={5} name="responsibilities" label="Responsibilities (5-8 bullet points recommended)" value={formData.responsibilities} onChange={handleChange} placeholder="- Responsibility 1\n- Responsibility 2" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={5} name="qualifications" label="Qualifications (Skills, Education, Certs)" value={formData.qualifications} onChange={handleChange} placeholder="- Qualification 1\n- Qualification 2" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth name="nice_to_have_skills" label="Nice-to-have Skills (comma-separated)" value={formData.nice_to_have_skills} onChange={handleChange} placeholder="e.g., AutoCAD, Project Management" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} name="benefits" label="Benefits / Perks" value={formData.benefits} onChange={handleChange} placeholder="- Perk 1\n- Perk 2" />
            </Grid>
          </Grid>
        );
      case 2: // Details & Contact
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="department" label="Department" value={formData.department} onChange={handleChange} placeholder="e.g., Marine Engineering" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="industry" label="Industry" value={formData.industry} onChange={handleChange} placeholder="e.g., Maritime" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="salary_min" label="Salary Minimum" type="number" value={formData.salary_min} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="salary_max" label="Salary Maximum" type="number" value={formData.salary_max} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth name="currency" label="Currency" value={formData.currency} onChange={handleChange}>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="INR">INR</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" name="application_deadline" label="Application Deadline" value={formData.application_deadline} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" name="openings" label="Number of Openings" value={formData.openings} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}><Typography variant="overline">Company Details</Typography></Divider>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Company Logo</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={logoPreview || ''} alt="Company Logo Preview" sx={{ width: 60, height: 60, border: '1px solid #ddd' }} />
                <Button variant="outlined" component="label">Upload Logo<input type="file" hidden accept="image/png, image/jpeg, image/jpg, image/svg+xml" onChange={handleLogoChange} /></Button>
                {logoPreview && <Button size="small" onClick={() => { setLogoFile(null); setLogoPreview(''); }}>Remove</Button>}
              </Box>
              <Typography variant="caption" color="text.secondary">Max 2MB. PNG, JPG, SVG.</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="company_website" label="Company Website" value={formData.company_website} onChange={handleChange} placeholder="https://example.com" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="hiring_contact_email" type="email" label="Hiring Contact Email (Internal Only)" value={formData.hiring_contact_email} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} name="about_the_company" label="About the Company" value={formData.about_the_company} onChange={handleChange} />
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  const getStepIcon = (step) => {
    const icons = {
      0: <WorkIcon />,
      1: <DescriptionIcon />,
      2: <BusinessIcon />
    };
    return icons[step] || <WorkIcon />;
  };

  // Handle option selection
  const handleOptionSelect = (type) => {
    setPostingType(type);
    setShowSelectionScreen(false);
    
    // Reset form for link posting type
    if (type === 'link') {
      setFormData(prev => ({
        ...prev,
        application_url: '',
        title: '',
        company_name: '' // Changed from company_id
      }));
    }
  };

  // Handle back to selection
  const handleBackToSelection = () => {
    setShowSelectionScreen(true);
    setPostingType(null);
    setActiveStep(0);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#f4f6f8', // Changed background to a light grey
      py: 4
    }}>
      <Box sx={{ maxWidth: '900px', mx: 'auto', px: 2 }}>
        {/* Header Section */}
        <Card sx={{ 
          mb: 4, 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)'
            }}>
              <WorkIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {showSelectionScreen ? 'Post a Job' : 'Post a Job Opening'}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {showSelectionScreen ? 'Select a posting method' : 'Connect with talented maritime professionals'}
            </Typography>
            {!showSelectionScreen && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
                <Chip 
                  label={postingType === 'link' ? 'Quick Link Post' : 'Full Job Form'}
                  color="primary"
                  sx={{ fontSize: '0.9rem', px: 2 }}
                />
                {postingType === 'form' && (
                  <Chip 
                    label={`Step ${activeStep + 1} of ${steps.length}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.9rem', px: 2 }}
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Selection Screen or Progress Stepper */}
        {showSelectionScreen ? (
          <Card sx={{ 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 4, textAlign: 'center', color: '#1976d2', fontWeight: 500 }}>
                How would you like to post your job?
              </Typography>
              
              <Grid container spacing={4}>
                {/* Quick Link Post Option */}
                <Grid item xs={12} md={6}>
                  <Card 
                    onClick={() => handleOptionSelect('link')} 
                    sx={{
                      cursor: 'pointer', 
                      p: 4, 
                      textAlign: 'center',
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: '#3f51b5' }}>
                      <Typography variant="h5">1</Typography>
                    </Avatar>
                    <Typography variant="h6" gutterBottom>Quick Link Post</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Simply provide a job title and link to an external application page
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                      <span>⏱️</span> Takes less than a minute
                    </Typography>
                  </Card>
                </Grid>

                {/* Full Form Post Option */}
                <Grid item xs={12} md={6}>
                  <Card 
                    onClick={() => handleOptionSelect('form')} 
                    sx={{
                      cursor: 'pointer', 
                      p: 4, 
                      textAlign: 'center',
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: '#2196f3' }}>
                      <Typography variant="h5">2</Typography>
                    </Avatar>
                    <Typography variant="h6" gutterBottom>Complete Job Form</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Create a detailed job posting with full information and employer details
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                      <span>📝</span> Comprehensive and professional
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : postingType === 'form' ? (
          <Card sx={{ 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel sx={{
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#1976d2'
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#42a5f5'
                }
              }}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel 
                      StepIconComponent={() => (
                        <Avatar sx={{
                          width: 32,
                          height: 32,
                          bgcolor: activeStep >= index ? '#1976d2' : '#e0e0e0',
                          color: activeStep >= index ? 'white' : '#666'
                        }}>
                          {activeStep >= index ? getStepIcon(index) : index + 1}
                        </Avatar>
                      )}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                        {label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        ) : null}

        {/* Main Content */}
        {!showSelectionScreen && (
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              {postingType === 'link' ? (
                /* Quick Link Post Form */
                <form onSubmit={handleQuickLinkSubmit}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
                      Post with a Link
                    </Typography>
                    <Typography variant="body1" color="text.secondary">Provide a job title, company, and a link to the external application page.</Typography>
                    <Divider sx={{ my: 2 }} />
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField required fullWidth name="title" label="Job Title" value={formData.title} onChange={handleChange} error={!!errors.title} helperText={errors.title} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField required fullWidth name="company_name" label="Company Name" value={formData.company_name} onChange={handleChange} error={!!errors.company_name} helperText={errors.company_name} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField required fullWidth type="url" name="external_application_url" label="External Application URL (https:// or mailto:)" value={formData.external_application_url} onChange={handleChange} error={!!errors.external_application_url} helperText={errors.external_application_url} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={3} name="summary" label="Summary (Optional)" value={formData.summary} onChange={handleChange} />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                    <Button 
                      onClick={handleBackToSelection}
                      size="large"
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      Back to Options
                    </Button>
                    
                    <Button 
                      variant="contained"
                      type="submit"
                      disabled={isSubmitting}
                      size="large"
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} color="inherit" />
                          Publishing...
                        </Box>
                      ) : (
                        'Publish Quick Job Post'
                      )}
                    </Button>
                  </Box>
                </form>
              ) : (
                /* Full Job Post Form */
                <form onSubmit={handleSubmit}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ 
                      mb: 1, 
                      fontWeight: 'bold',
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {getStepIcon(activeStep)}
                      {steps[activeStep]}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                  </Box>
                  
                  {getStepContent(activeStep)}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                    <Button 
                      onClick={activeStep === 0 ? handleBackToSelection : handleBack} 
                      size="large"
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      {activeStep === 0 ? 'Back to Options' : 'Previous'}
                    </Button>
                    
                    {activeStep === steps.length - 1 ? (
                      <Button 
                        variant="contained" 
                        type="submit" 
                        disabled={isSubmitting}
                        size="large"
                        sx={{ 
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                          }
                        }}
                      >
                        {isSubmitting ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} color="inherit" />
                            Publishing...
                          </Box>
                        ) : (
                          'Publish Job'
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        onClick={handleNext}
                        size="large"
                        sx={{ 
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                          }
                        }}
                      >
                        Next Step
                      </Button>
                    )}
                  </Box>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default PostJob;