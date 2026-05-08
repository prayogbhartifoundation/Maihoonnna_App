const { prisma } = require('../lib/prisma'); 
async function run() { 
  const zones = await prisma.zone.findMany({where:{pincode:'110046', isActive: true}}); 
  console.log('Zones for 110046:', zones.map(z=>z.name)); 
  if(zones.length>0){ 
    const staff = await prisma.staffProfile.findMany({where:{zoneId:zones[0].id, role:'care_companion'}, include:{user:true}}); 
    console.log('Care Companions in Zone:', staff.length); 
    if (staff.length > 0) {
      console.log('Staff 1:', staff[0].user.name, staff[0].employmentStatus, staff[0].user.isActive);
    }
  } else {
    // try to find any active zones
    const allZones = await prisma.zone.findMany({where:{isActive: true}});
    console.log('All Active Zones:', allZones.map(z=>({name: z.name, pincode: z.pincode})));
  }
} 
run().finally(()=>prisma.$disconnect());
