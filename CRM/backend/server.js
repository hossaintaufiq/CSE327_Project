import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { initFirebaseAdmin } from './src/config/firebaseAdmin.js';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import companyRoutes from './src/routes/companyRoutes.js';
import superAdminRoutes from './src/routes/superAdminRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import clientRoutes from './src/routes/clientRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import testRoutes from './src/routes/testRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import jiraRoutes from './src/routes/jiraRoutes.js';
import voipRoutes from './src/routes/voipRoutes.js';
import telegramRoutes from './src/routes/telegramRoutes.js';
import employeeRoutes from './src/routes/employeeRoutes.js';

// Import services
import { initTwilioClient } from './src/services/twilioService.js';
import { initTelegramBot } from './src/services/telegramService.js';
import { testEmailConfig } from './src/services/emailService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3100',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CRM Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/test', testRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/voip', voipRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/employees', employeeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: { code: 'NOT_FOUND', message: 'Route not found' } 
  });
});

// Central error handler with standard response format
app.use((err, req, res, next) => {
  // Log error (avoid logging sensitive data)
  const logMessage = err.message || 'Unknown error';
  const sanitizedMessage = logMessage.replace(/(password|token|secret|key)=[^&\s]*/gi, '$1=***');
  console.error(`[${new Date().toISOString()}] Error:`, sanitizedMessage);
  
  // Determine status code
  const status = err.status || err.statusCode || 500;
  
  // Build standard error response
  const errorResponse = {
    success: false,
    error: {
      code: err.code || (status === 400 ? 'BAD_REQUEST' : status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'),
      message: process.env.NODE_ENV === 'production' && status === 500 
        ? 'Internal Server Error' 
        : err.message || 'Internal Server Error'
    }
  };
  
  // Include validation errors if present
  if (err.errors) {
    errorResponse.error.details = err.errors;
  }
  
  res.status(status).json(errorResponse);
});

// Initialize and start server
const startServer = async () => {
  try {
    // Initialize Firebase Admin
    initFirebaseAdmin();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Initialize optional services
    initTwilioClient();
    initTelegramBot();
    
    // Test email configuration
    const emailOk = await testEmailConfig();
    if (!emailOk) {
      console.log('⚠️ Email service may not work - check GMAIL_USER and GMAIL_APP_PASSWORD');
    }

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('Press Ctrl+C to stop');
    });

    server.on('error', (err) => {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    });

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        mongoose.connection.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();

