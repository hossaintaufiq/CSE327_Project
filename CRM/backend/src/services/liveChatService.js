/**
 * Live Chat Service
 * 
 * Real-time chat functionality using Socket.io for:
 * - Client-employee communication
 * - Internal team chat
 * - Typing indicators
 * - Online presence
 * - Message history
 */

import { Server } from 'socket.io';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

let io = null;

// Track online users: { odId: { socketId, companyId, name } }
const onlineUsers = new Map();

// Track typing status: { `${companyId}:${recipientId}`: [userId1, userId2] }
const typingUsers = new Map();

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3100',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle user authentication/joining
    socket.on('user:join', async (data) => {
      try {
        const { userId, companyId, name } = data;
        
        if (!userId || !companyId) {
          socket.emit('error', { message: 'userId and companyId required' });
          return;
        }

        // Store user info
        onlineUsers.set(userId, {
          socketId: socket.id,
          companyId,
          name: name || 'Unknown',
        });

        // Join company room
        socket.join(`company:${companyId}`);
        socket.join(`user:${userId}`);

        // Notify others in company that user is online
        socket.to(`company:${companyId}`).emit('user:online', {
          userId,
          name,
          timestamp: new Date(),
        });

        // Send current online users to the joining user
        const companyOnlineUsers = getOnlineUsersForCompany(companyId);
        socket.emit('users:online', { users: companyOnlineUsers });

        console.log(`User ${name} (${userId}) joined company ${companyId}`);
      } catch (error) {
        console.error('Error in user:join:', error);
        socket.emit('error', { message: 'Failed to join' });
      }
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { senderId, recipientId, companyId, content, messageType = 'direct' } = data;

        if (!senderId || !companyId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Save message to database
        const message = await Message.create({
          companyId,
          senderId,
          recipientId: recipientId || null,
          content,
          messageType,
          isRead: false,
        });

        await message.populate('senderId', 'name email');

        const messageData = {
          _id: message._id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
        };

        // Emit to recipient (direct message) or company (broadcast)
        if (recipientId) {
          // Direct message - send to recipient and back to sender
          io.to(`user:${recipientId}`).emit('message:receive', messageData);
          socket.emit('message:sent', messageData);
        } else {
          // Company broadcast
          io.to(`company:${companyId}`).emit('message:receive', messageData);
        }

        // Clear typing indicator
        clearTyping(companyId, senderId, recipientId);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      const { userId, companyId, recipientId, userName } = data;
      
      if (recipientId) {
        // Direct message typing
        io.to(`user:${recipientId}`).emit('typing:update', {
          userId,
          userName,
          isTyping: true,
        });
      } else {
        // Company broadcast typing
        socket.to(`company:${companyId}`).emit('typing:update', {
          userId,
          userName,
          isTyping: true,
        });
      }

      // Track typing status
      const key = `${companyId}:${recipientId || 'broadcast'}`;
      if (!typingUsers.has(key)) {
        typingUsers.set(key, new Set());
      }
      typingUsers.get(key).add(userId);
    });

    socket.on('typing:stop', (data) => {
      const { userId, companyId, recipientId } = data;
      clearTyping(companyId, userId, recipientId);
    });

    // Handle message read status
    socket.on('message:read', async (data) => {
      try {
        const { messageIds, readerId } = data;
        
        if (!messageIds || !messageIds.length) return;

        // Update messages as read
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { isRead: true, readAt: new Date() }
        );

        // Notify senders that messages were read
        const messages = await Message.find({ _id: { $in: messageIds } }).select('senderId');
        const senderIds = [...new Set(messages.map(m => m.senderId.toString()))];

        senderIds.forEach(senderId => {
          io.to(`user:${senderId}`).emit('message:read', {
            messageIds,
            readerId,
            readAt: new Date(),
          });
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Find and remove user from online list
      for (const [odId, userData] of onlineUsers.entries()) {
        if (userData.socketId === socket.id) {
          const { companyId, name } = userData;
          
          // Notify company that user went offline
          socket.to(`company:${companyId}`).emit('user:offline', {
            userId: odId,
            name,
            timestamp: new Date(),
          });

          onlineUsers.delete(odId);
          console.log(`User ${name} (${odId}) disconnected`);
          break;
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket.io server initialized');
  return io;
}

/**
 * Clear typing indicator for a user
 */
function clearTyping(companyId, userId, recipientId) {
  const key = `${companyId}:${recipientId || 'broadcast'}`;
  const typing = typingUsers.get(key);
  
  if (typing) {
    typing.delete(userId);
    
    if (recipientId) {
      io.to(`user:${recipientId}`).emit('typing:update', {
        userId,
        isTyping: false,
      });
    } else {
      io.to(`company:${companyId}`).emit('typing:update', {
        userId,
        isTyping: false,
      });
    }
  }
}

/**
 * Get online users for a company
 * @param {string} companyId - Company ID
 * @returns {Array} Array of online user info
 */
function getOnlineUsersForCompany(companyId) {
  const users = [];
  for (const [userId, userData] of onlineUsers.entries()) {
    if (userData.companyId === companyId) {
      users.push({
        userId,
        name: userData.name,
      });
    }
  }
  return users;
}

/**
 * Get Socket.io instance
 * @returns {Server|null} Socket.io server instance
 */
export function getIO() {
  return io;
}

/**
 * Emit event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit event to all users in a company
 * @param {string} companyId - Company ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToCompany(companyId, event, data) {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
}

/**
 * Check if a user is online
 * @param {string} userId - User ID
 * @returns {boolean} Whether user is online
 */
export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

/**
 * Get count of online users for a company
 * @param {string} companyId - Company ID
 * @returns {number} Online user count
 */
export function getOnlineCount(companyId) {
  return getOnlineUsersForCompany(companyId).length;
}

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToCompany,
  isUserOnline,
  getOnlineCount,
};
