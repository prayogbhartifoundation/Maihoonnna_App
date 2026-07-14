import prisma from '../app/core/database';

async function main() {
  console.log('--- Subscriptions ---');
  const subs = await prisma.subscription.findMany({
    include: { package: true }
  });
  console.log(JSON.stringify(subs, null, 2));

  console.log('--- Packages ---');
  const pkgs = await prisma.subscriptionPackage.findMany();
  console.log(JSON.stringify(pkgs, null, 2));

  console.log('--- Users ---');
  const users = await prisma.user.findMany({
    where: { role: 'subscriber' }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
