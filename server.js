import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Staff} from './models/index.js';
import { initSchema } from './db/index.js';
import { anchorChain } from './utils/hashChain.js';
import authRouter from './routes/auth.js';
import patientsRouter from './routes/patients.js';
import logsRouter from './routes/logs.js';
import adminRouter from './routes/admin.js';
import testRouter from './routes/test.js';

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

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes MUST be mounted FIRST
  app.use('/auth', authRouter);
  app.use('/patients', patientsRouter);
  app.use('/logs', logsRouter);
  app.use('/admin', adminRouter);
  app.use('/api', testRouter);

  // Background anchoring job: runs every 2 minutes
  const ANCHOR_INTERVAL_MS = 2 * 60 * 1000;
  const anchorInterval = setInterval(async () => {
    try {
      const anchor = await anchorChain();
      if (anchor) {
        console.log(`[ANCHOR] Periodic chain anchor recorded: row ${anchor.row_id_at_anchor} -> ${anchor.anchor_hash.substring(0, 16)}...`);
      }
    } catch (err) {
      console.error('[ANCHOR] Periodic anchor error:', err.message);
    }
  }, ANCHOR_INTERVAL_MS);

  if (anchorInterval.unref) {
    anchorInterval.unref();
  }

  // Vite middleware for development; static assets for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
