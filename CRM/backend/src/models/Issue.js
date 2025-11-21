import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null, // null means system-level issue
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Support team member
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['bug', 'feature_request', 'support', 'billing', 'security', 'performance', 'other'],
      default: 'support',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'open',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        url: String,
        filename: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolution: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    isDispute: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

issueSchema.index({ companyId: 1, createdAt: -1 });
issueSchema.index({ status: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ category: 1 });

export const Issue = mongoose.model('Issue', issueSchema);

