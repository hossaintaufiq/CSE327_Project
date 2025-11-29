import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderType: {
      type: String,
      enum: ['user', 'system', 'ai', 'bot'],
      default: 'user',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'system', 'ai_response'],
      default: 'text',
    },
    metadata: {
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      aiConfidence: Number,
      aiIntent: String,
      replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        default: null,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
    isTyping: {
      type: Boolean,
      default: false,
    },
    typingUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      startedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  { timestamps: true }
);

chatMessageSchema.index({ chatRoomId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ 'readBy.userId': 1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);