import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasOverviewData } from '../../utils/jobs';
import { getApplicantsCount } from '../../utils/applicants';
import JobApplicationForm from './JobApplicationForm';
import { requestConnectionForJob } from '../../utils/connections';
import toast from 'react-hot-toast'; // Assuming you have react-hot-toast installed

export default function JobDetailsInApp({ job, companyName, companyLogo, isOwner, isAdmin }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = isOwner || isAdmin;
  const employerId = job?.posted_by || job?.user_id || job?.created_by;

  if (!job) return null;

  // Helper functions to handle string or array fields
  const getListFromField = (field) => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') return field.split('\n').map(item => item.trim()).filter(item => item);
    return [];
  };

  const responsibilities = getListFromField(job.responsibilities);
  const requirements = getListFromField(job.requirements);
  const benefits = getListFromField(job.benefits);
  const niceToHaveSkills = Array.isArray(job.nice_to_have_skills) ? job.nice_to_have_skills : (job.preferredQualifications || []);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName || 'Company'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-gray-400">Logo</span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                In-App
              </span>
            </div>
            {!!companyName && (
              <div className="mt-1 text-ocean-600 font-medium">{companyName}</div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <Link to={`/jobs/${job.id}/edit`} className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50">
                Edit Job
              </Link>
            )}
            {isOwner || isAdmin ? (
              <Link to={`/jobs/${job.id}/manage`} className="px-3 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 text-sm">
                Manage Applications
              </Link>
            ) : (
              user?.id && employerId && user.id !== employerId ? (
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
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  Connect with Employer
                </button>
              ) : null
            )}
          </div>
        </div>

        {/* Minimal meta: Deadline only if present */}
        {job?.application_deadline && (
          <div className="mt-4 text-xs text-gray-500">
            Deadline: {new Date(job.application_deadline).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Layout: description + overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary/Description */}
          {(job.description || job.summary) && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {job.description || job.summary}
              </p>
            </div>
          )}

          {/* Responsibilities */}
          {responsibilities.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">Responsibilities</h2>
              <ul className="space-y-2">
                {responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1 text-lg font-bold">•</span>
                    <span className="text-gray-700">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Qualifications */}
          {requirements.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">Qualifications</h2>
              <ul className="space-y-2">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1 text-lg font-bold">•</span>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nice-to-have Skills */}
          {niceToHaveSkills.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">Nice-to-have Skills</h2>
              <div className="flex flex-wrap gap-2">
                {niceToHaveSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">Benefits & Perks</h2>
              <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1 text-lg">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* About the Company */}
          {(job.about_the_company || job.companyInfo?.description) && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-2">About the Company</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {job.about_the_company || job.companyInfo?.description}
              </p>
            </div>
          )}

          {/* Application form for non-owners */}
          {user?.id && user.id !== job.posted_by && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <JobApplicationForm jobId={job.id} />
            </div>
          )}
        </div>

        {/* Overview (render only if something to show) */}
        {hasOverviewData(job) && (
          <aside className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-base font-semibold mb-3">Job Overview</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              {job?.industry && <li><span className="text-gray-500">Industry:</span> {job.industry}</li>}
              {job?.department && <li><span className="text-gray-500">Department:</span> {job.department}</li>}
              {job?.location && <li><span className="text-gray-500">Location:</span> {job.location}</li>}
              {job?.job_type && <li><span className="text-gray-500">Job Type:</span> {job.job_type}</li>}
              {job?.experience_level && <li><span className="text-gray-500">Experience Level:</span> {job.experience_level}</li>}
              {job?.work_mode && <li><span className="text-gray-500">Work Mode:</span> {job.work_mode}</li>}
              {(job?.salary_min != null && job?.salary_max != null) && (
                <li><span className="text-gray-500">Salary:</span> {job.currency || 'USD'} {job.salary_min} – {job.salary_max}</li>
              )}
              {job?.application_deadline && <li><span className="text-gray-500">Deadline:</span> {new Date(job.application_deadline).toLocaleDateString()}</li>}
              {(() => { const c = getApplicantsCount(job); return c !== null ? (<li><span className="text-gray-500">Applicants:</span> {c}</li>) : null; })()}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
