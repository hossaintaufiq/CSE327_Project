import { connectDB } from './db.js';
import { initFirebaseAdmin } from './firebaseAdmin.js';
import { jiraSyncService } from '../services/jiraSyncService.js';

export const initializeServices = async () => {
  try {
    console.log('🔄 Initializing services...');

    // Initialize Firebase Admin
    console.log('Initializing Firebase...');
    initFirebaseAdmin();
    console.log('✅ Firebase Admin initialized');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected');

    // Initialize Jira sync service (disabled for debugging)
    console.log('Starting Jira sync service...');
    // jiraSyncService.startPeriodicSync(); // Temporarily disabled for debugging
    console.log('✅ Jira sync service disabled for debugging');

    console.log('🎉 All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    throw error;
  }
};