/**
 * Voice AI Routes
 * 
 * Routes for voice-to-AI interaction.
 */

import express from 'express';
import * as voiceAIController from '../controllers/voiceAIController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Process voice input (text)
router.post('/process', auth, voiceAIController.processVoice);

// Process audio file (future)
router.post('/audio', auth, voiceAIController.processAudio);

// Get conversation history
router.get('/history/:sessionId?', auth, voiceAIController.getHistory);

// Clear conversation history
router.delete('/history/:sessionId?', auth, voiceAIController.clearHistory);

// Get quick commands
router.get('/commands', auth, voiceAIController.getQuickCommands);

export default router;
