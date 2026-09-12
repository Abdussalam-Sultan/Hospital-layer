import { sequelize, DataTypes } from '../db/index.js';

const ChainAnchor = sequelize.define('ChainAnchor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  anchor_hash: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  row_id_at_anchor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.STRING(64),
    allowNull: false
  }
}, {
  tableName: 'chain_anchors'
});

export default ChainAnchor;