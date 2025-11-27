import React from 'react';
import { MessageSquare, UserMinus, Loader2 } from 'lucide-react';

// Primary CTAs: solid blue (Connect, Message, key actions)
export const primaryButtonClasses = `
  inline-flex items-center justify-center gap-2
  rounded-lg px-4 py-2.5 text-sm font-semibold
  bg-ocean-500 text-white shadow-sm
  hover:bg-ocean-600
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2
  disabled:opacity-60 disabled:cursor-not-allowed
  active:scale-[0.98] transition-all duration-150
`;

// Secondary CTAs: calm purple outline (View Profile, etc.)
export const secondaryButtonClasses = `
  inline-flex items-center justify-center gap-1.5
  rounded-lg px-4 py-2.5 text-sm font-semibold
  border border-purple-500 text-purple-600 bg-white
  hover:bg-purple-50 hover:text-purple-700
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
  disabled:opacity-60 disabled:cursor-not-allowed
  active:scale-[0.98] transition-all duration-150
`;

export function MessageButton({ onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${primaryButtonClasses} min-h-[44px] ${className}`}
      aria-label="Send message"
    >
      <MessageSquare className="h-4 w-4" aria-hidden="true" />
      <span>Message</span>
    </button>
  );
}

export function RemoveButton({ onClick, disabled, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="
        inline-flex items-center justify-center gap-2
        min-h-[44px] rounded-lg px-4 py-2.5 text-sm font-semibold
        border-2 border-red-300 text-red-700 bg-white
        hover:bg-red-50 hover:border-red-400
        active:scale-[0.98] transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500
        disabled:opacity-60 disabled:cursor-not-allowed
      "
      aria-label="Remove connection"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserMinus className="h-4 w-4" aria-hidden="true" />}
      <span>{loading ? 'Removing…' : 'Remove'}</span>
    </button>
  );
}

// Generic wrappers (optional use elsewhere)
export function PrimaryButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`${primaryButtonClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`${secondaryButtonClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
