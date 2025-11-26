import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import { initFirebaseAdmin } from './src/config/firebaseAdmin.js';
import authRoutes from './src/routes/authRoutes.js';
import companyRoutes from './src/routes/companyRoutes.js';
import superAdminRoutes from './src/routes/superAdminRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import clientRoutes from './src/routes/clientRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import testRoutes from './src/routes/testRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import jiraRoutes from './src/routes/jiraRoutes.js';
import { jiraSyncService } from './src/services/jiraSyncService.js';

console.log('JIRA_BASE_URL:', process.env.JIRA_BASE_URL);
console.log('JIRA_EMAIL:', process.env.JIRA_EMAIL ? 'SET' : 'NOT SET');
console.log('JIRA_API_TOKEN:', process.env.JIRA_API_TOKEN ? 'SET' : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 5001;

console.log('Initializing Express app...');

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Middleware configured...');

// Initialize services
const initializeServer = async () => {
  // Initialize Firebase Admin
  console.log('Initializing Firebase...');
  initFirebaseAdmin();

  // Connect to MongoDB
  console.log('Connecting to MongoDB...');
  await connectDB();

  // Initialize Jira sync service
  try {
    console.log('Starting Jira sync service...');
    jiraSyncService.startPeriodicSync(); // Starts with default 5-minute interval for near-instant sync
    console.log('✅ Jira sync service started');
  } catch (error) {
    console.error('❌ Error starting Jira sync service:', error.message);
  }

  // Health check
  app.get('/api/health', async (req, res) => {
    const { getFirebaseAdmin } = await import('./src/config/firebaseAdmin.js');
    let firebaseStatus = 'not initialized';
    try {
      getFirebaseAdmin();
      firebaseStatus = 'initialized';
    } catch (error) {
      firebaseStatus = `error: ${error.message}`;
    }
    
    res.json({ 
      status: 'ok', 
      message: 'CRM Backend API is running',
      firebaseAdmin: firebaseStatus
    });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/super-admin', superAdminRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/test', testRoutes);
  app.use('/api/jira', jiraRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

// Start the server
initializeServer().catch((error) => {
  console.error('❌ Server initialization failed:', error);
  process.exit(1);
});

