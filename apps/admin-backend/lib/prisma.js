const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

/**
 * Prisma Client & Pool Singleton
 *
 * Your Prisma Client generation requires the "client" (Wasm) engine,
 * which mandates a driver adapter like @prisma/adapter-pg.
 *
 * We make BOTH the Pool and the PrismaClient singletons. This prevents:
 * 1. Port leaks across hot-reloads.
 * 2. The 'DeprecationWarning: Calling client.query() when the client is already executing a query'.
 */

const globalForPrisma = global;

// Initialize or reuse singleton pool
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pool = pool;
}

// Initialize or reuse singleton Prisma client
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma, pool };

