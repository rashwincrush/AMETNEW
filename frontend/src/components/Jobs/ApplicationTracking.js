import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import { normalizeStatus, STATUS_BADGE_CLASS, STATUS_LABEL, STATUS_ICON } from '../../utils/applicationStatus';
import { generateApplicationStatusAdvice, generateRejectionInsights } from '../../services/groqService';

// Normalize resume value (path or legacy public URL) into a storage path
const getResumePathFromValue = (value) => {
  if (!value) return null;

  // New style: plain key/path like "userId/uuid-file.pdf"
  if (!/^https?:\/\//i.test(value)) {
    return value;
  }

  // Legacy style: full public URL containing "/storage/v1/object/public/resumes/<key>"
  const match = value.match(/\/storage\/v1\/object\/public\/resumes\/(.+)$/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
};

// STATE INVENTORY
// Local state:
//   - applications: Array of user's job applications with joined job details
//   - isLoading: Boolean for initial data fetch
//   - filter: String status filter value ('all' or specific status)
//   - offerLetters: Object mapping appId -> offer letter data (for 'offered' status)
//   - respondingOfferId: String appId currently being responded to (for loading state)
// Context consumed:
//   - useAuth: { user, userRole } - Current user and role
//   - useNavigate: navigate function for routing
// Side effects:
//   - useEffect [user, userRole]: Route guard and fetch applications on mount
//     - Guards: Only 'student' or 'alumni' roles allowed
//     - Fetches from job_applications table with jobs join
//     - Calls fetchOfferLetters() for any 'offered' applications
// Optimistic updates:
//   - respondToOffer: Updates application status immediately to 'hired' or 'withdrawn'
//     based on response, updates offerLetters status immediately

const ApplicationTracking = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Offer letter state
  const [offerLetters, setOfferLetters] = useState({}); // appId -> offer data
  const [respondingOfferId, setRespondingOfferId] = useState(null);

  // AI advice state
  const [aiAdvice, setAiAdvice] = useState({}); // appId -> { advice, loading }
  const [userProfile, setUserProfile] = useState(null);

  // Application insights state (for rejected applications)
  const [applicationInsights, setApplicationInsights] = useState({}); // appId -> { gap_analysis, next_steps, similar_roles, loading }
  const [generatingInsights, setGeneratingInsights] = useState(new Set());

  useEffect(() => {
    // Route guard: only applicants (student/alumni)
    if (user && !['student','alumni'].includes(userRole)) {
      toast.error('Only student and alumni accounts can view My applications.');
      navigate('/jobs', { replace: true });
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        // Query that joins job_applications with jobs to get full details.
        // RLS will scope to the current user automatically.
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            id,
            created_at,
            status,
            resume_url,
            rejection_reason,
            jobs:job_id (
              id,
              title,
              company_name,
              location,
              job_type,
              deadline,
              apply_url,
              application_url,
              external_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const rows = Array.isArray(data) ? data : [];

        // Derive source_type client-side (same semantics as v_jobs_public)
        const appsWithSourceType = rows.map(app => ({
          ...app,
          source_type: app.jobs?.application_url || app.jobs?.external_url ? 'quick_link' : 'in_app'
        }));

        setApplications(appsWithSourceType);
        
        // Fetch offer letters for applications with 'offered' status
        const offeredApps = appsWithSourceType.filter(app => normalizeStatus(app.status) === 'offered');
        if (offeredApps.length > 0) {
          await fetchOfferLetters(offeredApps);
        }
        
        // Fetch insights for rejected applications
        await fetchApplicationInsights(appsWithSourceType);
        // Filter for in_app jobs only (matching original intent)
        const inAppApplications = appsWithSourceType.filter(app => 
          app.jobs && app.jobs.source_type === 'in_app'
        );

        const enriched = await Promise.all(inAppApplications.map(async (row) => {
          const out = { ...row };
          try {
            const path = getResumePathFromValue(row.resume_url || '');
            if (path) {
              const { data: signed, error: signErr } = await supabase
                .storage
                .from('resumes')
                .createSignedUrl(path, 60 * 60);
              if (!signErr && signed?.signedUrl) {
                out._resume_signed_url = signed.signedUrl;
              }
            }
          } catch (_) { /* ignore */ }
          return out;
        }));

        setApplications(enriched);
      } catch (error) {
        logger.error('Error fetching applications:', error);
        toast.error('We could not load your applications. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
    fetchUserProfile();
  }, [user]);

  // Fetch user profile for AI advice generation
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('degree, field_of_study, branch, skills, years_of_experience, experience, work_experience, previous_roles, full_name')
        .eq('id', user.id)
        .single();
      
      if (error) {
        logger.error('Error fetching user profile:', error);
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      logger.error('Error in fetchUserProfile:', error);
    }
  };

  // Generate AI advice for an application
  const generateAdviceForApplication = useCallback(async (application) => {
    if (!userProfile || !application.jobs) return;
    
    const appId = application.id;
    
    // Set loading state
    setAiAdvice(prev => ({
      ...prev,
      [appId]: { ...prev[appId], loading: true }
    }));
    
    try {
      const result = await generateApplicationStatusAdvice(
        application.jobs,
        userProfile,
        application.status
      );
      
      if (result.success) {
        setAiAdvice(prev => ({
          ...prev,
          [appId]: { advice: result.advice, loading: false, error: null }
        }));
      } else {
        setAiAdvice(prev => ({
          ...prev,
          [appId]: { advice: null, loading: false, error: result.error }
        }));
      }
    } catch (error) {
      logger.error('Error generating AI advice:', error);
      setAiAdvice(prev => ({
        ...prev,
        [appId]: { advice: null, loading: false, error: 'Failed to generate advice' }
      }));
    }
  }, [userProfile]);

  // Fetch existing insights for rejected applications
  const fetchApplicationInsights = useCallback(async (applicationsList) => {
    if (!user) return;
    
    const rejectedApps = applicationsList.filter(app => 
      normalizeStatus(app.status) === 'rejected'
    );
    
    if (rejectedApps.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_application_insights', { p_user_id: user.id });
      
      if (error) {
        logger.error('Error fetching application insights:', error);
        return;
      }
      
      // Convert to map by application_id
      const insightsMap = {};
      (data || []).forEach(insight => {
        insightsMap[insight.application_id] = {
          gap_analysis: insight.gap_analysis,
          next_steps: insight.next_steps || [],
          similar_roles: insight.similar_roles || [],
          loading: false,
        };
      });
      
      setApplicationInsights(insightsMap);
      
      // Auto-generate insights for rejected apps that don't have them
      rejectedApps.forEach(app => {
        if (!insightsMap[app.id] && !generatingInsights.has(app.id)) {
          generateRejectionInsight(app);
        }
      });
    } catch (error) {
      logger.error('Error in fetchApplicationInsights:', error);
    }
  }, [user, generatingInsights]);

  // Generate rejection insight for an application
  const generateRejectionInsight = useCallback(async (application) => {
    if (!userProfile || !application.jobs || generatingInsights.has(application.id)) return;
    
    const appId = application.id;
    
    setGeneratingInsights(prev => new Set(prev).add(appId));
    
    // Set loading state
    setApplicationInsights(prev => ({
      ...prev,
      [appId]: { ...prev[appId], loading: true }
    }));
    
    try {
      const result = await generateRejectionInsights(
        application.jobs,
        userProfile,
        application
      );
      
      if (result.success && result.insights) {
        // Save to database via RPC
        const { error: saveError } = await supabase
          .from('application_insights')
          .insert({
            application_id: appId,
            user_id: user.id,
            gap_analysis: result.insights.gap_analysis,
            next_steps: result.insights.next_steps,
            similar_roles: result.insights.similar_roles,
          });
        
        if (saveError) {
          logger.error('Error saving insight:', saveError);
        }
        
        setApplicationInsights(prev => ({
          ...prev,
          [appId]: {
            gap_analysis: result.insights.gap_analysis,
            next_steps: result.insights.next_steps,
            similar_roles: result.insights.similar_roles,
            loading: false,
          }
        }));
      } else {
        setApplicationInsights(prev => ({
          ...prev,
          [appId]: { ...prev[appId], loading: false, error: result.error }
        }));
      }
    } catch (error) {
      logger.error('Error generating rejection insight:', error);
      setApplicationInsights(prev => ({
        ...prev,
        [appId]: { ...prev[appId], loading: false, error: 'Failed to generate insights' }
      }));
    } finally {
      setGeneratingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  }, [userProfile, user, generatingInsights]);

  // Status filters (canonical values)
  const filterOptions = [
    { value: 'all',           label: 'All Applications' },
    { value: 'submitted',     label: STATUS_LABEL.submitted },
    { value: 'under_review',  label: STATUS_LABEL.under_review },
    { value: 'shortlisted',   label: STATUS_LABEL.shortlisted },
    { value: 'interviewing',  label: STATUS_LABEL.interviewing },
    { value: 'offered',       label: STATUS_LABEL.offered },
    { value: 'hired',         label: STATUS_LABEL.hired },
    { value: 'rejected',      label: STATUS_LABEL.rejected },
    { value: 'withdrawn',     label: STATUS_LABEL.withdrawn },
  ];

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => normalizeStatus(app.status) === filter);

  const getStatusBadgeClass = (status) => {
    const canonical = normalizeStatus(status);
    return STATUS_BADGE_CLASS[canonical];
  };

  const getStatusIcon = (status) => {
    const canonical = normalizeStatus(status);
    return STATUS_ICON[canonical];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Timeline stages configuration
  const TIMELINE_STAGES = [
    { key: 'submitted', label: 'Applied', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'under_review', label: 'Under Review', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { key: 'interviewing', label: 'Interview', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { key: 'offered', label: 'Offer', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.318 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.318 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.318 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.318 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { key: 'hired', label: 'Hired', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  // Alternative end stages
  const REJECTED_STAGE = { key: 'rejected', label: 'Not Selected', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' };

  // Get timeline stage index for current status
  const getCurrentStageIndex = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'rejected') return -1; // Special case
    if (normalized === 'withdrawn') return -1; // Special case
    if (normalized === 'hired') return TIMELINE_STAGES.length - 1;
    
    const index = TIMELINE_STAGES.findIndex(stage => stage.key === normalized);
    return index >= 0 ? index : 0; // Default to first stage if unknown
  };

  const calculateDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };
  
  // Fetch offer letters for offered applications
  const fetchOfferLetters = async (offeredApps) => {
    try {
      const offers = {};
      for (const app of offeredApps) {
        // eslint-disable-next-line no-console
        console.log('[RPC CALL]', 'get_offer_letter_for_applicant', { p_application_id: app.id });
        const { data, error } = await supabase.rpc('get_offer_letter_for_applicant', {
          p_application_id: app.id,
        });
        // eslint-disable-next-line no-console
        console.log('[RPC RESULT]', 'get_offer_letter_for_applicant', { data, error });
        
        if (!error && data?.success) {
          offers[app.id] = data.offer;
        }
      }
      setOfferLetters(offers);
    } catch (err) {
      logger.error('Error fetching offer letters:', err);
    }
  };
  
  // Generate signed URL and view offer letter
  const viewOfferLetter = async (appId) => {
    const offer = offerLetters[appId];
    if (!offer?.file_path) {
      toast.error('Offer letter not available');
      return;
    }
    
    try {
      // eslint-disable-next-line no-console
      console.log('[STORAGE CALL]', 'offer-letters.createSignedUrl', { filePath: offer.file_path, expiry: 3600 });
      const { data, error } = await supabase.storage
        .from('offer-letters')
        .createSignedUrl(offer.file_path, 3600); // 1 hour expiry
      // eslint-disable-next-line no-console
      console.log('[STORAGE RESULT]', 'offer-letters.createSignedUrl', { data, error });
      
      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      logger.error('Error generating signed URL for offer letter:', err);
      toast.error('Could not open offer letter. Please try again.');
    }
  };
  
  // Accept or decline offer
  const respondToOffer = async (appId, response) => {
    try {
      setRespondingOfferId(appId);
      
      // eslint-disable-next-line no-console
      console.log('[RPC CALL]', 'respond_to_offer', { p_application_id: appId, p_response: response });
      const { data, error } = await supabase.rpc('respond_to_offer', {
        p_application_id: appId,
        p_response: response,
      });
      // eslint-disable-next-line no-console
      console.log('[RPC RESULT]', 'respond_to_offer', { data, error });
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to respond to offer');
      }
      
      // Update local state
      setApplications(apps =>
        apps.map(app => app.id === appId ? { ...app, status: data.new_status } : app)
      );
      
      // Update offer letter status
      setOfferLetters(prev => ({
        ...prev,
        [appId]: { ...prev[appId], status: response }
      }));
      
      toast.success(data.message);
      
    } catch (err) {
      logger.error('Error responding to offer:', err);
      toast.error(err.message || 'Failed to respond to offer');
    } finally {
      setRespondingOfferId(null);
    }
  };

  // Timeline Component
  const ApplicationTimeline = ({ status }) => {
    const normalized = normalizeStatus(status);
    const currentIndex = getCurrentStageIndex(status);
    const isRejected = normalized === 'rejected' || normalized === 'withdrawn';
    
    return (
      <div className="mt-4 mb-4">
        <div className="flex items-start justify-between relative">
          {/* Connecting line background */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
          
          {TIMELINE_STAGES.map((stage, index) => {
            let stageState = 'upcoming';
            
            if (isRejected) {
              // If rejected, show stages up to where they got
              if (index <= currentIndex && currentIndex >= 0) {
                stageState = 'completed';
              }
            } else {
              if (index < currentIndex) {
                stageState = 'completed';
              } else if (index === currentIndex) {
                stageState = 'current';
              }
            }
            
            const isLast = index === TIMELINE_STAGES.length - 1;
            
            return (
              <div key={stage.key} className="flex flex-col items-center flex-1">
                {/* Stage circle */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    stageState === 'current' 
                      ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100' 
                      : stageState === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stage.icon} />
                  </svg>
                </div>
                
                {/* Stage label */}
                <span 
                  className={`mt-2 text-xs font-medium text-center ${
                    stageState === 'current'
                      ? 'text-blue-700 font-semibold'
                      : stageState === 'completed'
                        ? 'text-green-700'
                        : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>
                
                {/* Connector line (except for last item) */}
                {!isLast && (
                  <div 
                    className={`absolute h-0.5 top-4 transition-all duration-300 ${
                      stageState === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{
                      left: `${((index + 0.5) / TIMELINE_STAGES.length) * 100}%`,
                      width: `${(1 / TIMELINE_STAGES.length) * 100}%`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Rejected branch if applicable */}
        {isRejected && currentIndex >= 0 && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500 text-white border-2 border-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={REJECTED_STAGE.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-red-700">
                {REJECTED_STAGE.label}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // AI Advice Card Component
  const AIAdviceCard = ({ application }) => {
    const appId = application.id;
    const adviceData = aiAdvice[appId];
    
    // Auto-generate advice when component mounts if not already generated
    useEffect(() => {
      if (userProfile && !adviceData && application.jobs) {
        generateAdviceForApplication(application);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [application.id, userProfile, generateAdviceForApplication]);
    
    if (adviceData?.loading) {
      return (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Getting personalized advice...
          </div>
        </div>
      );
    }
    
    if (adviceData?.advice) {
      return (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">AI Career Coach</p>
              <p className="text-sm text-gray-600 italic">&ldquo;{adviceData.advice}&rdquo;</p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // What to Improve Card Component (for rejected applications)
  const WhatToImproveCard = ({ application }) => {
    const appId = application.id;
    const insight = applicationInsights[appId];
    const isRejected = normalizeStatus(application.status) === 'rejected';
    
    if (!isRejected) return null;
    
    if (insight?.loading || generatingInsights.has(appId)) {
      return (
        <div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Career Coach is analyzing...</p>
              <p className="text-xs text-amber-700">Generating personalized insights for you</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (!insight?.gap_analysis) {
      return (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">Insights not available yet. Check back soon.</p>
        </div>
      );
    }
    
    return (
      <div className="mt-3 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m16.024 7.07l-.707.707M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m16.024 7.07l-.707.707" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold text-amber-900 mb-2">
              Career Coaching: What to Improve
            </h4>
            
            {/* Gap Analysis */}
            <div className="mb-4">
              <p className="text-sm font-medium text-amber-800 mb-1">Gap Analysis</p>
              <p className="text-sm text-gray-700 italic">&ldquo;{insight.gap_analysis}&rdquo;</p>
            </div>
            
            {/* Next Steps */}
            {insight.next_steps && insight.next_steps.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Next Steps</p>
                <ul className="space-y-2">
                  {insight.next_steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-semibold text-amber-800">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Similar Roles */}
            {insight.similar_roles && insight.similar_roles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-800 mb-2">Roles Better Suited for You</p>
                <div className="flex flex-wrap gap-2">
                  {insight.similar_roles.map((role, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1.5 bg-white border border-amber-300 rounded-full text-sm text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/jobs?search=${encodeURIComponent(role)}`)}
                    >
                      {role}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">Click a role to search for jobs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading your applications...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">Please log in to view your applications.</p>
        <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My applications</h2>
      
      {applications.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">You have not applied to any roles yet</h3>
          <p className="mt-1 text-gray-500">When you apply to jobs, your applications and statuses will appear here.</p>
          <div className="mt-6">
            <Link
              to="/jobs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse jobs
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filter options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.value === 'all'
                    ? `(${applications.length})`
                    : `(${applications.filter(app => normalizeStatus(app.status) === option.value).length})`}
                </option>
              ))}
            </select>
          </div>

          {/* Applications list */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <li key={application.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-lg font-medium text-blue-600 truncate">
                          <Link to={`/jobs/${application.job_id}`} className="hover:underline">
                            {application.jobs?.title || 'Unknown Position'}
                          </Link>
                        </p>
                        {(() => {
                          const canonical = normalizeStatus(application.status);
                          return (
                            <span className={`ml-2 px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(canonical)}`}>
                              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d={getStatusIcon(canonical)} clipRule="evenodd" />
                              </svg>
                              {STATUS_LABEL[canonical]}
                              <span className="sr-only">Status: {STATUS_LABEL[canonical]}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500">
                          Applied {calculateDaysAgo(application.created_at)}
                        </p>
                      </div>
                    </div>
                    {/* Application Status Timeline */}
                    <ApplicationTimeline status={application.status} />
                    
                    {/* AI Advice Card */}
                    <AIAdviceCard application={application} />

                    {/* Offer Letter Banner for Offered Status */}
                    {normalizeStatus(application.status) === 'offered' && offerLetters[application.id] && (
                      <div className="mt-3 mb-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-purple-900">
                                Offer Received!
                              </p>
                              <p className="text-sm text-purple-700">
                                Your offer letter is ready.
                                {offerLetters[application.id]?.file_name && (
                                  <span className="block text-xs text-purple-600 mt-0.5">
                                    {offerLetters[application.id].file_name}
                                  </span>
                                )}
                                {offerLetters[application.id]?.notes && (
                                  <span className="block text-xs text-purple-600 mt-1 italic">
                                    &ldquo;{offerLetters[application.id].notes}&rdquo;
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => viewOfferLetter(application.id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Offer Letter
                            </button>
                            <button
                              onClick={() => respondToOffer(application.id, 'accepted')}
                              disabled={respondingOfferId === application.id}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {respondingOfferId === application.id ? (
                                <span className="animate-pulse">Processing...</span>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Accept Offer
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => respondToOffer(application.id, 'declined')}
                              disabled={respondingOfferId === application.id}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GAP 1 FIX: Rejection Reason Display */}
                    {normalizeStatus(application.status) === 'rejected' && (
                      <div className="mt-3 mb-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-red-900">
                              Application Not Selected
                            </p>
                            <p className="text-sm text-red-800 mt-1">
                              Feedback from employer:
                            </p>
                            {application.rejection_reason ? (
                              <p className="text-sm text-red-700 mt-1 italic">
                                &ldquo;{application.rejection_reason}&rdquo;
                              </p>
                            ) : (
                              <p className="text-sm text-red-600/70 mt-1">
                                No specific feedback was provided.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Career Coaching: What to Improve Card */}
                    <WhatToImproveCard application={application} />

                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814l-4.419-3.346-4.419 3.346A1 1 0 014 16V4zm7 5a1 1 0 10-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                          </svg>
                          {application.jobs?.company_name || 'Unknown Company'}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {application.jobs?.location || 'Location not specified'}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                          </svg>
                          {application.jobs?.job_type || 'Job type not specified'}
                        </p>
                        {application._resume_signed_url && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V7.414a2 2 0 00-.586-1.414l-3.414-3.414A2 2 0 0010.586 2H8z"/>
                            </svg>
                            <a href={application._resume_signed_url} target="_blank" rel="noopener noreferrer" className="text-ocean-600 hover:underline">View Resume</a>
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <p>
                          {(() => { const d = application.jobs?.deadline || application.jobs?.application_deadline; return (
                            <>Deadline: {d ? formatDate(d) : 'Not specified'}</>
                          ); })()}
                        </p>
                      </div>
                    </div>

                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ApplicationTracking;
