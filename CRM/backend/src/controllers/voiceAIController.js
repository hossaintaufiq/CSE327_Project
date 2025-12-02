/**
 * Voice AI Controller
 * 
 * Handles voice-to-AI endpoints.
 */

import * as voiceAIService from '../services/voiceAIService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * Process voice input (text already transcribed)
 */
export const processVoice = async (req, res, next) => {
  try {
    const { text, sessionId } = req.body;

    if (!text || typeof text !== 'string') {
      return errorResponse(res, 'VALIDATION_ERROR', 'text is required', 400);
    }

    const result = await voiceAIService.processVoiceInput({
      text: text.trim(),
      userId: req.user._id.toString(),
      companyId: req.companyId,
      sessionId,
    });

    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Process audio file (for future audio upload support)
 * Note: Requires additional speech-to-text integration
 */
export const processAudio = async (req, res, next) => {
  try {
    // For now, return info about client-side transcription
    return successResponse(res, {
      message: 'Use client-side Web Speech API for transcription, then send text to /voice/process',
      supported: true,
      clientSideRequired: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation history
 */
export const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const fullSessionId = sessionId || `${req.user._id}-${req.companyId}`;
    
    const history = voiceAIService.getConversationHistory(fullSessionId);
    
    return successResponse(res, { 
      sessionId: fullSessionId,
      history: history.map(h => ({
        role: h.role,
        text: h.parts[0]?.text || '',
      })),
      messageCount: history.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear conversation history
 */
export const clearHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const fullSessionId = sessionId || `${req.user._id}-${req.companyId}`;
    
    voiceAIService.clearConversation(fullSessionId);
    
    return successResponse(res, null, 200, 'Conversation cleared');
  } catch (error) {
    next(error);
  }
};

/**
 * Get quick commands reference
 */
export const getQuickCommands = async (req, res, next) => {
  try {
    return successResponse(res, {
      commands: Object.keys(voiceAIService.QUICK_COMMANDS),
      description: 'Say any of these phrases for quick actions',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * WebSocket handler for real-time voice streaming
 * Called from Socket.io setup
 */
export const handleVoiceSocket = (socket, io) => {
  // Voice session start
  socket.on('voice:start', (data) => {
    const { sessionId, companyId } = data;
    socket.voiceSession = { sessionId, companyId, startTime: Date.now() };
    socket.emit('voice:ready', { sessionId });
  });

  // Process voice text
  socket.on('voice:text', async (data) => {
    const { text, sessionId } = data;
    
    if (!text || !socket.userId) {
      socket.emit('voice:error', { message: 'Invalid request' });
      return;
    }

    try {
      const result = await voiceAIService.processVoiceInput({
        text,
        userId: socket.userId,
        companyId: socket.companyId || socket.voiceSession?.companyId,
        sessionId,
      });

      socket.emit('voice:response', {
        ...result,
        sessionId,
        timestamp: Date.now(),
      });

      // If there was an action, broadcast to company
      if (result.hasAction && result.action?.success) {
        io.to(`company:${socket.companyId}`).emit('voice:action', {
          userId: socket.userId,
          action: result.action,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      socket.emit('voice:error', { 
        message: 'Failed to process voice input',
        error: error.message,
      });
    }
  });

  // Voice session end
  socket.on('voice:end', () => {
    if (socket.voiceSession) {
      const duration = Date.now() - socket.voiceSession.startTime;
      socket.emit('voice:ended', { duration });
      socket.voiceSession = null;
    }
  });
};

export default {
  processVoice,
  processAudio,
  getHistory,
  clearHistory,
  getQuickCommands,
  handleVoiceSocket,
};
