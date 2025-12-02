/**
 * Voice Chat Service
 * 
 * Integration with Daily.co for real-time voice/video calls.
 * Free tier: 2,000 participant minutes/month
 * 
 * Features:
 * - Create rooms for calls
 * - Generate meeting tokens
 * - Manage call participants
 * - Call recording (optional)
 */

// Daily.co API configuration
const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

/**
 * Make a request to Daily.co API
 */
async function dailyApiRequest(endpoint, method = 'GET', body = null) {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY is not configured');
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${DAILY_API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Daily.co API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new room for a call
 * @param {Object} options
 * @param {string} options.name - Room name (optional, auto-generated if not provided)
 * @param {string} options.companyId - Company ID for tracking
 * @param {number} options.expiryMinutes - Room expiry in minutes (default: 60)
 * @param {boolean} options.enableRecording - Enable call recording
 * @returns {Promise<Object>} Room details
 */
export async function createRoom({
  name,
  companyId,
  expiryMinutes = 60,
  enableRecording = false,
  maxParticipants = 4,
} = {}) {
  const roomName = name || `crm-${companyId}-${Date.now()}`;
  
  const properties = {
    exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
    max_participants: maxParticipants,
    enable_prejoin_ui: true,
    enable_knocking: true,
    enable_screenshare: true,
    enable_chat: true,
  };

  if (enableRecording) {
    properties.enable_recording = 'cloud';
  }

  const room = await dailyApiRequest('/rooms', 'POST', {
    name: roomName,
    privacy: 'private',
    properties,
  });

  return {
    roomId: room.id,
    roomName: room.name,
    roomUrl: room.url,
    expiresAt: new Date(properties.exp * 1000),
    maxParticipants,
    features: {
      recording: enableRecording,
      screenshare: true,
      chat: true,
    },
  };
}

/**
 * Get room details
 * @param {string} roomName - Room name
 * @returns {Promise<Object>} Room details
 */
export async function getRoom(roomName) {
  return dailyApiRequest(`/rooms/${roomName}`);
}

/**
 * Delete a room
 * @param {string} roomName - Room name
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteRoom(roomName) {
  return dailyApiRequest(`/rooms/${roomName}`, 'DELETE');
}

/**
 * Create a meeting token for a participant
 * @param {Object} options
 * @param {string} options.roomName - Room name
 * @param {string} options.userName - Participant name
 * @param {string} options.userId - User ID
 * @param {boolean} options.isOwner - Whether user is room owner (can control others)
 * @param {number} options.expiryMinutes - Token expiry in minutes
 * @returns {Promise<Object>} Meeting token
 */
export async function createMeetingToken({
  roomName,
  userName,
  userId,
  isOwner = false,
  expiryMinutes = 60,
}) {
  const properties = {
    room_name: roomName,
    user_name: userName,
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
    is_owner: isOwner,
    enable_screenshare: true,
    start_video_off: false,
    start_audio_off: false,
  };

  const result = await dailyApiRequest('/meeting-tokens', 'POST', { properties });

  return {
    token: result.token,
    expiresAt: new Date(properties.exp * 1000),
    roomName,
    userName,
    isOwner,
  };
}

/**
 * Get active participants in a room
 * @param {string} roomName - Room name
 * @returns {Promise<Object>} Participant info
 */
export async function getRoomParticipants(roomName) {
  const result = await dailyApiRequest(`/rooms/${roomName}/presence`);
  return {
    roomName,
    participants: result.data || [],
    totalCount: result.total_count || 0,
  };
}

/**
 * List all active rooms
 * @returns {Promise<Array>} List of active rooms
 */
export async function listRooms() {
  const result = await dailyApiRequest('/rooms');
  return result.data || [];
}

/**
 * Start a call between two users
 * @param {Object} options
 * @param {string} options.callerId - Caller user ID
 * @param {string} options.callerName - Caller name
 * @param {string} options.recipientId - Recipient user ID
 * @param {string} options.recipientName - Recipient name
 * @param {string} options.companyId - Company ID
 * @returns {Promise<Object>} Call details with tokens
 */
export async function initiateCall({
  callerId,
  callerName,
  recipientId,
  recipientName,
  companyId,
}) {
  // Create a room for the call
  const room = await createRoom({
    companyId,
    expiryMinutes: 120,
    maxParticipants: 2,
  });

  // Generate tokens for both participants
  const callerToken = await createMeetingToken({
    roomName: room.roomName,
    userName: callerName,
    userId: callerId,
    isOwner: true,
  });

  const recipientToken = await createMeetingToken({
    roomName: room.roomName,
    userName: recipientName,
    userId: recipientId,
    isOwner: false,
  });

  return {
    room,
    caller: {
      userId: callerId,
      token: callerToken.token,
      roomUrl: `${room.roomUrl}?t=${callerToken.token}`,
    },
    recipient: {
      userId: recipientId,
      token: recipientToken.token,
      roomUrl: `${room.roomUrl}?t=${recipientToken.token}`,
    },
    createdAt: new Date(),
  };
}

/**
 * Create a group call room
 * @param {Object} options
 * @param {string} options.name - Call name
 * @param {string} options.companyId - Company ID
 * @param {Array} options.participants - List of { userId, userName }
 * @returns {Promise<Object>} Group call details
 */
export async function createGroupCall({
  name,
  companyId,
  participants,
}) {
  const room = await createRoom({
    name: `${name}-${Date.now()}`.replace(/\s+/g, '-').toLowerCase(),
    companyId,
    expiryMinutes: 180,
    maxParticipants: Math.max(participants.length, 10),
  });

  // Generate tokens for all participants
  const participantTokens = await Promise.all(
    participants.map(async (p, index) => {
      const token = await createMeetingToken({
        roomName: room.roomName,
        userName: p.userName,
        userId: p.userId,
        isOwner: index === 0, // First participant is owner
      });
      return {
        userId: p.userId,
        userName: p.userName,
        token: token.token,
        roomUrl: `${room.roomUrl}?t=${token.token}`,
      };
    })
  );

  return {
    room,
    participants: participantTokens,
    createdAt: new Date(),
  };
}

/**
 * Get recordings for a room
 * @param {string} roomName - Room name
 * @returns {Promise<Array>} List of recordings
 */
export async function getRecordings(roomName) {
  const result = await dailyApiRequest(`/recordings?room_name=${roomName}`);
  return result.data || [];
}

/**
 * Check Daily.co API key validity
 * @returns {Promise<boolean>} Whether API key is valid
 */
export async function validateApiKey() {
  try {
    await dailyApiRequest('/rooms?limit=1');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get usage stats
 * @returns {Promise<Object>} Usage statistics
 */
export async function getUsageStats() {
  const result = await dailyApiRequest('/meetings');
  return {
    totalMeetings: result.total_count || 0,
    meetings: result.data || [],
  };
}

export default {
  createRoom,
  getRoom,
  deleteRoom,
  createMeetingToken,
  getRoomParticipants,
  listRooms,
  initiateCall,
  createGroupCall,
  getRecordings,
  validateApiKey,
  getUsageStats,
};
