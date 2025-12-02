import express from 'express';
import { signup, login, getMe, syncUser, updateProfile } from '../controllers/authController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.post('/sync-user', verifyFirebaseToken, syncUser);
router.get('/me', verifyFirebaseToken, getMe);
router.put('/profile', verifyFirebaseToken, updateProfile);

export default router;

