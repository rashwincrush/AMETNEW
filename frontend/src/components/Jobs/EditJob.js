import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Avatar,
} from '@mui/material';
import {
  Work as WorkIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Edit as EditIcon, 
} from '@mui/icons-material';

const steps = ['Basic Information', 'Job Details', 'Company & Contact'];

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    title: '',
    location: '',
    job_type: 'Full-time',
    description: '',
    requirements: '',
    salary_range: '',
    application_url: '',
    deadline: '',
    company_id: null,
    logo_url: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            companies (
              name,
              logo_url
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          if (user && data.user_id !== user.id) {
            toast.error("You are not authorized to edit this job.");
            navigate('/jobs');
            return;
          }
          
          const deadlineDate = data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '';

          setFormData({
            ...data,
            company_name: data.companies ? data.companies.name : '',
            logo_url: data.companies ? data.companies.logo_url : '',
            deadline: deadlineDate,
          });
          if (data.companies && data.companies.logo_url) {
            setLogoPreview(data.companies.logo_url);
          }
        } else {
            toast.error("Job not found.");
            navigate('/jobs');
        }
      } catch (err) {
        toast.error('Failed to load job data for editing.');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };

    if (user) { 
      fetchJob();
    }
  }, [id, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setLogoFile(null);
      setLogoPreview(formData.logo_url || '');
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg'];
    const maxSize = 5 * 1024 * 1024; 
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      toast.error('Invalid file type. Only PNG, JPG, JPEG, or SVG are allowed.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 5MB.');
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

    setIsSubmitting(true);
    try {
      let companyId = formData.company_id;
      let companyLogoUrl = formData.logo_url;

      if (logoFile) {
        const fileName = `${user.id}/${Date.now()}_${logoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName);
        companyLogoUrl = urlData.publicUrl;
      }

      const { data: existingCompany, error: findError } = await supabase
        .from('companies')
        .select('id, logo_url')
        .eq('name', formData.company_name)
        .single();

      if (findError && findError.code !== 'PGRST116') throw findError;

      if (existingCompany) {
        companyId = existingCompany.id;
        if (companyLogoUrl !== existingCompany.logo_url) {
          const { error: updateError } = await supabase
            .from('companies')
            .update({ logo_url: companyLogoUrl })
            .eq('id', companyId);
          if (updateError) throw updateError;
        }
      } else {
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({ name: formData.company_name, logo_url: companyLogoUrl })
          .select('id')
          .single();
        if (createError) throw createError;
        companyId = newCompany.id;
      }

      const jobData = {
        title: formData.title,
        location: formData.location,
        job_type: formData.job_type,
        description: formData.description,
        requirements: formData.requirements,
        salary_range: formData.salary_range,
        application_url: formData.application_url,
        deadline: formData.deadline || null,
        company_id: companyId,
        is_approved: false,
      };

      const { error: jobError } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', id);

      if (jobError) throw jobError;

      toast.success('Job updated and submitted for re-approval.');
      navigate(`/jobs/${id}`);
    } catch (err) {
      toast.error(`Error updating job: ${err.message}`);
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
                  required fullWidth name="title" label="Job Title" value={formData.title} onChange={handleInputChange}
                  error={!!errors.title} helperText={errors.title}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required fullWidth name="location" label="Location" value={formData.location} onChange={handleInputChange}
                  error={!!errors.location} helperText={errors.location}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth name="job_type" label="Job Type" value={formData.job_type} onChange={handleInputChange}>
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
                  required fullWidth multiline rows={6} name="description" label="Job Description" value={formData.description} onChange={handleInputChange}
                  error={!!errors.description} helperText={errors.description}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required fullWidth multiline rows={4} name="requirements" label="Requirements" value={formData.requirements} onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                    Upload New Logo
                    <input type="file" hidden accept="image/png, image/jpeg, image/jpg, image/svg+xml" onChange={handleFileChange} />
                  </Button>
                  {logoPreview && (
                    <Button size="small" onClick={() => { setLogoFile(null); setLogoPreview(formData.logo_url || ''); }}>Cancel Change</Button>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">Max 5MB. Allowed types: PNG, JPG, SVG.</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="salary_range" label="Salary Range" value={formData.salary_range} onChange={handleInputChange} placeholder="e.g., $80k - $120k" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" name="deadline" label="Application Deadline" value={formData.deadline} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required fullWidth name="application_url" label="Application URL or Email" value={formData.application_url} onChange={handleInputChange}
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Job Data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#f4f6f8',
      py: 4
    }}>
      <Box sx={{ maxWidth: '900px', mx: 'auto', px: 2 }}>
        <Card sx={{ 
          mb: 4, 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              background: 'linear-gradient(45deg, #0288d1, #26c6da)'
            }}>
              <EditIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #0288d1, #26c6da)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Edit Job Opening
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Update the details for your job listing.
            </Typography>
          </CardContent>
        </Card>

        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={(props) => (
                    <Avatar sx={{
                      bgcolor: props.active ? 'primary.main' : 'grey.300',
                      color: props.active ? 'common.white' : 'text.secondary',
                      width: 40, 
                      height: 40
                    }}>
                      {getStepIcon(index)}
                    </Avatar>
                  )}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
              <Button 
                onClick={handleBack} 
                disabled={activeStep === 0}
                size="large"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                Previous
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
                      Updating Job...
                    </Box>
                  ) : (
                    'Update Job'
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
        </Paper>
      </Box>
    </Box>
  );
};

export default EditJob;