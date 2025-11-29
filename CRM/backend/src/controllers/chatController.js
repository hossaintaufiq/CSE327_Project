import { ChatRoom } from '../models/ChatRoom.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';

// Get all chat rooms for the user
export const getChatRooms = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { type, status = 'active' } = req.query;

    let query = {
      companyId,
      isActive: status === 'active',
    };

    // Filter by type if specified
    if (type) {
      query.type = type;
    }

    // Filter rooms where user is a participant
    query['participants.userId'] = user._id;

    const chatRooms = await ChatRoom.find(query)
      .populate('participants.userId', 'name email avatar')
      .populate('leadId', 'name email company')
      .populate('clientId', 'name email company')
      .populate('lastMessage')
      .populate('metadata.assignedTo', 'name email')
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: {
        chatRooms: chatRooms.map(room => ({
          id: room._id,
          type: room.type,
          title: room.title,
          participants: room.participants,
          lead: room.leadId ? {
            id: room.leadId._id,
            name: room.leadId.name,
            email: room.leadId.email,
            company: room.leadId.company,
          } : null,
          client: room.clientId ? {
            id: room.clientId._id,
            name: room.clientId.name,
            email: room.clientId.email,
            company: room.clientId.company,
          } : null,
          isActive: room.isActive,
          lastActivity: room.lastActivity,
          lastMessage: room.lastMessage,
          metadata: room.metadata,
          createdAt: room.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat rooms',
      error: error.message,
    });
  }
};

// Get messages for a specific chat room
export const getChatMessages = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user has access to this chat room
    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      companyId,
      'participants.userId': user._id,
      isActive: true,
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or access denied',
      });
    }

    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({
      chatRoomId: roomId,
      deleted: false,
    })
      .populate('senderId', 'name email avatar')
      .populate('metadata.replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read for this user
    await ChatMessage.updateMany(
      {
        chatRoomId: roomId,
        senderId: { $ne: user._id },
        'readBy.userId': { $ne: user._id },
      },
      {
        $push: {
          readBy: {
            userId: user._id,
            readAt: new Date(),
          },
        },
        isRead: true,
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse().map(msg => ({
          id: msg._id,
          chatRoomId: msg.chatRoomId,
          sender: {
            id: msg.senderId._id,
            name: msg.senderId.name,
            email: msg.senderId.email,
            avatar: msg.senderId.avatar,
            type: msg.senderType,
          },
          content: msg.content,
          messageType: msg.messageType,
          metadata: msg.metadata,
          isRead: msg.isRead,
          readBy: msg.readBy,
          edited: msg.edited,
          editedAt: msg.editedAt,
          createdAt: msg.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat messages',
      error: error.message,
    });
  }
};

// Create a new chat room
export const createChatRoom = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { type, leadId, clientId, participantIds, title, metadata } = req.body;

    // Validate input based on type
    if (type === 'lead' && !leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required for lead conversations',
      });
    }

    if (type === 'client' && !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required for client conversations',
      });
    }

    // Create participants array
    const participants = [{
      userId: user._id,
      role: 'owner',
    }];

    // Add additional participants
    if (participantIds && Array.isArray(participantIds)) {
      for (const participantId of participantIds) {
        participants.push({
          userId: participantId,
          role: 'member',
        });
      }
    }

    const chatRoom = new ChatRoom({
      companyId,
      type,
      participants,
      leadId: type === 'lead' ? leadId : null,
      clientId: type === 'client' ? clientId : null,
      title: title || undefined,
      metadata: metadata || {},
    });

    await chatRoom.save();

    // Populate the created room
    await chatRoom.populate('participants.userId', 'name email avatar');
    if (leadId) await chatRoom.populate('leadId', 'name email company');
    if (clientId) await chatRoom.populate('clientId', 'name email company');

    res.status(201).json({
      success: true,
      data: {
        chatRoom: {
          id: chatRoom._id,
          type: chatRoom.type,
          title: chatRoom.title,
          participants: chatRoom.participants,
          lead: chatRoom.leadId,
          client: chatRoom.clientId,
          isActive: chatRoom.isActive,
          metadata: chatRoom.metadata,
          createdAt: chatRoom.createdAt,
        },
      },
      message: 'Chat room created successfully',
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room',
      error: error.message,
    });
  }
};

// Send a message to a chat room
export const sendMessage = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { roomId } = req.params;
    const { content, messageType = 'text', metadata = {} } = req.body;

    // Verify user has access to this chat room
    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      companyId,
      'participants.userId': user._id,
      isActive: true,
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or access denied',
      });
    }

    const message = new ChatMessage({
      chatRoomId: roomId,
      senderId: user._id,
      senderType: 'user',
      content,
      messageType,
      metadata,
    });

    await message.save();

    // Update chat room's last message and activity
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: message._id,
      lastActivity: new Date(),
    });

    // Populate the message
    await message.populate('senderId', 'name email avatar');

    res.status(201).json({
      success: true,
      data: {
        message: {
          id: message._id,
          chatRoomId: message.chatRoomId,
          sender: {
            id: message.senderId._id,
            name: message.senderId.name,
            email: message.senderId.email,
            avatar: message.senderId.avatar,
            type: message.senderType,
          },
          content: message.content,
          messageType: message.messageType,
          metadata: message.metadata,
          isRead: message.isRead,
          createdAt: message.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// Add participant to chat room
export const addParticipant = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { roomId } = req.params;
    const { userId, role = 'member' } = req.body;

    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      companyId,
      'participants.userId': user._id,
      isActive: true,
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or access denied',
      });
    }

    // Check if user is already a participant
    const existingParticipant = chatRoom.participants.find(
      p => p.userId.toString() === userId
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'User is already a participant in this chat room',
      });
    }

    chatRoom.participants.push({
      userId,
      role,
      joinedAt: new Date(),
    });

    await chatRoom.save();

    res.json({
      success: true,
      message: 'Participant added successfully',
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant',
      error: error.message,
    });
  }
};

// Update chat room metadata
export const updateChatRoom = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { roomId } = req.params;
    const updates = req.body;

    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      companyId,
      'participants.userId': user._id,
      isActive: true,
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or access denied',
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'metadata'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'metadata') {
          chatRoom.metadata = { ...chatRoom.metadata, ...updates.metadata };
        } else {
          chatRoom[field] = updates[field];
        }
      }
    });

    await chatRoom.save();

    res.json({
      success: true,
      message: 'Chat room updated successfully',
      data: { chatRoom },
    });
  } catch (error) {
    console.error('Error updating chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat room',
      error: error.message,
    });
  }
};

// Set typing status
export const setTypingStatus = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { roomId } = req.params;
    const { isTyping } = req.body;

    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      companyId,
      'participants.userId': user._id,
      isActive: true,
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or access denied',
      });
    }

    // Update typing status in the chat room
    // Note: In a real implementation, you might want to use Redis or WebSocket for real-time typing
    // For now, we'll just acknowledge the request

    res.json({
      success: true,
      message: `Typing status updated: ${isTyping ? 'typing' : 'not typing'}`,
    });
  } catch (error) {
    console.error('Error setting typing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update typing status',
      error: error.message,
    });
  }
};