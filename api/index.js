import { Staff } from '../models/index.js';
import { initSchema } from '../db/index.js';
import { app } from '../app.js';

let initialization;

async function initializeBackend() {
  if (!initialization) {
    initialization = (async () => {
      await initSchema();

      const staffCount = await Staff.count();
      if (staffCount === 0) {
        console.log('Database empty on startup. Populating initial seed data...');
        const { seedDatabase } = await import('../seed.js');
        await seedDatabase();
      }
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }

  return initialization;
}

export default async function handler(req, res) {
  await initializeBackend();
  return app(req, res);
}