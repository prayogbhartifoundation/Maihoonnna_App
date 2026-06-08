const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

/**
 * Prisma Client & Pool Singleton
 *
 * Uses Supabase's transaction-mode pooler (the only option on free tier).
 * Transaction-mode pooler does NOT support persistent connections or keepAlive.
 * We use a small pool with short idle timeout to avoid stale connections.
 */

const globalForPrisma = global;

const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,                        // small pool for transaction-mode pooler
    idleTimeoutMillis: 10000,      // release idle connections quickly
    connectionTimeoutMillis: 15000, // wait up to 15s for a connection
  });

pool.on('error', (err) => {
  console.error('[prisma.js] Pool client error:', err.message);
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pool = pool;
}

const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma, pool };
