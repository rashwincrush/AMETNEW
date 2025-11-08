import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { coalesceAppUrl, isQuickLink } from '../../utils/jobs';
import { requestConnectionForJob } from '../../utils/connections';
import ImageWithFallback from '../common/ImageWithFallback';

export default function JobDetailsQuickLink({ job, companyName, companyLogo, isOwner, isAdmin }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const externalUrl = useMemo(() => coalesceAppUrl(job), [job]);
  const employerId = job?.posted_by || job?.user_id || job?.created_by;
  const derivedIsOwner = !!(user?.id && employerId && user.id === employerId);
  const canEdit = (typeof isOwner === 'boolean' ? isOwner : derivedIsOwner) || isAdmin;

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
          <a
            href={externalUrl}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700"
          >
            Apply Externally
          </a>

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
        </div>

        {/* Meta row removed per minimal spec */}
      </div>

      {/* Description (only if present) */}
      {job?.description && job.description.trim() && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-2">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      {/* NOTHING ELSE. No empty “Overview”, no salary/department placeholders. */}
    </div>
  );
}
