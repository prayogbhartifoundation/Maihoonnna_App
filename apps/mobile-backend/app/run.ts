import app from './main';
import { config } from './core/config';
import prisma from './core/database';
import { startMedicationWorker } from './workers/medicationWorker';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅  Database connected');

    // Start background medication notification worker
    startMedicationWorker();

    app.listen(Number(config.port), '0.0.0.0', () => {
      console.log(`🚀  Server running on http://0.0.0.0:${config.port}/api`);
      console.log(`📦  Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();