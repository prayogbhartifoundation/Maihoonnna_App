require('dotenv').config({ path: '../.env' });
const { prisma } = require('../lib/prisma');

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'operations_manager'
    },
    select: {
      id: true,
      name: true
    },
    take: 5
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
