import { Sequelize, DataTypes, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();
const dbUrl = process.env.DB_URL || '';
const dbDialect = process.env.DB_DIALECT || 'postgres';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'hospitaldb';

let sequelize;

if (dbUrl) {

  sequelize = new Sequelize(dbUrl, {
  dialect: dbDialect,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

} else {
  console.log(`Connecting to database via URL: ${dbUrl}`);
  sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
      host: dbHost,
      port: dbPort,
      dialect: dbDialect,
      logging: false,
      define: {
    timestamps: false,
    underscored: true
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
    }
  );
  console.log(`Database connection established to ${dbUser}@${dbHost}:${dbPort}/${dbName}`);
}

if (!sequelize) {
  console.error('No database configuration found. Please set DATABASE_URL or DB_HOST/DB_NAME in your environment.');
}
export { Op, DataTypes } from 'sequelize';

export async function initSchema() {
  await sequelize.authenticate();
  await sequelize.sync();
}
export {sequelize}

initSchema().catch((err) => {
  console.error('Failed to sync Sequelize schema:', err.message);
});
