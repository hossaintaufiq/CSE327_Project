import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planType: { type: String, default: "basic" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
