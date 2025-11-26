import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { coalesceAppUrl, isQuickLink } from '../../utils/jobs';
import { requestConnectionForJob } from '../../utils/connections';
import ImageWithFallback from '../common/ImageWithFallback';
import { supabase } from '../../utils/supabase';

export default function JobDetailsQuickLink({ job, companyName, companyLogo, isOwner, isAdmin }) {
  const { user, userRole, getUserRole } = useAuth();
  const navigate = useNavigate();
  const externalUrl = useMemo(() => coalesceAppUrl(job), [job]);
  const employerId = job?.posted_by || job?.user_id || job?.created_by;
  const derivedIsOwner = !!(user?.id && employerId && user.id === employerId);
  const canEdit = (typeof isOwner === 'boolean' ? isOwner : derivedIsOwner) || isAdmin;
  const role = userRole || (typeof getUserRole === 'function' ? getUserRole() : null);
  const isEmployer = role === 'employer';
  const skills = Array.isArray(job?.skills)
    ? job.skills
    : typeof job?.skills === 'string'
      ? job.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  // Guards
  if (!job || !isQuickLink(job)) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
            <ImageWithFallback
              src={companyLogo}
              alt={companyName || 'Company'}
              className="w-14 h-14"
              placeholderSrc="/default-avatar.svg"
              emptyMessage="Employer logo to be uploaded"
            />
          </div>

          {/* Title & Meta */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Quick Link
              </span>
            </div>
            {!!companyName && (
              <div className="mt-1 text-ocean-600 font-medium">{companyName}</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {canEdit && (
              <Link to={`/jobs/${job.id}/edit`} className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50">
                Edit Job
              </Link>
            )}
            {/* No "Manage Applications" for Quick Links */}
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
          {isEmployer ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-400 cursor-not-allowed"
              aria-disabled="true"
            >
              Accepting Applications
            </button>
          ) : (
            <button
              onClick={() => {
                if (!externalUrl) return;
                const ok = window.confirm("External listing. Clicking will take you to a page outside the Alumni portal. Continue?");
                if (ok) window.open(externalUrl, '_blank', 'noopener');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700"
            >
              Apply Externally
            </button>
          )}

          {/* Optional: Ask Employer if viewer isn’t the poster */}
          {user?.id && employerId && user.id !== employerId && (
            <button
              onClick={async () => {
                try {
                  await requestConnectionForJob(job.id, employerId, user?.id);
                } catch (error) {
                  console.error('Failed to request connection:', error);
                  toast.error('Connection request failed. Please try again.');
                }
                navigate(`/messages?peer=${employerId}&job=${job.id}`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Ask Employer
            </button>
          )}

          {canEdit && (
            <button
              onClick={async () => {
                const ok = window.confirm('Disable this external job? Applicants will no longer see Apply on this listing.');
                if (!ok) return;
                try {
                  const { error } = await supabase
                    .from('jobs')
                    .update({ is_active: false })
                    .eq('id', job.id);
                  if (error) throw error;
                  toast.success('Quick Link disabled');
                } catch (e) {
                  console.error('Disable Quick Link failed', e);
                  toast.error('Failed to disable. Please try again.');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
            >
              Disable
            </button>
          )}
        </div>

        {/* External disclaimer */}
        <p className="mt-3 text-xs text-gray-500">
          External listing. You will be redirected to the employer's site to apply. Availability depends on the external deadline.
        </p>

        {/* Meta row removed per minimal spec */}
      </div>

      {/* Description (only if present) */}
      {job?.description && job.description.trim() && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-2">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mt-4">
          <h2 className="text-lg font-semibold mb-2">Key Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* NOTHING ELSE. No empty “Overview”, no salary/department placeholders. */}
    </div>
  );
}
