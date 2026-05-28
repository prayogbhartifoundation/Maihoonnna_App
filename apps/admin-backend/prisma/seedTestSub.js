require('dotenv').config({ path: __dirname + '/../.env' });
const { UserRole } = require('@prisma/client');
const { v4: generateUUID } = require('uuid');
const bcrypt = require('bcryptjs');
const { prisma, pool } = require('../lib/prisma');

async function main() {
  console.log('🌱 Seeding new subscriber and beneficiary...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Subscriber
  const subscriberPhone = '9999999991';
  const subscriberUser = await prisma.user.upsert({
    where: { phone: subscriberPhone },
    update: { password: passwordHash },
    create: {
      phone: subscriberPhone,
      name: 'Saksham',
      password: passwordHash,
      role: UserRole.subscriber,
      isActive: true,
    },
  });
  console.log(`✅ Subscriber created: ${subscriberUser.name} (${subscriberPhone})`);

  // 2. Create Beneficiary User
  const beneficiaryPhone = '9999999992';
  const beneficiaryUser = await prisma.user.upsert({
    where: { phone: beneficiaryPhone },
    update: { password: passwordHash },
    create: {
      phone: beneficiaryPhone,
      name: 'Sakshi',
      password: passwordHash,
      role: UserRole.beneficiary,
      isActive: true,
    },
  });
  console.log(`✅ Beneficiary User created: ${beneficiaryUser.name} (${beneficiaryPhone})`);

  // 3. Create Beneficiary Profile in Noida Sector 62
  const beneficiaryProfile = await prisma.beneficiary.upsert({
    where: { userId: beneficiaryUser.id },
    update: { pincode: '201301' },
    create: {
      userId: beneficiaryUser.id,
      subscriberId: subscriberUser.id,
      name: 'Sakshi',
      age: 70,
      gender: 'male',
      address: 'Test Address, Noida',
      pincode: '201301',
    },
  });
  console.log(`✅ Beneficiary Profile created and linked to subscriber`);

  // 4. Create Elite Package
  const elitePackage = await prisma.subscriptionPackage.upsert({
    where: { type: 'elite' },
    update: {},
    create: {
      type: 'elite',
      name: 'Elite Care',
      description: 'Elite care package with maximum benefits',
      basePrice: 19999,
      durationMonths: 1,
      visitsPerWeek: 7,
      isActive: true,
    },
  });
  console.log(`✅ Elite Package created`);

  // 5. Connect Beneficiary to Package (Subscription)
  const existingSub = await prisma.subscription.findFirst({
    where: {
      subscriberId: subscriberUser.id,
      beneficiaryId: beneficiaryProfile.id,
      packageType: 'elite'
    }
  });

  if (!existingSub) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        subscriberId: subscriberUser.id,
        beneficiaryId: beneficiaryProfile.id,
        packageType: 'elite',
        duration: 'monthly',
        startDate,
        endDate,
        visitsTotal: 30,
        hoursTotal: 60,
        isActive: true,
      }
    });
    console.log(`✅ Subscription created for Elite package`);
  } else {
    console.log(`ℹ️ Subscription already exists`);
  }

  console.log('\n✨ Seeding successful!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (pool) await pool.end();
  });
