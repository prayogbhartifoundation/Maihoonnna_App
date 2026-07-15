import prisma from '../../core/database';
import { generateUUID } from '../../utils/helpers';
import { validateCoupon, applyCoupon } from '../coupon_service';
import bcrypt from 'bcryptjs';

function normalizeUnit(unitLabel: string | null | undefined): string {
  if (!unitLabel) return 'visits';
  const clean = unitLabel.replace(/^per\s+/i, '').trim().toLowerCase();
  if (clean === 'visit') return 'visits';
  if (clean === 'hour') return 'hours';
  if (clean === 'session') return 'sessions';
  if (clean === 'test') return 'tests';
  if (clean.endsWith('s')) return clean;
  return clean + 's';
}

function parseDob(dobStr: string | null | undefined): Date | null {
  if (!dobStr) return null;
  const parts = dobStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD-MM-YYYY or DD/MM/YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    } else if (parts[0].length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  const parsed = new Date(dobStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function calculateAge(dob: Date | null | undefined, rawAge?: string | number | null): number {
  if (dob && !isNaN(dob.getTime())) {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return Math.max(0, age);
  }
  if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
    const parsed = parseInt(String(rawAge), 10);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }
  return 0; // safe non-null default — age MUST be Int in DB
}

async function publishPackageVersion(tx: any, packageId: string): Promise<any> {
  const pkg = await tx.subscriptionPackage.findUnique({
    where: { id: packageId },
    include: {
      packageBenefits: {
        include: {
          benefit: true,
        },
      },
    },
  });

  if (!pkg) {
    throw new Error(`SubscriptionPackage not found with id: ${packageId}`);
  }

  const packageCode = pkg.type;

  const maxVersionRecord = await tx.packageVersion.findFirst({
    where: { packageCode },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const nextVersion = maxVersionRecord ? maxVersionRecord.version + 1 : 1;

  await tx.packageVersion.updateMany({
    where: { packageCode, isLatest: true },
    data: { isLatest: false },
  });

  const newVersion = await tx.packageVersion.create({
    data: {
      packageCode,
      version: nextVersion,
      name: pkg.name,
      tagline: pkg.tagline,
      description: pkg.description,
      basePrice: pkg.basePrice,
      mrp: pkg.mrp,
      currency: pkg.currency,
      billingCycle: pkg.billingCycle,
      durationMonths: pkg.durationMonths,
      isFreeTrial: pkg.isFreeTrial,
      trialDurationDays: pkg.trialDurationDays,
      visitsPerWeek: pkg.visitsPerWeek,
      hoursPerMonth: pkg.hoursPerMonth,
      maxBeneficiaries: pkg.maxBeneficiaries,
      features: pkg.features,
      highlightFeatures: pkg.highlightFeatures,
      color: pkg.color,
      isPopular: pkg.isPopular,
      isLatest: true,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
      discountPercentage: pkg.discountPercentage,
      miscellaneousCost: pkg.miscellaneousCost,
    },
  });

  if (pkg.packageBenefits.length > 0) {
    await tx.packageVersionBenefit.createMany({
      data: pkg.packageBenefits.map((pb: any) => ({
        packageVersionId: newVersion.id,
        benefitId: pb.benefitId,
        snapshotName: pb.benefit?.name || 'Benefit',
        snapshotUnitLabel: pb.benefit?.unitLabel || 'visits',
        unitsIncluded: pb.unitsIncluded,
        unitsPeriod: pb.unitsPeriod,
        isUnlimited: pb.isUnlimited,
        displayOrder: pb.displayOrder,
        notes: pb.notes,
      })),
    });
  }

  const versionWithBenefits = await tx.packageVersion.findUnique({
    where: { id: newVersion.id },
    include: { versionBenefits: true }
  });

  return versionWithBenefits!;
}

export const purchaseSubscription = async (
  userId: string,
  packageId: string, // We map this to the package type string
  beneficiaryData?: {
    name: string;
    age: number;
    gender: string;
    address: string;
    flatPlot?: string;
    streetArea?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    relationship: string;
    phone: string;
    dob?: string;
    devPassword?: string;
  } | null,
  medicalData?: any,
  emergencyContactsRaw?: any,
  couponCode?: string
) => {
  // Validate packageType
  const mappedType = (packageId || 'silver').toLowerCase();

  // Ensure the packages exist and get the mapped one
  const packages = await getSubscriptionPackages();
  const subPackage = packages.find((p: any) => p.type.toLowerCase() === mappedType);
  if (!subPackage) {
    throw new Error(`Package type ${mappedType} not found in database. Available types: ${packages.map(p => p.type).join(', ')}`);
  }

  // 1a. If beneficiaryData is provided, create the beneficiary user
  let newBeneficiaryUser: any = null;
  let dobDate: Date | null = null;

  if (beneficiaryData) {
    // Fetch subscriber's own phone to prevent self-linking
    const subscriberUser = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    const subscriberPhone = subscriberUser?.phone || '';

    let beneficiaryPhone = '';
    if (beneficiaryData.phone) {
      beneficiaryPhone = beneficiaryData.phone.replace(/\D/g, '').slice(-10);
      // Block subscriber from using their own number
      if (beneficiaryPhone === subscriberPhone) {
        throw new Error('You cannot use your own phone number as the beneficiary phone. Please use a different number.');
      }
      // Block any number already registered in the system
      const existingUser = await prisma.user.findUnique({ where: { phone: beneficiaryPhone } });
      if (existingUser) {
        throw new Error('This phone number is already registered. Please use a different number.');
      }
    }
    if (!beneficiaryPhone) {
      throw new Error('Beneficiary phone number is required.');
    }

    dobDate = parseDob(beneficiaryData.dob);

    // Hash devPassword if provided (default '654321' set on frontend)
    let passwordHash: string | undefined = undefined;
    if (beneficiaryData.devPassword) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(String(beneficiaryData.devPassword), salt);
    }

    newBeneficiaryUser = await prisma.user.create({
      data: {
        id: generateUUID(),
        phone: beneficiaryPhone,
        name: beneficiaryData.name,
        role: 'beneficiary',
        age: calculateAge(dobDate, beneficiaryData.age),
        dateOfBirth: dobDate,
        ...(passwordHash ? { password: passwordHash } : {})
      }
    });
  }

  // Calculate pricing & validate coupon
  let finalAmountPaid = subPackage.basePrice;
  let discountAmount = 0;
  let appliedCouponId: string | null = null;

  if (couponCode) {
    const previousSubscriptionsCount = await prisma.subscription.count({
      where: { subscriberId: userId }
    });
    const isFirstTimeSubscriber = previousSubscriptionsCount === 0;

    const validation = await validateCoupon(
      couponCode,
      userId,
      mappedType,
      subPackage.basePrice,
      isFirstTimeSubscriber
    );

    if (!validation.isValid) {
      throw new Error(`Coupon failed validation: ${validation.message}`);
    }

    finalAmountPaid = validation.finalAmount;
    discountAmount = validation.discountApplied;
    appliedCouponId = validation.couponId || null;
  }

  // --- Start Medical Data Parsing ---
  const conditionIds: string[] = [];
  if (medicalData?.conditions && Array.isArray(medicalData.conditions)) {
      for (const condName of medicalData.conditions) {
          const slug = condName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          try {
              const condition = await prisma.medicalCondition.upsert({
                  where: { slug },
                  update: {},
                  create: {
                      id: generateUUID(),
                      name: condName,
                      slug: slug,
                      category: "General"
                   }
              });
              conditionIds.push(condition.id);
          } catch(e) { console.error("Condition Error", e); }
      }
  }

  const mappedMedications: any[] = [];
  if (medicalData?.medications && Array.isArray(medicalData.medications)) {
      for (const med of medicalData.medications) {
          // Map frequency string to enum (basic fallback)
          let freqEnum = 'once_daily';
          const lowerFreq = String(med.frequency || '').toLowerCase();
          if (lowerFreq.includes('twice') || lowerFreq.includes('2')) freqEnum = 'twice_daily';
          else if (lowerFreq.includes('thrice') || lowerFreq.includes('3')) freqEnum = 'thrice_daily';
          else if (lowerFreq.includes('needed')) freqEnum = 'as_needed';

          mappedMedications.push({
              id: generateUUID(),
              name: med.name || 'Unknown',
              dosage: med.dosage || '',
              frequency: freqEnum as any,
              timeSlots: med.timesPerDay || [],
              setReminders: !!med.setReminders,
              startDate: new Date()
          });
      }
  }
  // --- End Medical Data Parsing ---

  const finalEmergencyContacts: any[] = [];

  // 1. Check direct emergencyContactsRaw object (primary/secondary properties)
  if (emergencyContactsRaw) {
    if (emergencyContactsRaw.primaryName || emergencyContactsRaw.primaryPhone) {
      finalEmergencyContacts.push({
        name: emergencyContactsRaw.primaryName || 'Primary Contact',
        phone: String(emergencyContactsRaw.primaryPhone || '').replace(/\D/g, '').slice(-10) || '0000000000',
        relation: emergencyContactsRaw.primaryRelation || 'Primary Contact',
        email: emergencyContactsRaw.primaryEmail || '',
      });
    }
    if (emergencyContactsRaw.secondaryName || emergencyContactsRaw.secondaryPhone) {
      finalEmergencyContacts.push({
        name: emergencyContactsRaw.secondaryName || 'Secondary Contact',
        phone: String(emergencyContactsRaw.secondaryPhone || '').replace(/\D/g, '').slice(-10) || '0000000000',
        relation: emergencyContactsRaw.secondaryRelation || 'Secondary Contact',
        email: emergencyContactsRaw.secondaryEmail || '',
      });
    }
  }

  // 2. Check beneficiaryData.emergencyContacts array format
  const bDataAny = beneficiaryData as any;
  if (finalEmergencyContacts.length === 0 && bDataAny && bDataAny.emergencyContacts && Array.isArray(bDataAny.emergencyContacts)) {
    for (const ec of bDataAny.emergencyContacts) {
      if (ec.name && ec.phone) {
        finalEmergencyContacts.push({
          name: ec.name,
          phone: String(ec.phone).replace(/\D/g, '').slice(-10),
          relation: ec.relation || 'Emergency',
          email: ec.email || '',
        });
      }
    }
  }

  // 3. Fallback to subscriber contact details if none are supplied
  if (finalEmergencyContacts.length === 0 && medicalData && (medicalData as any).emergencyContacts && Array.isArray((medicalData as any).emergencyContacts)) {
    const rawEC = (medicalData as any).emergencyContacts[0];
    if (rawEC && rawEC.name && rawEC.phone) {
      finalEmergencyContacts.push({
        name: rawEC.name,
        phone: String(rawEC.phone).replace(/\D/g, '').slice(-10),
        relation: rawEC.relation || 'Emergency',
        email: rawEC.secondaryEmail || '',
      });
    }
  }

  // 4. Default fallback: subscriber profile
  if (beneficiaryData && finalEmergencyContacts.length === 0) {
    const subscriberUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    finalEmergencyContacts.push({
      name: subscriberUser?.name || 'Subscriber',
      phone: subscriberUser?.phone || '0000000000',
      relation: beneficiaryData.relationship || 'Subscriber',
    });
  }

  // Map Vitals to model fields
  const vitalsInput = medicalData?.vitals || {};

  // Run the creation flow inside a single database transaction
  // Note: newBeneficiaryUser was already created above (outside the transaction)
  const result = await prisma.$transaction(async (tx) => {
    let beneficiary: any = null;

    if (beneficiaryData && newBeneficiaryUser) {
      // 1b. Create Beneficiary record (only if beneficiary data was provided)
      beneficiary = await tx.beneficiary.create({
        data: {
          id: generateUUID(),
          userId: newBeneficiaryUser.id,
          subscriberId: userId,
          name: beneficiaryData.name,
          age: parseInt(String(beneficiaryData.age || 65), 10),
          dateOfBirth: dobDate,
          gender: (String(beneficiaryData.gender).toLowerCase().includes('male') && !String(beneficiaryData.gender).toLowerCase().includes('female')) ? 'male' : String(beneficiaryData.gender).toLowerCase().includes('female') ? 'female' : 'prefer_not_to_say',
          address: beneficiaryData.address || "Not provided",
          flatPlot: beneficiaryData.flatPlot || null,
          streetArea: beneficiaryData.streetArea || null,
          landmark: beneficiaryData.landmark || null,
          city: beneficiaryData.city || null,
          state: beneficiaryData.state || null,
          pincode: beneficiaryData.pincode || null,
          latitude: beneficiaryData.latitude || null,
          longitude: beneficiaryData.longitude || null,
          relationship: beneficiaryData.relationship || null,
          
          // Hook up parsed medical fields
          primaryPhysicianName: medicalData?.physicianName || null,
          primaryPhysicianPhone: medicalData?.physicianPhone || null,
          hobbiesInterests: medicalData?.hobbies || [],

          emergencyContacts: {
            create: finalEmergencyContacts.map((c: any) => ({
              id: generateUUID(),
              name: c.name,
              phone: c.phone,
              relationship: c.relation || 'Emergency',
              email: c.email || '',
            })),
          },
          conditions: conditionIds.length > 0 ? {
              create: conditionIds.map(cid => ({
                  id: generateUUID(),
                  conditionId: cid,
                  severity: 'moderate' as any
              }))
          } : undefined,
          medicationList: mappedMedications.length > 0 ? {
              create: mappedMedications
          } : undefined
        }
      });

      // 1c. Upsert BeneficiaryVitalConfigs
      const checkedVitalCodes = Object.entries(vitalsInput)
        .filter(([, checked]) => !!checked)
        .map(([code]) => code.trim().toUpperCase());

      if (checkedVitalCodes.length > 0) {
        const vitalDefs = await tx.vitalDefinition.findMany({
          where: { code: { in: checkedVitalCodes }, isActive: true }
        });

        for (const def of vitalDefs) {
          await tx.beneficiaryVitalConfig.upsert({
            where: {
              beneficiaryId_vitalDefinitionId: {
                beneficiaryId: beneficiary.id,
                vitalDefinitionId: def.id,
              }
            },
            update: { isActive: true },
            create: {
              id: generateUUID(),
              beneficiaryId: beneficiary.id,
              vitalDefinitionId: def.id,
              isActive: true,
              frequency: 'every_visit',
            }
          });
        }
      }
    }

    let pVersion = await tx.packageVersion.findFirst({
      where: { packageCode: subPackage.type, isLatest: true },
      include: { versionBenefits: true },
    });
    if (!pVersion) {
      pVersion = await publishPackageVersion(tx, subPackage.id);
    }
    const versionObj = pVersion!;

    // 2b. Create active Subscription record (beneficiaryId is optional now)
    const subscription = await tx.subscription.create({
      data: {
        id: generateUUID(),
        subscriberId: userId,
        beneficiaryId: beneficiary ? beneficiary.id : null,
        packageType: mappedType,
        packageVersionId: versionObj.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        visitsTotal: subPackage.visitsPerWeek * 4,
        hoursTotal: subPackage.hoursPerMonth || 0,
      },
      include: {
        package: true,
      }
    });

    // Promote user from prospect to subscriber if they are currently a prospect
    await tx.user.updateMany({
      where: { id: userId, role: 'prospect' },
      data: { role: 'subscriber' },
    });

    // 2c. Initialize snapshot benefit balances
    if (versionObj.versionBenefits && versionObj.versionBenefits.length > 0) {
      await tx.subscriptionBenefitBalance.createMany({
        data: versionObj.versionBenefits.map((vb: any) => ({
          id: generateUUID(),
          subscriptionId: subscription.id,
          benefitId: vb.benefitId,
          snapshotBenefitName: vb.snapshotName,
          snapshotUnitLabel: vb.snapshotUnitLabel,
          totalUnits: vb.unitsIncluded,
          usedUnits: 0,
          unit: vb.snapshotUnitLabel ? normalizeUnit(vb.snapshotUnitLabel) : 'visits',
        })),
        skipDuplicates: true,
      });
    }

    // 3. Create a Payment record snapshotting details at enrollment
    await tx.payment.create({
      data: {
        id: generateUUID(),
        subscriberId: userId,
        beneficiaryId: beneficiary ? beneficiary.id : null,
        subscriptionId: subscription.id,
        packageType: mappedType,
        packageVersionId: versionObj.id,
        snapshotPackageName: versionObj.name,
        snapshotBasePrice: versionObj.basePrice,
        snapshotBenefits: (versionObj.versionBenefits || []).map((vb: any) => ({
          name: vb.snapshotName,
          units: vb.unitsIncluded,
          unitLabel: vb.snapshotUnitLabel
        })),
        baseAmount: subPackage.basePrice,
        discountAmount: discountAmount,
        couponCode: couponCode || null,
        amountPaid: finalAmountPaid,
        currency: 'INR',
        paymentMethod: 'UPI',
        paymentStatus: 'success',
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        planStartDate: subscription.startDate,
        planEndDate: subscription.endDate,
        isSubscriptionActive: true,
        enrolledAt: new Date(),
        paidAt: new Date(),
      }
    });

    // 4. Record Coupon Usage (if a coupon was successfully applied)
    if (appliedCouponId && couponCode) {
      await tx.couponUsage.create({
        data: {
          id: generateUUID(),
          couponId: appliedCouponId,
          userId,
          subscriptionId: subscription.id,
          orderAmount: subPackage.basePrice,
          discountApplied: discountAmount
        }
      });

      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: {
          usedCount: { increment: 1 }
        }
      });
    }

    return {
      subscriptionId: subscription.id,
      packageName: subscription.package.name,
      beneficiaryName: beneficiary?.name || null,
      beneficiaryId: beneficiary?.id || null
    };
  });

  return {
    success: true,
    message: 'Subscription purchased successfully!',
    subscriptionId: result.subscriptionId,
    package: result.packageName,
    beneficiaryName: result.beneficiaryName,
    beneficiaryId: result.beneficiaryId
  };
};

