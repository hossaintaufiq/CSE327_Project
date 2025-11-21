import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'login_failed',
        'company_created',
        'company_updated',
        'company_deleted',
        'user_created',
        'user_updated',
        'user_deleted',
        'role_updated',
        'subscription_created',
        'subscription_updated',
        'subscription_cancelled',
        'data_exported',
        'settings_updated',
        'feature_toggled',
        'suspicious_activity',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ companyId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

