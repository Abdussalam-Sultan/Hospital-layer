import { sequelize, DataTypes } from '../db/index.js';

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.STRING(128),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  ward_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  admitted_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'patients'
});

export default Patient;