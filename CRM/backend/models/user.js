import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: String,
  name: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  role: { type: String, enum: ["super_admin", "company_admin", "manager", "employee", "client"], default: "employee" },
});

export default mongoose.model("User", userSchema);
