import prisma from '../../core/database';
import { generateUUID } from '../../utils/helpers';
import { validateCoupon, applyCoupon } from '../coupon_service';

export const purchaseSubscription = async (
  userId: string,
  packageId: string, // We map this to the package type string
  beneficiaryData: {
    name: string;
    age: number;
    gender: string;
    address: string;
    relationship: string;
    phone: string;
  },
  medicalData?: any,
  emergencyContactsRaw?: any,
  couponCode?: string
) => {
  // Validate packageType
  const mappedType = packageId;

  // Ensure the packages exist and get the mapped one
  const packages = await getSubscriptionPackages();
  const subPackage = packages.find((p: any) => p.type === mappedType);
  if (!subPackage) {
    throw new Error(`Package type ${mappedType} not found in database.`);
  }

  // 1a. The Beneficiary is technically a user in this schema, so we create a simple placeholder user row first
  const newBeneficiaryUser = await prisma.user.create({
    data: {
      id: generateUUID(),
      phone: `+91111${Math.floor(Math.random() * 9000000)}`, // fake distinct phone
      name: beneficiaryData.name,
      role: 'beneficiary'
    }
  });

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

  const mappedMedications = [];
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
              // @ts-ignore - bypassing type check since we pushed DB schema without regenerating client
              setReminders: !!med.setReminders,
              startDate: new Date()
          });
      }
  }
  // --- End Medical Data Parsing ---

  let finalEmergencyContacts: any[] = [];
  if (emergencyContactsRaw) {
      if (emergencyContactsRaw.primaryName || emergencyContactsRaw.primaryPhone) {
          finalEmergencyContacts.push({
              name: emergencyContactsRaw.primaryName || "Primary Contact",
              phone: emergencyContactsRaw.primaryPhone || "",
              relation: "Primary Contact",
              email: emergencyContactsRaw.primaryEmail || ""
          });
      }
      if (emergencyContactsRaw.secondaryName || emergencyContactsRaw.secondaryPhone) {
          finalEmergencyContacts.push({
              name: emergencyContactsRaw.secondaryName || "Secondary Contact",
              phone: emergencyContactsRaw.secondaryPhone || "",
              relation: "Secondary Contact",
              email: emergencyContactsRaw.secondaryEmail || ""
          });
      }
  }

  if (finalEmergencyContacts.length === 0) {
      finalEmergencyContacts.push({
          name: "Subscriber",
          phone: beneficiaryData.phone,
          relation: beneficiaryData.relationship
      });
  }

  // 1b. Create Beneficiary mapped to the logged-in User
  const beneficiary = await prisma.beneficiary.create({
    data: {
      id: generateUUID(),
      userId: newBeneficiaryUser.id,
      subscriberId: userId,
      name: beneficiaryData.name,
      age: beneficiaryData.age ?? 65,
      gender: (beneficiaryData.gender === 'Male' || beneficiaryData.gender === 'male') ? 'male' : (beneficiaryData.gender === 'Female' || beneficiaryData.gender === 'female') ? 'female' : 'prefer_not_to_say',
      address: beneficiaryData.address ?? "Not provided",
      relationship: beneficiaryData.relationship ?? null,
      
      // Hook up parsed medical fields
      primaryPhysicianName: medicalData?.physicianName || null,
      primaryPhysicianPhone: medicalData?.physicianPhone || null,
      hobbiesInterests: medicalData?.hobbies || [],

      // Spread dynamic vitals mapping directly (e.g. trackBloodPressure: true)
      ...(medicalData?.vitals || {}),

      emergencyContacts: {
        create: finalEmergencyContacts.map((c: any) => ({
          id: generateUUID(),
          name: c.name,
          phone: c.phone,
          relationship: c.relation || 'Emergency', // Changed 'relation' to 'relationship' to match schema
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

  // 2. Create the Subscription record
  const subscription = await prisma.subscription.create({
    data: {
      id: generateUUID(),
      subscriberId: userId,
      beneficiaryId: beneficiary.id,
      packageType: mappedType,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      visitsTotal: subPackage.visitsPerWeek * 4,
      hoursTotal: subPackage.totalHours || 0,
    },
    include: {
      package: true,
    }
  });

  // 3. Create a Payment record to track this enrollment
  await prisma.payment.create({
    data: {
      id: generateUUID(),
      subscriberId: userId,
      beneficiaryId: beneficiary.id,
      subscriptionId: subscription.id,
      packageType: mappedType,
      baseAmount: subPackage.basePrice,
      discountAmount: discountAmount,
      couponCode: couponCode || null,
      amountPaid: finalAmountPaid,
      currency: 'INR',
      paymentMethod: 'UPI',           // Mock for now — will be dynamic when real gateway is added
      paymentStatus: 'success',       // Mock success — will depend on gateway response later
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
    await applyCoupon(
      appliedCouponId,
      userId,
      subscription.id,
      subPackage.basePrice,
      discountAmount
    );
  }


  return {
    success: true,
    message: 'Subscription purchased successfully!',
    subscriptionId: subscription.id,
    package: (subscription as any).package.name,
    beneficiaryName: beneficiary.name
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

export const getSubscriptionPackages = async () => {
  let packages = await prisma.subscriptionPackage.findMany({
    where: { isActive: true, isGlobal: true },
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
      orderBy: { basePrice: 'asc' }
    });
  }

  return packages;
};