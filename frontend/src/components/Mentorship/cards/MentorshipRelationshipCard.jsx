import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpenMentorshipChat } from '../../../hooks/useOpenMentorshipChat';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import logger from '../../../utils/logger';
import { MENTORSHIP_COPY } from '../../../constants/mentorshipCopy';
import MentorshipStatusChip from '../MentorshipStatusChip';
import { 
  endMentorshipRelationship, 
  fullDisconnectFromUser 
} from '../../../api/mentorshipApi';
import { mapMentorshipError } from '../../../services/mentorship';
import { VideoCameraIcon, CalendarIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import ScheduleVideoSessionModal from '../ScheduleVideoSessionModal';
import { supabase } from '../../../utils/supabase';

/**
 * Card component for mentorship relationships (active and past).
 * Shows different UI based on whether user is mentee or mentor.
 * 
 * @param {Object} props
 * @param {'mentee'|'mentor'} props.role - User's role in this relationship
 * @param {Object} props.otherUser - The other user in the relationship
 * @param {string} props.status - Relationship status (active, completed, terminated)
 * @param {string} props.relationshipId - Relationship ID
 * @param {string} [props.startedAt] - When relationship started
 * @param {string} [props.endedAt] - When relationship ended
 * @param {boolean} [props.hasMessages] - Whether there are messages in DM
 * @param {Function} [props.onEndMentorship] - Handler for ending mentorship
 * @param {boolean} [props.highlighted] - Whether to highlight this card
 */
export default function MentorshipRelationshipCard({
  role,
  otherUser,
  status,
  relationshipId,
  requestId = null,
  startedAt,
  endedAt,
  hasMessages = false,
  onEndMentorship,
  onScheduleSuccess = null,
  highlighted = false,
  videoMeetingLink = null,
  scheduledStartTime = null,
  scheduledEndTime = null,
  isVideoSessionScheduled = false,
}) {
  const navigate = useNavigate();
  const { openChat, loadingId } = useOpenMentorshipChat();
  const statusCopy = MENTORSHIP_COPY.chips.statuses.relationship;
  const roleCopy = MENTORSHIP_COPY.chips.roles;
  const buttonCopy = MENTORSHIP_COPY.buttons;
  const dialogCopy = MENTORSHIP_COPY.dialogs.endMentorship;
  const [showMenu, setShowMenu] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [alsoDisconnect, setAlsoDisconnect] = useState(false);

  const handleScheduleSuccess = () => {
    setShowScheduleModal(false);
    if (onScheduleSuccess) {
      onScheduleSuccess();
    }
  };
  
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  const isEnded = status === 'ended_by_mentor' || status === 'ended_by_mentee' || status === 'ended_by_system';
  
  const isMentee = role === 'mentee';
  
  // Status chip via shared component
  const getStatusChip = () => {
    if (isActive || isCompleted || isEnded) {
      return <MentorshipStatusChip type="relationship" status={status} />;
    }
    return null;
  };
  
  const getRoleChip = () => {
    if (isMentee) {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
          Your Mentor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
        Your Mentee
      </span>
    );
  };
  
  const handleNameClick = () => {
    if (!otherUser?.id) return;

    if (isMentee) {
      // Viewer is mentee, otherUser is mentor → mentorship profile
      navigate(`/mentorship/mentor/${otherUser.id}`);
    } else {
      // Viewer is mentor, otherUser is mentee → standard alumni profile
      navigate(`/profile/${otherUser.id}`);
    }
  };

  const handleOpenChat = async () => {
    if (!relationshipId) return;

    const result = await openChat(relationshipId);
    if (result && result.message) {
      toast.error(result.message);
    }
  };
  
  const handleEndMentorship = async () => {
    if (!otherUser?.id) {
      toast.error('Unable to end mentorship: user information missing');
      return;
    }

    setIsEnding(true);
    try {
      if (alsoDisconnect) {
        await fullDisconnectFromUser(otherUser.id);
      } else {
        await endMentorshipRelationship(relationshipId);
      }

      toast.success('Mentorship ended');

      // Trigger parent refetch
      if (onEndMentorship) {
        onEndMentorship();
      }

      setIsEndDialogOpen(false);
      setAlsoDisconnect(false);
      setShowMenu(false);
    } catch (error) {
      logger.error('Error ending mentorship:', error);
      const { code, message } = mapMentorshipError(error);
      if (code === 'ALREADY_ENDED') {
        toast.success('Mentorship ended');
      } else {
        toast.error(message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsEnding(false);
    }
  };
  
  return (
    <div
      className={clsx(
        'border rounded-xl p-4 bg-white shadow-sm',
        'flex flex-col sm:flex-row sm:items-center gap-4',
        'transition-all duration-200',
        highlighted && 'ring-2 ring-blue-500 ring-offset-2',
        'hover:shadow-md',
        !isActive && 'opacity-75'
      )}
    >
      {/* User Info */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.full_name || otherUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-slate-600 font-semibold text-lg">
                {(otherUser?.full_name || otherUser?.name || '?')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              type="button"
              onClick={handleNameClick}
              className="text-left text-base font-semibold text-slate-900 truncate hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded"
            >
              {otherUser?.full_name || otherUser?.name || 'Unknown User'}
            </button>
            {getRoleChip()}
            {getStatusChip()}
          </div>
          
          {otherUser?.current_job_title && (
            <p className="text-sm text-slate-600 truncate">
              {otherUser.current_job_title}
              {otherUser.company_name && ` at ${otherUser.company_name}`}
            </p>
          )}
          
          <p className="text-xs text-slate-500 mt-1">
            {isActive && startedAt && `Started ${formatDistanceToNow(new Date(startedAt), { addSuffix: true })}`}
            {!isActive && endedAt && `Ended ${formatDistanceToNow(new Date(endedAt), { addSuffix: true })}`}
          </p>

          {/* Scheduled Meeting Time */}
          {scheduledStartTime && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-sm">📅</span>
              <span className="font-medium">Meeting:</span>
              <span>
                {new Date(scheduledStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·
                {new Date(scheduledStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –
                {scheduledEndTime && new Date(scheduledEndTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Join Video Meeting Button (active relationships only) */}
          {isActive && videoMeetingLink && (
            <div className="mt-2">
              <a
                href={videoMeetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors"
              >
                <VideoCameraIcon className="w-3.5 h-3.5" />
                Join Video Meeting
              </a>
            </div>
          )}

          {/* Past relationships: show meeting time as read-only */}
          {!isActive && scheduledStartTime && (
            <div className="mt-2 text-xs text-slate-500">
              Meeting was scheduled for {new Date(scheduledStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          )}

          {/* GAP 6 FIX: Progress Tracking */}
          {isActive && <MentorshipProgress relationshipId={relationshipId} role={role} />}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Primary CTA: Open Chat */}
        <button
          onClick={handleOpenChat}
          disabled={loadingId === relationshipId || !relationshipId}
          className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-h-[36px]"
        >
          {loadingId === relationshipId
            ? buttonCopy.chat.opening
            : hasMessages
              ? buttonCopy.chat.openChat
              : buttonCopy.chat.sendFirstMessage}
        </button>

        {/* Schedule Meeting Button (active relationships only) */}
        {isActive && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors min-h-[36px]"
          >
            <CalendarIcon className="w-4 h-4 mr-1" />
            {scheduledStartTime ? 'Reschedule' : 'Schedule Meeting'}
          </button>
        )}
        
        {/* Menu for Active Relationships */}
        {isActive && onEndMentorship && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="More options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={() => {
                      setIsEndDialogOpen(true);
                      setAlsoDisconnect(false);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    End Mentorship
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Schedule Video Session Modal */}
      <ScheduleVideoSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={handleScheduleSuccess}
        mentorshipRequestId={requestId || relationshipId}
        mentorName={isMentee ? otherUser?.full_name : null}
        menteeName={!isMentee ? otherUser?.full_name : null}
        videoMeetingLink={videoMeetingLink}
        initialDate={scheduledStartTime ? new Date(scheduledStartTime).toISOString().split('T')[0] : null}
        initialStartTime={scheduledStartTime ? new Date(scheduledStartTime).toTimeString().slice(0, 5) : null}
        initialEndTime={scheduledEndTime ? new Date(scheduledEndTime).toTimeString().slice(0, 5) : null}
      />

      {/* End Mentorship Confirmation Dialog */}
      {isEndDialogOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              if (!isEnding) {
                setIsEndDialogOpen(false);
                setAlsoDisconnect(false);
              }
            }}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
              onKeyDown={(e) => {
                if (e.key === 'Escape' && !isEnding) {
                  setIsEndDialogOpen(false);
                  setAlsoDisconnect(false);
                }
              }}
            >
              <h3 className="text-lg font-semibold text-slate-900">
                End this mentorship?
              </h3>

              <p className="text-sm text-slate-600">
                This will move {otherUser?.full_name || 'this person'} to your past mentorships.
                You can still message each other.
              </p>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoDisconnect}
                  onChange={(e) => setAlsoDisconnect(e.target.checked)}
                  disabled={isEnding}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    Also remove from my connections
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    This will remove them from your network entirely.
                  </div>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsEndDialogOpen(false);
                    setAlsoDisconnect(false);
                  }}
                  disabled={isEnding}
                  className="flex-1 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndMentorship}
                  disabled={isEnding}
                  autoFocus
                  className="flex-1 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isEnding ? 'Ending...' : 'End Mentorship'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// GAP 6 FIX: MentorshipProgress component
function MentorshipProgress({ relationshipId, role }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, [relationshipId]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase.rpc('get_mentorship_progress', {
        p_relationship_id: relationshipId
      });
      if (error) throw error;
      if (data?.success) {
        setProgress(data.progress);
      }
    } catch (err) {
      logger.error('Failed to fetch mentorship progress', err);
    }
  };

  const toggleGoal = async (goalId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('toggle_goal_achieved', {
        p_relationship_id: relationshipId,
        p_goal_id: goalId
      });
      if (error) throw error;
      if (data?.success) {
        await fetchProgress();
        toast.success(data.achieved ? 'Goal achieved! 🎉' : 'Goal marked incomplete');
      }
    } catch (err) {
      toast.error('Failed to update goal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!newGoalText.trim()) return;
    
    setLoading(true);
    try {
      const currentGoals = progress?.goals || [];
      const newGoal = {
        id: Date.now().toString(),
        text: newGoalText.trim(),
        achieved: false
      };
      
      const { data, error } = await supabase.rpc('update_mentorship_goals', {
        p_relationship_id: relationshipId,
        p_goals: [...currentGoals, newGoal]
      });
      
      if (error) throw error;
      if (data?.success) {
        await fetchProgress();
        setNewGoalText('');
        setShowAddGoal(false);
        toast.success('Goal added!');
      }
    } catch (err) {
      toast.error('Failed to add goal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    const feedback = prompt('Enter your feedback for this mentorship:');
    if (!feedback?.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('submit_mentorship_feedback', {
        p_relationship_id: relationshipId,
        p_feedback: feedback.trim()
      });
      
      if (error) throw error;
      if (data?.success) {
        await fetchProgress();
        toast.success(data.auto_completed ? 'Feedback submitted! Relationship auto-completed.' : 'Feedback submitted!');
      }
    } catch (err) {
      toast.error('Failed to submit feedback: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!progress) return null;

  const goals = progress.goals || [];
  const achievedCount = goals.filter(g => g.achieved).length;
  const isMentor = role === 'mentor';

  return (
    <div className="mt-3 pt-3 border-t border-slate-200">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-slate-700">
            Progress: {achievedCount}/{goals.length} goals
          </span>
          <span className="text-slate-500">{progress.progress_percentage}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Goals List */}
      {goals.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {goals.map((goal, idx) => (
            <div key={goal.id || idx} className="flex items-center gap-2">
              <button
                onClick={() => !loading && toggleGoal(goal.id || idx.toString())}
                disabled={loading}
                className={clsx(
                  'flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  goal.achieved 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-slate-300 hover:border-green-400'
                )}
              >
                {goal.achieved && <CheckCircleIcon className="w-4 h-4" />}
              </button>
              <span className={clsx(
                'text-sm',
                goal.achieved ? 'text-slate-500 line-through' : 'text-slate-700'
              )}>
                {goal.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal */}
      {showAddGoal ? (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            placeholder="Enter new goal..."
            className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={addGoal}
            disabled={loading || !newGoalText.trim()}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAddGoal(false); setNewGoalText(''); }}
            className="text-sm text-slate-600 px-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddGoal(true)}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3"
        >
          <PlusIcon className="w-4 h-4" />
          Add Goal
        </button>
      )}

      {/* Feedback Section */}
      {progress.can_submit_feedback && (
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {isMentor ? 
                (progress.mentor_feedback_submitted ? 'Your feedback submitted ✓' : 'Share your feedback as mentor') :
                (progress.mentee_feedback_submitted ? 'Your feedback submitted ✓' : 'Share your feedback as mentee')
              }
            </span>
            {!isMentor && !progress.mentee_feedback_submitted && (
              <button
                onClick={submitFeedback}
                disabled={loading}
                className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
              >
                Leave Feedback
              </button>
            )}
            {isMentor && !progress.mentor_feedback_submitted && (
              <button
                onClick={submitFeedback}
                disabled={loading}
                className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
              >
                Leave Feedback
              </button>
            )}
          </div>
          {achievedCount === goals.length && goals.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              🎉 All goals achieved! Leave feedback to complete the mentorship.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
