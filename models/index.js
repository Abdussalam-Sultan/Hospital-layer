import Staff from './Staff.js';
import Shift from './Shift.js';
import Ward from './Ward.js';
import Patient from './Patient.js';
import AccessLog from './AccessLog.js';
import ChainAnchor from './ChainAnchor.js';

Staff.hasMany(Shift, { foreignKey: 'staff_id', as: 'shifts' });
Shift.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });

Ward.hasMany(Shift, { foreignKey: 'ward_id', as: 'shifts' });
Shift.belongsTo(Ward, { foreignKey: 'ward_id', as: 'ward' });

Ward.hasMany(Patient, { foreignKey: 'ward_id', as: 'patients' });
Patient.belongsTo(Ward, { foreignKey: 'ward_id', as: 'ward' });

Staff.hasMany(AccessLog, { foreignKey: 'staff_id', constraints: false, as: 'access_logs' });
AccessLog.belongsTo(Staff, { foreignKey: 'staff_id', constraints: false, as: 'staff' });

Patient.hasMany(AccessLog, { foreignKey: 'patient_id', constraints: false, as: 'access_logs' });
AccessLog.belongsTo(Patient, { foreignKey: 'patient_id', constraints: false, as: 'patient' });


export {
    Staff,
    Shift,
    Ward,
    Patient,
    AccessLog,
    ChainAnchor
};