const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Successfully connected! User count: ${userCount}`);
  } catch (error) {
    console.error('Error connecting to database via Prisma:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
