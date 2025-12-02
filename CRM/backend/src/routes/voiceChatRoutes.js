/**
 * Voice Chat Routes
 * 
 * Routes for voice/video calling using Daily.co.
 */

import express from 'express';
import * as voiceChatController from '../controllers/voiceChatController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ===== Status =====

// Check if voice chat is enabled
router.get('/status', auth, voiceChatController.getStatus);

// ===== Rooms =====

// Create a new call room
router.post('/rooms', auth, voiceChatController.createRoom);

// Get active calls
router.get('/active', auth, voiceChatController.getActiveCalls);

// Get meeting token for a room
router.get('/rooms/:roomName/token', auth, voiceChatController.getMeetingToken);

// Get room participants
router.get('/rooms/:roomName/participants', auth, voiceChatController.getRoomParticipants);

// Get room recordings
router.get('/rooms/:roomName/recordings', auth, voiceChatController.getRecordings);

// End a call
router.delete('/rooms/:roomName', auth, voiceChatController.endCall);

// ===== Calling =====

// Initiate a call to another user
router.post('/call', auth, voiceChatController.initiateCall);

// Create a group call
router.post('/group-call', auth, voiceChatController.createGroupCall);

// Answer an incoming call
router.post('/call/:roomName/answer', auth, voiceChatController.answerCall);

// Decline an incoming call
router.post('/call/:roomName/decline', auth, voiceChatController.declineCall);

export default router;
