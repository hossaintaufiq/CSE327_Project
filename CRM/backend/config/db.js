<<<<<<< HEAD
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // these options are now defaults in mongoose 6+, but safe to include:
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
=======
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
>>>>>>> f43fda7bb8cfd1d10fda5257e30cb6ae392dc6d3
    process.exit(1);
  }
};

<<<<<<< HEAD
module.exports = connectDB;
=======
export default connectDB;
>>>>>>> f43fda7bb8cfd1d10fda5257e30cb6ae392dc6d3
