import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.subscriptionPackage.findMany();
  console.log(JSON.stringify(packages, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
