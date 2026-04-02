const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Subscription Packages first
  console.log('Creating subscription packages...');
  const basicPackage = await prisma.subscriptionPackage.upsert({
    where: { type: 'BASIC_MONTHLY' },
    update: {},
    create: {
      type: 'BASIC_MONTHLY',
      name: 'Basic Care Plan',
      description: 'Daily visits and basic health monitoring',
      basePrice: 5000,
      billingCycle: 'monthly',
      activeFrom: new Date(),
      visitsPerWeek: 3,
      hoursPerMonth: 20,
      features: ['Daily Health Check', 'Medication Reminders', 'Emotional Support'],
      isActive: true
    }
  });

  const premiumPackage = await prisma.subscriptionPackage.upsert({
    where: { type: 'PREMIUM_ANNUAL' },
    update: {},
    create: {
      type: 'PREMIUM_ANNUAL',
      name: 'Premium 24x7 Support',
      description: 'Comprehensive annual care package',
      basePrice: 50000,
      billingCycle: 'annual',
      durationMonths: 12,
      activeFrom: new Date(),
      visitsPerWeek: 7,
      hoursPerMonth: 100,
      features: ['Priority Emergency Response', 'Physiotherapy', 'Doctor Consultation'],
      isActive: true
    }
  });

  // 2. Create Zones
  console.log('Creating zones...');
  const zoneDelhi = await prisma.zone.upsert({
    where: { name: 'Delhi North' },
    update: {},
    create: {
      name: 'Delhi North',
      code: 'DEL-N',
      city: 'New Delhi',
      address: 'Rohini Sector 15',
      state: 'Delhi',
      pincode: '110085',
      isActive: true
    }
  });

  const zoneMumbai = await prisma.zone.upsert({
    where: { name: 'Mumbai West' },
    update: {},
    create: {
      name: 'Mumbai West',
      code: 'MUM-W',
      city: 'Mumbai',
      address: 'Andheri West',
      state: 'Maharashtra',
      pincode: '400053',
      isActive: true
    }
  });

  // 3. Create Operations Manager
  console.log('Creating Operations Managers...');
  const omUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      name: 'OM Rajesh Kumar',
      email: 'rajesh.om@maihoonna.com',
      role: 'operations_manager',
      isActive: true
    }
  });

  await prisma.staffProfile.upsert({
    where: { userId: omUser.id },
    update: {},
    create: {
      userId: omUser.id,
      zoneId: zoneDelhi.id,
      onboardingStatus: 'completed'
    }
  });

  await prisma.operationsManager.upsert({
    where: { userId: omUser.id },
    update: {},
    create: {
      userId: omUser.id,
      name: 'Rajesh Kumar'
    }
  });

  // 4. Create Field Managers
  console.log('Creating Field Managers...');
  const fmUser = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {},
    create: {
      phone: '9876543211',
      name: 'FM Sunita Sharma',
      email: 'sunita.fm@maihoonna.com',
      role: 'field_manager',
      isActive: true
    }
  });

  await prisma.staffProfile.upsert({
    where: { userId: fmUser.id },
    update: {},
    create: {
      userId: fmUser.id,
      zoneId: zoneDelhi.id,
      onboardingStatus: 'completed'
    }
  });

  const fmProfile = await prisma.fieldManager.upsert({
    where: { userId: fmUser.id },
    update: {},
    create: {
      userId: fmUser.id,
      name: 'Sunita Sharma',
      operationsManagerId: omUser.id,
      experienceYears: 5,
      zone: 'Delhi North'
    }
  });

  // 5. Create Care Companions
  console.log('Creating Care Companions...');
  const ccUser = await prisma.user.upsert({
    where: { phone: '9876543212' },
    update: {},
    create: {
      phone: '9876543212',
      name: 'CC Anita Devi',
      role: 'care_companion',
      isActive: true
    }
  });

  await prisma.staffProfile.upsert({
    where: { userId: ccUser.id },
    update: {},
    create: {
      userId: ccUser.id,
      zoneId: zoneDelhi.id,
      onboardingStatus: 'completed'
    }
  });

  const ccProfile = await prisma.careCompanion.upsert({
    where: { userId: ccUser.id },
    update: {},
    create: {
      userId: ccUser.id,
      name: 'Anita Devi',
      zone: 'Delhi North',
      experienceYears: 3,
      specialization: ['Geriatric Care', 'Dementia Support']
    }
  });

  // 6. Create Subscribers
  console.log('Creating Subscribers...');
  const subUser = await prisma.user.upsert({
    where: { phone: '9876543213' },
    update: {},
    create: {
      phone: '9876543213',
      name: 'Amit Singhania',
      role: 'subscriber',
      isActive: true
    }
  });

  // 7. Create Beneficiaries
  console.log('Creating Beneficiaries...');
  const beneficiary = await prisma.beneficiary.upsert({
    where: { userId: subUser.id + '_BEN' }, // Fake ID for demo
    update: {},
    create: {
      id: 'BEN-001',
      userId: subUser.id, // Linking to user record
      subscriberId: subUser.id,
      name: 'Kishore Singhania',
      age: 72,
      gender: 'male',
      phone: '9876543214',
      address: 'Flat 402, Rohini Sector 15',
      pincode: '110085',
      city: 'New Delhi',
      medicalConditions: ['Hypertension', 'Arthritis'],
      emergencyContacts: [
        { name: 'Amit Singhania', relation: 'Son', phone: '9876543213' }
      ],
      fieldManagerId: fmUser.id,
      careCompanionId: ccUser.id,
      isActive: true
    }
  });

  // 8. Create Active Subscription
  console.log('Linking subscription to beneficiary...');
  await prisma.subscription.create({
    data: {
      subscriberId: subUser.id,
      beneficiaryId: beneficiary.id,
      packageType: basicPackage.type,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      visitsTotal: 12,
      hoursTotal: 20
    }
  });

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
