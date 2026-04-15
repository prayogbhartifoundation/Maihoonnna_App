const { prisma } = require('./lib/prisma');

async function check() {
  try {
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
  } catch (err) {
    console.error('Verification failed:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
