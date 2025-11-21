import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['all', 'companies', 'users', 'specific_companies'],
      default: 'all',
    },
    targetCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
    ],
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'maintenance', 'update', 'announcement'],
      default: 'info',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ targetType: 1 });
announcementSchema.index({ type: 1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);

