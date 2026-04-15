require('dotenv').config({ path: __dirname + '/../.env' });
const { UserRole } = require('@prisma/client');
const { v4: generateUUID } = require('uuid');
const bcrypt = require('bcryptjs');
const { prisma, pool } = require('../lib/prisma');

async function main() {
  console.log('🌱 Seeding test data...');

  // ─── 1. Hash Passwords ────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const beneficiaryPasswordHash = await bcrypt.hash('123456', salt);
  const ccPasswordHash = await bcrypt.hash('123456', salt);
  const subscriberPasswordHash = await bcrypt.hash('password123', salt);

  // ─── 2. Create Subscriber (needed as parent for beneficiary) ─────────────
  console.log('Creating subscriber...');
  const subscriberUser = await prisma.user.upsert({
    where: { phone: '+919000000001' },
    update: {},
    create: {
      phone: '+919000000001',
      name: 'Rahul Kumar',
      age: 45,
      password: subscriberPasswordHash,
      role: UserRole.subscriber,
      isActive: true,
    },
  });
  console.log(
    `✅ Subscriber: ${subscriberUser.name} (${subscriberUser.phone})`
  );

  // ─── 3. Create Beneficiary User ──────────────────────────────────────────
  console.log('Creating beneficiary user...');
  const beneficiaryUser = await prisma.user.upsert({
    where: { phone: '+919956471834' },
    update: { password: beneficiaryPasswordHash },
    create: {
      phone: '+919956471834',
      name: 'Ravi Kumar',
      age: 72,
      password: beneficiaryPasswordHash,
      role: UserRole.beneficiary,
      isActive: true,
    },
  });
  console.log(
    `✅ Beneficiary User: ${beneficiaryUser.name} (${beneficiaryUser.phone})`
  );

  // ─── 4. Create Care Companion User ───────────────────────────────────────
  console.log('Creating care companion user...');
  const ccUser = await prisma.user.upsert({
    where: { phone: '+915555555555' },
    update: { password: ccPasswordHash, role: UserRole.care_companion },
    create: {
      phone: '+915555555555',
      name: 'Sarah Singh',
      age: 30,
      password: ccPasswordHash,
      role: UserRole.care_companion,
      isActive: true,
    },
  });
  console.log(`✅ Care Companion User: ${ccUser.name} (${ccUser.phone})`);

  // Create another CC for the new zone
  const ccUser2 = await prisma.user.upsert({
    where: { phone: '+918888888888' },
    update: { role: UserRole.care_companion },
    create: {
      phone: '+918888888888',
      name: 'Amit Sharma',
      age: 28,
      password: ccPasswordHash,
      role: UserRole.care_companion,
      isActive: true,
    },
  });
  console.log(`✅ Care Companion User 2: ${ccUser2.name} (${ccUser2.phone})`);

  // ─── 5. Create CareCompanion Profile ─────────────────────────────────────
  console.log('Creating care companion profiles...');
  const ccProfile = await prisma.careCompanion.upsert({
    where: { userId: ccUser.id },
    update: {},
    create: {
      userId: ccUser.id,
      name: 'Sarah Singh',
      bio: 'Board-certified nurse practitioner with 8+ years of experience in geriatric care.',
      specialization: ['Geriatric Care', 'Chronic Disease Management'],
      zone: 'Noida Sector 62',
      isAvailable: true,
    },
  });

  const ccProfile2 = await prisma.careCompanion.upsert({
    where: { userId: ccUser2.id },
    update: {},
    create: {
      userId: ccUser2.id,
      name: 'Amit Sharma',
      bio: 'Experienced caregiver with focus on post-surgery recovery.',
      specialization: ['Post-surgery Care'],
      zone: 'Janakpuri Zone',
      isAvailable: true,
    },
  });
  console.log(`✅ Care Companion Profiles created`);

  // ─── 5b. Create Zones ─────────────────────────────────────────────────────
  console.log('Creating zones...');
  const zone1 = await prisma.zone.upsert({
    where: { id: 'zone-noida-62' },
    update: { pincode: '201301' },
    create: {
      id: 'zone-noida-62',
      name: 'Noida Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      address: 'Sector 62, Noida',
      pincode: '201301',
      isActive: true,
    },
  });

  const zone2 = await prisma.zone.upsert({
    where: { id: 'zone-janakpuri-110059' },
    update: { pincode: '110059' },
    create: {
      id: 'zone-janakpuri-110059',
      name: 'Janakpuri Zone',
      city: 'New Delhi',
      state: 'Delhi',
      address: 'Janakpuri, Delhi',
      pincode: '110059',
      isActive: true,
    },
  });
  console.log(`✅ Zones created`);

  // ─── 5c. Create StaffProfiles ─────────────────────────────────────────────
  console.log('Creating staff profiles for assignment logic...');
  await prisma.staffProfile.upsert({
    where: { userId: ccUser.id },
    update: { zoneId: zone1.id },
    create: {
      userId: ccUser.id,
      role: UserRole.care_companion,
      employmentStatus: 'active',
      zoneId: zone1.id,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: ccUser2.id },
    update: { zoneId: zone2.id },
    create: {
      userId: ccUser2.id,
      role: UserRole.care_companion,
      employmentStatus: 'active',
      zoneId: zone2.id,
    },
  });
  console.log(`✅ StaffProfiles created and linked to zones`);

  // ─── 6. Create Beneficiary Profile ───────────────────────────────────────
  console.log('Creating beneficiary profile...');
  const beneficiaryProfile = await prisma.beneficiary.upsert({
    where: { userId: beneficiaryUser.id },
    update: { pincode: '201301' },
    create: {
      userId: beneficiaryUser.id,
      subscriberId: subscriberUser.id,
      name: 'Ravi Kumar',
      age: 72,
      gender: 'male',
      address: '42 Sector 18, Noida, Uttar Pradesh',
      pincode: '201301',
      emergencyContacts: {
        create: [
          {
            id: generateUUID(),
            name: 'Rahul Kumar',
            phone: '9000000001',
            relationship: 'Son',
          },
        ],
      },
      emotionalScore: 8.0,
    },
  });

  // Create another beneficiary for the new pincode 110059
  const beneficiaryUser2 = await prisma.user.upsert({
    where: { phone: '+917777777777' },
    update: { role: UserRole.beneficiary },
    create: {
      phone: '+917777777777',
      name: 'Mrs. Sharma',
      age: 65,
      password: beneficiaryPasswordHash,
      role: UserRole.beneficiary,
      isActive: true,
    },
  });

  const beneficiaryProfile2 = await prisma.beneficiary.upsert({
    where: { userId: beneficiaryUser2.id },
    update: { pincode: '110059' },
    create: {
      userId: beneficiaryUser2.id,
      subscriberId: subscriberUser.id,
      name: 'Mrs. Sharma',
      age: 65,
      gender: 'female',
      address: 'House No. 123, Janakpuri, New Delhi',
      pincode: '110059',
      emergencyContacts: {
        create: [
          {
            id: generateUUID(),
            name: 'Rahul Kumar',
            phone: '9000000001',
            relationship: 'Son',
          },
        ],
      },
      emotionalScore: 7.5,
    },
  });
  console.log(`✅ Beneficiary Profiles created (pincode 110059 included)`);

  // ─── 7. Create Medications for Beneficiary ───────────────────────────────
  console.log('Creating medications...');
  const medsData = [
    {
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'twice_daily',
      timeSlots: ['08:00 AM', '08:00 PM'],
    },
    {
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'once_daily',
      timeSlots: ['09:00 AM'],
    },
    {
      name: 'Aspirin',
      dosage: '75mg',
      frequency: 'once_daily',
      timeSlots: ['08:00 AM'],
    },
  ];

  for (const med of medsData) {
    const existing = await prisma.medication.findFirst({
      where: { beneficiaryId: beneficiaryProfile.id, name: med.name },
    });
    if (!existing) {
      await prisma.medication.create({
        data: {
          beneficiaryId: beneficiaryProfile.id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          timeSlots: med.timeSlots,
          startDate: new Date(),
          isActive: true,
        },
      });
    }
    console.log(`✅ Medication: ${med.name} ${med.dosage}`);
  }

  // ─── 8. Create a Scheduled Visit ─────────────────────────────────────────
  console.log('Creating test visit...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const existingVisit = await prisma.visit.findFirst({
    where: {
      beneficiaryId: beneficiaryProfile.id,
      careCompanionId: ccProfile.id,
    },
  });

  if (!existingVisit) {
    await prisma.visit.create({
      data: {
        encounterId: `ENC-TEST-${Date.now()}`,
        beneficiaryId: beneficiaryProfile.id,
        careCompanionId: ccProfile.id,
        scheduledTime: tomorrow,
        status: 'scheduled',
      },
    });
    console.log(`✅ Visit scheduled for tomorrow at 10:00 AM`);
  } else {
    console.log(`ℹ️  Visit already exists, skipping.`);
  }

  // ─── 8b. Create Vital Definitions ─────────────────────────────────────────
  console.log('Creating vital definitions...');
  const vitals = [
    {
      name: 'Blood Pressure',
      unit: 'mmHg',
      fieldKey: 'trackBloodPressure',
      displayOrder: 1,
    },
    {
      name: 'Heart Rate',
      unit: 'bpm',
      fieldKey: 'trackHeartRate',
      displayOrder: 2,
    },
    {
      name: 'Blood Sugar',
      unit: 'mg/dL',
      fieldKey: 'trackBloodSugar',
      displayOrder: 3,
    },
    {
      name: 'Oxygen Saturation',
      unit: '%',
      fieldKey: 'trackOxygenSaturation',
      displayOrder: 4,
    },
    {
      name: 'Temperature',
      unit: '°F',
      fieldKey: 'trackTemperature',
      displayOrder: 5,
    },
    { name: 'Weight', unit: 'kg', fieldKey: 'trackWeight', displayOrder: 6 },
    {
      name: 'Respiratory Rate',
      unit: 'breaths/min',
      fieldKey: 'trackRespiratoryRate',
      displayOrder: 7,
    },
  ];

  for (const v of vitals) {
    await prisma.vitalDefinition.upsert({
      where: { fieldKey: v.fieldKey },
      update: { name: v.name, unit: v.unit, displayOrder: v.displayOrder },
      create: {
        id: generateUUID(),
        ...v,
        isActive: true,
      },
    });
  }
  console.log(`✅ Vital definitions created`);

  // ─── 8d. Create Benefit Types ──────────────────────────────────────────
  console.log('Creating benefit types...');
  const benefitTypes = [
    {
      name: 'Nurse',
      description: 'Trained nursing home visit',
      iconCode: '🏥',
    },
    {
      name: 'Care Assistant',
      description: 'Non-medical companionship',
      iconCode: '🤝',
    },
    { name: 'Ambulance', description: 'Emergency ambulance', iconCode: '🚑' },
    {
      name: 'Tele-consultation',
      description: 'Remote doctor consult',
      iconCode: '📞',
    },
    {
      name: 'Physio Session',
      description: 'Physiotherapy sessions',
      iconCode: '🧘',
    },
    {
      name: 'Lab Test',
      description: 'Diagnostic lab collection',
      iconCode: '🔬',
    },
    {
      name: 'Pharmacy',
      description: 'Medicine delivery & mgmt',
      iconCode: '💊',
    },
  ];

  for (let i = 0; i < benefitTypes.length; i++) {
    const bt = benefitTypes[i];
    await prisma.benefitType.upsert({
      where: { name: bt.name },
      update: {
        description: bt.description,
        iconCode: bt.iconCode,
        displayOrder: i + 1,
        isSystem: true,
      },
      create: {
        id: generateUUID(),
        ...bt,
        displayOrder: i + 1,
        isActive: true,
        isSystem: true,
      },
    });
  }
  console.log(`✅ Benefit Types created`);

  // ─── 8e. Create System Config ──────────────────────────────────────────
  console.log('Creating system configs...');
  const configs = [
    {
      key: 'globalLunchStart',
      value: '13:00',
      group: 'scheduling',
      description: 'Global lunch start time for all CCs',
    },
    {
      key: 'globalLunchEnd',
      value: '14:00',
      group: 'scheduling',
      description: 'Global lunch end time for all CCs',
    },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value, description: cfg.description },
      create: {
        id: generateUUID(),
        ...cfg,
      },
    });
  }
  console.log(`✅ System Configs created`);

  // ─── 8c. Create Medical Conditions ────────────────────────────────────────
  console.log('Creating common medical conditions...');
  const conditions = [
    { name: 'Diabetes', category: 'Endocrine' },
    { name: 'Hypertension', category: 'Cardiovascular' },
    { name: 'Asthma', category: 'Respiratory' },
    { name: 'Arthritis', category: 'Musculoskeletal' },
    { name: 'Dementia', category: 'Neurological' },
    { name: 'Heart Disease', category: 'Cardiovascular' },
    { name: 'COPD', category: 'Respiratory' },
    { name: 'Thyroid Disorder', category: 'Endocrine' },
  ];

  for (const c of conditions) {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.medicalCondition.upsert({
      where: { slug: slug },
      update: { name: c.name, category: c.category },
      create: {
        id: generateUUID(),
        name: c.name,
        slug: slug,
        category: c.category,
        isCommon: true,
        isActive: true,
      },
    });
  }
  console.log(`✅ Medical conditions created`);

  // ─── 9. Create Subscription Packages (Browse Packages) ───────────────────
  console.log('Creating subscription packages...');
  const packages = [
    {
      type: 'silver',
      name: 'Silver Care',
      description:
        'Essential care for your loved ones. Includes regular home visits, medication reminders, and basic health monitoring.',
      basePrice: 4999,
      durationMonths: 1,
      visitsPerWeek: 2,
      discountSixMonths: 10,
      discountAnnual: 20,
      isGlobal: true,
      features: [
        '2 home visits per week',
        'Medication reminders',
        'Basic health monitoring (BP, Sugar)',
        'Emergency support line',
        'Monthly health report',
        'Care companion app access',
      ],
    },
    {
      type: 'gold',
      name: 'Gold Care',
      description:
        'Comprehensive care with more frequent visits and advanced health tracking. Ideal for elders needing regular supervision.',
      basePrice: 8999,
      durationMonths: 1,
      visitsPerWeek: 4,
      discountSixMonths: 12,
      discountAnnual: 22,
      isGlobal: true,
      features: [
        '4 home visits per week',
        'Daily medication management',
        'Advanced vitals tracking',
        '24/7 emergency response',
        'Weekly health report',
        'Dedicated care coordinator',
        'Diet & nutrition guidance',
        'Physiotherapy session (1/month)',
      ],
    },
    {
      type: 'platinum',
      name: 'Platinum Care',
      description:
        'Our most complete care package. Daily visits, specialist consultations, and premium services for full peace of mind.',
      basePrice: 14999,
      durationMonths: 1,
      visitsPerWeek: 7,
      discountSixMonths: 15,
      discountAnnual: 25,
      isGlobal: true,
      features: [
        'Daily home visits (7 days/week)',
        'Full medication management',
        'Comprehensive vitals & labs tracking',
        'Priority emergency response',
        'Daily health reports',
        'Personal care manager',
        'Specialist consultations (2/month)',
        'Physiotherapy sessions (4/month)',
        'Social & recreational activities',
        'Family dashboard access',
      ],
    },
  ];

  for (const pkg of packages) {
    await prisma.subscriptionPackage.upsert({
      where: { type: pkg.type },
      update: {
        name: pkg.name,
        description: pkg.description,
        basePrice: pkg.basePrice,
        durationMonths: pkg.durationMonths,
        visitsPerWeek: pkg.visitsPerWeek,
        features: pkg.features,
        discountSixMonths: pkg.discountSixMonths,
        discountAnnual: pkg.discountAnnual,
      },
      create: pkg,
    });
    console.log(`✅ Package: ${pkg.name} - ₹${pkg.basePrice}/month`);
  }

  console.log('\n✨ Test data seeded successfully!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  TEST CREDENTIALS:');
  console.log('  Beneficiary  → Phone: +919956471834 | Password: 123456');
  console.log('  Care Companion → Phone: +915555555555 | Password: 123456');
  console.log('  Subscriber   → Phone: +919000000001 | Password: password123');
  console.log('═══════════════════════════════════════════════════════\n');
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
