/**
 * Calendar Link Generator
 * Generates calendar event links for Google, Outlook, and Apple Calendar
 * without requiring OAuth authentication. Users click the link to add the event.
 */

/**
 * Generate a Google Calendar event link
 * @param {Object} params
 * @param {string} params.title - Event title
 * @param {string} params.startTime - Start time in ISO format (e.g., "2025-04-16T10:00:00")
 * @param {string} params.endTime - End time in ISO format (e.g., "2025-04-16T11:00:00")
 * @param {string} params.description - Event description
 * @param {string} params.location - Event location (can be a video meeting link)
 * @param {string} [params.timezone] - Timezone (default: Asia/Kolkata)
 * @returns {string} Google Calendar URL
 */
export function generateGoogleCalendarLink({
  title,
  startTime,
  endTime,
  description = '',
  location = '',
  timezone = 'Asia/Kolkata',
}) {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  
  // Convert times to Google Calendar format (YYYYMMDDTHHMMSS)
  // Don't add 'Z' suffix when using timezone parameter
  const formatTimeForGoogle = (isoString) => {
    const date = new Date(isoString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0];
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatTimeForGoogle(startTime)}/${formatTimeForGoogle(endTime)}`,
    details: description,
    location: location,
    ctz: timezone,
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a Google Calendar link for a mentorship video session
 * @param {Object} params
 * @param {string} params.mentorName - Mentor's name
 * @param {string} params.menteeName - Mentee's name
 * @param {string} params.startTime - Start time in ISO format
 * @param {string} params.endTime - End time in ISO format
 * @param {string} params.videoMeetingLink - Video meeting link (Jitsi, Zoom, etc.)
 * @param {string} [params.timezone] - Timezone (default: Asia/Kolkata)
 * @returns {string} Google Calendar URL
 */
export function generateMentorshipCalendarLink({
  mentorName,
  menteeName,
  startTime,
  endTime,
  videoMeetingLink,
  timezone = 'Asia/Kolkata',
}) {
  const title = `Mentorship Session: ${mentorName} & ${menteeName}`;
  const description = `Video mentorship session between ${mentorName} (Mentor) and ${menteeName} (Mentee).\n\nVideo Meeting Link: ${videoMeetingLink}`;
  const location = videoMeetingLink;
  
  return generateGoogleCalendarLink({
    title,
    startTime,
    endTime,
    description,
    location,
    timezone,
  });
}

/**
 * Generate an Outlook Calendar event link
 * @param {Object} params
 * @param {string} params.title - Event title
 * @param {string} params.startTime - Start time in ISO format
 * @param {string} params.endTime - End time in ISO format
 * @param {string} params.description - Event description
 * @param {string} params.location - Event location
 * @returns {string} Outlook Calendar URL
 */
export function generateOutlookCalendarLink({
  title,
  startTime,
  endTime,
  description = '',
  location = '',
}) {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
  
  const formatTimeForOutlook = (isoString) => {
    const date = new Date(isoString);
    // Outlook format: YYYY-MM-DDTHH:mm:ss
    return date.toISOString().replace(/\.\d{3}Z$/, '');
  };
  
  const params = new URLSearchParams({
    subject: title,
    startdt: formatTimeForOutlook(startTime),
    enddt: formatTimeForOutlook(endTime),
    body: description,
    location: location,
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate an Apple Calendar (.ics file) data URI
 * @param {Object} params
 * @param {string} params.title - Event title
 * @param {string} params.startTime - Start time in ISO format
 * @param {string} params.endTime - End time in ISO format
 * @param {string} params.description - Event description
 * @param {string} params.location - Event location
 * @returns {string} Data URI with .ics content
 */
export function generateAppleCalendarLink({
  title,
  startTime,
  endTime,
  description = '',
  location = '',
}) {
  const formatTimeForICS = (isoString) => {
    const date = new Date(isoString);
    // ICS format: YYYYMMDDTHHMMSS
    return date.toISOString().replace(/[-:]/g, '').split('.')[0];
  };
  
  const uid = `${Date.now()}@alumni-portal`;
  const now = formatTimeForICS(new Date().toISOString());
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alumni Portal//Mentorship Session//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatTimeForICS(startTime)}`,
    `DTEND:${formatTimeForICS(endTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
  
  // Create data URI
  const encoded = encodeURIComponent(icsContent);
  return `data:text/calendar;charset=utf8,${encoded}`;
}

/**
 * Generate all calendar links for a mentorship session
 * @param {Object} params
 * @param {string} params.mentorName - Mentor's name
 * @param {string} params.menteeName - Mentee's name
 * @param {string} params.startTime - Start time in ISO format
 * @param {string} params.endTime - End time in ISO format
 * @param {string} params.videoMeetingLink - Video meeting link
 * @param {string} [params.timezone] - Timezone (default: Asia/Kolkata)
 * @returns {Object} Object with google, outlook, and apple calendar links
 */
export function generateAllCalendarLinks({
  mentorName,
  menteeName,
  startTime,
  endTime,
  videoMeetingLink,
  timezone = 'Asia/Kolkata',
}) {
  const title = `Mentorship Session: ${mentorName} & ${menteeName}`;
  const description = `Video mentorship session between ${mentorName} (Mentor) and ${menteeName} (Mentee).\\n\\nVideo Meeting Link: ${videoMeetingLink}`;
  const location = videoMeetingLink;
  
  return {
    google: generateGoogleCalendarLink({
      title,
      startTime,
      endTime,
      description,
      location,
      timezone,
    }),
    outlook: generateOutlookCalendarLink({
      title,
      startTime,
      endTime,
      description,
      location,
    }),
    apple: generateAppleCalendarLink({
      title,
      startTime,
      endTime,
      description,
      location,
    }),
  };
}
