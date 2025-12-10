import '../config/env.js'; // Load env vars first
import axios from 'axios';
import { Conversation } from '../models/Conversation.js';
import { emitToUser } from '../services/liveChatService.js';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_BASE = 'https://api.daily.co/v1';

// Debug log on module load
console.log('[audioCallController] Module loaded. DAILY_API_KEY configured:', !!DAILY_API_KEY);
if (!DAILY_API_KEY) {
  console.error('[audioCallController] WARNING: DAILY_API_KEY is not set in environment variables!');
}

/**
 * Create a Daily.co room for a conversation
 */
export const createCallRoom = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.firebaseUid; // Fixed: use firebaseUid instead of uid

    console.log('[createCallRoom] Starting call room creation:', { conversationId, userId });

    // Check if Daily.co API key is configured
    if (!DAILY_API_KEY || DAILY_API_KEY === 'your-daily-api-key-here' || DAILY_API_KEY.length < 20) {
      console.log('[createCallRoom] Daily.co service not yet configured (requires payment)');
      return res.status(503).json({
        success: false,
        message: 'Audio/Video call service requires payment setup. Please upgrade your account to enable calls.',
        error: 'service-not-configured'
      });
    }

    // Get conversation
    const conversation = await Conversation.findById(conversationId)
      .populate('clientUserId', 'name email firebaseUid')
      .populate('assignedRepresentative', 'name email firebaseUid');

    if (!conversation) {
      console.error('[createCallRoom] Conversation not found:', conversationId);
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    console.log('[createCallRoom] Conversation found:', {
      id: conversation._id,
      client: conversation.clientUserId?.email,
      representative: conversation.assignedRepresentative?.email,
      status: conversation.status
    });

    // Check if user is part of this conversation
    const isClient = conversation.clientUserId?.firebaseUid === userId;
    const isRepresentative = conversation.assignedRepresentative?.firebaseUid === userId;

    console.log('[createCallRoom] Authorization check:', {
      userId,
      isClient,
      isRepresentative,
      clientFirebaseUid: conversation.clientUserId?.firebaseUid,
      repFirebaseUid: conversation.assignedRepresentative?.firebaseUid
    });

    if (!isClient && !isRepresentative) {
      console.error('[createCallRoom] User not authorized:', userId);
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create a call for this conversation'
      });
    }

    // Don't allow calls if AI is active (no representative assigned)
    if (conversation.status === 'active' && !conversation.assignedRepresentative) {
      console.log('[createCallRoom] AI is active, no representative assigned');
      return res.status(400).json({
        success: false,
        message: 'Calls are only available when talking with a representative. Currently, AI is handling this conversation.'
      });
    }

    // Create Daily.co room (audio-only configuration)
    const roomName = `conversation-${conversationId}-${Date.now()}`;
    
    const roomConfig = {
      name: roomName,
      properties: {
        max_participants: 2,
        enable_screenshare: false,
        enable_chat: false,
        enable_knocking: false,
        enable_prejoin_ui: false,
        start_video_off: true, // Video disabled by default
        start_audio_off: false, // Audio enabled by default
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
      }
    };

    console.log('[createCallRoom] Creating Daily.co room:', roomName);

    const roomResponse = await axios.post(
      `${DAILY_API_BASE}/rooms`,
      roomConfig,
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const room = roomResponse.data;
    console.log('[createCallRoom] Room created successfully:', room.name);

    // Create meeting tokens for both participants
    const clientToken = await createMeetingToken(room.name, conversation.clientUserId.name, true);
    const repToken = conversation.assignedRepresentative 
      ? await createMeetingToken(room.name, conversation.assignedRepresentative.name, true)
      : null;

    // Store room info in conversation metadata
    conversation.metadata = {
      ...conversation.metadata,
      activeCallRoom: {
        roomName: room.name,
        roomUrl: room.url,
        createdAt: new Date(),
        createdBy: userId
      }
    };
    await conversation.save();

    console.log('[createCallRoom] Call room creation completed successfully');

    // Notify the other participant via Socket.IO
    const caller = isClient ? conversation.clientUserId : conversation.assignedRepresentative;
    const recipient = isClient ? conversation.assignedRepresentative : conversation.clientUserId;
    
    if (recipient?.firebaseUid) {
      console.log('[createCallRoom] Notifying recipient:', recipient.email);
      emitToUser(recipient.firebaseUid, 'call:incoming', {
        conversationId: conversation._id,
        roomUrl: room.url,
        token: repToken || clientToken,
        caller: {
          name: caller.name,
          email: caller.email
        },
        conversation: {
          id: conversation._id,
          title: conversation.title,
          type: conversation.type
        }
      });
    }

    res.json({
      success: true,
      data: {
        room: {
          name: room.name,
          url: room.url
        },
        token: isClient ? clientToken : repToken,
        conversation: {
          id: conversation._id,
          client: conversation.clientUserId?.name,
          representative: conversation.assignedRepresentative?.name
        }
      }
    });

  } catch (error) {
    console.error('[createCallRoom] ERROR:', {
      message: error.message,
      status: error.response?.status
    });
    
    // Check for Daily.co API authentication errors (unpaid/invalid key)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(503).json({
        success: false,
        message: 'Audio/Video call service requires valid payment setup. Please upgrade your account.',
        error: 'service-unavailable'
      });
    }

    // Handle network timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        message: 'Unable to connect to call service. Please try again later.',
        error: 'service-timeout'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create audio call room',
      error: error.message
    });
  }
};

