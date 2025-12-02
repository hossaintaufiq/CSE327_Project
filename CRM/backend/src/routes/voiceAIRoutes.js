/**
 * Voice AI Routes
 * 
 * Routes for voice-to-AI interaction.
 */

import express from 'express';
import * as voiceAIController from '../controllers/voiceAIController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Process voice input (text)
router.post('/process', verifyFirebaseToken, voiceAIController.processVoice);

// Process audio file (future)
router.post('/audio', verifyFirebaseToken, voiceAIController.processAudio);

// Get conversation history
router.get('/history/:sessionId?', verifyFirebaseToken, voiceAIController.getHistory);

// Clear conversation history
router.delete('/history/:sessionId?', verifyFirebaseToken, voiceAIController.clearHistory);

// Get quick commands
router.get('/commands', verifyFirebaseToken, voiceAIController.getQuickCommands);

export default router;
