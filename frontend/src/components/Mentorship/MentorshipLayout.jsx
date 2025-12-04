import React from 'react';
import MentorshipTabs from './MentorshipTabs';
import MentorshipHub from './MentorshipHub';
import MentorshipStatusBannerStrip from './banners/MentorshipStatusBannerStrip';

/**
 * Main layout shell for the mentorship module.
 * Provides consistent header, status banners, tab navigation, and hub.
 * Uses 4px spacing grid for atomic UI consistency.
 */
export default function MentorshipLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Mentorship
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Connect with mentors, guide mentees, and grow your professional network.
          </p>
        </div>
      </div>
      
      {/* Status Banners */}
      <MentorshipStatusBannerStrip />
      
      {/* Tab Navigation */}
      <MentorshipTabs />

      {/* Hub Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <MentorshipHub />
      </div>
    </div>
  );
}
