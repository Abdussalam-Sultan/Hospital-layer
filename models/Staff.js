import { sequelize, DataTypes } from '../db/index.js';

const Staff = sequelize.define('Staff', {
  id: {
    type: DataTypes.STRING(128),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('doctor', 'nurse', 'clerk', 'admin'),
    allowNull: false
  },
  default_ward: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'staff'
});


export default Staff;