/**
 * Get call room token for joining an existing call
 */
export const getCallToken = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.firebaseUid;

    const conversation = await Conversation.findById(conversationId)
      .populate('clientUserId', 'name email firebaseUid')
      .populate('assignedRepresentative', 'name email firebaseUid');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is part of this conversation
    const isClient = conversation.clientUserId?.firebaseUid === userId;
    const isRepresentative = conversation.assignedRepresentative?.firebaseUid === userId;

    if (!isClient && !isRepresentative) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to join this call'
      });
    }

    // Check if there's an active call room
    if (!conversation.metadata?.activeCallRoom) {
      return res.status(404).json({
        success: false,
        message: 'No active call room found for this conversation'
      });
    }

    const roomName = conversation.metadata.activeCallRoom.roomName;
    const userName = isClient ? conversation.clientUserId.name : conversation.assignedRepresentative.name;

    // Create meeting token
    const token = await createMeetingToken(roomName, userName, true);

    res.json({
      success: true,
      data: {
        token,
        roomName,
        roomUrl: conversation.metadata.activeCallRoom.roomUrl
      }
    });

  } catch (error) {
    console.error('Error getting call token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call token',
      error: error.message
    });
  }
};

/**
 * End a call and cleanup room
 */
export const endCall = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.firebaseUid;

    const conversation = await Conversation.findById(conversationId)
      .populate('clientUserId', 'firebaseUid')
      .populate('assignedRepresentative', 'firebaseUid');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check authorization
    const isClient = conversation.clientUserId?.firebaseUid === userId;
    const isRepresentative = conversation.assignedRepresentative?.firebaseUid === userId;

    if (!isClient && !isRepresentative) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to end this call'
      });
    }

    // Remove active call room from metadata
    if (conversation.metadata?.activeCallRoom) {
      const roomName = conversation.metadata.activeCallRoom.roomName;
      
      // Delete Daily.co room
      try {
        await axios.delete(
          `${DAILY_API_BASE}/rooms/${roomName}`,
          {
            headers: {
              'Authorization': `Bearer ${DAILY_API_KEY}`
            }
          }
        );
      } catch (deleteError) {
        console.error('Error deleting Daily room:', deleteError.response?.data || deleteError.message);
        // Continue even if delete fails
      }

      // Remove from metadata
      const metadata = { ...conversation.metadata };
      delete metadata.activeCallRoom;
      conversation.metadata = metadata;
      await conversation.save();
    }

    res.json({
      success: true,
      message: 'Call ended successfully'
    });

  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end call',
      error: error.message
    });
  }
};

/**
 * Helper function to create Daily.co meeting token
 */
async function createMeetingToken(roomName, userName, isOwner = false) {
  try {
    const tokenConfig = {
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      }
    };

    const response = await axios.post(
      `${DAILY_API_BASE}/meeting-tokens`,
      tokenConfig,
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.token;
  } catch (error) {
    console.error('Error creating meeting token:', error.response?.data || error.message);
    throw error;
  }
}
