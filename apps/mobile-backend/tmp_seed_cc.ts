import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    const phone = "9305951780";
    const passwordRaw = "maihoonna123";

    // Check if exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (existingUser) {
        console.log(`User ${phone} already exists. Attempting to update password and profile...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordRaw, salt);

        await prisma.user.update({
            where: { phone },
            data: {
                password: hashedPassword,
                role: "care_companion",
            }
        });

        // Check if care companion profile exists
        const existingCC = await prisma.careCompanion.findUnique({ where: { userId: existingUser.id } });
        if (!existingCC) {
            await prisma.careCompanion.create({
                data: {
                    id: uuidv4(),
                    userId: existingUser.id,
                    name: "Amit Care Giver",
                    bio: "Dedicated care companion assigned by administration.",
                    specialization: ["Elderly Care"],
                    zone: "North Zone"
                }
            });
        }

        console.log('✅ Success! Care Companion password and role updated.');
    } else {
        // Has password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordRaw, salt);

        const userId = uuidv4();

        // Create user and profile
        const user = await prisma.user.create({
            data: {
                id: userId,
                phone,
                password: hashedPassword,
                name: "Amit Care Giver",
                role: "care_companion"
            }
        });

        const cc = await prisma.careCompanion.create({
            data: {
                id: uuidv4(),
                userId: userId,
                name: "Amit Care Giver",
                bio: "Dedicated care companion assigned by administration.",
                specialization: ["Elderly Care"],
                zone: "North Zone"
            }
        });

        console.log('✅ Success! Care Companion account cleanly created.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
