require('dotenv').config({ path: __dirname + '/../.env' });
const { UserRole } = require('@prisma/client');
const { v4: generateUUID } = require('uuid');
const bcrypt = require('bcryptjs');
const { prisma, pool } = require('../lib/prisma');

async function main() {
  console.log('🌱 Seeding a fresh Subscriber and Beneficiary pair...');

  // 1. Hash Password for both logins
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('password123', salt);

  // 2. Create the Subscriber User
  console.log('Creating new Subscriber user...');
  const subscriberUser = await prisma.user.upsert({
    where: { phone: '9999999901' },
    update: { password: commonPasswordHash },
    create: {
      phone: '9999999901',
      name: 'Sanjeev Kapoor',
      email: 'sanjeev.k@example.com',
      age: 46,
      password: commonPasswordHash,
      role: UserRole.subscriber,
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Subscriber: ${subscriberUser.name} (${subscriberUser.phone})`);

  // 3. Create the Beneficiary User
  console.log('Creating new Beneficiary user...');
  const beneficiaryUser = await prisma.user.upsert({
    where: { phone: '9999999902' },
    update: { password: commonPasswordHash },
    create: {
      phone: '9999999902',
      name: 'Sourav Kapoor',
      email: 'sourav.k@example.com',
      age: 68,
      password: commonPasswordHash,
      role: UserRole.beneficiary,
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Beneficiary User: ${beneficiaryUser.name} (${beneficiaryUser.phone})`);

  // 4. Create the Beneficiary Profile linked to Subscriber
  console.log('Creating Beneficiary profile...');
  const beneficiaryProfile = await prisma.beneficiary.upsert({
    where: { userId: beneficiaryUser.id },
    update: {
      subscriberId: subscriberUser.id,
      pincode: '201301',
      address: 'Flat No. 502, Tower B, Gaur City, Sector 4, Noida',
      name: 'Sourav Kapoor',
    },
    create: {
      userId: beneficiaryUser.id,
      subscriberId: subscriberUser.id,
      name: 'Sourav Kapoor',
      age: 68,
      gender: 'male',
      address: 'Flat No. 502, Tower B, Gaur City, Sector 4, Noida',
      pincode: '201301',
      flatPlot: 'Flat No. 502, Tower B',
      streetArea: 'Gaur City, Sector 4',
      landmark: 'Near Central Plaza',
      city: 'Noida',
      state: 'Uttar Pradesh',
      emotionalScore: 8.5,
    },
  });
  console.log(`✅ Beneficiary Profile: ${beneficiaryProfile.name}`);

  // 5. Create Emergency Contact for the Beneficiary
  console.log('Creating emergency contact...');
  const existingContact = await prisma.emergencyContact.findFirst({
    where: { beneficiaryId: beneficiaryProfile.id },
  });
  if (!existingContact) {
    await prisma.emergencyContact.create({
      data: {
        id: generateUUID(),
        beneficiaryId: beneficiaryProfile.id,
        name: 'Sanjeev Kapoor',
        phone: '9876543210',
        relationship: 'Son / Sponsor',
      }
    });
    console.log(`✅ Emergency Contact created linking Sanjeev to Yash`);
  }

  // 6. Create Active Subscription Package
  console.log('Creating subscription pack...');
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const existingSub = await prisma.subscription.findFirst({
    where: { beneficiaryId: beneficiaryProfile.id },
  });

  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        id: generateUUID(),
        subscriberId: subscriberUser.id,
        beneficiaryId: beneficiaryProfile.id,
        packageType: 'silver',
        startDate: new Date(),
        endDate: thirtyDaysFromNow,
        renewalDate: thirtyDaysFromNow,
        visitsTotal: 8,
        visitsCompleted: 2,
        hoursTotal: 24.0,
        hoursUsed: 6.0,
        isActive: true,
      }
    });
    console.log(`✅ Subscription (Silver Plan) created for Yash`);
  }

  // 7. Create Beneficiary Medication entries
  console.log('Creating medication regimens...');
  const meds = [
    {
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'once_daily',
      timeSlots: ['08:00 AM'],
    },
    {
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'twice_daily',
      timeSlots: ['08:00 AM', '08:00 PM'],
    },
    {
      name: 'Aspirin',
      dosage: '75mg',
      frequency: 'once_daily',
      timeSlots: ['08:00 AM'],
    },
  ];

  for (const med of meds) {
    const existingMed = await prisma.medication.findFirst({
      where: { beneficiaryId: beneficiaryProfile.id, name: med.name },
    });
    if (!existingMed) {
      await prisma.medication.create({
        data: {
          id: generateUUID(),
          beneficiaryId: beneficiaryProfile.id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          timeSlots: med.timeSlots,
          startDate: new Date(),
          isActive: true,
        }
      });
      console.log(`✅ Added Medication: ${med.name}`);
    }
  }

  // 8. Create Beneficiary Vitals Configurations for all vital definitions
  console.log('Configuring active vital trackers...');
  const vitalDefinitions = await prisma.vitalDefinition.findMany({
    where: { isActive: true },
  });

  for (const def of vitalDefinitions) {
    const existingConfig = await prisma.beneficiaryVitalConfig.findFirst({
      where: { beneficiaryId: beneficiaryProfile.id, vitalDefinitionId: def.id },
    });

    if (!existingConfig) {
      await prisma.beneficiaryVitalConfig.create({
        data: {
          id: generateUUID(),
          beneficiaryId: beneficiaryProfile.id,
          vitalDefinitionId: def.id,
          isActive: true,
          isMandatory: true,
          frequency: 'every_visit',
          alertOnAbnormal: true,
        }
      });
      console.log(`✅ Configured Tracker for: ${def.name} (${def.code})`);
    }
  }

  console.log('\n✨ Fresh Subscriber & Beneficiary accounts seeded successfully!\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  LOGIN CREDENTIALS:');
  console.log('  Subscriber  → Phone: 9999999901 | Password: password123');
  console.log('  Beneficiary → Phone: 9999999902 | Password: password123');
  console.log('═══════════════════════════════════════════════════════════════════\n');
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
