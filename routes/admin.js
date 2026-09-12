import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  reassignShift,
  anchorNow
} from '../controllers/adminController.js';

const router = express.Router();

// All admin endpoints require JWT authentication and Admin role
router.use(authenticateJWT, requireAdmin);

// POST /admin/reassign-shift - reassign staff member shift immediately
router.post('/reassign-shift', reassignShift);

// POST /admin/anchor-now - create a manual cryptographic snapshot anchor
router.post('/anchor-now', anchorNow);

export default router;
