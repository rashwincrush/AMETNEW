import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { getLatestEdge, idempotentConnect } from '../../utils/connections';
import { log } from '../../utils/log';
import logger from '../../utils/logger';
import { isQuickLink } from '../../utils/jobs';
import { APPLICATION_STATUS, STATUS_LABEL, normalizeStatus } from '../../utils/applicationStatus';
import { generateApplicantRanking } from '../../services/groqService';

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

const STATUS_MAP = {
  'Submitted': 'submitted',
  'Under review': 'reviewed',
  'Shortlisted': 'interviewing',
  'Offered': 'offered',
  'Rejected': 'rejected',
};

const CANONICAL_DB_VALUES = new Set(Object.values(STATUS_MAP));

const DB_TO_LABEL = {
  'submitted': 'Submitted',
  'reviewed': 'Under review',
  'interviewing': 'Shortlisted',
  'offered': 'Offered',
  'rejected': 'Rejected',
  'applied': 'Submitted',
  'under_review': 'Under review',
  'shortlisted': 'Shortlisted',
  'hired': 'Offered',
};

function getLabelForStatus(status) {
  return DB_TO_LABEL[status] || (status ? String(status) : 'Submitted');
}

function mapLabelToDb(label) {
  const dbValue = STATUS_MAP[label] ?? label?.toLowerCase()?.trim();
  return dbValue;
}

// Screen reader only styles for live region
const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
};

// STATE INVENTORY
// Local state:
//   - applications: Array of job applications with enriched data (signed URLs, display names)
//   - savingIds: Set of application IDs currently being updated (for loading spinners)
//   - job: Job details object for the managed job
//   - loading: Boolean for initial data fetch
//   - error: Error message string for fetch failures
//   - connMap: Map of applicant_id -> connection status (connected, pending, etc.)
//   - currentPage: Number for pagination (1-based)
//   - totalCount: Total number of applications for pagination
//   - toastMessage: String for screen reader live region announcements
//   - resumeLoadingIds: Set of application IDs with resume loading in progress
//   - resumeErrors: Object mapping app.id -> error message for resume fetch failures
//   - resumeAnnouncements: Object mapping app.id -> ARIA live announcement text
//   - statusFilter: String filter value ('all' or specific status)
//   - sortOrder: String sort direction ('newest' or 'oldest')
//   - offerModalOpen: Boolean controlling offer letter modal visibility
//   - offerModalApp: Application object for the active offer modal
//   - offerFile: File object for the offer letter upload
//   - offerNotes: String notes for the offer letter
//   - offerUploading: Boolean for offer letter upload in progress
//   - selectedIds: Set of selected application IDs for bulk operations
//   - bulkStatusTarget: String target status for bulk update
//   - bulkConfirmOpen: Boolean controlling bulk confirm dialog
//   - bulkUpdating: Boolean for bulk update in progress
//   - bulkFailedIds: Array of IDs that failed in bulk update
//   - pageSize: Constant (10) for pagination page size
// Refs:
//   - isMountedRef: Boolean ref for component mount state (cleanup)
//   - toastLiveRef: DOM ref for screen reader live region
//   - previousStatusesRef: Map of appId -> previous status (for undo functionality)
//   - statusDropdownRefs: Map of appId -> dropdown DOM ref (for focus management)
// Context consumed:
//   - useAuth: { user, isAdmin } - Current user and admin status
//   - useParams: { jobId, id } - Route parameters (job ID)
//   - useNavigate: navigate function for routing
// Side effects:
//   - useEffect []: Set isMountedRef on mount/unmount
//   - useEffect [actualJobId, user, isAdmin, currentPage]: Fetch job and applications data
//   - useEffect [fetchJobAndApplications]: Trigger fetch when callback changes
// Optimistic updates:
//   - handleStatusChange: Updates application status in UI immediately, reverts on error
//   - handleUndoStatusChange: Reverts status immediately, restores on error
//   - proceedWithStatusUpdate: Background RPC call after optimistic update
//   - handleSendOffer: Updates status to 'offered' in UI immediately on success
//   - handleBulkStatusUpdate: Updates all selected applications status immediately

