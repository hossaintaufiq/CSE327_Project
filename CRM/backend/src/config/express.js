import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middleware/errorHandler.js';

export const createExpressApp = () => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  return app;
};

export const getPort = () => {
  return process.env.PORT || 5000;
};