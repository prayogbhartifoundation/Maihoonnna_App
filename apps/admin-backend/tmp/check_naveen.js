const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNaveen() {
    try {
        console.log('--- Diagnosis for NAveen-lal ---');
        
        // 1. Find the User
        const user = await prisma.user.findFirst({
            where: { name: { contains: 'NAveen-lal', mode: 'insensitive' } }
        });

        if (!user) {
            console.log('User "NAveen-lal" not found in DB.');
            return;
        }
        console.log(`User ID: ${user.id}, Role: ${user.role}`);

        // 2. Find the Field Manager profile
        const fm = await prisma.fieldManager.findUnique({
            where: { userId: user.id }
        });

        if (!fm) {
            console.log('FieldManager profile NOT FOUND for this userId.');
            return;
        }
        console.log(`FieldManager Profile ID: ${fm.id}, Name: ${fm.name}, Zone: ${fm.zone}`);

        // 3. Find teams managed by this FM
        const teams = await prisma.team.findMany({
            where: { fieldManagerId: fm.id }
        });

        console.log(`Teams managed by this FM: ${teams.length}`);
        for (const team of teams) {
            const ccCount = await prisma.careCompanion.count({
                where: { teamId: team.id }
            });
            console.log(` - Team: ${team.name} (ID: ${team.id}), Zone: ${team.zone}, CC Count (Direct): ${ccCount}`);
            
            const ccList = await prisma.careCompanion.findMany({
                where: { teamId: team.id },
                select: { id: true, name: true }
            });
            ccList.forEach(cc => console.log(`   * CC: ${cc.name} (ID: ${cc.id})`));
        }

        if (teams.length > 0) {
            const teamIds = teams.map(t => t.id);
            // Check the flawed query result
            const ccFlawed = await prisma.careCompanion.count({
                where: {
                    user: {
                        isActive: true,
                        staffProfile: { teamId: { in: teamIds } }
                    }
                }
            });
            console.log(`Prisma count using flawed StaffProfile join: ${ccFlawed}`);
            
            // Check the fixed query result
            const ccFixed = await prisma.careCompanion.count({
                where: {
                    teamId: { in: teamIds },
                    user: { isActive: true }
                }
            });
            console.log(`Prisma count using fixed direct teamId filter: ${ccFixed}`);
        }

    } catch (err) {
        console.error('Error during diagnosis:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkNaveen();
