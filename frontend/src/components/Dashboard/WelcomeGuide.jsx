import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircleIcon, 
  UsersIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

// ============================================
// WELCOME GUIDE COMPONENT
// ============================================
// Shows first-time users a guided onboarding experience
// with clear next steps to reduce cognitive load

const STORAGE_KEY = 'amet_welcome_dismissed';
const COMPLETED_STEPS_KEY = 'amet_onboarding_steps';

/**
 * Check if user has completed their profile
 */
function isProfileComplete(profile) {
  if (!profile) return false;
  
  const requiredFields = ['first_name', 'last_name'];
  const hasRequired = requiredFields.every(field => profile[field]);
  
  // Check for at least some optional fields filled
  const optionalFields = ['company_name', 'current_job_title', 'bio', 'avatar_url'];
  const optionalFilled = optionalFields.filter(field => profile[field]).length;
  
  return hasRequired && optionalFilled >= 2;
}

/**
 * WelcomeGuide - First-time user onboarding component
 */
export function WelcomeGuide({ className = '' }) {
  const { user, profile, userRole } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load dismissed state and completed steps from localStorage
  useEffect(() => {
    try {
      const dismissedValue = localStorage.getItem(STORAGE_KEY);
      const stepsValue = localStorage.getItem(COMPLETED_STEPS_KEY);
      
      if (dismissedValue === 'true') {
        setDismissed(true);
      }
      
      if (stepsValue) {
        setCompletedSteps(JSON.parse(stepsValue));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Auto-mark profile step as complete if profile is filled
  useEffect(() => {
    if (isProfileComplete(profile) && !completedSteps.includes('profile')) {
      markStepComplete('profile');
    }
  }, [profile, completedSteps]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  const markStepComplete = (stepId) => {
    if (completedSteps.includes(stepId)) return;
    
    const newSteps = [...completedSteps, stepId];
    setCompletedSteps(newSteps);
    
    try {
      localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(newSteps));
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  // Don't show if dismissed or all steps complete
  if (dismissed) return null;

  // Define onboarding steps based on role
  const getSteps = () => {
    const baseSteps = [
      {
        id: 'profile',
        title: 'Complete your profile',
        description: 'Add your photo, bio, and work details to help others find you.',
        icon: UserCircleIcon,
        link: '/profile',
        linkText: 'Edit Profile',
        priority: 1,
      },
      {
        id: 'directory',
        title: 'Find your batchmates',
        description: 'Search the alumni directory to reconnect with classmates.',
        icon: UsersIcon,
        link: '/directory',
        linkText: 'Browse Directory',
        priority: 2,
      },
      {
        id: 'events',
        title: 'Discover events',
        description: 'See upcoming reunions, workshops, and networking events.',
        icon: CalendarIcon,
        link: '/events',
        linkText: 'View Events',
        priority: 3,
      },
    ];

    // Add role-specific steps
    if (userRole === 'alumni' || userRole === 'user') {
      baseSteps.push({
        id: 'mentorship',
        title: 'Explore mentorship',
        description: 'Find a mentor or offer guidance to fellow alumni.',
        icon: AcademicCapIcon,
        link: '/mentorship',
        linkText: 'Explore Mentorship',
        priority: 4,
      });
    }

    if (userRole === 'employer') {
      baseSteps.push({
        id: 'jobs',
        title: 'Post a job',
        description: 'Share opportunities with our talented alumni network.',
        icon: ChatBubbleLeftRightIcon,
        link: '/jobs/post',
        linkText: 'Post Job',
        priority: 4,
      });
    }

    return baseSteps.sort((a, b) => a.priority - b.priority);
  };

  const steps = getSteps();
  const incompleteSteps = steps.filter(s => !completedSteps.includes(s.id));
  const progress = Math.round((completedSteps.length / steps.length) * 100);

  // Auto-dismiss when all steps complete
  if (incompleteSteps.length === 0 && !dismissed) {
    // Show completion message briefly, then dismiss
    return (
      <div className={`card bg-emerald-50 border-emerald-200 ${className}`}>
        <div className="card-body flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900">You're all set!</h3>
            <p className="text-sm text-emerald-700">
              You've completed the getting started guide. Enjoy exploring the platform!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="btn-ghost btn-sm text-emerald-700"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="card-header bg-gradient-to-r from-ocean-500 to-ocean-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg">👋</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Welcome to the Alumni Network!</h2>
              <p className="text-ocean-100 text-sm">
                Complete these steps to get started • {progress}% done
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse guide' : 'Expand guide'}
            >
              <ArrowRightIcon 
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss welcome guide"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% complete`}
          />
        </div>
      </div>

      {/* Steps */}
      {isExpanded && (
        <div className="card-body p-0">
          <ul className="divide-y divide-gray-100" role="list">
            {steps.map((step, index) => {
              const isComplete = completedSteps.includes(step.id);
              const Icon = step.icon;
              
              return (
                <li 
                  key={step.id}
                  className={`flex items-center gap-4 p-4 transition-colors ${
                    isComplete ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Step number / check */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${isComplete 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-ocean-100 text-ocean-600'
                    }
                  `}>
                    {isComplete ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${isComplete ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${isComplete ? 'text-gray-400' : 'text-gray-600'}`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Action */}
                  {!isComplete && (
                    <Link
                      to={step.link}
                      onClick={() => markStepComplete(step.id)}
                      className="btn-primary btn-sm shrink-0"
                    >
                      {step.linkText}
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Link>
                  )}
                  
                  {isComplete && (
                    <span className="text-sm text-emerald-600 font-medium shrink-0">
                      Done
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Footer hint */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            You can dismiss this guide anytime. It won't affect your account.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * QuickActions - Simplified action cards for the dashboard
 * Reduces cognitive load by showing only 3 primary actions
 */
export function QuickActions({ className = '' }) {
  const { userRole } = useAuth();

  const actions = [
    {
      id: 'directory',
      title: 'Find Alumni',
      description: 'Search and connect',
      icon: UsersIcon,
      link: '/directory',
      color: 'ocean',
    },
    {
      id: 'events',
      title: 'Events',
      description: 'Upcoming activities',
      icon: CalendarIcon,
      link: '/events',
      color: 'emerald',
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Chat with connections',
      icon: ChatBubbleLeftRightIcon,
      link: '/messages',
      color: 'purple',
    },
  ];

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        const colorClasses = {
          ocean: 'bg-ocean-50 text-ocean-600 hover:bg-ocean-100',
          emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
          purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
        };

        return (
          <Link
            key={action.id}
            to={action.link}
            className={`
              flex flex-col items-center justify-center p-4 rounded-xl
              transition-all duration-fast
              ${colorClasses[action.color]}
              focus-ring
            `}
          >
            <Icon className="w-6 h-6 mb-2" />
            <span className="font-medium text-sm">{action.title}</span>
            <span className="text-xs opacity-75">{action.description}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default WelcomeGuide;
