const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkZones() {
  try {
    const zones = await prisma.zone.findMany();
    console.log('Total Zones:', zones.length);
    zones.forEach(z => {
      console.log(`- Zone: ${z.name}, Pincode: ${z.pincode}, Active: ${z.isActive}`);
    });
    
    const target = await prisma.zone.findFirst({
      where: { pincode: '110059' }
    });
    console.log('\nTarget Pincode 110059 Search Result:');
    console.log(target ? JSON.stringify(target, null, 2) : 'NOT FOUND');

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkZones();
