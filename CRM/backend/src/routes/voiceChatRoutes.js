/**
 * Voice Chat Routes
 * 
 * Routes for voice/video calling using Daily.co.
 */

import express from 'express';
import * as voiceChatController from '../controllers/voiceChatController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// ===== Status =====

// Check if voice chat is enabled
router.get('/status', verifyFirebaseToken, voiceChatController.getStatus);

// ===== Rooms =====

// Create a new call room
router.post('/rooms', verifyFirebaseToken, voiceChatController.createRoom);

// Get active calls
router.get('/active', verifyFirebaseToken, voiceChatController.getActiveCalls);

// Get meeting token for a room
router.get('/rooms/:roomName/token', verifyFirebaseToken, voiceChatController.getMeetingToken);

// Get room participants
router.get('/rooms/:roomName/participants', verifyFirebaseToken, voiceChatController.getRoomParticipants);

// Get room recordings
router.get('/rooms/:roomName/recordings', verifyFirebaseToken, voiceChatController.getRecordings);

// End a call
router.delete('/rooms/:roomName', verifyFirebaseToken, voiceChatController.endCall);

// ===== Calling =====

// Initiate a call to another user
router.post('/call', verifyFirebaseToken, voiceChatController.initiateCall);

// Create a group call
router.post('/group-call', verifyFirebaseToken, voiceChatController.createGroupCall);

// Answer an incoming call
router.post('/call/:roomName/answer', verifyFirebaseToken, voiceChatController.answerCall);

// Decline an incoming call
router.post('/call/:roomName/decline', verifyFirebaseToken, voiceChatController.declineCall);

export default router;
