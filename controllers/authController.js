import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Staff, Shift, Ward } from '../models/index.js';
import { appendAuditLog } from '../utils/hashChain.js';
import { JWT_SECRET } from '../middleware/auth.js';

/**
 * Handle staff login
 * POST /auth/login
 */
export async function login(req, res) {
  try {
    const { staffId, password } = req.body || {};

    if (!staffId || !password) {
      return res.status(400).json({ error: 'staffId and password are required' });
    }

    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(401).json({ error: 'Invalid staff ID or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, staff.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid staff ID or password' });
    }

    // Find currently active shift (end_time IS NULL)
    const activeShift = await Shift.findOne({
      where: {
        staff_id: staff.id,
        end_time: null
      },
      include: [{ model: Ward, as: 'ward' }]
    });

    const staff_ward_at_time = activeShift?.ward?.name || staff.default_ward || 'Unassigned';
    const currentShiftWardId = activeShift ? activeShift.ward_id : null;

    // Append audit log for login
    await appendAuditLog({
      staff_id: staff.id,
      patient_id: null,
      action: 'LOGIN',
      result: 'GRANTED',
      reason: null,
      staff_ward_at_time,
      patient_ward_at_time: null,
      timestamp: new Date().toISOString()
    });

    // Issue JWT containing { staffId, role, currentShiftWardId }
    const token = jwt.sign(
      {
        staffId: staff.id,
        role: staff.role,
        currentShiftWardId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        currentShiftWardId,
        currentWard: staff_ward_at_time
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

export default {
  login
};
