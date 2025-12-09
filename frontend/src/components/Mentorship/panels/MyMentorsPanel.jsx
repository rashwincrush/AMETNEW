import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * Panel showing active and past mentorships where user is mentee.
 */
export default function MyMentorsPanel({ highlightRelationshipId }) {
  const { user } = useAuth();
  const highlightRef = useRef(null);
  const navigate = useNavigate();
  
  // Fetch relationships where user is mentee
  const { data: relationships, isLoading, error, refetch } = useQuery({
    queryKey: ['my-mentors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('v_my_mentorship_relationships')
        .select('*')
        .eq('mentee_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const rows = data || [];

      // Hydrate mentor identities via getPublicIdentity to ensure names/avatars
      // always come from the canonical profile/directory.
      return Promise.all(
        rows.map(async (rel) => ({
          ...rel,
          mentor: await getPublicIdentity(rel.mentor_id),
        })),
      );
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
  
  // Deduplicate by mentor so each mentor appears at most once.
  // If there are multiple relationships with the same mentor, keep the one
  // with the latest start_date (and let status drive Active vs Past).
  const dedupedRelationships = React.useMemo(() => {
    if (!relationships || !Array.isArray(relationships)) return [];

    const byMentor = new Map();
    for (const rel of relationships) {
      const existing = byMentor.get(rel.mentor_id);
      if (!existing) {
        byMentor.set(rel.mentor_id, rel);
        continue;
      }

      const existingStart = existing.start_date ? new Date(existing.start_date).getTime() : 0;
      const currentStart = rel.start_date ? new Date(rel.start_date).getTime() : 0;
      if (currentStart > existingStart) {
        byMentor.set(rel.mentor_id, rel);
      }
    }

    return Array.from(byMentor.values());
  }, [relationships]);
  
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
  const activeRelationships = dedupedRelationships.filter(r => r.status === 'active');
  const pastRelationships = dedupedRelationships.filter(r => r.status !== 'active');
  
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-rose-600 mb-3">Error loading mentors: {error.message}</p>
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
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Mentors</h2>
        <p className="text-sm text-slate-600 mt-1">
          People who are mentoring you
        </p>
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
          <div className="text-4xl mb-4">🎓</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {MENTORSHIP_COPY.emptyStates.myMentors.none.title}
          </h3>
          <p className="text-slate-600 mb-4">
            {MENTORSHIP_COPY.emptyStates.myMentors.none.body}
          </p>
          <button
            type="button"
            onClick={() => navigate('/mentorship?tab=find')}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Find mentors
          </button>
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
                role="mentee"
                otherUser={rel.mentor || { id: rel.mentor_id, full_name: 'Unknown User' }}
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
                role="mentee"
                otherUser={rel.mentor || { id: rel.mentor_id, full_name: 'Unknown User' }}
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
