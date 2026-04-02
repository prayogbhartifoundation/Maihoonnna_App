require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();

async function test() {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            subscriber: { select: { name: true, phone: true, email: true } },
            primaryCC: { select: { name: true, zone: true } },
            secondaryCC: { select: { name: true, zone: true } },
            fieldManager: { select: { name: true } },
            subscriptions: {
                where: { isActive: true },
                include: { package: { select: { name: true } } },
                take: 1
            }
        }
    });
    console.log('Success!', beneficiaries.length);
  } catch (err) {
    fs.writeFileSync('error.json', JSON.stringify({ message: err.message, stack: err.stack }));
  } finally {
    await prisma.$disconnect();
  }
}
test();