/**
 * Links a beneficiary to an existing unlinked subscription for a subscriber.
 * This is called after checkout when the user is prompted to enroll their first beneficiary.
 */
export const linkBeneficiaryToSubscription = async (
  userId: string,
  beneficiaryData: {
    name: string;
    age: number;
    gender: string;
    address: string;
    flatPlot?: string;
    streetArea?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    relationship: string;
    phone?: string;
    dob?: string;
    maritalStatus?: string;
    devPassword?: string;
  },
  medicalData?: any,
  emergencyContactsRaw?: any,
  preferencesData?: any
) => {
  // 1. Find the active unlinked subscription for this subscriber
  const unlinkedSubscription = await prisma.subscription.findFirst({
    where: { subscriberId: userId, isActive: true, beneficiaryId: null },
    orderBy: { createdAt: 'desc' },
    include: { package: true }
  });

  let subIdToLink: string | null = unlinkedSubscription?.id || null;
  if (!subIdToLink) {
    const anyActiveSub = await prisma.subscription.findFirst({
      where: { subscriberId: userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    if (anyActiveSub) {
      subIdToLink = anyActiveSub.id;
    }
  }

  const beneficiaryName = beneficiaryData.name || (beneficiaryData as any).fullName || 'Beneficiary';
  const dobDate = parseDob(beneficiaryData.dob);

  // 2. Find or create beneficiary user
  // Fetch subscriber's own phone to prevent self-linking
  const subscriberSelf = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
  const subscriberPhone = subscriberSelf?.phone || '';

  let beneficiaryUser: any = null;
  let beneficiaryPhone = '';
  if (beneficiaryData.phone) {
    const rawBenPhone = beneficiaryData.phone.replace(/\D/g, '').slice(-10);
    if (rawBenPhone) {
      // Block subscriber from using their own number
      if (rawBenPhone === subscriberPhone) {
        throw new Error('You cannot use your own phone number as the beneficiary phone. Please use a different number.');
      }
      beneficiaryPhone = rawBenPhone;
      const existingUser = await prisma.user.findUnique({ where: { phone: beneficiaryPhone } });
      // Only reuse if this is a different user (already a beneficiary account)
      if (existingUser && existingUser.id !== userId) {
        beneficiaryUser = existingUser;
      } else if (existingUser) {
        // Phone belongs to some other registered user — reject it
        throw new Error('This phone number is already registered. Please use a different number.');
      }
    }
  }

  if (!beneficiaryPhone) {
    throw new Error('Beneficiary phone number is required.');
  }

  if (!beneficiaryUser) {
    // Hash devPassword if provided (default '654321' set on frontend)
    let passwordHash: string | undefined = undefined;
    if (beneficiaryData.devPassword) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(String(beneficiaryData.devPassword), salt);
    }

    beneficiaryUser = await prisma.user.create({
      data: {
        id: generateUUID(),
        phone: beneficiaryPhone,
        name: beneficiaryName,
        role: 'beneficiary',
        age: calculateAge(dobDate, beneficiaryData.age),
        dateOfBirth: dobDate,
        ...(passwordHash ? { password: passwordHash } : {})
      }
    });
  }

  // 3. Parse medical conditions and medications
  const conditionIds: string[] = [];
  if (medicalData?.conditions && Array.isArray(medicalData.conditions)) {
    for (const condName of medicalData.conditions) {
      const slug = condName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      try {
        const condition = await prisma.medicalCondition.upsert({
          where: { slug },
          update: {},
          create: { id: generateUUID(), name: condName, slug, category: 'General' }
        });
        conditionIds.push(condition.id);
      } catch (e) { console.error('Condition Error', e); }
    }
  }

  const mappedMedications: any[] = [];
  if (medicalData?.medications && Array.isArray(medicalData.medications)) {
    for (const med of medicalData.medications) {
      let freqEnum = 'once_daily';
      const lowerFreq = String(med.frequency || '').toLowerCase();
      if (lowerFreq.includes('twice') || lowerFreq.includes('2')) freqEnum = 'twice_daily';
      else if (lowerFreq.includes('thrice') || lowerFreq.includes('3')) freqEnum = 'thrice_daily';
      else if (lowerFreq.includes('needed')) freqEnum = 'as_needed';
      mappedMedications.push({
        id: generateUUID(),
        name: med.name || 'Unknown',
        dosage: med.dosage || '',
        frequency: freqEnum as any,
        timeSlots: med.timesPerDay || [],
        setReminders: !!med.setReminders,
        startDate: new Date()
      });
    }
  }

  // 4. Parse emergency contacts
  const finalEmergencyContacts: any[] = [];
  if (emergencyContactsRaw) {
    if (emergencyContactsRaw.primaryName || emergencyContactsRaw.primaryPhone) {
      finalEmergencyContacts.push({
        name: emergencyContactsRaw.primaryName || 'Primary Contact',
        phone: String(emergencyContactsRaw.primaryPhone || '').replace(/\D/g, '').slice(-10) || '0000000000',
        relation: emergencyContactsRaw.primaryRelation || 'Primary Contact',
        email: emergencyContactsRaw.primaryEmail || '',
      });
    }
    if (emergencyContactsRaw.secondaryName || emergencyContactsRaw.secondaryPhone) {
      finalEmergencyContacts.push({
        name: emergencyContactsRaw.secondaryName || 'Secondary Contact',
        phone: String(emergencyContactsRaw.secondaryPhone || '').replace(/\D/g, '').slice(-10) || '0000000000',
        relation: emergencyContactsRaw.secondaryRelation || 'Secondary Contact',
        email: emergencyContactsRaw.secondaryEmail || '',
      });
    }
  }

  if (finalEmergencyContacts.length === 0) {
    const subscriberUser = await prisma.user.findUnique({ where: { id: userId } });
    finalEmergencyContacts.push({
      name: subscriberUser?.name || 'Subscriber',
      phone: subscriberUser?.phone || '0000000000',
      relation: beneficiaryData.relationship || 'Subscriber',
    });
  }

  const vitalsInput = medicalData?.vitals || {};

  // 5. Run link operation in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 5a. Find or create beneficiary record
    let beneficiary = await tx.beneficiary.findUnique({
      where: { userId: beneficiaryUser.id }
    });

    if (!beneficiary) {
      beneficiary = await tx.beneficiary.create({
        data: {
          id: generateUUID(),
          userId: beneficiaryUser.id,
          subscriberId: userId,
          name: beneficiaryName,
          age: calculateAge(dobDate, beneficiaryData.age),
          dateOfBirth: dobDate,
          gender: (String(beneficiaryData.gender).toLowerCase().includes('male') && !String(beneficiaryData.gender).toLowerCase().includes('female')) ? 'male' : String(beneficiaryData.gender).toLowerCase().includes('female') ? 'female' : 'prefer_not_to_say',
          address: beneficiaryData.address || 'Not provided',
          flatPlot: beneficiaryData.flatPlot || null,
          streetArea: beneficiaryData.streetArea || null,
          landmark: beneficiaryData.landmark || null,
          city: beneficiaryData.city || null,
          state: beneficiaryData.state || null,
          pincode: beneficiaryData.pincode || null,
          latitude: beneficiaryData.latitude || null,
          longitude: beneficiaryData.longitude || null,
          relationship: beneficiaryData.relationship || null,
          primaryPhysicianName: medicalData?.physicianName || null,
          primaryPhysicianPhone: medicalData?.physicianPhone || null,
          hobbiesInterests: medicalData?.hobbies || [],
          emergencyContacts: {
            create: finalEmergencyContacts.map((c: any) => ({
              id: generateUUID(),
              name: c.name,
              phone: c.phone,
              relationship: c.relation || 'Emergency',
              email: c.email || '',
            }))
          },
          conditions: conditionIds.length > 0 ? {
            create: conditionIds.map(cid => ({ id: generateUUID(), conditionId: cid, severity: 'moderate' as any }))
          } : undefined,
          medicationList: mappedMedications.length > 0 ? { create: mappedMedications } : undefined
        }
      });
    }

    // 5b. Link subscription and payments to the new beneficiary
    if (subIdToLink) {
      const existingSub = await tx.subscription.findUnique({
        where: { id: subIdToLink },
        include: { package: true, packageVersion: true }
      });

      const newStart = new Date();
      const newEnd = new Date(newStart);
      const months = existingSub?.packageVersion?.durationMonths || existingSub?.package?.durationMonths || 1;
      newEnd.setMonth(newEnd.getMonth() + months);

      await tx.subscription.update({
        where: { id: subIdToLink },
        data: { 
          beneficiaryId: beneficiary.id,
          startDate: newStart,
          endDate: newEnd
        }
      });

      await tx.payment.updateMany({
        where: { subscriptionId: subIdToLink },
        data: { 
          beneficiaryId: beneficiary.id,
          planStartDate: newStart,
          planEndDate: newEnd
        }
      });
    }

    // Promote user from prospect to subscriber if they are currently a prospect
    await tx.user.updateMany({
      where: { id: userId, role: 'prospect' },
      data: { role: 'subscriber' },
    });

    // 5c. Upsert vital configs
    const checkedVitalCodes = Object.entries(vitalsInput)
      .filter(([, checked]) => !!checked)
      .map(([code]) => code.trim().toUpperCase());

    if (checkedVitalCodes.length > 0) {
      const vitalDefs = await tx.vitalDefinition.findMany({
        where: { code: { in: checkedVitalCodes }, isActive: true }
      });
      for (const def of vitalDefs) {
        await tx.beneficiaryVitalConfig.upsert({
          where: { beneficiaryId_vitalDefinitionId: { beneficiaryId: beneficiary.id, vitalDefinitionId: def.id } },
          update: { isActive: true },
          create: { id: generateUUID(), beneficiaryId: beneficiary.id, vitalDefinitionId: def.id, isActive: true, frequency: 'every_visit' }
        });
      }
    }

    // 5d. Save schedule preferences (preferredTiming → preferredSlot)
    if (preferencesData) {
      const preferredSlot = preferencesData.preferredTiming || preferencesData.preferredSlot || 'morning';
      const preferredDays = Array.isArray(preferencesData.preferredDays) ? preferencesData.preferredDays : [];
      const avoidDays = Array.isArray(preferencesData.avoidDays) ? preferencesData.avoidDays : [];
      await tx.schedulePreference.upsert({
        where: { beneficiaryId: beneficiary.id },
        update: {
          preferredSlot,
          preferredDays,
          avoidDays,
          preferredTimeFrom: preferencesData.preferredTimeFrom || null,
          preferredTimeTo: preferencesData.preferredTimeTo || null,
          preferFemaleCc: !!preferencesData.preferFemaleCc,
          languagePreference: preferencesData.languagePreference || null,
          specialNotes: preferencesData.specialNotes || null,
        },
        create: {
          id: generateUUID(),
          beneficiaryId: beneficiary.id,
          preferredSlot,
          preferredDays,
          avoidDays,
          preferredTimeFrom: preferencesData.preferredTimeFrom || null,
          preferredTimeTo: preferencesData.preferredTimeTo || null,
          preferFemaleCc: !!preferencesData.preferFemaleCc,
          languagePreference: preferencesData.languagePreference || null,
          specialNotes: preferencesData.specialNotes || null,
        }
      });
    }

    return { beneficiaryId: beneficiary.id, beneficiaryName: beneficiary.name };
  });

  return {
    success: true,
    message: 'Beneficiary enrolled and linked to subscription successfully!',
    beneficiaryId: result.beneficiaryId,
    beneficiaryName: result.beneficiaryName,
    subscriptionId: subIdToLink
  };
};