const ManageJobApplications = () => {
  const { jobId, id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [applications, setApplications] = useState([]);
  const [savingIds, setSavingIds] = useState(new Set());
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connMap, setConnMap] = useState(new Map()); // applicant_id -> status
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(''); // For screen reader announcements
  const [resumeLoadingIds, setResumeLoadingIds] = useState(new Set()); // Track which resumes are loading
  const [resumeErrors, setResumeErrors] = useState({}); // Track resume fetch errors keyed by app.id
  const [resumeAnnouncements, setResumeAnnouncements] = useState({}); // ARIA live announcements per resume
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' or specific status
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  
  // Offer letter modal state
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerModalApp, setOfferModalApp] = useState(null);
  const [offerFile, setOfferFile] = useState(null);
  const [offerNotes, setOfferNotes] = useState('');
  const [offerUploading, setOfferUploading] = useState(false);
  
  // Bulk status update state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatusTarget, setBulkStatusTarget] = useState('');
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkFailedIds, setBulkFailedIds] = useState([]);
  
  // Rejection reason modal state (GAP 1 FIX)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionModalApp, setRejectionModalApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null); // Stores { applicationId, newStatus, previousStatus, applicantName }

  // AI Ranking state
  const [applicantRankings, setApplicantRankings] = useState({}); // applicant_id -> { score, summary, ranked_at }
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingApplicants, setRankingApplicants] = useState(new Set()); // Applicants currently being ranked
  const [rankSortEnabled, setRankSortEnabled] = useState(false); // Whether to sort by ranking score
  
  const pageSize = 10;
  const isMountedRef = useRef(true);
  const toastLiveRef = useRef(null);
  const previousStatusesRef = useRef(new Map()); // Store previous status for undo: appId -> status
  const statusDropdownRefs = useRef(new Map()); // Store refs to status dropdowns for focus

  // Handle both parameter names (jobId and id)
  const actualJobId = jobId || id;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchJobAndApplications = useCallback(async () => {
    if (!user || !actualJobId) {
      if (isMountedRef.current) {
        setError("Invalid or missing job ID.");
        setLoading(false);
      }
      return;
    }

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      // Session snapshot
      const { data: { session } } = await supabase.auth.getSession();
      log.group('[APPS] session', { hasSession: !!session, userId: session?.user?.id, jobId: actualJobId });

      // Fetch job details (admin-aware: allow admins to see any job)
      const t0 = performance.now();
      let jobQuery = supabase
        .from('jobs')
        .select('id, title, posted_by, user_id, created_by, company_id')
        .eq('id', actualJobId);

      // If admin, no additional filter needed; RLS will allow
      // If not admin, add ownership filter to prevent unauthorized access
      if (!isAdmin) {
        jobQuery = jobQuery.or(`posted_by.eq.${user.id},user_id.eq.${user.id},created_by.eq.${user.id}`);
      }

      const jobResp = await jobQuery.single();
      const jobData = jobResp.data; const jobError = jobResp.error;
      log.group('[APPS] job fetch', {
        ms: +(performance.now() - t0).toFixed(1),
        error: jobError ? { code: jobError.code, message: jobError.message, details: jobError.details } : null,
        gotRow: !!jobData
      });

      if (jobError || !jobData) {
        if (isMountedRef.current) {
          setError("This job either doesn’t exist or you’re not authorized to view its applications.");
          setJob(null);
          setApplications([]);
        }
        return;
      }

      if (isMountedRef.current) {
        setJob(jobData);
      }

      // Determine ownership (posted_by OR user_id OR created_by) or admin
      const ownerIds = [jobData.posted_by, jobData.user_id, jobData.created_by].filter(Boolean);
      const isOwner = ownerIds.includes(user.id) || isAdmin;

      if (isOwner) {
        // Use owner-scoped RPC with paging and total_count
        const offset = (currentPage - 1) * pageSize;
        const t1 = performance.now();
        // eslint-disable-next-line no-console
        console.log('[RPC CALL]', 'get_applications_for_job_v2', { p_job_id: actualJobId, p_limit: pageSize, p_offset: offset });
        const { data: rpcRows, error: rpcErr2 } = await supabase.rpc('get_applications_for_job_v2', {
          p_job_id: actualJobId,
          p_limit: pageSize,
          p_offset: offset,
        });
        // eslint-disable-next-line no-console
        console.log('[RPC RESULT]', 'get_applications_for_job_v2', { data: rpcRows, error: rpcErr2 });
        log.group('[APPS] list via get_applications_for_job', {
          ms: +(performance.now() - t1).toFixed(1),
          error: rpcErr2 ? { code: rpcErr2.code, message: rpcErr2.message, details: rpcErr2.details } : null,
          rows: Array.isArray(rpcRows) ? rpcRows.length : 0
        });
        if (rpcErr2) throw rpcErr2;
        const baseRows = Array.isArray(rpcRows) ? rpcRows : [];
        baseRows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        // Enrich rows: signed URL fallback and applicant display name
        const enriched = await Promise.all(baseRows.map(async (row) => {
          const out = { ...row };
          try {
            // Derive an authorization-checked resume path via RPC before signing
            // eslint-disable-next-line no-console
            console.log('[RPC CALL]', 'get_job_application_resume_path_for_viewer', { p_application_id: row.id });
            const { data: resumePath, error: pathErr } = await supabase.rpc(
              'get_job_application_resume_path_for_viewer',
              { p_application_id: row.id }
            );
            // eslint-disable-next-line no-console
            console.log('[RPC RESULT]', 'get_job_application_resume_path_for_viewer', { data: resumePath, error: pathErr });

            if (!pathErr && resumePath) {
              const { data: signed, error: signErr } = await supabase
                .storage
                .from('resumes')
                .createSignedUrl(resumePath, 60 * 60);
              if (!signErr && signed?.signedUrl) {
                out._resume_signed_url = signed.signedUrl;
              }
            }
          } catch (_) { /* ignore */ }

          try {
            // Applicant display name fallback if RPC did not return applicant_name
            if (!out.applicant_name && out.applicant_id) {
              const { data: prof } = await supabase
                .from('profiles')
                .select('full_name, name, first_name, last_name')
                .eq('id', out.applicant_id)
                .maybeSingle();
              if (prof) {
                out._applicant_display = (
                  prof.full_name ||
                  prof.name ||
                  [prof.first_name, prof.last_name].filter(Boolean).join(' ') ||
                  'Applicant'
                );
              }
            }
          } catch (_) { /* ignore */ }
          return out;
        }));

        if (isMountedRef.current) {
          setApplications(enriched);
          setTotalCount(baseRows[0]?.total_count ?? 0);
        }
        // Load connection status for each applicant
        if (user?.id && Array.isArray(baseRows)) {
          const entries = await Promise.all(
            baseRows.map(async (app) => {
              const otherId = app.applicant_id;
              if (!otherId) return [null, null];
              try {
                const edge = await getLatestEdge(user.id, otherId);
                return [otherId, edge?.status || null];
              } catch (e) {
                return [otherId, null];
              }
            })
          );
          const map = new Map(entries.filter(([k]) => !!k));
          if (isMountedRef.current) {
            setConnMap(map);
          }
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      log.group('[APPS] fetch error', { error: err });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [actualJobId, user, isAdmin, currentPage]);

  useEffect(() => {
    fetchJobAndApplications();
  }, [fetchJobAndApplications]);

  // Fetch cached AI rankings for this job
  const fetchApplicantRankings = useCallback(async () => {
    if (!actualJobId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_applicant_rankings_for_job', { p_job_id: actualJobId });
      
      if (error) {
        logger.error('Error fetching applicant rankings:', error);
        return;
      }
      
      // Convert to map by applicant_id
      const rankingsMap = {};
      (data || []).forEach(ranking => {
        rankingsMap[ranking.applicant_id] = {
          score: ranking.score,
          summary: ranking.summary,
          ranked_at: ranking.ranked_at,
          application_id: ranking.application_id,
        };
      });
      
      setApplicantRankings(rankingsMap);
    } catch (error) {
      logger.error('Error in fetchApplicantRankings:', error);
    }
  }, [actualJobId]);

  // Generate AI ranking for a single applicant
  const generateRankingForApplicant = async (application, jobDetails) => {
    if (!application.applicant_id || !jobDetails) return;
    
    const applicantId = application.applicant_id;
    
    // Add to loading set
    setRankingApplicants(prev => new Set(prev).add(applicantId));
    
    try {
      // Fetch applicant profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, degree, field_of_study, skills, years_of_experience, work_experience, expected_graduation_year')
        .eq('id', applicantId)
        .single();
      
      if (profileError || !profile) {
        logger.error('Error fetching applicant profile:', profileError);
        return;
      }
      
      // Call Groq API
      const result = await generateApplicantRanking(jobDetails, profile);
      
      if (result.success) {
        // Save to database
        const { error: saveError } = await supabase
          .rpc('upsert_applicant_ranking', {
            p_job_id: actualJobId,
            p_applicant_id: applicantId,
            p_application_id: application.id,
            p_score: result.score,
            p_summary: result.summary,
          });
        
        if (saveError) {
          logger.error('Error saving ranking:', saveError);
        }
        
        // Update local state
        setApplicantRankings(prev => ({
          ...prev,
          [applicantId]: {
            score: result.score,
            summary: result.summary,
            ranked_at: new Date().toISOString(),
            application_id: application.id,
          }
        }));
      } else {
        logger.error('Error generating ranking:', result.error);
      }
    } catch (error) {
      logger.error('Error in generateRankingForApplicant:', error);
    } finally {
      setRankingApplicants(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicantId);
        return newSet;
      });
    }
  };

  // Generate rankings for all applicants without cached scores
  const generateAllRankings = async () => {
    if (!job || applications.length === 0) return;
    
    setRankingLoading(true);
    toast.loading('Generating AI rankings for all applicants...');
    
    try {
      // Get applicants that need ranking
      const applicantsNeedingRanking = applications.filter(app => 
        !applicantRankings[app.applicant_id] && !rankingApplicants.has(app.applicant_id)
      );
      
      if (applicantsNeedingRanking.length === 0) {
        toast.success('All applicants already have rankings!');
        return;
      }
      
      // Generate rankings sequentially to avoid rate limits
      for (const application of applicantsNeedingRanking) {
        await generateRankingForApplicant(application, job);
      }
      
      toast.success(`Ranked ${applicantsNeedingRanking.length} applicants`);
    } catch (error) {
      logger.error('Error generating all rankings:', error);
      toast.error('Failed to generate some rankings');
    } finally {
      setRankingLoading(false);
    }
  };

  // Re-rank all applicants (clear cache and regenerate)
  const handleReRank = async () => {
    if (!actualJobId || !job) return;
    
    if (!window.confirm('This will clear all existing rankings and regenerate them. Continue?')) {
      return;
    }
    
    setRankingLoading(true);
    toast.loading('Clearing old rankings and regenerating...');
    
    try {
      // Clear existing rankings
      await supabase.rpc('clear_applicant_rankings', { p_job_id: actualJobId });
      
      // Clear local state
      setApplicantRankings({});
      
      // Regenerate all rankings
      await generateAllRankings();
    } catch (error) {
      logger.error('Error re-ranking:', error);
      toast.error('Failed to re-rank applicants');
    } finally {
      setRankingLoading(false);
    }
  };

  // Load rankings when job data is available
  useEffect(() => {
    if (job && actualJobId) {
      fetchApplicantRankings();
    }
  }, [job, actualJobId, fetchApplicantRankings]);

  // Helper to get score badge color
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Ref to store dropdown refs for focus management
  const setStatusDropdownRef = (appId, el) => {
    if (el) statusDropdownRefs.current.set(appId, el);
  };

  // NOTE: areAllVisibleSelected is defined after filteredApplications useMemo below

  const handleStatusChange = async (applicationId, newStatus) => {
    // Find the current app and store previous status for potential undo
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;
    
    const previousStatus = app.status;
    const applicantName = app._applicant_display || app.applicant_name || 'Applicant';
    const newStatusLabel = getLabelForStatus(newStatus);
    
    // GAP 1 FIX: If status is 'rejected', show rejection reason modal first
    if (newStatus === 'rejected') {
      setRejectionModalApp(app);
      setRejectionReason('');
      setInternalNotes(app.employer_internal_notes || '');
      setPendingStatusUpdate({ applicationId, newStatus, previousStatus, applicantName });
      setRejectionModalOpen(true);
      return;
    }
    
    // Store previous status for undo
    previousStatusesRef.current.set(applicationId, previousStatus);
    
    // Optimistically update UI immediately
    setApplications(apps =>
      apps.map(a => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );
    
    // Show saving state
    setSavingIds(prev => new Set(prev).add(applicationId));
    
    // Track undo toast ID for potential dismissal
    let undoToastId = null;
    let undoClicked = false;
    
    // Show toast with undo button (5 second duration)
    undoToastId = toast.success(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Status updated to {newStatusLabel} for {applicantName}</span>
          <button
            onClick={() => {
              undoClicked = true;
              toast.dismiss(t.id);
              handleUndoStatusChange(applicationId, previousStatus, applicantName);
            }}
            className="px-2 py-1 text-xs font-medium bg-white text-ocean-700 rounded hover:bg-gray-100 transition-colors"
          >
            Undo
          </button>
        </div>
      ),
      {
        duration: 5000,
        onClose: () => {
          // If toast closed naturally (not via undo) and component still mounted, proceed
          if (!undoClicked && isMountedRef.current) {
            proceedWithStatusUpdate(applicationId, newStatus, previousStatus, applicantName, undoToastId, null, null);
          }
        }
      }
    );
    
    // Announce to screen readers
    setToastMessage(`Status updated to ${newStatusLabel} for ${applicantName}`);
    
    // Call RPC immediately in background (no rejection reason for non-rejected statuses)
    proceedWithStatusUpdate(applicationId, newStatus, previousStatus, applicantName, undoToastId, null, null);
  };
  
  // GAP 1 FIX: Handle rejection reason submission
  const handleRejectionSubmit = async () => {
    if (!pendingStatusUpdate) return;
    
    const { applicationId, newStatus, previousStatus, applicantName } = pendingStatusUpdate;
    
    // Store previous status for undo
    previousStatusesRef.current.set(applicationId, previousStatus);
    
    // Optimistically update UI immediately
    setApplications(apps =>
      apps.map(a => (a.id === applicationId ? { ...a, status: newStatus, rejection_reason: rejectionReason, employer_internal_notes: internalNotes } : a))
    );
    
    // Close modal
    setRejectionModalOpen(false);
    setRejectionModalApp(null);
    
    // Show saving state
    setSavingIds(prev => new Set(prev).add(applicationId));
    
    // Show success toast
    const toastId = toast.success(
      `Application rejected for ${applicantName}${rejectionReason ? ' with feedback' : ''}`
    );
    
    // Announce to screen readers
    setToastMessage(`Application rejected for ${applicantName}${rejectionReason ? ' with feedback' : ''}`);
    
    // Call RPC with rejection reason and internal notes
    await proceedWithStatusUpdate(applicationId, newStatus, previousStatus, applicantName, toastId, rejectionReason, internalNotes);
    
    // Clear pending update
    setPendingStatusUpdate(null);
    setRejectionReason('');
    setInternalNotes('');
  };
  
  // GAP 1 FIX: Handle rejection modal cancel
  const handleRejectionCancel = () => {
    setRejectionModalOpen(false);
    setRejectionModalApp(null);
    setPendingStatusUpdate(null);
    setRejectionReason('');
    setInternalNotes('');
  };
  
  const proceedWithStatusUpdate = async (applicationId, newStatus, previousStatus, applicantName, toastId, rejectionReason = null, internalNotes = null) => {
    try {
      if (!CANONICAL_DB_VALUES.has(newStatus)) {
        log.group('[APPS] invalid status for DB', { newStatus });
        throw new Error('Invalid status');
      }
      
      // GAP 1 FIX: Pass rejection reason and internal notes to RPC
      // eslint-disable-next-line no-console
      console.log('[RPC CALL]', 'set_application_status', { 
        p_application_id: applicationId, 
        p_status: newStatus, 
        p_notes: null,
        p_rejection_reason: rejectionReason,
        p_internal_notes: internalNotes
      });
      const { error } = await supabase.rpc('set_application_status', {
        p_application_id: applicationId,
        p_status: newStatus,
        p_notes: null,
        p_rejection_reason: rejectionReason,
        p_internal_notes: internalNotes,
      });
      // eslint-disable-next-line no-console
      console.log('[RPC RESULT]', 'set_application_status', { error });

      if (error) throw error;
      
      // Success - clear previous status from undo storage
      previousStatusesRef.current.delete(applicationId);
      
    } catch (err) {
      log.group('[APPS] error updating status', { error: err, applicationId, newStatus, previousStatus });
      
      // Revert optimistic UI update
      setApplications(apps =>
        apps.map(app => (app.id === applicationId ? { ...app, status: previousStatus } : app))
      );
      
      // Dismiss the undo toast if still showing
      if (toastId) toast.dismiss(toastId);
      
      const msg = (err?.code === '42501' || err?.code === 'P0001' || err?.status === 403 || /RLS|permission|not allowed/i.test(err?.message || ''))
        ? 'Only the job owner can manage applications.'
        : 'Could not update status. Please try again.';
      
      toast.error(msg);
      setToastMessage(msg);
      
      // Refocus the dropdown for the failed application
      setTimeout(() => {
        const dropdownEl = statusDropdownRefs.current.get(applicationId);
        if (dropdownEl) {
          const select = dropdownEl.querySelector('select');
          if (select) select.focus();
        }
      }, 100);
      
    } finally {
      if (isMountedRef.current) {
        setSavingIds(prev => {
          const next = new Set(prev);
          next.delete(applicationId);
          return next;
        });
      }
    }
  };
  
  // Handle sending offer letter
  const handleSendOffer = async () => {
    if (!offerModalApp || !offerFile) return;
    
    const applicationId = offerModalApp.id;
    const applicantName = offerModalApp._applicant_display || offerModalApp.applicant_name || 'Applicant';
    
    try {
      setOfferUploading(true);
      
      // Validate file size (max 5MB)
      if (offerFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!validTypes.includes(offerFile.type)) {
        toast.error('Only PDF and DOCX files are allowed');
        return;
      }
      
      // Generate file path: {employerId}/{applicationId}/{filename}
      const fileExt = offerFile.name.split('.').pop();
      const cleanFileName = offerFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${applicationId}/${Date.now()}_${cleanFileName}`;
      
      // Upload file to offer-letters bucket
      // eslint-disable-next-line no-console
      console.log('[STORAGE CALL]', 'offer-letters.upload', { filePath, fileSize: offerFile.size, fileType: offerFile.type });
      const { error: uploadError } = await supabase.storage
        .from('offer-letters')
        .upload(filePath, offerFile, {
          cacheControl: '3600',
        });
      // eslint-disable-next-line no-console
      console.log('[STORAGE RESULT]', 'offer-letters.upload', { error: uploadError });
      
      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Call RPC to send offer letter
      // eslint-disable-next-line no-console
      console.log('[RPC CALL]', 'send_offer_letter', { p_application_id: applicationId, p_file_path: filePath, p_file_name: offerFile.name, p_notes: offerNotes?.trim() || null });
      const { data: rpcResult, error: rpcError } = await supabase.rpc('send_offer_letter', {
        p_application_id: applicationId,
        p_file_path: filePath,
        p_file_name: offerFile.name,
        p_notes: offerNotes?.trim() || null,
      });
      // eslint-disable-next-line no-console
      console.log('[RPC RESULT]', 'send_offer_letter', { data: rpcResult, error: rpcError });
      
      if (rpcError) {
        // Clean up uploaded file on RPC failure
        // eslint-disable-next-line no-console
        console.log('[STORAGE CALL]', 'offer-letters.remove', { filePath });
        const removeResult = await supabase.storage.from('offer-letters').remove([filePath]);
        // eslint-disable-next-line no-console
        console.log('[STORAGE RESULT]', 'offer-letters.remove', removeResult);
        throw rpcError;
      }
      
      if (!rpcResult?.success) {
        throw new Error(rpcResult?.error || 'Failed to send offer letter');
      }
      
      // Update local state to reflect new status
      setApplications(apps =>
        apps.map(app => (app.id === applicationId ? { ...app, status: 'offered' } : app))
      );
      
      toast.success(`Offer letter sent to ${applicantName}`);
      setToastMessage(`Offer letter sent to ${applicantName}`);
      
      // Close modal and reset state
      setOfferModalOpen(false);
      setOfferModalApp(null);
      setOfferFile(null);
      setOfferNotes('');
      
    } catch (err) {
      log.error('Error sending offer letter:', err);
      toast.error(err.message || 'Failed to send offer letter');
    } finally {
      setOfferUploading(false);
    }
  };

  // Check if applicant is eligible for offer (shortlisted or interviewing)
  const canSendOffer = (status) => {
    const normalized = normalizeStatus(status);
    return ['shortlisted', 'interviewing', 'reviewed'].includes(normalized);
  };

  const handleUndoStatusChange = async (applicationId, previousStatus, applicantName) => {
    // Revert UI immediately (optimistic)
    setApplications(apps =>
      apps.map(app => (app.id === applicationId ? { ...app, status: previousStatus } : app))
    );
    
    setSavingIds(prev => new Set(prev).add(applicationId));
    
    try {
      // Call RPC to revert status
      // eslint-disable-next-line no-console
      console.log('[RPC CALL]', 'set_application_status (undo)', { p_application_id: applicationId, p_status: previousStatus, p_notes: null });
      const { error } = await supabase.rpc('set_application_status', {
        p_application_id: applicationId,
        p_status: previousStatus,
        p_notes: null,
      });
      // eslint-disable-next-line no-console
      console.log('[RPC RESULT]', 'set_application_status (undo)', { error });

      if (error) throw error;
      
      // Clear stored previous status
      previousStatusesRef.current.delete(applicationId);
      
      toast.success(`Status reverted for ${applicantName}`);
      setToastMessage(`Status reverted for ${applicantName}`);
      
    } catch (err) {
      log.group('[APPS] error reverting status', { error: err, applicationId, previousStatus });
      
      const msg = (err?.code === '42501' || err?.code === 'P0001' || err?.status === 403 || /RLS|permission|not allowed/i.test(err?.message || ''))
        ? 'Only the job owner can manage applications.'
        : 'Could not revert status. Please try again.';
      
      toast.error(msg);
      setToastMessage(msg);
      
    } finally {
      if (isMountedRef.current) {
        setSavingIds(prev => {
          const next = new Set(prev);
          next.delete(applicationId);
          return next;
        });
      }
    }
  };

  const handleRequestConnection = async (otherId) => {
    if (!user?.id || !otherId) return;
    try {
      await idempotentConnect(user.id, otherId);
      toast.success('Connection request sent.');
      setToastMessage('Connection request sent');
      // Refresh connection map for this applicant
      const edge = await getLatestEdge(user.id, otherId);
      if (isMountedRef.current) {
        setConnMap(prev => new Map(prev).set(otherId, edge?.status || 'pending'));
      }
    } catch (e) {
      // idempotentConnect already toasts on failure
      setToastMessage('Connection request failed');
    }
  };

  // Handle view resume click with loading state and accessibility announcements
  const handleViewResume = async (appId) => {
    if (!appId) return;
    
    // Prevent double-clicks
    if (resumeLoadingIds.has(appId)) return;
    
    // Clear any previous error for this app
    setResumeErrors(prev => ({ ...prev, [appId]: null }));
    
    // Set loading state
    setResumeLoadingIds(prev => new Set(prev).add(appId));
    
    // Announce to screen readers
    setResumeAnnouncements(prev => ({ ...prev, [appId]: 'Fetching resume, please wait.' }));
    
    try {
      // Derive an authorization-checked resume path via RPC before signing
      // eslint-disable-next-line no-console
      console.log('[RPC CALL]', 'get_job_application_resume_path_for_viewer', { p_application_id: appId });
      const { data: resumePath, error: pathErr } = await supabase.rpc(
        'get_job_application_resume_path_for_viewer',
        { p_application_id: appId }
      );
      // eslint-disable-next-line no-console
      console.log('[RPC RESULT]', 'get_job_application_resume_path_for_viewer', { data: resumePath, error: pathErr });

      if (pathErr || !resumePath) {
        throw new Error('Could not retrieve resume path');
      }

      // Generate signed URL
      const { data: signed, error: signErr } = await supabase
        .storage
        .from('resumes')
        .createSignedUrl(resumePath, 60 * 60);

      if (signErr || !signed?.signedUrl) {
        throw new Error('Could not generate resume URL');
      }

      // Open in new tab
      window.open(signed.signedUrl, '_blank', 'noopener,noreferrer');
      
      // Announce success
      setResumeAnnouncements(prev => ({ ...prev, [appId]: 'Resume opened in new tab.' }));
      
    } catch (err) {
      log.group('[APPS] resume fetch error', { error: err, appId });
      
      // Set error state for this app
      setResumeErrors(prev => ({ 
        ...prev, 
        [appId]: 'Could not open resume. Try again.' 
      }));
      
      // Announce error to screen readers
      setResumeAnnouncements(prev => ({ 
        ...prev, 
        [appId]: 'Error: Could not open resume. Please try again.' 
      }));
      
    } finally {
      // Clear loading state
      setResumeLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      
      // Clear announcement after a delay (so screen readers have time to announce)
      setTimeout(() => {
        if (isMountedRef.current) {
          setResumeAnnouncements(prev => ({ ...prev, [appId]: '' }));
        }
      }, 3000);
    }
  };

  const canMessage = (otherId) => {
    const status = connMap.get(otherId);
    return status === 'accepted' || status === 'connected';
  };
  
  // GAP 4 FIX: Allow direct messaging for active job applicants (in hiring pipeline)
  const canMessageApplicant = (app) => {
    const activeStatuses = ['under_review', 'shortlisted', 'interviewing', 'offered', 'reviewed'];
    return activeStatuses.includes(normalizeStatus(app.status));
  };

  // Filter and sort applications client-side
  const filteredApplications = useMemo(() => {
    let result = [...applications];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(app => normalizeStatus(app.status) === statusFilter);
    }
    
    // Apply sorting
    if (rankSortEnabled) {
      // Sort by AI ranking score (highest first), then by date
      result.sort((a, b) => {
        const scoreA = applicantRankings[a.applicant_id]?.score || 0;
        const scoreB = applicantRankings[b.applicant_id]?.score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA; // Higher score first
        // Tie-breaker: date
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
    } else {
      // Apply sorting by created_at
      result.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
    }
    
    return result;
  }, [applications, statusFilter, sortOrder, rankSortEnabled, applicantRankings]);

  // Check if all visible rows are selected — defined AFTER filteredApplications to avoid TDZ
  const areAllVisibleSelected = filteredApplications.length > 0 &&
    filteredApplications.every(app => selectedIds.has(app.id));

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSortOrder('newest');
  };

  // Bulk status update handlers
  const toggleSelection = (appId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredApplications.map(app => app.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      // Deselect all visible
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkFailedIds([]);
  };

  const handleBulkStatusUpdate = async (retryFailedOnly = false) => {
    const idsToUpdate = retryFailedOnly 
      ? bulkFailedIds 
      : Array.from(selectedIds);
    
    if (idsToUpdate.length === 0 || (!retryFailedOnly && !bulkStatusTarget)) return;
    
    const targetStatus = retryFailedOnly ? bulkStatusTarget : bulkStatusTarget;
    
    try {
      setBulkUpdating(true);
      
      // Show progress toast
      const progressToastId = toast.loading(
        `Updating ${idsToUpdate.length} applicant${idsToUpdate.length > 1 ? 's' : ''}…`,
        { duration: Infinity }
      );
      
      // Call bulk RPC
      // eslint-disable-next-line no-console
      console.log('[RPC CALL]', 'bulk_set_application_status', { p_application_ids: idsToUpdate, p_status: targetStatus, p_notes: null, count: idsToUpdate.length });
      const { data: result, error } = await supabase.rpc('bulk_set_application_status', {
        p_application_ids: idsToUpdate,
        p_status: targetStatus,
        p_notes: null,
      });
      // eslint-disable-next-line no-console
      console.log('[RPC RESULT]', 'bulk_set_application_status', { data: result, error });
      
      toast.dismiss(progressToastId);
      
      if (error) throw error;
      
      if (!result?.success && result?.failed_count > 0) {
        // Partial or complete failure
        setBulkFailedIds(result.failed_ids || []);
        
        if (result.succeeded_count > 0) {
          // Mixed results
          toast.error(
            <div>
              {result.succeeded_count} updated, {result.failed_count} failed.
              <button 
                onClick={() => handleBulkStatusUpdate(true)}
                className="ml-2 underline text-blue-600 hover:text-blue-800"
              >
                Retry failed
              </button>
            </div>,
            { duration: 10000 }
          );
        } else {
          // All failed
          toast.error(`Failed to update ${result.failed_count} applicants. Please try again.`);
        }
        
        // Update succeeded ones in UI
        if (result.succeeded_ids?.length > 0) {
          setApplications(apps =>
            apps.map(app => 
              result.succeeded_ids.includes(app.id) 
                ? { ...app, status: targetStatus } 
                : app
            )
          );
        }
        
      } else {
        // All succeeded
        setApplications(apps =>
          apps.map(app => 
            idsToUpdate.includes(app.id) 
              ? { ...app, status: targetStatus } 
              : app
          )
        );
        
        setBulkFailedIds([]);
        clearSelection();
        
        toast.success(`Done — ${result.succeeded_count} applicant${result.succeeded_count > 1 ? 's' : ''} moved to ${STATUS_LABEL[targetStatus] || targetStatus}`);
        
        // Refresh list to get updated data
        await fetchJobAndApplications();
      }
      
    } catch (err) {
      log.error('Error in bulk status update:', err);
      toast.error(err.message || 'Failed to update applicants');
    } finally {
      setBulkUpdating(false);
      setBulkConfirmOpen(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Screen reader live region for toast announcements */}
      <div 
        ref={toastLiveRef}
        aria-live="assertive" 
        aria-atomic="true"
        style={srOnlyStyles}
      >
        {toastMessage}
      </div>
      {loading && (
        <div className="py-10"><LoadingSpinner message="Loading applications..." /></div>
      )}
      {(!loading && !actualJobId) && (
        <div className="text-center py-10 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 font-medium">Invalid or missing job ID</div>
          <p className="text-red-500 text-sm mt-1">Please check the URL and try again.</p>
        </div>
      )}
      {(!loading && error) && (
        <div className="text-center py-10 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 font-medium">Access Denied</div>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <p className="text-gray-500 text-xs mt-2">You need to be the job poster or an administrator to view applications.</p>
        </div>
      )}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-4"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Applications</h1>
          <h2 className="text-xl text-gray-600">For: {job?.title || 'Unknown job'}</h2>
        </div>
      </div>
      
      {(() => {
        const quick = isQuickLink(job);
        if (quick) {
          return (
            <div className="mb-6 p-4 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
              This is a Quick Link job. Applications are collected on the external site, so there may be no in-app applicants here.
            </div>
          );
        }

        const ownerIds = [job?.posted_by, job?.user_id, job?.created_by].filter(Boolean);
        const isOwner = ownerIds.includes(user.id) || isAdmin;

        if (!isOwner && !isAdmin) {
          return (
            <div className="mb-6 p-4 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-100">
              You are not authorized to view applications for this job.
            </div>
          );
        }

        return (
          applications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-4">No one has applied to this job yet.</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Share this job on social media to attract more applicants</p>
                <p>• Consider reviewing your job requirements and salary</p>
                <p>• Check back later for new applications</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filter and Sort Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Status Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 mr-1">Filter by status:</span>
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        statusFilter === 'all'
                          ? 'bg-ocean-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {APPLICATION_STATUS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          statusFilter === status
                            ? 'bg-ocean-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    ))}
                  </div>

                  {/* Sort Control */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Sort by date:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setSortOrder('newest')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          sortOrder === 'newest' && !rankSortEnabled
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Newest first
                      </button>
                      <button
                        onClick={() => setSortOrder('oldest')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          sortOrder === 'oldest' && !rankSortEnabled
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Oldest first
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Ranking Controls */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">AI Ranking:</span>
                    <button
                      onClick={() => setRankSortEnabled(!rankSortEnabled)}
                      disabled={Object.keys(applicantRankings).length === 0}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        rankSortEnabled
                          ? 'bg-purple-600 text-white'
                          : Object.keys(applicantRankings).length === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {rankSortEnabled ? 'Sorted by AI Score' : 'Sort by AI Score'}
                    </button>
                    <button
                      onClick={handleReRank}
                      disabled={rankingLoading}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className={`w-4 h-4 ${rankingLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {rankingLoading ? 'Ranking...' : 'Re-rank All'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {Object.keys(applicantRankings).length} of {applications.length} ranked
                  </div>
                </div>

                {/* Result Count and Clear Filters */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{filteredApplications.length}</span> of{' '}
                    <span className="font-semibold text-gray-900">{applications.length}</span> applicants
                    {statusFilter !== 'all' && (
                      <span className="ml-1 text-ocean-600">(filtered by {STATUS_LABEL[statusFilter]})</span>
                    )}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-ocean-600 hover:text-ocean-700 font-medium hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No applications match the selected filter.</p>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="mt-2 text-sm text-ocean-600 hover:text-ocean-700 font-medium hover:underline"
                  >
                    Show all applications
                  </button>
                </div>
              ) : (
                <>
                  {/* Bulk Action Bar */}
                  {selectedIds.size > 0 && (
                    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm p-4 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedIds.size} applicant{selectedIds.size > 1 ? 's' : ''} selected
                          </span>
                          <button
                            onClick={clearSelection}
                            className="text-sm text-ocean-600 hover:text-ocean-700 underline"
                          >
                            Clear selection
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Move to…</label>
                          <select
                            value={bulkStatusTarget}
                            onChange={(e) => setBulkStatusTarget(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
                          >
                            <option value="">Select status…</option>
                            {APPLICATION_STATUS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setBulkConfirmOpen(true)}
                            disabled={!bulkStatusTarget || bulkUpdating}
                            className="px-4 py-1.5 text-sm font-medium bg-ocean-600 text-white rounded-md hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Apply to selected
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile list (sm and below) */}
                  <div className="md:hidden space-y-3">
                    {filteredApplications.map(app => (
                      <div key={app.id} className="bg-white shadow rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelection(app.id)}
                            className="w-4 h-4 mt-0.5 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500 flex-shrink-0"
                            aria-label={`Select applicant ${app._applicant_display || app.applicant_name || 'Applicant'}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <Link to={`/jobs/${actualJobId}/applicants/${app.applicant_id}`} className="block font-medium text-gray-900 truncate hover:underline">
                                {app._applicant_display || app.applicant_name || 'Applicant'}
                              </Link>
                              {/* AI Ranking Badge */}
                              {applicantRankings[app.applicant_id] && (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreBadgeClass(applicantRankings[app.applicant_id].score)}`}>
                                    {applicantRankings[app.applicant_id].score}
                                  </span>
                                </div>
                              )}
                              {rankingApplicants.has(app.applicant_id) && (
                                <span className="text-xs text-gray-400">Analyzing...</span>
                              )}
                            </div>
                            {/* AI Summary */}
                            {applicantRankings[app.applicant_id]?.summary && (
                              <div className="mt-1 text-xs text-purple-700 italic">
                                {applicantRankings[app.applicant_id].summary}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-500">Applied on {new Date(app.created_at).toLocaleDateString()}</div>
                        <div className="mt-2 text-sm">
                          {app._resume_signed_url ? (
                            <>
                              <button
                                onClick={() => handleViewResume(app.id)}
                                disabled={resumeLoadingIds.has(app.id)}
                                className={`text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed ${resumeLoadingIds.has(app.id) ? 'animate-pulse' : ''}`}
                                aria-describedby={`resume-live-${app.id}`}
                              >
                                {resumeLoadingIds.has(app.id) ? 'Opening…' : 'View Resume'}
                              </button>
                              <span 
                                id={`resume-live-${app.id}`}
                                aria-live="polite" 
                                className="sr-only"
                              >
                                {resumeAnnouncements[app.id] || ''}
                              </span>
                              {resumeErrors[app.id] && (
                                <div 
                                  role="alert" 
                                  className="mt-1 text-xs text-red-600 font-medium"
                                >
                                  {resumeErrors[app.id]}
                                </div>
                              )}
                              <div className="mt-1 text-xs text-gray-500 space-x-2">
                                {app.resume_from_profile ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Profile</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700">New Upload</span>}
                                {app.matches_primary ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-700">Primary</span> : null}
                                {app.resume_uploaded_at ? <span>Uploaded: {new Date(app.resume_uploaded_at).toLocaleDateString()}</span> : null}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">No resume</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Status</label>
                        <div ref={(el) => setStatusDropdownRef(app.id, el)} aria-live="polite" aria-atomic="true">
                          {(() => {
                            const currentLabel = getLabelForStatus(app.status);
                            const currentDb = CANONICAL_DB_VALUES.has(app.status)
                              ? app.status
                              : mapLabelToDb(currentLabel);
                            const isNonCanonical = !CANONICAL_DB_VALUES.has(app.status);
                            return (
                              <select
                                value={currentDb}
                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                disabled={savingIds.has(app.id)}
                                aria-label={`Update status for ${app.applicant_name || 'applicant'}`}
                                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md disabled:opacity-60"
                              >
                                {isNonCanonical && (
                                  <option value={app.status} disabled>{currentLabel} (legacy)</option>
                                )}
                                <option value="submitted">Submitted</option>
                                <option value="reviewed">Under review</option>
                                <option value="interviewing">Shortlisted</option>
                                <option value="offered">Offered</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            );
                          })()}
                        </div>
                        {savingIds.has(app.id) && (
                          <div className="text-xs text-gray-400 mt-1" aria-live="polite">Saving…</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Link to={`/jobs/${actualJobId}/applicants/${app.applicant_id}`} className="text-ocean-600 hover:underline text-sm">View Profile</Link>
                        {(canMessage(app.applicant_id) || canMessageApplicant(app)) ? (
                          <button 
                            onClick={() => navigate(`/messages?peer=${app.applicant_id}&job=${actualJobId}`)} 
                            className="text-blue-600 hover:underline text-sm"
                            title={canMessageApplicant(app) ? "Direct message — active applicant" : "Message"}
                          >
                            Message
                          </button>
                        ) : (
                          <button onClick={() => handleRequestConnection(app.applicant_id)} className="text-green-600 hover:underline text-sm">Request Connection</button>
                        )}
                        {canSendOffer(app.status) && (
                          <button 
                            onClick={() => { setOfferModalApp(app); setOfferModalOpen(true); }}
                            className="text-purple-600 hover:underline text-sm font-medium"
                          >
                            Send Offer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table (md and up) */}
              <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={areAllVisibleSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                          aria-label="Select all applicants on this page"
                          title="Select all on this page"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map(app => (
                      <tr key={app.id}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelection(app.id)}
                            className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                            aria-label={`Select applicant ${app._applicant_display || app.applicant_name || 'Applicant'}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <Link to={`/directory/${app.applicant_id}`} className="text-sm font-medium text-gray-900 hover:underline">
                              {app._applicant_display || app.applicant_name || 'Applicant'}
                            </Link>
                            {/* AI Summary */}
                            {applicantRankings[app.applicant_id]?.summary && (
                              <div className="mt-1 text-xs text-purple-700 italic max-w-xs">
                                {applicantRankings[app.applicant_id].summary}
                              </div>
                            )}
                            {rankingApplicants.has(app.applicant_id) && (
                              <span className="text-xs text-gray-400 mt-1">Analyzing...</span>
                            )}
                          </div>
                        </td>
                        {/* AI Ranking Score */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {applicantRankings[app.applicant_id] ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreBadgeClass(applicantRankings[app.applicant_id].score)}`}>
                                {applicantRankings[app.applicant_id].score}
                              </span>
                              {applicantRankings[app.applicant_id].score >= 80 && (
                                <span className="text-xs text-green-600">★ Top Match</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {app._resume_signed_url ? (
                            <div>
                              <button
                                onClick={() => handleViewResume(app.id)}
                                disabled={resumeLoadingIds.has(app.id)}
                                className={`text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed ${resumeLoadingIds.has(app.id) ? 'animate-pulse' : ''}`}
                                aria-describedby={`resume-live-desktop-${app.id}`}
                              >
                                {resumeLoadingIds.has(app.id) ? 'Opening…' : 'View Resume'}
                              </button>
                              <span 
                                id={`resume-live-desktop-${app.id}`}
                                aria-live="polite" 
                                className="sr-only"
                              >
                                {resumeAnnouncements[app.id] || ''}
                              </span>
                              {resumeErrors[app.id] && (
                                <div 
                                  role="alert" 
                                  className="mt-1 text-xs text-red-600 font-medium"
                                >
                                  {resumeErrors[app.id]}
                                </div>
                              )}
                              <div className="mt-1 text-xs text-gray-500 space-x-2">
                                {app.resume_from_profile ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Profile</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700">New Upload</span>}
                                {app.matches_primary ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-700">Primary</span> : null}
                                {app.resume_uploaded_at ? <span>Uploaded: {new Date(app.resume_uploaded_at).toLocaleDateString()}</span> : null}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div ref={(el) => setStatusDropdownRef(app.id, el)} aria-live="polite" aria-atomic="true">
                            {(() => {
                              const currentLabel = getLabelForStatus(app.status);
                              const currentDb = CANONICAL_DB_VALUES.has(app.status)
                                ? app.status
                                : mapLabelToDb(currentLabel);
                              const isNonCanonical = !CANONICAL_DB_VALUES.has(app.status);
                              return (
                                <select
                                  value={currentDb}
                                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                  disabled={savingIds.has(app.id)}
                                  aria-label={`Update status for ${app.applicant_name || 'applicant'}`}
                                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-60"
                                >
                                  {isNonCanonical && (
                                    <option value={app.status} disabled>{currentLabel} (legacy)</option>
                                  )}
                                  <option value="submitted">Submitted</option>
                                  <option value="reviewed">Under review</option>
                                  <option value="interviewing">Shortlisted</option>
                                  <option value="offered">Offered</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              );
                            })()}
                          </div>
                          {savingIds.has(app.id) && (
                            <div className="text-xs text-gray-400 mt-1" aria-live="polite">Saving…</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <Link to={`/jobs/${actualJobId}/applicants/${app.applicant_id}`} className="text-ocean-600 hover:underline">View Profile</Link>
                          {(canMessage(app.applicant_id) || canMessageApplicant(app)) ? (
                            <button 
                              onClick={() => navigate(`/messages?peer=${app.applicant_id}&job=${actualJobId}`)} 
                              className="text-blue-600 hover:underline"
                              title={canMessageApplicant(app) ? "Direct message — active applicant" : "Message"}
                            >
                              Message
                            </button>
                          ) : (
                            <button onClick={() => handleRequestConnection(app.applicant_id)} className="text-green-600 hover:underline">Request Connection</button>
                          )}
                          {canSendOffer(app.status) && (
                            <button 
                              onClick={() => { setOfferModalApp(app); setOfferModalOpen(true); }}
                              className="text-purple-600 hover:underline font-medium"
                            >
                              Send Offer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              )}
            </>
          )
        );
      })()}
      
      {/* Bulk Status Update Confirmation Modal */}
      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Bulk Update
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Update <span className="font-medium text-gray-900">{selectedIds.size}</span> applicant{selectedIds.size > 1 ? 's' : ''} to{' '}
              <span className="font-medium text-gray-900">{STATUS_LABEL[bulkStatusTarget] || bulkStatusTarget}</span>?
            </p>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ This action cannot be undone in bulk.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkConfirmOpen(false)}
                disabled={bulkUpdating}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkStatusUpdate(false)}
                disabled={bulkUpdating}
                className="px-4 py-2 text-sm font-medium bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkUpdating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Updating…
                  </>
                ) : (
                  'Confirm Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Letter Modal */}
      {offerModalOpen && offerModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Send Offer Letter
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Sending offer to: <span className="font-medium text-gray-900">
                {offerModalApp._applicant_display || offerModalApp.applicant_name || 'Applicant'}
              </span>
            </p>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Letter (PDF or DOCX, max 5MB) *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setOfferFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {offerFile && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {offerFile.name} ({(offerFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={offerNotes}
                onChange={(e) => setOfferNotes(e.target.value)}
                placeholder="Add any additional notes for the applicant..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                rows={3}
              />
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOfferModalOpen(false);
                  setOfferModalApp(null);
                  setOfferFile(null);
                  setOfferNotes('');
                }}
                disabled={offerUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendOffer}
                disabled={!offerFile || offerUploading}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {offerUploading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  'Send Offer Letter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAP 1 FIX: Rejection Reason Modal */}
      {rejectionModalOpen && rejectionModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reject Application
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting: <span className="font-medium text-gray-900">
                {rejectionModalApp._applicant_display || rejectionModalApp.applicant_name || 'Applicant'}
              </span>
            </p>
            
            {/* Rejection Reason - Visible to Applicant */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-gray-500 font-normal">(optional but encouraged)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                This feedback will be shared with the applicant to help them improve.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., 'We require 3+ years of experience for this role.' or 'The position has been filled.'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {rejectionReason.length}/500 characters
              </p>
            </div>
            
            {/* Internal Notes - Private to Employer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes <span className="text-gray-500 font-normal">(private, applicant won't see this)</span>
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Your private notes about this candidate (e.g., 'Good fit for future roles', 'Screening call notes')..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm bg-gray-50"
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {internalNotes.length}/1000 characters
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleRejectionCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectionSubmit}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalCount > pageSize && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200"
          >
            Previous
          </button>
          <span className="min-h-[44px] px-4 py-2 rounded-lg bg-ocean-600 text-white font-medium flex items-center">
            Page {currentPage} of {Math.ceil(totalCount / pageSize)}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
            className="inline-flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
};

export default ManageJobApplications;
