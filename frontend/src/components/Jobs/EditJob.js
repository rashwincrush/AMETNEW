import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EmployerGuard from '../Auth/EmployerGuard';
import toast from 'react-hot-toast';
import { toFriendlyToast, getFriendlyErrorMessage } from '../../utils/errors';
import {
  Box, TextField, Button, Typography, Paper, Grid,
  CircularProgress, MenuItem, Alert, Switch, FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { log } from '../../utils/log';
import { toISODate } from '../../utils/dateClean';

const GuardReady = ({ onReady }) => {
  useEffect(() => { onReady && onReady(); }, [onReady]);
  return null;
};

const EditJob = () => {
  // Route param (supports legacy :jobId too)
  const params = useParams();
  const id = params.id ?? params.jobId;

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false); // fetch loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // just for coordinating when to start the fetch
  const [guardReady, setGuardReady] = useState(false);

  // Mount log
  useEffect(() => {
    log.group('[EDIT] mount', { routeId: id, path: location.pathname });
  }, [id, location.pathname]);

  const fetchJob = useCallback(async () => {
    if (!id) {
      setError('Missing job id in route.');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to edit a job.');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Snapshot session for visibility
      const { data: { session } } = await supabase.auth.getSession();
      log.group('[EDIT] session', {
        hasSession: !!session,
        userId: session?.user?.id,
        routeId: id,
        path: location.pathname
      });

      let data = null, err = null, status = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const t0 = performance.now();
        const resp = await supabase
          .from('jobs')
          .select(`
            id, title, company_name, location, job_type,
            description, requirements, skills, salary_range, application_url,
            contact_email, external_url, apply_url, company_id,
            posted_by, user_id, created_by, deadline, application_deadline,
            is_active, is_approved
          `)
          .eq('id', id)
          .single();

        data = resp.data; err = resp.error; status = resp.status;
        log.group('[EDIT] fetch result', {
          status: resp.status,
          ms: +(performance.now() - t0).toFixed(1),
          error: err ? { code: err.code, message: err.message, details: err.details } : null,
          gotRow: !!data
        });

        if (!err && data) break; // success

        const st = err?.status ?? status ?? 0;
        if ([401, 403, 406].includes(st)) {
          await new Promise(r => setTimeout(r, 250));
          continue; // retry
        }
        break;
      }

      if (err || !data) {
        setError('This job either doesn’t exist or you don’t have permission to edit it.');
        setFormData(null);
        return;
      }

      log.group('[EDIT] owner check', {
        posted_by: data.posted_by,
        user_id: data.user_id,
        created_by: data.created_by,
        me: user?.id
      });

      setFormData({
        ...data,
        skillsText: Array.isArray(data.skills)
          ? data.skills.join(', ')
          : (data.skills || ''),
      });
    } catch (e) {
      console.error('Error fetching job:', e);
      setError(getFriendlyErrorMessage(e, 'Failed to load job data.'));
      setFormData(null);
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, location.pathname]);

  // Kick off the fetch only after the guard renders our child
  useEffect(() => {
    if (guardReady && !formData && !loading && !error) {
      fetchJob();
    }
  }, [guardReady, formData, loading, error, fetchJob]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!id) {
      toast.error('Missing job id.');
      return;
    }
    setIsSubmitting(true);

    const {
      title, company_name, location, job_type, description, requirements, skills,
      salary_range, application_url, contact_email, external_url, apply_url,
      company_id, deadline, application_deadline, is_active
    } = formData || {};

    // Normalize and enforce the DB constraint jobs_external_target_at_most_one
    // Only one of apply_url, application_url, external_url can be non-null
    const clean = (v) => {
      if (v === undefined || v === null) return null;
      if (typeof v !== 'string') return v;
      const t = v.trim();
      return t === '' ? null : t;
    };

    const norm_apply_url = clean(apply_url);
    const norm_application_url = clean(application_url);
    const norm_external_url = clean(external_url);

    const chosen = [norm_apply_url, norm_application_url, norm_external_url].filter(Boolean).length;
    if (chosen > 1) {
      toast.error('Please provide only ONE of: Apply URL, Application URL, or External URL.');
      setIsSubmitting(false);
      return;
    }

    // Additional validation to match jobs_application_url_valid
    if (norm_application_url && !(norm_application_url.startsWith('https://') || norm_application_url.startsWith('mailto:'))) {
      toast.error('Application URL must start with https:// or mailto:');
      setIsSubmitting(false);
      return;
    }

    const isQuick = !!(norm_application_url || norm_external_url);
    let updateData;
    if (isQuick) {
      // Minimal Quick Link update
      const isoDate = toISODate(String((application_deadline || deadline || '').toString()).trim());
      if (!title || !norm_application_url || !isoDate) {
        toast.error('For Quick Link, Title, External URL, and Deadline are required.');
        setIsSubmitting(false);
        return;
      }
      updateData = {
        title,
        company_name: (company_name || '').trim() || null,
        application_url: norm_application_url,
        application_deadline: isoDate,
        description: (description || '').trim() || null,
      };
    } else {
      // Legacy in-app update
      updateData = {
        title, company_name, location, job_type, description, requirements, skills,
        salary_range, application_url: norm_application_url, contact_email,
        external_url: norm_external_url, apply_url: norm_apply_url,
        company_id, deadline, is_active
      };
    }

    if (isAdmin) updateData.is_approved = formData?.is_approved ?? false;
    if (!isAdmin) {
      delete updateData.is_approved;
      delete updateData.is_featured; // just in case
    }

    try {
      log.group('[EDIT] update submit', { id, payload: updateData });
      const t0 = performance.now();
      const { data: upd, error: upErr, status } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select('id')
        .single();

      log.group('[EDIT] update result', {
        status,
        ms: +(performance.now() - t0).toFixed(1),
        error: upErr ? { code: upErr.code, message: upErr.message, details: upErr.details } : null,
        updated: !!upd?.id
      });

      if (upErr) throw upErr;

      toast.success('Job updated successfully!');
      navigate(`/jobs/${id}`);
    } catch (err) {
      console.error('Error updating job:', err);
      toFriendlyToast(toast, err, 'Update failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI states:
  // 1) While guard isn’t ready yet OR first fetch pending → spinner
  // 2) After fetch: if error → error banner
  // 3) After fetch: if formData → form

  return (
    <EmployerGuard jobId={id /* non-strict so child always renders */}>
      {() => (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <GuardReady onReady={() => setGuardReady(true)} />

          {(loading || !guardReady || (!formData && !error)) && (
            <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'50vh' }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              <Button variant="contained" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>
                Go Back
              </Button>
            </Box>
          )}

          {!loading && guardReady && formData && !error && (
            <>
              <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                Back to Job Details
              </Button>

              <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Edit Job
                </Typography>

                <form onSubmit={handleSave}>
                  <Grid container spacing={3}>
                    {/* Quick Link minimal form */}
                    {(() => {
                      const quick = !!(formData?.application_url || formData?.external_url);
                      if (!quick) return null;
                      return (
                        <>
                          <Grid item xs={12}>
                            <TextField required fullWidth label="Job Title" name="title"
                              value={formData.title || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth label="Company Name (Optional)" name="company_name"
                              value={formData.company_name || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField required fullWidth label="External Application URL (https:// or mailto:)" name="application_url"
                              value={formData.application_url || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField required type="date" fullWidth label="Deadline" name="application_deadline"
                              value={(formData.application_deadline || formData.deadline) ? new Date(formData.application_deadline || formData.deadline).toISOString().split('T')[0] : ''}
                              onChange={(e) => setFormData(p => ({ ...p, application_deadline: e.target.value }))}
                              InputLabelProps={{ shrink: true }} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth multiline rows={3} label="Summary (Optional)" name="description"
                              value={formData.description || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                        </>
                      );
                    })()}

                    {/* In-App form (legacy) */}
                    {(() => {
                      const quick = !!(formData?.application_url || formData?.external_url);
                      if (quick) return null;
                      return (
                        <>
                          <Grid item xs={12}>
                            <TextField required fullWidth label="Job Title" name="title"
                              value={formData.title || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField select required fullWidth label="Job Type" name="job_type"
                              value={formData.job_type || 'Full-time'} onChange={handleChange} disabled={isSubmitting}>
                              <MenuItem value="Full-time">Full-time</MenuItem>
                              <MenuItem value="Part-time">Part-time</MenuItem>
                              <MenuItem value="Contract">Contract</MenuItem>
                              <MenuItem value="Internship">Internship</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField required fullWidth label="Location" name="location"
                              value={formData.location || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField required fullWidth multiline rows={4} label="Job Description" name="description"
                              value={formData.description || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label="Key Skills (comma-separated)"
                              name="skills"
                              value={
                                typeof formData.skillsText === 'string'
                                  ? formData.skillsText
                                  : (Array.isArray(formData.skills)
                                      ? formData.skills.join(', ')
                                      : (formData.skills || ''))
                              }
                              onChange={(e) => {
                                const raw = e.target.value || '';
                                const parts = raw
                                  .split(/[\n,]+/)
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                setFormData(prev => ({
                                  ...prev,
                                  skillsText: raw,
                                  skills: parts,
                                }));
                              }}
                              disabled={isSubmitting}
                              helperText="Add important skills separated by commas (e.g., Navigation, Engine Maintenance, Leadership)"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth multiline rows={3} label="Requirements" name="requirements"
                              value={formData.requirements || ''} onChange={handleChange}
                              disabled={isSubmitting} helperText="Use bullet points (•) or newlines to separate requirements"
                              sx={{
                                '& .MuiInputBase-input': { lineHeight: 1.5, fontSize: '1rem' },
                                '& textarea': { whiteSpace: 'pre-wrap', wordWrap: 'break-word' }
                              }} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Salary Range" name="salary_range"
                              value={formData.salary_range || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField type="date" fullWidth label="Application Deadline" name="deadline"
                              value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                              onChange={handleChange} InputLabelProps={{ shrink: true }} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth label="Application URL / Email" name="application_url"
                              value={formData.application_url || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth label="External Apply URL" name="external_url"
                              value={formData.external_url || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth label="Direct Apply URL" name="apply_url"
                              value={formData.apply_url || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField fullWidth label="Contact Email" name="contact_email"
                              value={formData.contact_email || ''} onChange={handleChange} disabled={isSubmitting} />
                          </Grid>
                        </>
                      );
                    })()}

                    {isAdmin && (
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>Admin Controls</Typography>
                        <FormControlLabel
                          control={<Switch checked={formData.is_approved || false}
                            onChange={(e) => setFormData(p => ({ ...p, is_approved: e.target.checked }))} />}
                          label="Is Approved" disabled={isSubmitting}
                        />
                        <FormControlLabel
                          control={<Switch checked={formData.is_active !== false}
                            onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />}
                          label="Is Active" disabled={isSubmitting}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                      <Button variant="outlined" color="secondary"
                        onClick={() => navigate(`/jobs/${id}`)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </>
          )}
        </Box>
      )}
    </EmployerGuard>
  );
};

export default EditJob;
