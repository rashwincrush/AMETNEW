import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabase';
import { endMentorshipRelationship } from '../../../api/mentorshipApi';
import { mapMentorshipError } from '../../../utils/mentorshipErrorMap';
import MentorshipRelationshipCard from '../cards/MentorshipRelationshipCard';
import { toast } from 'react-hot-toast';
import { getPublicIdentity } from '../../../lib/hydrateIdentity';
import { MENTORSHIP_COPY } from '../../../constants/mentorshipCopy';

/**
 * Panel showing active and past mentorships where user is mentor.
 */
export default function MyMenteesPanel({ highlightRelationshipId }) {
  const { user } = useAuth();
  const highlightRef = useRef(null);
  
  // Fetch relationships where user is mentor
  const { data: relationships, isLoading, error, refetch } = useQuery({
    queryKey: ['my-mentees', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('v_my_mentorship_relationships')
        .select('*')
        .eq('mentor_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const rows = data || [];

      return Promise.all(
        rows.map(async (rel) => ({
          ...rel,
          mentee: await getPublicIdentity(rel.mentee_id),
        })),
      );
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
  
  // Fetch mentor capacity info
  const { data: mentorInfo } = useQuery({
    queryKey: ['mentor-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('mentors')
        .select('max_mentees')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
  
  // Scroll to highlighted relationship
  useEffect(() => {
    if (highlightRelationshipId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlightRelationshipId]);
  
  const handleEndMentorship = async (relationshipId) => {
    try {
      await endMentorshipRelationship(relationshipId);
      toast.success('Mentorship ended');
      refetch();
    } catch (error) {
      const mapped = mapMentorshipError(error);
      toast.error(mapped.message);
    }
  };
  
  // Separate active and past
  const activeRelationships = relationships?.filter(r => r.status === 'active') || [];
  const pastRelationships = relationships?.filter(r => r.status !== 'active') || [];
  
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-rose-600 mb-3">Error loading mentees: {error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header with Capacity */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Mentees</h2>
            <p className="text-sm text-slate-600 mt-1">
              People you are mentoring
            </p>
          </div>
          {mentorInfo && (
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {activeRelationships.length} / {mentorInfo.max_mentees || 0}
              </div>
              <div className="text-xs text-slate-600">Capacity</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && (!relationships || relationships.length === 0) && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-4">👨‍🏫</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {MENTORSHIP_COPY.emptyStates.myMentees.none.title}
          </h3>
          <p className="text-slate-600 mb-4">
            {MENTORSHIP_COPY.emptyStates.myMentees.none.body}
          </p>
        </div>
      )}
      
      {/* Active Mentorships */}
      {!isLoading && activeRelationships.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Active</h3>
          {activeRelationships.map((rel) => (
            <div
              key={rel.id}
              ref={rel.id === highlightRelationshipId ? highlightRef : null}
            >
              <MentorshipRelationshipCard
                role="mentor"
                otherUser={rel.mentee || { id: rel.mentee_id, full_name: 'Unknown User' }}
                status={rel.status}
                relationshipId={rel.id}
                startedAt={rel.start_date}
                hasMessages={rel.has_messages}
                onEndMentorship={() => handleEndMentorship(rel.id)}
                highlighted={rel.id === highlightRelationshipId}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Past Mentorships */}
      {!isLoading && pastRelationships.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Past</h3>
          {pastRelationships.map((rel) => (
            <div
              key={rel.id}
              ref={rel.id === highlightRelationshipId ? highlightRef : null}
            >
              <MentorshipRelationshipCard
                role="mentor"
                otherUser={rel.mentee || { id: rel.mentee_id, full_name: 'Unknown User' }}
                status={rel.status}
                relationshipId={rel.id}
                startedAt={rel.start_date}
                endedAt={rel.end_date}
                hasMessages={rel.has_messages}
                highlighted={rel.id === highlightRelationshipId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
