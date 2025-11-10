<<<<<<< HEAD
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['vendor', 'customer', 'admin'], required: true },
  // add other profile fields as needed
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
=======
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true }, // Firebase UID
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["client", "vendor"], default: "client" },
    subscriptionActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
>>>>>>> f43fda7bb8cfd1d10fda5257e30cb6ae392dc6d3
