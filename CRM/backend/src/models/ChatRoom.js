import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
      enum: ['lead', 'client', 'internal', 'support'],
      required: true,
    },
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['owner', 'member', 'lead', 'client'],
        default: 'member',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client', // Can reference Client model for leads
      default: null,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    title: {
      type: String,
      trim: true,
      default: function() {
        if (this.type === 'lead' && this.leadId) return `Lead Conversation`;
        if (this.type === 'client' && this.clientId) return `Client Support`;
        if (this.type === 'internal') return `Internal Chat`;
        return `Chat Room`;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
      },
      tags: [String],
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
  },
  { timestamps: true }
);

chatRoomSchema.index({ companyId: 1, type: 1 });
chatRoomSchema.index({ 'participants.userId': 1 });
chatRoomSchema.index({ leadId: 1 });
chatRoomSchema.index({ clientId: 1 });
chatRoomSchema.index({ lastActivity: -1 });

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);