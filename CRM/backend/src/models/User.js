import mongoose from 'mongoose';
import { isSuperAdminEmail } from '../config/superAdmin.js';

const companyMembershipSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    role: {
      type: String,
      enum: ['company_admin', 'manager', 'employee', 'client'],
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatar: {
      type: String,
    },
    globalRole: {
      type: String,
      enum: ['super_admin', 'user'],
      default: 'user',
    },
    companies: [companyMembershipSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Telegram integration
    telegramChatId: {
      type: String,
      sparse: true,
    },
    telegramUsername: {
      type: String,
    },
    telegramLinkedAt: {
      type: Date,
    },
    // Notification preferences
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      telegram: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
    // Last activity tracking
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ 'companies.companyId': 1 });

// Pre-save hook: Security validation - only super admin email can have super_admin role
userSchema.pre('save', function (next) {
  console.log('🔒 PRE-SAVE HOOK:', {
    email: this.email,
    globalRole: this.globalRole,
    isModified: this.isModified('globalRole'),
  });
  
  // If user is being set to super_admin, verify email matches
  if (this.globalRole === 'super_admin' && !isSuperAdminEmail(this.email)) {
    console.error(`❌ SECURITY: Attempted to set super_admin role for unauthorized email: ${this.email}`);
    // Revert to 'user' role
    this.globalRole = 'user';
    console.log('🔄 Reverted role to: user');
  }
  // If email doesn't match super admin email, ensure role is not super_admin
  if (!isSuperAdminEmail(this.email) && this.globalRole === 'super_admin') {
    console.error(`❌ SECURITY: Unauthorized super_admin role detected for email: ${this.email}`);
    this.globalRole = 'user';
    console.log('🔄 Reverted role to: user');
  }
  
  console.log('✅ PRE-SAVE HOOK COMPLETE. Final role:', this.globalRole);
  next();
});

// Pre-update hook: Also validate on update operations
userSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
  const update = this.getUpdate();
  if (update && update.$set && update.$set.globalRole === 'super_admin') {
    // For update operations, we need to check the email from the query
    // This is a best-effort check - the main validation happens in controllers
    console.warn('SECURITY: Update operation attempting to set super_admin role - verify email in controller');
  }
  next();
});

export const User = mongoose.model('User', userSchema);

