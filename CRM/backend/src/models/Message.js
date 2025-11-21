import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means message to company/admin
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['support', 'order', 'general', 'complaint', 'feedback'],
      default: 'general',
    },
  },
  { timestamps: true }
);

messageSchema.index({ companyId: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ recipientId: 1 });
messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);