export const getUserDashboard = async (userId: string) => {
  // Find all active subscriptions for this specific user
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      subscriberId: userId,
      isActive: true,
    },
    include: {
      package: true,
    }
  });

  // Find all beneficiaries linked to this user
  const beneficiaries = await prisma.beneficiary.findMany({
    where: {
      subscriberId: userId
    }
  });

  return {
    success: true,
    activeSubscriptions,
    beneficiaries
  };
};

export const activateSubscription = async (
  userId: string,
  beneficiaryId: string,
  beneficiaryData: {
    name: string;
    age: number;
    gender: string;
    address: string;
    flatPlot?: string;
    streetArea?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    relationship: string;
    phone: string;
    dob?: string;
    maritalStatus?: string;
  },
  medicalData?: any,
  emergencyContactsRaw?: any
) => {
  // 1. Find the inactive subscription for this beneficiary
  const existingSub = await prisma.subscription.findFirst({
    where: { beneficiaryId, isActive: false },
    orderBy: { createdAt: 'desc' },
    include: {
      package: true,
      packageVersion: {
        include: {
          versionBenefits: true
        }
      }
    }
  });

  if (!existingSub) {
    throw new Error('No inactive pre-arranged subscription found for this beneficiary.');
  }

  const dobDate = parseDob(beneficiaryData.dob);

  // 2. Medical Data Parsing
  const conditionIds: string[] = [];
  if (medicalData?.conditions && Array.isArray(medicalData.conditions)) {
      for (const condName of medicalData.conditions) {
          const slug = condName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          try {
              const condition = await prisma.medicalCondition.upsert({
                  where: { slug },
                  update: {},
                  create: {
                      id: generateUUID(),
                      name: condName,
                      slug: slug,
                      category: "General"
                   }
              });
              conditionIds.push(condition.id);
          } catch(e) { console.error("Condition Error", e); }
      }
  }

  const mappedMedications: any[] = [];
  if (medicalData?.medications && Array.isArray(medicalData.medications)) {
      for (const med of medicalData.medications) {
          let freqEnum = 'once_daily';
          const lowerFreq = String(med.frequency || '').toLowerCase();
          if (lowerFreq.includes('twice') || lowerFreq.includes('2')) freqEnum = 'twice_daily';
          else if (lowerFreq.includes('thrice') || lowerFreq.includes('3')) freqEnum = 'thrice_daily';
          else if (lowerFreq.includes('needed')) freqEnum = 'as_needed';

          mappedMedications.push({
              id: generateUUID(),
              beneficiaryId,
              name: med.name || 'Unknown',
              dosage: med.dosage || '',
              frequency: freqEnum as any,
              timeSlots: med.timesPerDay || [],
              setReminders: !!med.setReminders,
              instructions: med.instructions || null,
              startDate: med.startDate ? (parseDob(med.startDate) || new Date()) : new Date(),
              endDate: med.endDate ? parseDob(med.endDate) : null,
              totalDays: med.totalDays ? parseInt(med.totalDays, 10) : null
          });
      }
  }

  // 3. Emergency Contacts Parsing
  const finalEmergencyContacts: any[] = [];
  if (emergencyContactsRaw) {
    if (emergencyContactsRaw.primaryName || emergencyContactsRaw.primaryPhone) {
      finalEmergencyContacts.push({
        name: emergencyContactsRaw.primaryName || 'Primary Contact',
        phone: String(emergencyContactsRaw.primaryPhone || '').replace(/\D/g, '').slice(-10) || '0000000000',
        relation: emergencyContactsRaw.primaryRelation || 'Primary Contact',
        email: emergencyContactsRaw.primaryEmail || '',
      });
    }
    if (emergencyContactsRaw.secondaryName || emergencyContactsRaw.secondaryPhone) {
      finalEmergencyContacts.push({
        name: emergencyContactsRaw.secondaryName || 'Secondary Contact',
        phone: String(emergencyContactsRaw.secondaryPhone || '').replace(/\D/g, '').slice(-10) || '0000000000',
        relation: emergencyContactsRaw.secondaryRelation || 'Secondary Contact',
        email: emergencyContactsRaw.secondaryEmail || '',
      });
    }
  }

  const bDataAny = beneficiaryData as any;
  if (finalEmergencyContacts.length === 0 && bDataAny.emergencyContacts && Array.isArray(bDataAny.emergencyContacts)) {
    for (const ec of bDataAny.emergencyContacts) {
      if (ec.name && ec.phone) {
        finalEmergencyContacts.push({
          name: ec.name,
          phone: String(ec.phone).replace(/\D/g, '').slice(-10),
          relation: ec.relation || 'Emergency',
          email: ec.email || '',
        });
      }
    }
  }

  if (finalEmergencyContacts.length === 0 && medicalData && (medicalData as any).emergencyContacts && Array.isArray((medicalData as any).emergencyContacts)) {
    const rawEC = (medicalData as any).emergencyContacts[0];
    if (rawEC && rawEC.name && rawEC.phone) {
      finalEmergencyContacts.push({
        name: rawEC.name,
        phone: String(rawEC.phone).replace(/\D/g, '').slice(-10),
        relation: rawEC.relation || 'Emergency',
        email: rawEC.secondaryEmail || '',
      });
    }
  }

  if (finalEmergencyContacts.length === 0) {
    const subscriberUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    finalEmergencyContacts.push({
      name: subscriberUser?.name || 'Subscriber',
      phone: subscriberUser?.phone || '0000000000',
      relation: beneficiaryData.relationship || 'Subscriber',
    });
  }

  const vitalsInput = medicalData?.vitals || {};

  return prisma.$transaction(async (tx) => {
    // A. Update Beneficiary profile
    const beneficiary = await tx.beneficiary.update({
      where: { id: beneficiaryId },
      data: {
        name: beneficiaryData.name,
        age: parseInt(String(beneficiaryData.age || 65), 10),
        dateOfBirth: dobDate,
        gender: (String(beneficiaryData.gender).toLowerCase().includes('male') && !String(beneficiaryData.gender).toLowerCase().includes('female')) ? 'male' : String(beneficiaryData.gender).toLowerCase().includes('female') ? 'female' : 'prefer_not_to_say',
        address: beneficiaryData.address || "Not provided",
        flatPlot: beneficiaryData.flatPlot || null,
        streetArea: beneficiaryData.streetArea || null,
        landmark: beneficiaryData.landmark || null,
        city: beneficiaryData.city || null,
        state: beneficiaryData.state || null,
        pincode: beneficiaryData.pincode || null,
        latitude: beneficiaryData.latitude || null,
        longitude: beneficiaryData.longitude || null,
        relationship: beneficiaryData.relationship || null,
        maritalStatus: beneficiaryData.maritalStatus || null,
        verificationStatus: "verified", // Mark as verified!
        isActive: true,

        primaryPhysicianName: medicalData?.physicianName || null,
        primaryPhysicianPhone: medicalData?.physicianPhone || null,
        hobbiesInterests: medicalData?.hobbies || [],
      }
    });

    // B. Clean and sync medications
    await tx.medication.deleteMany({ where: { beneficiaryId } });
    if (mappedMedications.length > 0) {
      await tx.medication.createMany({ data: mappedMedications });
    }

    // C. Clean and sync conditions
    await tx.beneficiaryCondition.deleteMany({ where: { beneficiaryId } });
    if (conditionIds.length > 0) {
      await tx.beneficiaryCondition.createMany({
        data: conditionIds.map(cid => ({
          id: generateUUID(),
          beneficiaryId,
          conditionId: cid,
          severity: 'moderate' as any
        }))
      });
    }

    // D. Clean and sync emergency contacts
    await tx.emergencyContact.deleteMany({ where: { beneficiaryId } });
    if (finalEmergencyContacts.length > 0) {
      await tx.emergencyContact.createMany({
        data: finalEmergencyContacts.map((c: any) => ({
          id: generateUUID(),
          beneficiaryId,
          name: c.name,
          phone: c.phone,
          relationship: c.relation || 'Emergency',
          email: c.email || '',
        }))
      });
    }

    // E. Sync Vitals Config
    const checkedVitalCodes = Object.entries(vitalsInput)
      .filter(([, checked]) => !!checked)
      .map(([code]) => code.trim().toUpperCase());

    if (checkedVitalCodes.length > 0) {
      const vitalDefs = await tx.vitalDefinition.findMany({
        where: { code: { in: checkedVitalCodes }, isActive: true }
      });

      for (const def of vitalDefs) {
        await tx.beneficiaryVitalConfig.upsert({
          where: {
            beneficiaryId_vitalDefinitionId: {
              beneficiaryId,
              vitalDefinitionId: def.id,
            }
          },
          update: { isActive: true },
          create: {
            id: generateUUID(),
            beneficiaryId,
            vitalDefinitionId: def.id,
            isActive: true,
            frequency: 'every_visit',
          }
        });
      }
    }

    // F. Activate Subscription
    const start = new Date();
    const end = new Date(start);
    const months = existingSub.packageVersion?.durationMonths || existingSub.package?.durationMonths || 1;
    end.setMonth(end.getMonth() + months);

    const subscription = await tx.subscription.update({
      where: { id: existingSub.id },
      data: {
        isActive: true,
        startDate: start,
        endDate: end,
      }
    });

    // G. Create Benefit Balances if they don't exist
    const versionObj = existingSub.packageVersion;
    if (versionObj?.versionBenefits && versionObj.versionBenefits.length > 0) {
      await tx.subscriptionBenefitBalance.createMany({
        data: versionObj.versionBenefits.map((vb: any) => ({
          subscriptionId: subscription.id,
          benefitId: vb.benefitId,
          packageVersionBenefitId: vb.id,
          snapshotBenefitName: vb.snapshotName,
          snapshotUnitLabel: vb.snapshotUnitLabel,
          totalUnits: vb.unitsIncluded,
          usedUnits: 0,
          unit: vb.snapshotUnitLabel ? normalizeUnit(vb.snapshotUnitLabel) : 'visits',
        })),
        skipDuplicates: true,
      });
    }

    // H. Create Payment record
    const invoiceNumber = `ADM-ACT-${Date.now()}`;
    await tx.payment.create({
      data: {
        invoiceNumber,
        subscriberId: userId,
        beneficiaryId,
        subscriptionId: subscription.id,
        packageType: subscription.packageType,
        packageVersionId: versionObj?.id || null,
        snapshotPackageName: versionObj?.name || 'Prepaid Care Package',
        snapshotBasePrice: versionObj?.basePrice || 0,
        snapshotBenefits: versionObj?.versionBenefits?.map((vb: any) => ({
          name: vb.snapshotName,
          units: vb.unitsIncluded,
          unitLabel: vb.snapshotUnitLabel
        })) || [],
        baseAmount: versionObj?.basePrice || 0,
        amountPaid: versionObj?.basePrice || 0,
        discountAmount: 0,
        paymentMethod: 'csa_prepaid',
        paymentStatus: 'success',
        planStartDate: start,
        planEndDate: end,
        paidAt: new Date(),
        enrolledAt: new Date(),
        isSubscriptionActive: true,
        gatewayName: 'csa_consent_activation',
      }
    });

    // I. Log Activity
    await tx.activityLog.create({
      data: {
        id: generateUUID(),
        userId,
        type: 'SUBSCRIPTION',
        action: 'ACTIVATED',
        details: {
          subscriptionId: subscription.id,
          beneficiaryId,
          invoiceNumber
        } as any
      }
    });

    // Promote user from prospect to subscriber if they are currently a prospect
    await tx.user.updateMany({
      where: { id: userId, role: 'prospect' },
      data: { role: 'subscriber' },
    });

    return { subscription, beneficiary };
  });
};

