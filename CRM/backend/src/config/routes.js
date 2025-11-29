import authRoutes from '../routes/authRoutes.js';
// import companyRoutes from '../routes/companyRoutes.js';
// import superAdminRoutes from '../routes/superAdminRoutes.js';
// import messageRoutes from '../routes/messageRoutes.js';
// import chatRoutes from '../routes/chatRoutes.js';
// import dashboardRoutes from '../routes/dashboardRoutes.js';
// import clientRoutes from '../routes/clientRoutes.js';
// import orderRoutes from '../routes/orderRoutes.js';
// import projectRoutes from '../routes/projectRoutes.js';
// import taskRoutes from '../routes/taskRoutes.js';
// import testRoutes from '../routes/testRoutes.js';
// import notificationRoutes from '../routes/notificationRoutes.js';
// import jiraRoutes from '../routes/jiraRoutes.js';

export const loadRoutes = (app) => {
  // Health check
  app.get('/api/health', async (req, res) => {
    const { getFirebaseAdmin } = await import('../config/firebaseAdmin.js');
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
      firebaseAdmin: firebaseStatus,
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  // app.use('/api/company', companyRoutes);
  // app.use('/api/super-admin', superAdminRoutes);
  // app.use('/api/messages', messageRoutes);
  // app.use('/api/chat', chatRoutes);
  // app.use('/api/dashboard', dashboardRoutes);
  // app.use('/api/clients', clientRoutes);
  // app.use('/api/orders', orderRoutes);
  // app.use('/api/projects', projectRoutes);
  // app.use('/api/tasks', taskRoutes);
  // app.use('/api/test', testRoutes);
  // app.use('/api/jira', jiraRoutes);
  // app.use('/api/notifications', notificationRoutes);
};