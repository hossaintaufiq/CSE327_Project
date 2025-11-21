import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

router.get('/stats', getDashboardStats);

export default router;

