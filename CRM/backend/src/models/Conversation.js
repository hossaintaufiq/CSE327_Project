import mongoose from 'mongoose';

/**
 * Conversation Model
 * 
 * Handles client-company communication with support for:
 * - Company-specific conversations
 * - Product-specific issues
 * - Type categorization (inquiry, order, complaint)
 * - AI-first support with representative escalation
 * - Multiple communication channels (chat, voice, telegram)
 */
const conversationMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderType: {
      type: String,
      enum: ['client', 'ai', 'representative', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'voice', 'file', 'image', 'system', 'ai_response', 'call_log'],
      default: 'text',
    },
    metadata: {
      // For AI messages
      aiConfidence: Number,
      aiIntent: String,
      aiSuggestions: [String],
      
      // For file/voice messages
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number, // For voice messages
      
      // For call logs
      callDuration: Number,
      callType: {
        type: String,
        enum: ['voice_ai', 'voice_representative', 'video'],
      },
      callStatus: {
        type: String,
        enum: ['initiated', 'ringing', 'connected', 'ended', 'missed', 'failed'],
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    // Client who initiated the conversation
    clientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Company the conversation is with
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    
    // Optional: Specific product/service this conversation is about
    productId: {
      type: String, // Can be product SKU or ID
      default: null,
    },
    productName: {
      type: String,
      default: null,
    },
    
    // Conversation type
    type: {
      type: String,
      enum: ['inquiry', 'order', 'complaint', 'general', 'support'],
      default: 'general',
    },
    
    // Conversation title (auto-generated or custom)
    title: {
      type: String,
      default: function() {
        const typeLabels = {
          inquiry: 'Product Inquiry',
          order: 'Order Support',
          complaint: 'Complaint',
          general: 'General Chat',
          support: 'Support Request',
        };
        return typeLabels[this.type] || 'Conversation';
      },
    },
    
    // Current status
    status: {
      type: String,
      enum: ['active', 'pending_representative', 'with_representative', 'resolved', 'closed'],
      default: 'active',
    },
    
    // Priority level
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    
    // Communication channel
    channel: {
      type: String,
      enum: ['web_chat', 'voice_ai', 'voice_call', 'telegram', 'app'],
      default: 'web_chat',
    },
    
    // AI handling status
    aiHandled: {
      type: Boolean,
      default: true, // Starts with AI
    },
    
    // Assigned representative (when escalated from AI)
    assignedRepresentative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    
    // Escalation history
    escalationHistory: [{
      escalatedAt: {
        type: Date,
        default: Date.now,
      },
      reason: String,
      fromAi: Boolean,
      toRepresentative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
    
    // Related order (if conversation is about an order)
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    
    // Messages in this conversation
    messages: [conversationMessageSchema],
    
    // Last activity timestamp
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    
    // Resolution details
    resolution: {
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolutionType: {
        type: String,
        enum: ['ai_resolved', 'representative_resolved', 'client_closed', 'auto_closed'],
      },
      resolutionNotes: String,
      clientSatisfaction: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    
    // Tags for categorization
    tags: [String],
    
    // Internal notes (visible only to company staff)
    internalNotes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
conversationSchema.index({ clientUserId: 1, companyId: 1 });
conversationSchema.index({ clientUserId: 1, status: 1 });
conversationSchema.index({ companyId: 1, status: 1 });
conversationSchema.index({ companyId: 1, assignedRepresentative: 1 });
conversationSchema.index({ type: 1, status: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ 'messages.createdAt': -1 });

// Virtual for unread message count
conversationSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => !msg.isRead && msg.senderType !== 'client').length;
});

// Method to add a message
conversationSchema.methods.addMessage = async function(messageData) {
  this.messages.push(messageData);
  this.lastActivity = new Date();
  return this.save();
};

// Method to escalate to representative
conversationSchema.methods.escalateToRepresentative = async function(reason, representativeId = null) {
  this.aiHandled = false;
  this.status = representativeId ? 'with_representative' : 'pending_representative';
  this.assignedRepresentative = representativeId;
  this.escalationHistory.push({
    reason,
    fromAi: true,
    toRepresentative: representativeId,
  });
  
  // Add system message
  this.messages.push({
    senderType: 'system',
    content: representativeId 
      ? 'You are now connected with a customer representative.'
      : 'Your request has been escalated to a customer representative. Please wait.',
    messageType: 'system',
  });
  
  return this.save();
};

// Method to resolve conversation
conversationSchema.methods.resolve = async function(resolvedBy, resolutionType, notes = '') {
  this.status = 'resolved';
  this.resolution = {
    resolvedAt: new Date(),
    resolvedBy,
    resolutionType,
    resolutionNotes: notes,
  };
  
  this.messages.push({
    senderType: 'system',
    content: 'This conversation has been resolved. Thank you for contacting us!',
    messageType: 'system',
  });
  
  return this.save();
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function({
  clientUserId,
  companyId,
  type = 'general',
  productId = null,
  productName = null,
}) {
  // Look for existing active conversation of same type with same company/product
  let conversation = await this.findOne({
    clientUserId,
    companyId,
    type,
    productId,
    status: { $in: ['active', 'pending_representative', 'with_representative'] },
    isActive: true,
  });
  
  if (!conversation) {
    conversation = await this.create({
      clientUserId,
      companyId,
      type,
      productId,
      productName,
    });
  }
  
  return conversation;
};

export const Conversation = mongoose.model('Conversation', conversationSchema);
