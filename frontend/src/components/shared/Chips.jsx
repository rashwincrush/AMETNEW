import React from 'react';
import { AcademicCapIcon, BuildingOffice2Icon, BriefcaseIcon } from '@heroicons/react/24/outline';

const base = 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] text-slate-700';
const iconCls = 'h-4 w-4 text-slate-400';

export function TextPill({ children, className = '' }) {
  if (!children) return null;
  return <span className={`${base} ${className}`}>{children}</span>;
}

function Chip({ icon: Icon, children, title }) {
  if (!children) return null;
  return (
    <span className={base} title={title || (typeof children === 'string' ? children : undefined)}>
      {Icon ? <Icon className={iconCls} /> : null}
      <span className="truncate max-w-[220px]">{children}</span>
    </span>
  );
}

export const DegreeChip = ({ children }) => (
  <Chip icon={AcademicCapIcon}>{children}</Chip>
);

export const DeptChip = ({ children }) => (
  <Chip icon={AcademicCapIcon}>{children}</Chip>
);

export const CompanyChip = ({ children }) => (
  <Chip icon={BuildingOffice2Icon}>{children}</Chip>
);

export const PositionChip = ({ children }) => (
  <Chip icon={BriefcaseIcon}>{children}</Chip>
);
