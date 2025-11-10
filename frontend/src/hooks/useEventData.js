import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useEvent(eventId) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_events_with_end_at')
        .select('*')
        .eq('id', eventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useMyRsvp(eventId) {
  return useQuery({
    queryKey: ['myRsvp', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_my_event_rsvp')
        .select('attendance_status, is_waitlisted')
        .eq('event_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!eventId,
  });
}

export function useMyFeedback(eventId) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myFeedback', eventId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_feedback')
        .select('id, rating, comment, comments, created_at')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!(eventId && user?.id),
  });
}

export function useOrganizer(eventId) {
  return useQuery({
    queryKey: ['eventOrganizer', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_event_organizer')
        .select('name,email,phone,avatar_url,current_location,company_name,graduation_year')
        .eq('event_id', eventId)
        .single();
      if (error) return null; // Silently fail if no organizer view
      return data;
    },
    enabled: !!eventId,
  });
}

export function useEventComputedFlags(eventRow) {
  if (!eventRow) {
    return {
      startISO: null,
      endISO: null,
      eventStarted: false,
      eventEnded: false,
    };
  }
  
  const startISO = eventRow.start_at || eventRow.start_date;
  const endISO = eventRow.computed_end_at || eventRow.end_at || eventRow.end_date;
  const eventStarted = !!startISO && dayjs().isAfter(dayjs(startISO));
  const eventEnded = !!endISO && dayjs().isAfter(dayjs(endISO));
  
  return { startISO, endISO, eventStarted, eventEnded };
}
