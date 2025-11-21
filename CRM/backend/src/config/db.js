import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create Super Admin user if it doesn't exist
    await createSuperAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    const { User } = await import('../models/User.js');
    const superAdminEmail = 'hossainahmmedtaufiq22@gmail.com';
    
    const existingAdmin = await User.findOne({ email: superAdminEmail });
    if (!existingAdmin) {
      // Super Admin will be created via Firebase Auth, we just need to mark them in DB
      console.log('ℹ️  Super Admin user will be created on first login');
    }
  } catch (error) {
    console.error('Error checking Super Admin:', error.message);
  }
};

