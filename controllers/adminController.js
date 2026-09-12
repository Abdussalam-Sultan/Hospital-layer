import crypto from 'crypto';
import { Ward, Staff, Shift } from '../models/index.js';
import { sequelize } from '../db/index.js';
import { anchorChain } from '../utils/hashChain.js';

/**
 * POST /admin/reassign-shift
 * End current active shift and assign staff member to a new ward.
 */
export async function reassignShift(req, res) {
  try {
    const { staffId, newWardId, wardId } = req.body || {};
    const targetWardId = newWardId !== undefined && newWardId !== null ? newWardId : wardId;

    if (!staffId || targetWardId === undefined || targetWardId === null) {
      return res.status(400).json({ error: 'staffId and newWardId (or wardId) are required' });
    }

    const wardIdNum = parseInt(targetWardId, 10);
    const ward = await Ward.findByPk(wardIdNum);
    if (!ward) {
      return res.status(404).json({ error: `Ward with ID ${targetWardId} not found` });
    }

    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ error: `Staff member with ID '${staffId}' not found` });
    }

    const now = new Date();
    const newShiftId = crypto.randomUUID();

    const result = await sequelize.transaction(async (t) => {
      // 1. Find currently active shift
      const currentActiveShift = await Shift.findOne({
        where: {
          staff_id: staffId,
          end_time: null
        },
        transaction: t
      });

      // 2. Close active shift
      if (currentActiveShift) {
        await currentActiveShift.update({ end_time: now }, { transaction: t });
      }

      // 3. Create new shift with new ward
      const newShift = await Shift.create({
        id: newShiftId,
        staff_id: staffId,
        ward_id: wardIdNum,
        start_time: now,
        end_time: null
      }, { transaction: t });

      return {
        previousShift: currentActiveShift ? currentActiveShift.toJSON() : null,
        newShift: {
          id: newShiftId,
          staff_id: staffId,
          ward_id: wardIdNum,
          ward_name: ward.name,
          start_time: now.toISOString(),
          end_time: null
        }
      };
    });

    return res.json({
      message: `Staff member ${staff.name} (${staff.id}) reassigned to ${ward.name} immediately.`,
      ...result
    });
  } catch (err) {
    console.error('Error reassigning shift:', err);
    return res.status(500).json({ error: 'Failed to reassign shift' });
  }
}

/**
 * POST /admin/anchor-now
 * Manually trigger hash-chain snapshot anchoring.
 */
export async function anchorNow(req, res) {
  try {
    const anchor = await anchorChain();
    if (!anchor) {
      return res.status(400).json({
        error: 'Cannot anchor: access_logs is currently empty. Perform some access operations first.'
      });
    }

    return res.json({
      message: 'Chain anchor successfully recorded.',
      anchor
    });
  } catch (err) {
    console.error('Error anchoring chain:', err);
    return res.status(500).json({ error: 'Failed to record chain anchor' });
  }
}

export default {
  reassignShift,
  anchorNow
};
