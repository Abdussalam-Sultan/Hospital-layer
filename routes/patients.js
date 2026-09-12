import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  listPatients,
  getPatientById,
  emergencyAccess
} from '../controllers/patientsController.js';

const router = express.Router();

// GET /patients - list patients in current shift ward
router.get('/', authenticateJWT, listPatients);

// GET /patients/:id - retrieve patient record with ward-based access check
router.get('/:id', authenticateJWT, getPatientById);

// POST /patients/:id/emergency-access - emergency override access with logged reason
router.post('/:id/emergency-access', authenticateJWT, emergencyAccess);

export default router;
