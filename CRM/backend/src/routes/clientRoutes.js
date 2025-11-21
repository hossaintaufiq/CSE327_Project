import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController.js';

const router = express.Router();

router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', checkRole(['company_admin', 'manager', 'employee']), createClient);
router.put('/:id', checkRole(['company_admin', 'manager', 'employee']), updateClient);
router.delete('/:id', checkRole(['company_admin', 'manager']), deleteClient);

export default router;

