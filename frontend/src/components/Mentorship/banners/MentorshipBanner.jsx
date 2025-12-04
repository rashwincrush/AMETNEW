import React from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

/**
 * Generic banner component for mentorship status messages.
 * Supports different variants (info, success, warning, danger) and role contexts.
 */
export default function MentorshipBanner({
  variant = 'info',
  role,
  title,
  body,
  primaryCta,
  secondaryCta,
}) {
  const navigate = useNavigate();
  
  const variantStyles = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
  };
  
  const handleCtaClick = (cta) => {
    if (cta.onClick) {
      cta.onClick();
    } else if (cta.to) {
      navigate(cta.to);
    }
  };
  
  return (
    <div
      className={clsx(
        'rounded-lg border px-4 py-3',
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
        variantStyles[variant]
      )}
      role="alert"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {role && (
            <span className="inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium">
              {role === 'mentee' && '🎓 Mentee'}
              {role === 'mentor' && '👨‍🏫 Mentor'}
              {role === 'both' && '🎓👨‍🏫 Both'}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            {body && (
              <p className="mt-1 text-sm opacity-90">{body}</p>
            )}
          </div>
        </div>
      </div>
      
      {(primaryCta || secondaryCta) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {secondaryCta && (
            <button
              onClick={() => handleCtaClick(secondaryCta)}
              className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium bg-white/60 hover:bg-white/80 transition-colors"
            >
              {secondaryCta.label}
            </button>
          )}
          {primaryCta && (
            <button
              onClick={() => handleCtaClick(primaryCta)}
              className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold bg-white hover:bg-white/90 transition-colors shadow-sm"
            >
              {primaryCta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
