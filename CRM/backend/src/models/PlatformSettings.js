import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      enum: ['api', 'email', 'sms', 'storage', 'branding', 'security', 'billing', 'other'],
      default: 'other',
    },
    description: {
      type: String,
      trim: true,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

platformSettingsSchema.index({ key: 1 });
platformSettingsSchema.index({ category: 1 });

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

