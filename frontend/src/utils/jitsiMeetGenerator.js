/**
 * Jitsi Meet Link Generator
 * Generates Jitsi Meet meeting links without requiring OAuth or API keys
 * Free, unlimited duration, no account required for participants
 */

/**
 * Generate a Jitsi Meet link
 * @param {Object} params
 * @param {string} params.roomName - Unique room name for the meeting
 * @param {string} [params.displayName] - Display name for the user
 * @param {boolean} [params.startWithVideoMuted] - Start with video muted
 * @param {boolean} [params.startWithAudioMuted] - Start with audio muted
 * @returns {string} Jitsi Meet URL
 */
export function generateJitsiMeetLink({
  roomName,
  displayName = '',
  startWithVideoMuted = false,
  startWithAudioMuted = false,
}) {
  const baseUrl = 'https://meet.jit.si';
  const params = new URLSearchParams();
  
  // Add room name to URL path
  const url = `${baseUrl}/${roomName}`;
  
  // Add optional parameters
  if (displayName) {
    params.set('config.startWithAudioMuted', startWithAudioMuted.toString());
    params.set('config.startWithVideoMuted', startWithVideoMuted.toString());
  }
  
  const paramString = params.toString();
  return paramString ? `${url}?${paramString}` : url;
}

/**
 * Generate a unique room name for a mentorship session
 * @param {string} mentorshipRequestId - The mentorship request ID
 * @returns {string} Unique room name
 */
export function generateMentorshipRoomName(mentorshipRequestId) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `mentorship-${mentorshipRequestId}-${timestamp}-${randomString}`;
}

/**
 * Generate a Jitsi Meet link for a mentorship session
 * @param {string} mentorshipRequestId - The mentorship request ID
 * @returns {string} Jitsi Meet URL
 */
export function generateMentorshipJitsiLink(mentorshipRequestId) {
  const roomName = generateMentorshipRoomName(mentorshipRequestId);
  return generateJitsiMeetLink({ roomName });
}
