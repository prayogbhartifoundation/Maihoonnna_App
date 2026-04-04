import app from './main';
import { config } from './core/config';
import prisma from './core/database';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅  Database connected');

    app.listen(config.port, () => {
      console.log(`🚀  Server running on http://localhost:${config.port}/api`);
      console.log(`📦  Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();