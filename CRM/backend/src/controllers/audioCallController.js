import '../config/env.js'; // Load env vars first
import { Conversation } from '../models/Conversation.js';
import { emitToUser } from '../services/liveChatService.js';
import { generateVoiceToken, getTwilioClient } from '../services/twilioService.js';

/**
 * Create a Twilio Voice call room for a conversation
 */
export const createCallRoom = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.firebaseUid;

    console.log('[createCallRoom] Starting call room creation:', { conversationId, userId });

    // Check if Twilio is configured
    if (!getTwilioClient()) {
      console.log('[createCallRoom] Twilio service not configured');
      return res.status(503).json({
        success: false,
        message: 'Audio call service not configured. Please check Twilio credentials.',
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

    // Generate Twilio Voice tokens for both participants
    const roomName = `conversation-${conversationId}-${Date.now()}`;
    const clientIdentity = `client-${conversation.clientUserId._id}`;
    const repIdentity = conversation.assignedRepresentative 
      ? `rep-${conversation.assignedRepresentative._id}` 
      : null;

    console.log('[createCallRoom] Generating Twilio tokens');

    const clientToken = generateVoiceToken(clientIdentity);
    const repToken = repIdentity ? generateVoiceToken(repIdentity) : null;

    console.log('[createCallRoom] Tokens generated successfully');

    // Store call info in conversation metadata
    conversation.metadata = {
      ...conversation.metadata,
      activeCallRoom: {
        roomName: roomName,
        clientIdentity: clientIdentity,
        repIdentity: repIdentity,
        createdAt: new Date(),
        createdBy: userId
      }
    };
    await conversation.save();

    console.log('[createCallRoom] Call room creation completed successfully');

    // Notify the other participant via Socket.IO
    const caller = isClient ? conversation.clientUserId : conversation.assignedRepresentative;
    const recipient = isClient ? conversation.assignedRepresentative : conversation.clientUserId;
    const recipientIdentity = isClient ? repIdentity : clientIdentity;
    const recipientToken = isClient ? repToken : clientToken;
    
    if (recipient?.firebaseUid) {
      console.log('[createCallRoom] Notifying recipient:', {
        email: recipient.email,
        firebaseUid: recipient.firebaseUid,
        identity: recipientIdentity
      });
      
      emitToUser(recipient.firebaseUid, 'call:incoming', {
        conversationId: conversation._id,
        token: recipientToken,
        roomName: roomName,
        identity: recipientIdentity,
        targetIdentity: isClient ? clientIdentity : repIdentity, // Who the recipient should call back
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
    } else {
      console.log('[createCallRoom] No recipient to notify');
    }

    res.json({
      success: true,
      data: {
        room: {
          name: roomName
        },
        token: isClient ? clientToken : repToken,
        identity: isClient ? clientIdentity : repIdentity,
        targetIdentity: isClient ? repIdentity : clientIdentity, // Who to call
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
      stack: error.stack
    });
    
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
    const identity = isClient 
      ? conversation.metadata.activeCallRoom.clientIdentity
      : conversation.metadata.activeCallRoom.repIdentity;

    // Generate Twilio Voice token
    const token = generateVoiceToken(identity);

    res.json({
      success: true,
      data: {
        token,
        roomName,
        identity
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
      const metadata = { ...conversation.metadata };
      delete metadata.activeCallRoom;
      conversation.metadata = metadata;
      await conversation.save();
      console.log('[endCall] Call ended for conversation:', conversationId);
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
