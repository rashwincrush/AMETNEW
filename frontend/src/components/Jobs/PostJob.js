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

const steps = ['Basic Information', 'Job Details', 'Company & Contact'];

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
    company_name: '', // Changed from company_id to company_name
    title: '',
    location: '',
    job_type: 'Full-time',
    description: '',
    requirements: '',
    salary_range: '',
    application_url: '',
    deadline: '',
    company_id: null, // To store the ID of the company
    logo_url: '' // To store the logo URL after upload
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
    if (activeStep === 0) {
      if (!formData.title.trim()) newErrors.title = 'Job title is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
    }
    if (activeStep === 1) {
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required';
    }
    if (activeStep === 2) {
      if (!formData.company_name) newErrors.company_name = 'Company name is required';
      // No validation for logo, it's optional
      if (!formData.application_url.trim()) newErrors.application_url = 'Application URL or email is required';
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) {
      toast.error('Please fix the errors before submitting.');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to post a job.');
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
          const fileName = `${user.id}/${Date.now()}_${cleanFileName}`;
          
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
            created_by: user.id // Ensure we set the created_by field
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

      // Create the final payload by explicitly picking only the valid fields.
      // This is the most robust way to prevent payload contamination.
      const jobData = {
        title: formData.title?.trim(),
        location: formData.location?.trim(),
        job_type: formData.job_type,
        description: formData.description?.trim(),
        requirements: formData.requirements?.trim(),
        salary_range: formData.salary_range?.trim(),
        application_url: formData.application_url?.trim(),
        company_id: companyId,      // This is critical and must not be null
        posted_by: user.id,         // This is also required
        is_approved: false,
        is_active: true,
      };
      
      // Only add deadline if it's valid
      if (deadline) {
        jobData.deadline = deadline;
      }
      
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
        throw new Error(`Failed to create job: ${jobError.message}`);
      }
      
      console.log("Job created successfully");
      toast.success('Job submitted for approval!');
      navigate('/jobs');
    } catch (err) {
      toast.error(`Error submitting job: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required fullWidth name="title" label="Job Title" value={formData.title} onChange={handleChange}
                error={!!errors.title} helperText={errors.title}
                placeholder="e.g., Senior Marine Engineer"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required fullWidth name="location" label="Location" value={formData.location} onChange={handleChange}
                error={!!errors.location} helperText={errors.location}
                placeholder="e.g., Mumbai, Maharashtra"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth name="job_type" label="Job Type" value={formData.job_type} onChange={handleChange}>
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required fullWidth multiline rows={6} name="description" label="Job Description" value={formData.description} onChange={handleChange}
                error={!!errors.description} helperText={errors.description}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required fullWidth multiline rows={4} name="requirements" label="Requirements" value={formData.requirements} onChange={handleChange}
                error={!!errors.requirements} helperText={errors.requirements}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
             <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="company_name"
                label="Company Name"
                value={formData.company_name}
                onChange={handleChange}
                error={!!errors.company_name}
                helperText={errors.company_name || 'Enter the name of the company.'}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Company Logo</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  src={logoPreview || '/logo.png'} 
                  alt="Company Logo Preview" 
                  sx={{ width: 60, height: 60, border: '1px solid #ddd' }}
                />
                <Button variant="outlined" component="label">
                  Upload Logo
                  <input type="file" hidden accept="image/png, image/jpeg, image/jpg, image/svg+xml" onChange={handleLogoChange} />
                </Button>
                {logoPreview && (
                  <Button size="small" onClick={() => { setLogoFile(null); setLogoPreview(''); }}>Remove</Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">Max 5MB. Allowed types: PNG, JPG, SVG.</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="salary_range" label="Salary Range" value={formData.salary_range} onChange={handleChange} placeholder="e.g., $80k - $120k" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" name="deadline" label="Application Deadline" value={formData.deadline} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required fullWidth name="application_url" label="Application URL or Email" value={formData.application_url} onChange={handleChange}
                error={!!errors.application_url} helperText={errors.application_url}
              />
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
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!formData.title.trim()) {
                    setErrors({title: 'Job title is required'});
                    return;
                  }
                  if (!formData.application_url.trim()) {
                    setErrors({application_url: 'Application URL is required'});
                    return;
                  }
                  
                  setIsSubmitting(true);
                  supabase.from('jobs').insert([
                    {
                      title: formData.title,
                      application_url: formData.application_url,
                      company_name: formData.company_name, // Changed from company_id
                      user_id: user?.id,
                      is_approved: false,
                      is_active: true,
                      external_url: true
                    }
                  ])
                  .then(({error}) => {
                    if (error) throw error;
                    toast.success('Job link submitted for approval!');
                    navigate('/jobs');
                  })
                  .catch(err => {
                    toast.error(`Error submitting job: ${err.message}`);
                  })
                  .finally(() => setIsSubmitting(false));
                }}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ 
                      mb: 1, 
                      fontWeight: 'bold',
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <WorkIcon />
                      Quick Job Post with Link
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      Provide a job title and application link to quickly post a job
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        name="title"
                        label="Job Title"
                        value={formData.title}
                        onChange={handleChange}
                        error={!!errors.title}
                        helperText={errors.title}
                        placeholder="e.g., Senior Marine Engineer"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="company_name"
                        label="Company (Optional)"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="e.g., Maersk"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        type="url"
                        name="application_url"
                        label="Application URL"
                        value={formData.application_url}
                        onChange={handleChange}
                        error={!!errors.application_url}
                        helperText={errors.application_url}
                        placeholder="https://example.com/apply"
                      />
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