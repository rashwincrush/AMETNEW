import React from 'react';
import { MessageSquare, UserMinus, Loader2 } from 'lucide-react';

export function MessageButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        inline-flex items-center gap-2 rounded-xl px-4 py-2
        bg-gradient-to-br from-sky-500 to-blue-600 text-white
        shadow-sm hover:shadow active:scale-[.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500
        disabled:opacity-60 disabled:cursor-not-allowed
      "
      aria-label="Message"
    >
      <MessageSquare className="h-4 w-4" />
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
        inline-flex items-center gap-2 rounded-xl px-4 py-2
        border border-red-300 text-red-600 bg-white
        hover:bg-red-50
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500
        disabled:opacity-60 disabled:cursor-not-allowed
      "
      aria-label="Remove connection"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
      <span>{loading ? 'Removing…' : 'Remove'}</span>
    </button>
  );
}
