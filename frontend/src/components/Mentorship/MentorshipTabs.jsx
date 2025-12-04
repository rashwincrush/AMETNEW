import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMentorshipRoleContext } from '../../hooks/useMentorshipRoleContext.js';
import clsx from 'clsx';

/**
 * Role-aware tab navigation for mentorship module.
 * Uses query params (?tab=...) instead of separate routes.
 * Shows different tabs based on role: mentee-only, mentor-only, or dual-role.
 */
export default function MentorshipTabs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleContext = useMentorshipRoleContext();
  
  const activeTab = searchParams.get('tab') || 'find';
  
  // Build role-aware tab configuration
  const tabs = useMemo(() => {
    const {
      isMenteeApproved,
      hasMentorProfile,
      isDualRole,
      isStudent,
    } = roleContext;
    
    const allTabs = [];
    
    // Mentee-only tabs (student or alumni mentee without mentor profile)
    if (isMenteeApproved && !hasMentorProfile) {
      allTabs.push(
        { key: 'find', label: 'Find Mentors', icon: '🔍' },
        { key: 'mentee', label: 'My Mentors', icon: '👥' },
        { key: 'requests', label: 'My Requests', icon: '📨', sub: 'sent' },
        { key: 'settings', label: 'Settings', icon: '⚙️', mode: 'mentee' }
      );
    }
    
    // Mentor-only tabs (has mentor profile but not mentee-approved)
    else if (hasMentorProfile && !isMenteeApproved) {
      allTabs.push(
        { key: 'mentor', label: 'My Mentees', icon: '🎓' },
        { key: 'requests', label: 'Requests', icon: '📨', sub: 'received' },
        { key: 'settings', label: 'Settings', icon: '⚙️', mode: 'mentor' }
      );
    }
    
    // Dual-role tabs (both mentee and mentor)
    else if (isDualRole) {
      allTabs.push(
        { key: 'find', label: 'Find Mentors', icon: '🔍' },
        { key: 'mentee', label: 'My Mentors', icon: '👥' },
        { key: 'mentor', label: 'My Mentees', icon: '🎓' },
        { key: 'requests', label: 'Requests', icon: '📨' },
        { key: 'settings', label: 'Settings', icon: '⚙️' }
      );
    }
    
    // Fallback: basic tabs for unapproved users
    else {
      allTabs.push(
        { key: 'find', label: 'Find Mentors', icon: '🔍' },
        { key: 'settings', label: 'Settings', icon: '⚙️' }
      );
    }
    
    return allTabs;
  }, [roleContext]);
  
  const handleTabClick = (tab) => {
    const params = new URLSearchParams();
    params.set('tab', tab.key);
    
    // Add sub-param if specified
    if (tab.sub) {
      params.set('sub', tab.sub);
    }
    
    // Add mode-param if specified
    if (tab.mode) {
      params.set('mode', tab.mode);
    }
    
    navigate(`/mentorship?${params.toString()}`);
  };
  
  if (tabs.length === 0) return null;
  
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <nav 
          className="flex gap-2 overflow-x-auto py-3 scrollbar-hide" 
          role="tablist"
          aria-label="Mentorship navigation"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.key}-panel`}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
                  'transition-colors duration-150 whitespace-nowrap',
                  'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
                  // Ensure 44x44px touch target on mobile
                  'min-h-[44px] sm:min-h-[36px]',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
