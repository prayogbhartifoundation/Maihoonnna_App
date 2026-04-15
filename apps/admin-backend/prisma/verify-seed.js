const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const counts = {
    users: await prisma.user.count(),
    zones: await prisma.zone.count(),
    om: await prisma.operationsManager.count(),
    fm: await prisma.fieldManager.count(),
    cc: await prisma.careCompanion.count(),
    beneficiaries: await prisma.beneficiary.count(),
    packages: await prisma.subscriptionPackage.count(),
    subscriptions: await prisma.subscription.count(),
  };
  console.log('Database Record Counts:', JSON.stringify(counts, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
