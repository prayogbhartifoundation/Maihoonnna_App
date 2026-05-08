require('dotenv').config();
const { prisma } = require('../lib/prisma');

async function run() {
  try {
    const zones = await prisma.zone.findMany();
    console.log('Total Zones:', zones.length);
    zones.forEach(z => console.log(`Zone: ${z.name}, Pincode: ${z.pincode}, Active: ${z.isActive}`));

    const staff = await prisma.staffProfile.findMany({
      include: { user: true }
    });
    console.log('Total Staff Profiles:', staff.length);
    staff.forEach(s => console.log(`Staff: ${s.user.name}, Role: ${s.role}, ZoneId: ${s.zoneId}, Status: ${s.employmentStatus}, UserActive: ${s.user.isActive}`));

    const companions = await prisma.careCompanion.findMany();
    console.log('Total Care Companions:', companions.length);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
