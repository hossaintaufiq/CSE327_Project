import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false, // Email is optional for leads
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'lead', 'customer'],
      default: 'lead',
    },
    // Pipeline stage for lead management
    pipelineStage: {
      type: String,
      enum: ['prospect', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'prospect',
    },
    notes: {
      type: String,
      trim: true,
    },
    jiraIssues: [{
      issueKey: {
        type: String,
        required: true,
      },
      issueUrl: {
        type: String,
        required: true,
      },
      createdAt: {
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

clientSchema.index({ companyId: 1, createdAt: -1 });
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ pipelineStage: 1 });

export const Client = mongoose.model('Client', clientSchema);

