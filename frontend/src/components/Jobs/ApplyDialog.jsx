import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ApplyDialog({ open, onClose, jobId, deadline, onSuccess }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef(null);
  const prevFocusRef = useRef(null);
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  const formatKolkata = (iso) => {
    try {
      return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
    } catch (_) { return new Date(iso).toLocaleDateString(); }
  };

  useEffect(() => {
    if (!open) return;
    // Save and restore focus
    prevFocusRef.current = document.activeElement;
    // Focus first focusable in dialog
    const t = setTimeout(() => {
      try {
        if (!dialogRef.current) return;
        const focusables = dialogRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length) (focusables[0]).focus();
      } catch (_) { void 0; }
    }, 0);
    return () => {
      clearTimeout(t);
      const el = prevFocusRef.current;
      if (el && typeof el.focus === 'function') {
        try { el.focus(); } catch (_) { void 0; }
      }
    };
  }, [open]);

  const deadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      // Trap focus
      const focusables = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to apply.');
      return;
    }
    if (deadlinePassed) {
      toast.error('Applications are closed.');
      return;
    }
    if (!file) {
      toast.error('Please upload your resume.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('File too large (max 10 MB).');
      return;
    }
    const allowedExt = ['pdf','doc','docx'];
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowedExt.includes(ext)) {
      toast.error('Unsupported file type. Please upload PDF, DOC, or DOCX.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting application...');
    try {
      // Upload resume to storage: resumes/{userId}/{uuid}-{originalName}
      const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${user.id}/${uuid}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('resumes').upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      // Create a short-lived signed URL for confirmation display
      let signedUrl = null;
      try {
        const { data: signed } = await supabase.storage.from('resumes').createSignedUrl(path, 60 * 60);
        signedUrl = signed?.signedUrl || null;
      } catch (_) { void 0; }

      // Insert application with minimal columns (trust RLS)
      const base = { job_id: jobId };
      let insertPayload = base;

      // Try with resume_url if column exists; on failure due to column absence, retry without
      let res = await supabase.from('job_applications').insert({ ...insertPayload, resume_url: path }).select('id').single();
      if (res.error && /column\s+"?resume_url"?/i.test(res.error.message || '')) {
        res = await supabase.from('job_applications').insert(base).select('id').single();
      }
      if (res.error) {
        const msg = (res.error.status === 403 || /RLS|Not allowed|permission/i.test(res.error.message))
          ? "You’re not allowed to apply to this job."
          : (/(deadline|closed|inactive|status)/i.test(res.error.message) ? 'Applications are closed.' : res.error.message);
        throw new Error(msg);
      }

      if (onSuccess) onSuccess({ signedUrl, path });
      toast.success('Application submitted!', { id: toastId });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit application.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'flex' : 'hidden'} items-center justify-center`} role="dialog" aria-modal="true" aria-labelledby="apply-dialog-title" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close apply dialog" />
      <div ref={dialogRef} className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl p-6">
        <h3 id="apply-dialog-title" className="text-lg font-semibold mb-4">Apply to Job</h3>
        {deadline && (
          <div className="text-xs text-gray-500 mb-2">Apply by {formatKolkata(deadline)}</div>
        )}
        {deadlinePassed && (
          <div className="mb-3 p-2 rounded bg-red-50 text-red-600 border border-red-200 text-sm">Applications are closed.</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF/DOC/DOCX)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (!f) { setFile(null); return; }
                if (f.size > MAX_SIZE) { toast.error('File too large (max 10 MB).'); e.target.value=''; setFile(null); return; }
                const ext = (f.name.split('.').pop() || '').toLowerCase();
                if (!['pdf','doc','docx'].includes(ext)) { toast.error('Unsupported file type.'); e.target.value=''; setFile(null); return; }
                setFile(f);
              }}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {submitting && (
              <div className="mt-2 text-xs text-gray-500" aria-live="polite">Uploading and submitting…</div>
            )}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a short note to the employer (won’t be saved if column is absent)."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2" aria-label="Cancel and close apply dialog">Cancel</button>
            <button type="submit" disabled={submitting || deadlinePassed} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2" aria-label="Submit application">
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
