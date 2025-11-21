import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ['free', 'standard', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'trial',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank', 'paypal', 'none'],
      default: 'none',
    },
    lastPaymentDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    failedPayments: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ companyId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);

