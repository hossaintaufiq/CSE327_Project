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
import { errorHandler } from './src/middleware/errorHandler.js';
import jiraRoutes from './src/routes/jiraRoutes.js';

console.log('JIRA_BASE_URL:', process.env.JIRA_BASE_URL);
console.log('JIRA_EMAIL:', process.env.JIRA_EMAIL ? 'SET' : 'NOT SET');
console.log('JIRA_API_TOKEN:', process.env.JIRA_API_TOKEN ? 'SET' : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/jira', jiraRoutes);

// Initialize Firebase Admin
initFirebaseAdmin();

// Connect to MongoDB
connectDB();

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

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

