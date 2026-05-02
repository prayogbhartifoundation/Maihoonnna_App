const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// ── GET /api/subscriptions/check-phone ────────────────────────────────────────
// Pre-check if a phone already has a user record + their beneficiaries
router.get('/check-phone', async (req, res) => {
  const { phone } = req.query;
  if (!phone)
    return res
      .status(400)
      .json({ success: false, message: 'phone is required' });

  try {
    const user = await prisma.user.findUnique({
      where: { phone: String(phone) },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        subscriberBeneficiaries: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            subscriptions: {
              where: { isActive: true },
              select: {
                id: true,
                packageType: true,
                startDate: true,
                endDate: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) return res.json({ success: true, data: { exists: false } });

    res.json({
      success: true,
      data: {
        exists: true,
        id: user.id,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        beneficiaries: user.subscriberBeneficiaries,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscriptions/admin-enroll ─────────────────────────────────────
// Full enrollment: create/upsert subscriber + beneficiary + subscription + payment
router.post('/admin-enroll', async (req, res) => {
  const {
    // Subscriber
    subscriberPhone,
    subscriberName,
    subscriberEmail,
    subscriberAddress,
    subscriberPincode,
    subscriberCity,
    subscriberState,
    // Beneficiary
    sameAsSubscriber = false,
    beneficiaryPhone,
    beneficiaryName,
    beneficiaryAge,
    beneficiaryDob,
    beneficiaryGender = 'prefer_not_to_say',
    beneficiaryAddress = '',
    beneficiaryPincode = '',
    beneficiaryCity = '',
    beneficiaryState = '',
    relationship = '',
    maritalStatus = '',
    profilePhoto = '',
    // Medical & Vitals
    medicalConditions = [], // array of { slug, name, severity }
    medications = [], // array of { name, dosage, frequency, instructions, startDate }
    primaryPhysicianName = '',
    primaryPhysicianPhone = '',
    hobbiesInterests = [],
    vitalsToTrack = {}, // { bloodPressure: true, heartRate: true, ... }
    // Emergency contact
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship = 'Family',
    emergencyContactEmail = '',
    secondaryContactName,
    secondaryContactPhone,
    secondaryContactRelationship = '',
    secondaryContactEmail = '',
    // Schedule
    preferredSlot = 'Morning',
    // Package
    packageId,
    duration = 'monthly',
    startDate,
    // Payment
    amountPaid,
    paymentMethod = 'Cash',
    paymentNote = '',
  } = req.body;

  if (!subscriberPhone || !subscriberName || !packageId) {
    return res
      .status(400)
      .json({
        success: false,
        message: 'subscriberPhone, subscriberName, and packageId are required',
      });
  }

  // If beneficiary is different, we need their phone
  if (!sameAsSubscriber && !beneficiaryPhone) {
    return res
      .status(400)
      .json({
        success: false,
        message: 'beneficiaryPhone is required when sameAsSubscriber is false',
      });
  }

  try {
    // Fetch package
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
      include: { packageBenefits: true },
    });
    if (!pkg)
      return res
        .status(404)
        .json({ success: false, message: 'Package not found' });

    // Compute dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    if (duration === 'six_months') end.setMonth(end.getMonth() + 6);
    else if (duration === 'annual') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    // We never set a password — mobile users log in via OTP only
    const dummyHash = await bcrypt.hash('otp-only-' + subscriberPhone, 8);

    const result = await prisma.$transaction(async (tx) => {
      // ──────────────────────────────────────────────────────────────────
      // 1. Find or create Subscriber (User with role: subscriber)
      // ──────────────────────────────────────────────────────────────────
      let subscriberUser = await tx.user.findUnique({
        where: { phone: subscriberPhone },
      });
      if (!subscriberUser) {
        subscriberUser = await tx.user.create({
          data: {
            phone: subscriberPhone,
            name: subscriberName,
            role: 'subscriber',
            password: dummyHash,
            isActive: true,
            location: subscriberAddress
              ? `${subscriberAddress}, ${subscriberCity || ''}, ${subscriberState || ''} - ${subscriberPincode || ''}`.trim()
              : '',
          },
        });
      } else {
        // Update name if provided and different
        const newLocation = subscriberAddress
          ? `${subscriberAddress}, ${subscriberCity || ''}, ${subscriberState || ''} - ${subscriberPincode || ''}`.trim()
          : subscriberUser.location;
        if (
          subscriberUser.name !== subscriberName ||
          subscriberUser.location !== newLocation
        ) {
          subscriberUser = await tx.user.update({
            where: { id: subscriberUser.id },
            data: {
              name: subscriberName,
              location: newLocation,
            },
          });
        }
      }

      // ──────────────────────────────────────────────────────────────────
      // 2. Find or create Beneficiary User
      // ──────────────────────────────────────────────────────────────────
      let beneficiaryUser;
      if (sameAsSubscriber) {
        beneficiaryUser = subscriberUser;
      } else {
        const benPhone = beneficiaryPhone;
        const benHash = await bcrypt.hash('otp-only-' + benPhone, 8);
        beneficiaryUser = await tx.user.findUnique({
          where: { phone: benPhone },
        });
        if (!beneficiaryUser) {
          beneficiaryUser = await tx.user.create({
            data: {
              phone: benPhone,
              name: beneficiaryName || subscriberName,
              role: 'beneficiary',
              password: benHash,
              isActive: true,
            },
          });
        }
      }

      // ──────────────────────────────────────────────────────────────────
      // 3. Find or create Beneficiary profile
      // ──────────────────────────────────────────────────────────────────
      let beneficiary = await tx.beneficiary.findUnique({
        where: { userId: beneficiaryUser.id },
      });
      if (!beneficiary) {
        beneficiary = await tx.beneficiary.create({
          data: {
            userId: beneficiaryUser.id,
            subscriberId: subscriberUser.id,
            name: beneficiaryName || subscriberName,
            age: beneficiaryAge ? parseInt(beneficiaryAge) : 0,
            dateOfBirth: beneficiaryDob ? new Date(beneficiaryDob) : undefined,
            gender: beneficiaryGender,
            maritalStatus: maritalStatus,
            photo: profilePhoto,
            address: beneficiaryAddress,
            pincode: beneficiaryPincode,
            city: beneficiaryCity,
            state: beneficiaryState,
            relationship: relationship,
            primaryPhysicianName: primaryPhysicianName,
            primaryPhysicianPhone: primaryPhysicianPhone,
            hobbiesInterests: hobbiesInterests,
            // Vitals tracking
            isActive: true,
            // Nested creates
            emergencyContacts: {
              create: [
                ...(emergencyContactName
                  ? [
                      {
                        name: emergencyContactName,
                        phone:
                          emergencyContactPhone ||
                          subscriberPhone.replace('+91', ''),
                        relationship: emergencyContactRelationship,
                        email: emergencyContactEmail,
                        isPrimary: true,
                      },
                    ]
                  : []),
                ...(secondaryContactName
                  ? [
                      {
                        name: secondaryContactName,
                        phone: secondaryContactPhone,
                        relationship: secondaryContactRelationship,
                        email: secondaryContactEmail,
                        isPrimary: false,
                      },
                    ]
                  : []),
              ],
            },
            schedulePreference: preferredSlot
              ? {
                  create: {
                    preferredSlot: preferredSlot,
                    preferredDays: [
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                      'Sunday',
                    ],
                  },
                }
              : undefined,
            // Medications
            medicationList:
              medications.length > 0
                ? {
                    create: medications.map((m) => ({
                      name: m.name,
                      dosage: m.dosage || '1 unit',
                      frequency: m.frequency || 'once_daily',
                      instructions: m.instructions,
                      timeSlots: m.timeSlots || [],
                      setReminders: !!m.setReminders,
                      startDate: m.startDate
                        ? new Date(m.startDate)
                        : new Date(),
                    })),
                  }
                : undefined,
          },
        });

        // ──────────────────────────────────────────────────────────────
        // 3b. Medical Conditions
        // ──────────────────────────────────────────────────────────────
        if (medicalConditions && medicalConditions.length > 0) {
          for (const conditionName of medicalConditions) {
            const slug = conditionName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]/g, '');
            // Find or create the condition
            let cond = await tx.medicalCondition.findUnique({
              where: { name: conditionName },
            });
            if (!cond) {
              cond = await tx.medicalCondition.create({
                data: {
                  name: conditionName,
                  slug: slug,
                  category: 'General',
                  isCommon: false,
                },
              });
            }

            // Link to beneficiary
            await tx.beneficiaryCondition.upsert({
              where: {
                beneficiaryId_conditionId: {
                  beneficiaryId: beneficiary.id,
                  conditionId: cond.id,
                },
              },
              update: { isActive: true },
              create: {
                beneficiaryId: beneficiary.id,
                conditionId: cond.id,
                severity: 'moderate',
                isActive: true,
              },
            });
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────
      // 3c. Vitals Configuration (New Relational System)
      // ──────────────────────────────────────────────────────────────────
      if (vitalsToTrack && Object.keys(vitalsToTrack).length > 0) {
        const vitalCodes = Object.keys(vitalsToTrack).filter(code => vitalsToTrack[code]);
        if (vitalCodes.length > 0) {
          const vitalDefs = await tx.vitalDefinition.findMany({
            where: { code: { in: vitalCodes } }
          });

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Create configs for selected vitals
          for (const def of vitalDefs) {
            await tx.beneficiaryVitalConfig.upsert({
              where: {
                beneficiaryId_vitalDefinitionId_effectiveFrom: {
                  beneficiaryId: beneficiary.id,
                  vitalDefinitionId: def.id,
                  effectiveFrom: today
                }
              },
              update: { isActive: true },
              create: {
                beneficiaryId: beneficiary.id,
                vitalDefinitionId: def.id,
                isActive: true,
                frequency: 'every_visit',
                effectiveFrom: today
              }
            });
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────
      // 4. Deactivate existing active subscriptions for this beneficiary
      // ──────────────────────────────────────────────────────────────────
      await tx.subscription.updateMany({
        where: { beneficiaryId: beneficiary.id, isActive: true },
        data: { isActive: false },
      });

      // ──────────────────────────────────────────────────────────────────
      // 5. Create new Subscription
      // ──────────────────────────────────────────────────────────────────
      const sub = await tx.subscription.create({
        data: {
          subscriberId: subscriberUser.id,
          beneficiaryId: beneficiary.id,
          packageType: pkg.type,
          duration,
          startDate: start,
          endDate: end,
          visitsTotal: pkg.visitsPerWeek * 4,
          hoursTotal: pkg.hoursPerMonth || 0,
          isActive: true,
        },
      });

      // ──────────────────────────────────────────────────────────────────
      // 6. Initialize benefit balances
      // ──────────────────────────────────────────────────────────────────
      if (pkg.packageBenefits.length > 0) {
        await tx.subscriptionBenefitBalance.createMany({
          data: pkg.packageBenefits.map((pb) => ({
            subscriptionId: sub.id,
            benefitId: pb.benefitId,
            totalUnits: pb.unitsIncluded,
            usedUnits: 0,
          })),
          skipDuplicates: true,
        });
      }

      // ──────────────────────────────────────────────────────────────────
      // 7. Create Payment record (offline / admin-enrolled)
      // ──────────────────────────────────────────────────────────────────
      const paid = parseFloat(amountPaid) || pkg.basePrice;
      const invoiceNumber = `ADM-${Date.now()}`;
      await tx.payment.create({
        data: {
          invoiceNumber,
          subscriberId: subscriberUser.id,
          beneficiaryId: beneficiary.id,
          subscriptionId: sub.id,
          packageType: pkg.type,
          baseAmount: pkg.basePrice,
          amountPaid: paid,
          discountAmount: pkg.basePrice - paid > 0 ? pkg.basePrice - paid : 0,
          paymentMethod: paymentMethod,
          paymentStatus: 'success',
          planStartDate: start,
          planEndDate: end,
          paidAt: new Date(),
          enrolledAt: new Date(),
          isSubscriptionActive: true,
          gatewayName: 'admin_offline',
          failureReason: paymentNote || null,
        },
      });

      return {
        subscription: sub,
        subscriber: {
          id: subscriberUser.id,
          name: subscriberUser.name,
          phone: subscriberUser.phone,
        },
        beneficiary: { id: beneficiary.id, name: beneficiary.name },
        package: { 
          name: pkg.name, 
          type: pkg.type, 
          basePrice: pkg.basePrice,
          isGlobal: pkg.isGlobal
        },
        invoiceNumber,
      };
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('Admin Enrollment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/subscriptions/:id/balances ──────────────────────────────────────
router.get('/:id/balances', async (req, res) => {
  try {
    const balances = await prisma.subscriptionBenefitBalance.findMany({
      where: { subscriptionId: req.params.id },
      include: { benefit: true },
    });
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscriptions/enroll ────────────────────────────────────────────
// Legacy enroll route (requires existing user IDs)
router.post('/enroll', async (req, res) => {
  const {
    subscriberId,
    beneficiaryId,
    packageId,
    duration = 'monthly',
    startDate = new Date(),
  } = req.body;
  if (!subscriberId || !beneficiaryId || !packageId) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }
  try {
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
      include: { packageBenefits: true },
    });
    if (!pkg)
      return res
        .status(404)
        .json({ success: false, message: 'Package not found' });

    const start = new Date(startDate);
    const end = new Date(start);
    if (duration === 'six_months') end.setMonth(end.getMonth() + 6);
    else if (duration === 'annual') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    const subscription = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { beneficiaryId, isActive: true },
        data: { isActive: false },
      });
      const sub = await tx.subscription.create({
        data: {
          subscriberId,
          beneficiaryId,
          packageType: pkg.type,
          duration,
          startDate: start,
          endDate: end,
          visitsTotal: pkg.visitsPerWeek * 4,
          hoursTotal: pkg.hoursPerMonth || 0,
          isActive: true,
        },
      });
      if (pkg.packageBenefits.length > 0) {
        await tx.subscriptionBenefitBalance.createMany({
          data: pkg.packageBenefits.map((pb) => ({
            subscriptionId: sub.id,
            benefitId: pb.benefitId,
            totalUnits: pb.unitsIncluded,
            usedUnits: 0,
          })),
        });
      }
      return sub;
    });
    res.status(201).json({ success: true, data: subscription });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscriptions/:id/consume ──────────────────────────────────────
router.post('/:id/consume', async (req, res) => {
  const { benefitId, units = 1, notes } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.subscriptionBenefitBalance.findUnique({
        where: {
          subscriptionId_benefitId: {
            subscriptionId: req.params.id,
            benefitId,
          },
        },
      });
      if (!balance)
        throw new Error('No balance found for this benefit in subscription');
      if (balance.totalUnits < balance.usedUnits + units) {
        throw new Error('Insufficient balance for this benefit');
      }
      return tx.subscriptionBenefitBalance.update({
        where: { id: balance.id },
        data: { usedUnits: { increment: units } },
      });
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
