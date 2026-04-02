const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));

// Shared singleton Prisma client for all admin panel routes.
// Uses DATABASE_URL from .env with port 6543 (Supabase connection pooler).
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

module.exports = prisma;
