import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from './config';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;