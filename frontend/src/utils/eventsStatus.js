import dayjs from 'dayjs';

// Central helper to compute event timing flags and status label
// This mirrors existing frontend semantics for start/end and status
export function computeEventTimelineFlags(event) {
  if (!event) {
    return {
      startISO: null,
      endISO: null,
      eventStarted: false,
      eventEnded: false,
      statusLabel: 'Upcoming',
    };
  }

  const now = dayjs();

  const startISO = event.start_at || event.start_date || null;
  const endISO = event.computed_end_at || event.end_at || event.end_date || startISO;

  const start = startISO ? dayjs(startISO) : null;
  const end = endISO ? dayjs(endISO) : start;

  const eventStarted = !!start && now.isAfter(start) || now.isSame(start);
  const eventEnded = !!end && now.isAfter(end);

  let statusLabel = 'Upcoming';
  if (eventEnded) statusLabel = 'Past';
  else if (eventStarted) statusLabel = 'Happening Now';

  return {
    startISO,
    endISO,
    eventStarted,
    eventEnded,
    statusLabel,
  };
}
