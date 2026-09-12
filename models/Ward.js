import { sequelize, DataTypes } from '../db/index.js';

const Ward = sequelize.define('Ward', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'wards'
});

export default Ward;