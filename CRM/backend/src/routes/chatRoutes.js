import express from 'express';
import {
  getChatRooms,
  getChatMessages,
  createChatRoom,
  sendMessage,
  addParticipant,
  updateChatRoom,
  setTypingStatus,
} from '../controllers/chatController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';

const router = express.Router();

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Chat API is working' });
});

// All chat routes require authentication and company access
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// Get all chat rooms for the user
router.get('/rooms', getChatRooms);

// Create a new chat room
router.post('/rooms', createChatRoom);

// Get messages for a specific chat room
router.get('/rooms/:roomId/messages', getChatMessages);

// Send a message to a chat room
router.post('/rooms/:roomId/messages', sendMessage);

// Add participant to chat room
router.post('/rooms/:roomId/participants', addParticipant);

// Update chat room
router.put('/rooms/:roomId', updateChatRoom);

// Set typing status
router.post('/rooms/:roomId/typing', setTypingStatus);

export default router;