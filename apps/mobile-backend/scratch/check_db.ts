import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true }
  });
  console.log(users);

  console.log('\n--- BENEFICIARIES ---');
  const beneficiaries = await prisma.beneficiary.findMany({
    select: { id: true, name: true, subscriberId: true, userId: true }
  });
  console.log(beneficiaries);
}

main().catch(console.error).finally(() => prisma.$disconnect());
