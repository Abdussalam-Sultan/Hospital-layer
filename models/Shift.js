import { sequelize, DataTypes } from '../db/index.js';

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.STRING(128),
    primaryKey: true
  },
  staff_id: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  ward_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'shifts'
});


export default Shift;