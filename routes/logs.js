import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getLogs,
  verifyChainHandler,
  getOverridesSummary
} from '../controllers/logsController.js';

const router = express.Router();

// All logs endpoints require JWT authentication and Admin role
router.use(authenticateJWT, requireAdmin);

// GET /logs - paginated access logs
router.get('/', getLogs);

// GET /logs/verify - cryptographic verification of hash chain and anchors
router.get('/verify', verifyChainHandler);

// GET /logs/overrides/summary - aggregated ranking of emergency overrides by staff
router.get('/overrides/summary', getOverridesSummary);

export default router;
