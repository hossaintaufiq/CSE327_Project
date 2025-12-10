import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    // Client user who placed the order (the actual User account)
    clientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Legacy field - links to Client record (for leads converted to orders)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: String, // Product SKU or ID
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        description: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
      default: 'pending',
    },
    // Assigned company employee to handle this order
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Shipping information
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // Payment information
    payment: {
      method: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'online', 'other'],
        default: 'cash',
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: String,
      paidAt: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Customer notes/special instructions
    customerNotes: {
      type: String,
      trim: true,
    },
    // Related conversation (if order came from chat)
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
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
    // Order timeline/history
    timeline: [{
      status: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      notes: String,
    }],
  },
  { timestamps: true }
);

orderSchema.index({ companyId: 1, createdAt: -1 });
orderSchema.index({ clientUserId: 1, createdAt: -1 }); // For client's order history
orderSchema.index({ clientId: 1 });
orderSchema.index({ assignedTo: 1 });
orderSchema.index({ status: 1 });

// Pre-save hook to add timeline entry on status change
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);