export const getSubscriptionPackages = async (regionId?: string) => {
  let packages = await prisma.subscriptionPackage.findMany({
    where: {
      isActive: true,
      OR: [
        { isGlobal: true },
        regionId ? {
          isGlobal: false,
          packageRegions: {
            some: { regionId }
          }
        } : null
      ].filter(Boolean) as any
    },
    include: {
      packageRegions: {
        include: { region: true }
      },
      packageBenefits: {
        include: {
          benefit: {
            include: {
              benefitType: true
            }
          }
        }
      }
    },
    orderBy: { basePrice: 'asc' }
  });

  // If there are no packages, create the default ones and return them
  if (packages.length === 0) {
    const defaultPackages = [
      {
        id: generateUUID(),
        type: 'silver',
        name: 'Basic Care',
        description: 'Personalized plans designed for peace of mind.',
        basePrice: 2999,
        discountSixMonths: 10.0,
        discountAnnual: 20.0,
        durationMonths: 1,
        visitsPerWeek: 1,
        features: ['Weekly health checkups', 'Vitals monitoring', 'Emergency contact support', 'Basic companionship'],
        isActive: true,
        isGlobal: true,
      },
      {
        id: generateUUID(),
        type: 'gold',
        name: 'Premium Care',
        description: 'Personalized plans designed for peace of mind.',
        basePrice: 5999,
        discountSixMonths: 10.0,
        discountAnnual: 20.0,
        durationMonths: 1,
        visitsPerWeek: 3,
        features: ['Bi-weekly health checkups', 'Comprehensive vitals tracking', '24/7 emergency support'],
        isActive: true,
        isGlobal: true,
      }
    ];

    await prisma.subscriptionPackage.createMany({
      data: defaultPackages
    });

    packages = await prisma.subscriptionPackage.findMany({
      where: { isActive: true, isGlobal: true },
      include: {
        packageBenefits: {
          include: {
            benefit: {
              include: {
                benefitType: true
              }
            }
          }
        }
      },
      orderBy: { basePrice: 'asc' }
    }) as any;
  }

  return packages;
};


