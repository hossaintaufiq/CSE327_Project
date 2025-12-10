import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { createCallRoom, getCallToken, endCall } from '../controllers/audioCallController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

/**
 * @route   POST /api/audio-calls/:conversationId/create
 * @desc    Create a new audio call room for a conversation
 * @access  Private (Client or Representative)
 */
router.post('/:conversationId/create', createCallRoom);

/**
 * @route   GET /api/audio-calls/:conversationId/token
 * @desc    Get token to join an existing call
 * @access  Private (Client or Representative)
 */
router.get('/:conversationId/token', getCallToken);

/**
 * @route   POST /api/audio-calls/:conversationId/end
 * @desc    End an active audio call
 * @access  Private (Client or Representative)
 */
router.post('/:conversationId/end', endCall);

export default router;
