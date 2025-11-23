import mongoose from 'mongoose';

const featureToggleSchema = new mongoose.Schema(
  {
    feature: {
      type: String,
      required: true,
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    affectedCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
    ],
    // If empty, applies to all companies
    // If has companies, only those companies are affected
  },
  { timestamps: true }
);

featureToggleSchema.index({ enabled: 1 });

export const FeatureToggle = mongoose.model('FeatureToggle', featureToggleSchema);

