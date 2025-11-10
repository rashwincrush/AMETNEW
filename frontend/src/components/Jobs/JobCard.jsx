import React from 'react';
import { Link } from 'react-router-dom';
import { getDeadline, isExpired } from '../../utils/jobs';
import { isAdmin } from '../../utils/roles';
import dayjs from 'dayjs';

export default function JobCard({ row, role }) {
  const expired = isExpired(row);
  const deadline = getDeadline(row);
  const deadlineLabel = deadline ? dayjs(deadline).format('DD MMM YYYY') : '—';

  const canManage =
    isAdmin(role) || row.posted_by === row?.__auth_user_id || row.created_by === row?.__auth_user_id;

  return (
    <article className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{row.title}</h3>
          <p className="text-sm text-gray-600">{row.company_name ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{row.location ?? '—'}</p>
        </div>
        {expired ? (
          <span className="text-xs px-2 py-1 rounded-full border bg-gray-50">Applications Closed</span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full border">Open</span>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-700 line-clamp-3">{row.description}</div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
        <span>Deadline: {deadlineLabel}</span>
        <div className="flex items-center gap-2">
          {canManage ? (
            <Link to={`/jobs/${row.id}/applications`} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">
              Manage Applications
            </Link>
          ) : expired ? (
            <button className="px-3 py-1.5 rounded-lg border opacity-60 cursor-not-allowed">Apply</button>
          ) : (
            <Link to={`/jobs/${row.id}`} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">
              View
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
