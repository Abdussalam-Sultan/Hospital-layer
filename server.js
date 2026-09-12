import dotenv from 'dotenv';
import { Staff} from './models/index.js';
import { initSchema } from './db/index.js';
import { app, startAnchorScheduler } from './app.js';

dotenv.config();

async function startServer() {

// Ensure database schema is ready in MySQL via Sequelize
await initSchema();

  // Auto-seed if database is empty (e.g. initial run)
  try {
    const staffCount = await Staff.count();
    if (staffCount === 0) {
      console.log('Database empty on startup. Populating initial seed data in MySQL...');
      const { seedDatabase } = await import('./seed.js');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Initial count check/seed error:', err);
  }

  const PORT = process.env.PORT || 3000;
  startAnchorScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
