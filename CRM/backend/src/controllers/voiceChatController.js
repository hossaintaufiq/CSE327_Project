/**
 * Voice Chat Controller
 * 
 * Handles voice/video call endpoints using Daily.co.
 */

import * as voiceChatService from '../services/voiceChatService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { emitToCompany, emitToUser } from '../services/liveChatService.js';

/**
 * Create a new call room
 */
export const createRoom = async (req, res, next) => {
  try {
    const { name, expiryMinutes, enableRecording, maxParticipants } = req.body;

    const room = await voiceChatService.createRoom({
      name,
      companyId: req.companyId,
      expiryMinutes,
      enableRecording,
      maxParticipants,
    });

    return successResponse(res, { room }, 201, 'Call room created');
  } catch (error) {
    if (error.message.includes('DAILY_API_KEY')) {
      return errorResponse(res, 'CONFIG_ERROR', 'Voice chat is not configured', 503);
    }
    next(error);
  }
};

/**
 * Get a meeting token for joining a room
 */
export const getMeetingToken = async (req, res, next) => {
  try {
    const { roomName } = req.params;
    const { isOwner } = req.query;

    const token = await voiceChatService.createMeetingToken({
      roomName,
      userName: req.user.name || req.user.email,
      userId: req.user._id.toString(),
      isOwner: isOwner === 'true',
    });

    return successResponse(res, { token });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate a call to another user
 */
export const initiateCall = async (req, res, next) => {
  try {
    const { recipientId, recipientName } = req.body;

    if (!recipientId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'recipientId is required', 400);
    }

    const call = await voiceChatService.initiateCall({
      callerId: req.user._id.toString(),
      callerName: req.user.name || req.user.email,
      recipientId,
      recipientName: recipientName || 'User',
      companyId: req.companyId,
    });

    // Notify the recipient via Socket.io
    emitToUser(recipientId, 'call:incoming', {
      callId: call.room.roomName,
      caller: {
        id: req.user._id.toString(),
        name: req.user.name || req.user.email,
      },
      roomUrl: call.recipient.roomUrl,
      token: call.recipient.token,
      createdAt: call.createdAt,
    });

    return successResponse(res, {
      callId: call.room.roomName,
      roomUrl: call.caller.roomUrl,
      token: call.caller.token,
      expiresAt: call.room.expiresAt,
    }, 201, 'Call initiated');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a group call
 */
export const createGroupCall = async (req, res, next) => {
  try {
    const { name, participants } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return errorResponse(res, 'VALIDATION_ERROR', 'participants array is required', 400);
    }

    // Add the caller as the first participant
    const allParticipants = [
      { userId: req.user._id.toString(), userName: req.user.name || req.user.email },
      ...participants,
    ];

    const call = await voiceChatService.createGroupCall({
      name: name || 'Group Call',
      companyId: req.companyId,
      participants: allParticipants,
    });

    // Notify all participants except the caller
    for (let i = 1; i < call.participants.length; i++) {
      const participant = call.participants[i];
      emitToUser(participant.userId, 'call:group-invite', {
        callId: call.room.roomName,
        name: name || 'Group Call',
        organizer: {
          id: req.user._id.toString(),
          name: req.user.name || req.user.email,
        },
        roomUrl: participant.roomUrl,
        token: participant.token,
        participantCount: allParticipants.length,
      });
    }

    // Return caller's details
    const callerDetails = call.participants[0];
    return successResponse(res, {
      callId: call.room.roomName,
      roomUrl: callerDetails.roomUrl,
      token: callerDetails.token,
      expiresAt: call.room.expiresAt,
      participantCount: allParticipants.length,
    }, 201, 'Group call created');
  } catch (error) {
    next(error);
  }
};

/**
 * Get room participants
 */
export const getRoomParticipants = async (req, res, next) => {
  try {
    const { roomName } = req.params;
    const participants = await voiceChatService.getRoomParticipants(roomName);
    return successResponse(res, { participants });
  } catch (error) {
    next(error);
  }
};

/**
 * End a call (delete room)
 */
export const endCall = async (req, res, next) => {
  try {
    const { roomName } = req.params;
    
    await voiceChatService.deleteRoom(roomName);

    // Notify all participants
    emitToCompany(req.companyId, 'call:ended', {
      roomName,
      endedBy: req.user._id.toString(),
    });

    return successResponse(res, null, 200, 'Call ended');
  } catch (error) {
    next(error);
  }
};

/**
 * Get active calls
 */
export const getActiveCalls = async (req, res, next) => {
  try {
    const rooms = await voiceChatService.listRooms();
    
    // Filter rooms belonging to this company (by naming convention)
    const companyRooms = rooms.filter(room => 
      room.name.includes(req.companyId) || room.name.startsWith('crm-')
    );

    return successResponse(res, { 
      activeCalls: companyRooms,
      count: companyRooms.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Answer an incoming call
 */
export const answerCall = async (req, res, next) => {
  try {
    const { roomName } = req.params;

    // Generate a token for the answering user
    const token = await voiceChatService.createMeetingToken({
      roomName,
      userName: req.user.name || req.user.email,
      userId: req.user._id.toString(),
      isOwner: false,
    });

    const room = await voiceChatService.getRoom(roomName);

    // Notify caller that call was answered
    emitToCompany(req.companyId, 'call:answered', {
      roomName,
      answeredBy: {
        id: req.user._id.toString(),
        name: req.user.name || req.user.email,
      },
    });

    return successResponse(res, {
      roomUrl: `${room.url}?t=${token.token}`,
      token: token.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline an incoming call
 */
export const declineCall = async (req, res, next) => {
  try {
    const { roomName } = req.params;
    const { reason } = req.body;

    // Notify caller that call was declined
    emitToCompany(req.companyId, 'call:declined', {
      roomName,
      declinedBy: {
        id: req.user._id.toString(),
        name: req.user.name || req.user.email,
      },
      reason: reason || 'User declined the call',
    });

    return successResponse(res, null, 200, 'Call declined');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recordings for a room
 */
export const getRecordings = async (req, res, next) => {
  try {
    const { roomName } = req.params;
    const recordings = await voiceChatService.getRecordings(roomName);
    return successResponse(res, { recordings });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if voice chat is configured
 */
export const getStatus = async (req, res, next) => {
  try {
    const isConfigured = await voiceChatService.validateApiKey();
    return successResponse(res, { 
      enabled: isConfigured,
      provider: 'daily.co',
    });
  } catch (error) {
    return successResponse(res, { 
      enabled: false,
      provider: 'daily.co',
      error: 'Voice chat not configured',
    });
  }
};

export default {
  createRoom,
  getMeetingToken,
  initiateCall,
  createGroupCall,
  getRoomParticipants,
  endCall,
  getActiveCalls,
  answerCall,
  declineCall,
  getRecordings,
  getStatus,
};
