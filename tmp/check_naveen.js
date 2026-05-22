const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNaveen() {
    const naveenUser = await prisma.user.findFirst({
        where: { name: { contains: 'NAveen-lal', mode: 'insensitive' } }
    });

    if (!naveenUser) {
        console.log('NAveen-lal user not found');
        return;
    }

    console.log(`Naveen User ID: ${naveenUser.id}`);

    const naveenFM = await prisma.fieldManager.findUnique({
        where: { userId: naveenUser.id }
    });

    if (!naveenFM) {
        console.log('NAveen-lal FieldManager profile not found');
        return;
    }

    console.log(`Naveen FM Profile ID: ${naveenFM.id}`);

    const naveenTeams = await prisma.team.findMany({
        where: { fieldManagerId: naveenFM.id },
        include: { careCompanions: true }
    });

    console.log(`Naveen managing ${naveenTeams.length} teams.`);
    naveenTeams.forEach(t => {
        console.log(`Team: ${t.name} (ID: ${t.id}), CC Count: ${t.careCompanions.length}`);
        t.careCompanions.forEach(cc => {
            console.log(` - CC: ${cc.name} (ID: ${cc.id}, teamId: ${cc.teamId})`);
        });
    });

    const teamIds = naveenTeams.map(t => t.id);
    const ccCountWithStaffProfileJoin = await prisma.careCompanion.count({
        where: {
            user: {
                isActive: true,
                staffProfile: { teamId: { in: teamIds } }
            }
        }
    });

    const ccCountDirect = await prisma.careCompanion.count({
        where: {
            teamId: { in: teamIds },
            user: { isActive: true }
        }
    });

    console.log(`CC Count with StaffProfile filter: ${ccCountWithStaffProfileJoin}`);
    console.log(`CC Count with direct teamId filter: ${ccCountDirect}`);

    await prisma.$disconnect();
}

checkNaveen();
