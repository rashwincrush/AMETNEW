import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { useApproval } from '../../hooks/useApproval';
import { handleSupabaseGuardError } from '../../utils/mapSupabaseErrorToToast';
import { buildJobPayload } from '../../utils/jobPayloadBuilder';
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
  const { user, profile, userRole } = useAuth();
  const { loading: apprLoading, isApprovedEmployer } = useApproval();

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
        // Default logo for employers: prefer company logo, else use employer's profile avatar (DP)
        logo_url: profile.logo_url || profile.avatar_url || ''
      }));
    }
  }, [profile]);

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    job_type: 'Full-time',
    experience_level: 'Entry',
    department: '',
    industry: '',
    salary_min: '',
    salary_max: '',
    deadline: '', // Renamed from application_deadline
    summary: '', // Will be mapped to description
    responsibilities: '', // Will be mapped to requirements
    qualifications: '', // Will be mapped to requirements
    nice_to_have_skills: '', // Will be mapped to skills array
    contact_email: '', // Renamed from hiring_contact_email
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
    if (!isApprovedEmployer) { toast.error('Your profile is not approved. Kindly contact administrator.'); return; }

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

      const { data: existingCompany } = await supabase.from('companies').select('id').eq('name', formData.company_name.trim()).single();
      let companyId = existingCompany?.id;
      if (!companyId) {
        const { data: newCompany, error: createError } = await supabase.from('companies').insert({ name: formData.company_name.trim(), created_by: session.user.id }).select('id').single();
        if (createError) throw createError;
        companyId = newCompany.id;
      }

      const payload = buildJobPayload(formData, companyId, 'quick');
      const insertPayload = { ...payload, is_approved: false, is_active: true };
      const { error: jobError } = await supabase.from('jobs').insert(insertPayload).select('id').single();
      if (jobError) throw jobError;

      toast.success('Quick Link job posted successfully!');
      navigate('/jobs');

    } catch (err) {
      console.error('Error submitting Quick Link job:', err);
      handleSupabaseGuardError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isApprovedEmployer) { toast.error('Your profile is not approved. Kindly contact administrator.'); return; }

    if (!validateStep()) {
      toast.error('Please fix the errors on the current step.');
      return;
    }

    const { salary_min, salary_max, deadline } = formData;
    if (salary_min && salary_max && parseFloat(salary_min) > parseFloat(salary_max)) {
      toast.error('Salary minimum cannot be greater than the maximum.');
      setErrors(prev => ({ ...prev, salary_min: 'Invalid range', salary_max: 'Invalid range' }));
      return;
    }

    if (deadline) {
      const today = new Date();
      const deadlineDate = new Date(deadline);
      today.setHours(0, 0, 0, 0); 
      if (deadlineDate < today) {
        toast.error('Application deadline cannot be in the past.');
        setErrors(prev => ({ ...prev, deadline: 'Date cannot be in the past' }));
        return;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error('Please sign in to post a job.');
      return;
    }

    setIsSubmitting(true);
    try {
      let companyId = formData.company_id;
      // For employers, if no explicit logo chosen, default to profile logo or avatar (DP)
      let logoUrl = formData.logo_url || (userRole === 'employer' ? (profile?.logo_url || profile?.avatar_url || '') : formData.logo_url);

      if (logoFile) {
        try {
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

      const { data: existingCompanies, error: findError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', formData.company_name.trim());

      if (findError) {
        console.error("Error finding company:", findError);
        throw new Error(`Failed to find company: ${findError.message}`);
      }

      if (existingCompanies && existingCompanies.length > 0) {
        companyId = existingCompanies[0].id;
        
        if (logoUrl) {
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
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: formData.company_name.trim(),
            logo_url: logoUrl,
            created_by: session.user.id 
          })
          .select();
          
        if (createError) {
          console.error("Error creating company:", createError);
          throw new Error(`Failed to create company: ${createError.message}`);
        }
        
        companyId = newCompany[0].id;
      }
      
      if (!companyId) {
        console.error("No valid company_id after company creation/lookup");
        throw new Error("Cannot create job without a valid company ID");
      }

      const payload = buildJobPayload(formData, companyId, 'form');
      const insertPayload = { ...payload, is_approved: false, is_active: true };
      console.log("Submitting In-App job with payload:", insertPayload);
      const { data: newJob, error: jobError } = await supabase.from('jobs').insert(insertPayload).select('id').single();
        
      if (jobError) {
        console.error("Error creating job:", jobError);
        console.error('Full job creation error:', JSON.stringify(jobError, null, 2));
        throw new Error(`Failed to create job: ${jobError.message || 'RLS/validation error'}`);
      }
      
      console.log("Job created successfully");
      toast.success('Job posted!');

      if (newJob && newJob[0]?.id) {
        navigate(`/jobs/${newJob[0].id}`);
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      console.error('Error submitting job:', err);
      handleSupabaseGuardError(err);
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
              <TextField required fullWidth name="title" label="Job Title" value={formData.title} onChange={handleChange} error={!!errors.title} helperText={errors.title} placeholder="e.g., Mechanical Engineer – Shipyard" />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth name="company_name" label="Company Name" value={formData.company_name} onChange={handleChange} error={!!errors.company_name} helperText={errors.company_name} />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth name="location" label="Location" value={formData.location} onChange={handleChange} error={!!errors.location} helperText={errors.location} placeholder="e.g., Mumbai, Maharashtra, India" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required name="job_type" label="Job Type" value={formData.job_type} onChange={handleChange}>
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
                <MenuItem value="Temporary">Temporary</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required name="experience_level" label="Experience Level" value={formData.experience_level} onChange={handleChange}>
                <MenuItem value="Entry">Entry</MenuItem>
                <MenuItem value="Mid">Mid-level</MenuItem>
                <MenuItem value="Senior">Senior</MenuItem>
                <MenuItem value="Director+">Director+</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );
      case 1: 
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} name="summary" label="Summary (Short, 1-2 sentences)" value={formData.summary} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={5} name="responsibilities" label="Responsibilities / Requirements" value={formData.responsibilities} onChange={handleChange} placeholder="- Responsibility 1\n- Responsibility 2" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth name="nice_to_have_skills" label="Nice-to-have Skills (comma-separated)" value={formData.nice_to_have_skills} onChange={handleChange} placeholder="e.g., AutoCAD, Project Management" />
            </Grid>
          </Grid>
        );
      case 2: 
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="department" label="Department" value={formData.department} onChange={handleChange} placeholder="e.g., Marine Engineering" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="industry" label="Industry" value={formData.industry} onChange={handleChange} placeholder="e.g., Maritime" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="salary_min" label="Salary Minimum" type="number" value={formData.salary_min} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="salary_max" label="Salary Maximum" type="number" value={formData.salary_max} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" name="deadline" label="Application Deadline" value={formData.deadline} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}><Typography variant="overline">Company Details</Typography></Divider>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Company Logo</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={logoPreview || profile.avatar_url || ''} alt="Company Logo Preview" sx={{ width: 60, height: 60, border: '1px solid #ddd' }} />
                <Button variant="outlined" component="label">Upload New Logo<input type="file" hidden accept="image/png, image/jpeg, image/jpg, image/svg+xml" onChange={handleLogoChange} /></Button>
                {logoPreview && <Button size="small" onClick={() => { setLogoFile(null); setLogoPreview(''); }}>Remove</Button>}
              </Box>
              {userRole === 'employer' ? (
                <Typography variant="caption" color="text.secondary">Optional. Your profile avatar will be used by default if no logo is uploaded.</Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">Max 2MB. PNG, JPG, SVG.</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="contact_email" type="email" label="Hiring Contact Email (Internal Only)" value={formData.contact_email} onChange={handleChange} />
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

  if (!apprLoading && !isApprovedEmployer) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">Your profile is not approved. Kindly contact administrator.</div>
    );
  }

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