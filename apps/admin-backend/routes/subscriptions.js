const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { calculateAge } = require('../utils/age');
const { publishPackageVersion } = require('../utils/packageVersionHelper');

function normalizeUnit(unitLabel) {
  if (!unitLabel) return 'visits';
  const clean = unitLabel.replace(/^per\s+/i, '').trim().toLowerCase();
  if (clean === 'visit') return 'visits';
  if (clean === 'hour') return 'hours';
  if (clean === 'session') return 'sessions';
  if (clean === 'test') return 'tests';
  if (clean.endsWith('s')) return clean;
  return clean + 's';
}

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
    csaMode = false,
    subscriberPassword = '',
  } = req.body;

  if (!subscriberPhone || !subscriberName || !packageId) {
    return res
      .status(400)
      .json({
        success: false,
        message: 'subscriberPhone, subscriberName, and packageId are required',
      });
  }

  // If beneficiary is different, we generate a placeholder phone if not provided

  try {
    // Fetch package
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
      include: { packageBenefits: { include: { benefit: true } } },
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

    // Use provided password for testing, otherwise OTP-only placeholder
    const passwordToHash = subscriberPassword || ('otp-only-' + subscriberPhone);
    const dummyHash = await bcrypt.hash(passwordToHash, 8);

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
            role: sameAsSubscriber ? 'beneficiary' : 'subscriber',
            password: dummyHash,
            isActive: true,
            location: subscriberAddress
              ? `${subscriberAddress}, ${subscriberCity || ''}, ${subscriberState || ''} - ${subscriberPincode || ''}`.trim()
              : '',
          },
        });
      } else {
        // Update name if provided and different, and promote to subscriber if currently prospect
        const newLocation = subscriberAddress
          ? `${subscriberAddress}, ${subscriberCity || ''}, ${subscriberState || ''} - ${subscriberPincode || ''}`.trim()
          : subscriberUser.location;

        const updateData = {};
        if (subscriberUser.name !== subscriberName) updateData.name = subscriberName;
        if (subscriberUser.location !== newLocation) updateData.location = newLocation;
        
        if (sameAsSubscriber) {
          if (subscriberUser.role !== 'beneficiary') {
            updateData.role = 'beneficiary';
          }
        } else if (subscriberUser.role === 'prospect') {
          updateData.role = 'subscriber';
        }

        if (Object.keys(updateData).length > 0) {
          subscriberUser = await tx.user.update({
            where: { id: subscriberUser.id },
            data: updateData,
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
        // If no beneficiary phone given, generate a placeholder (BEN- prefix + subscriber phone suffix)
        const benPhone = beneficiaryPhone || `BEN${subscriberPhone.slice(-8)}`;
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
            dateOfBirth: beneficiaryDob ? new Date(beneficiaryDob) : undefined,
            age: beneficiaryDob ? (calculateAge(beneficiaryDob) ?? (beneficiaryAge ? parseInt(beneficiaryAge) : 0)) : (beneficiaryAge ? parseInt(beneficiaryAge) : 0),
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
            isActive: csaMode ? false : true,
            createdBy: csaMode ? 'csa' : 'subscriber',
            verificationStatus: csaMode ? 'pending' : 'verified',
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
                      startDate: m.startDate ? new Date(m.startDate) : new Date(),
                      endDate: m.endDate ? new Date(m.endDate) : null,
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
            if (!conditionName) continue;
            const normalizedName = conditionName.trim();
            const slug = normalizedName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]/g, '');
            // Find or create the condition checking both name and slug
            let cond = await tx.medicalCondition.findFirst({
              where: {
                OR: [
                  { name: { equals: normalizedName, mode: 'insensitive' } },
                  { slug: slug }
                ]
              }
            });
            if (!cond) {
              cond = await tx.medicalCondition.create({
                data: {
                  name: normalizedName,
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
                beneficiaryId_vitalDefinitionId: {
                  beneficiaryId: beneficiary.id,
                  vitalDefinitionId: def.id
                }
              },
              update: { isActive: true },
              create: {
                beneficiaryId: beneficiary.id,
                vitalDefinitionId: def.id,
                isActive: true,
                frequency: 'every_visit'
              }
            });
          }
        }
      }

      // 4. Deactivate existing active subscriptions for this beneficiary
      // ──────────────────────────────────────────────────────────────────
      await tx.subscription.updateMany({
        where: { beneficiaryId: beneficiary.id, isActive: true },
        data: { isActive: false },
      });

      // 4b. Find or publish latest PackageVersion
      let pVersion = await tx.packageVersion.findFirst({
        where: { packageCode: pkg.type, isLatest: true },
        include: { versionBenefits: true },
      });

      if (!pVersion) {
        const createdVer = await publishPackageVersion(tx, pkg.id);
        pVersion = await tx.packageVersion.findUnique({
          where: { id: createdVer.id },
          include: { versionBenefits: true },
        });
      }

      // ──────────────────────────────────────────────────────────────────
      // 5. Create new Subscription
      // ──────────────────────────────────────────────────────────────────
      const sub = await tx.subscription.create({
        data: {
          subscriberId: subscriberUser.id,
          beneficiaryId: beneficiary.id,
          packageType: pkg.type,
          packageVersionId: pVersion.id,
          duration,
          startDate: start,
          endDate: end,
          visitsTotal: pkg.visitsPerWeek * 4,
          hoursTotal: pkg.hoursPerMonth || 0,
          // In CSA mode, subscription starts inactive until subscriber activates via mobile app
          isActive: csaMode ? false : true,
        },
      });

      // ──────────────────────────────────────────────────────────────────
      // 6. Initialize benefit balances
      // ──────────────────────────────────────────────────────────────────
      if (pVersion.versionBenefits && pVersion.versionBenefits.length > 0) {
        await tx.subscriptionBenefitBalance.createMany({
          data: pVersion.versionBenefits.map((vb) => ({
            subscriptionId: sub.id,
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

      // ──────────────────────────────────────────────────────────────────
      // 7. Create Payment record (offline / admin-enrolled)
      // In CSA mode, payment is deferred until subscriber activates the plan.
      // ──────────────────────────────────────────────────────────────────
      const invoiceNumber = `ADM-${Date.now()}`;
      if (!csaMode) {
        const paid = parseFloat(amountPaid) || pkg.basePrice;
        await tx.payment.create({
          data: {
            invoiceNumber,
            subscriberId: subscriberUser.id,
            beneficiaryId: beneficiary.id,
            subscriptionId: sub.id,
            packageType: pkg.type,
            packageVersionId: pVersion.id,
            snapshotPackageName: pVersion.name,
            snapshotBasePrice: pVersion.basePrice,
            snapshotBenefits: pVersion.versionBenefits.map(vb => ({
              name: vb.snapshotName,
              units: vb.unitsIncluded,
              unitLabel: vb.snapshotUnitLabel
            })),
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
      }

      await tx.activityLog.create({
        data: {
          userId: subscriberUser.id,
          type: 'SUBSCRIPTION',
          action: 'ENROLLED',
          details: {
            entity: 'subscription',
            entityId: sub.id,
            packageId: pkg.id,
            beneficiaryId: beneficiary.id,
            updatedByRole: req.user?.role || 'system',
            updatedByName: req.user?.name || 'Admin',
          }
        }
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

// ── POST /api/subscriptions/:id/initialize-balances ──────────────────────────
// Backfills missing SubscriptionBenefitBalance rows for an existing subscription.
// Safe to call multiple times — uses skipDuplicates.
router.post('/:id/initialize-balances', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch subscription + its package benefits
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        package: {
          include: {
            packageBenefits: {
              include: { benefit: true },
            },
          },
        },
        benefitBalances: true,
      },
    });

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const packageBenefits = sub.package?.packageBenefits || [];

    if (packageBenefits.length === 0) {
      return res.json({
        success: true,
        message: 'This package has no defined benefits — nothing to initialize.',
        created: 0,
      });
    }

    // Find which benefitIds are already tracked
    const existingBenefitIds = new Set(sub.benefitBalances.map((bb) => bb.benefitId));

    // Only create missing ones
    const toCreate = packageBenefits
      .filter((pb) => !existingBenefitIds.has(pb.benefitId))
      .map((pb) => ({
        subscriptionId: id,
        benefitId: pb.benefitId,
        totalUnits: pb.unitsIncluded,
        usedUnits: 0,
        unit: pb.unit || (pb.benefit?.unitLabel ? normalizeUnit(pb.benefit.unitLabel) : 'visits'),
      }));

    if (toCreate.length === 0) {
      return res.json({
        success: true,
        message: 'All benefit balances are already initialized.',
        created: 0,
      });
    }

    await prisma.subscriptionBenefitBalance.createMany({
      data: toCreate,
      skipDuplicates: true,
    });

    console.log(`[InitBalances] Created ${toCreate.length} balances for subscription ${id}`);

    res.json({
      success: true,
      message: `Successfully initialized ${toCreate.length} benefit balance(s).`,
      created: toCreate.length,
      benefits: toCreate.map((b) => {
        const pb = packageBenefits.find((p) => p.benefitId === b.benefitId);
        return { benefitId: b.benefitId, name: pb?.benefit?.name, totalUnits: b.totalUnits };
      }),
    });
  } catch (err) {
    console.error('[InitBalances] Error:', err);
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
      include: { packageBenefits: { include: { benefit: true } } },
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

      // Find or publish latest PackageVersion
      let pVersion = await tx.packageVersion.findFirst({
        where: { packageCode: pkg.type, isLatest: true },
        include: { versionBenefits: true },
      });

      if (!pVersion) {
        const createdVer = await publishPackageVersion(tx, pkg.id);
        pVersion = await tx.packageVersion.findUnique({
          where: { id: createdVer.id },
          include: { versionBenefits: true },
        });
      }

      const sub = await tx.subscription.create({
        data: {
          subscriberId,
          beneficiaryId,
          packageType: pkg.type,
          packageVersionId: pVersion.id,
          duration,
          startDate: start,
          endDate: end,
          visitsTotal: pkg.visitsPerWeek * 4,
          hoursTotal: pkg.hoursPerMonth || 0,
          isActive: true,
        },
      });

      if (pVersion.versionBenefits && pVersion.versionBenefits.length > 0) {
        await tx.subscriptionBenefitBalance.createMany({
          data: pVersion.versionBenefits.map((vb) => ({
            subscriptionId: sub.id,
            benefitId: vb.benefitId,
            packageVersionBenefitId: vb.id,
            snapshotBenefitName: vb.snapshotName,
            snapshotUnitLabel: vb.snapshotUnitLabel,
            totalUnits: vb.unitsIncluded,
            usedUnits: 0,
            unit: vb.snapshotUnitLabel ? normalizeUnit(vb.snapshotUnitLabel) : 'visits',
          })),
        });
      }
      
      await tx.activityLog.create({
        data: {
          userId: subscriberId,
          type: 'SUBSCRIPTION',
          action: 'ENROLLED',
          details: {
            entity: 'subscription',
            entityId: sub.id,
            packageId,
            beneficiaryId,
            updatedByRole: req.user?.role || 'system',
            updatedByName: req.user?.name || 'Admin',
          }
        }
      });

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

// ── GET /api/subscriptions/beneficiary/:id/utilization ────────────────────────
// Returns active subscription + benefit balances + recent hours log for a beneficiary
router.get('/beneficiary/:id/utilization', async (req, res) => {
  try {
    const { id: beneficiaryId } = req.params;

    // Get active subscription with package + benefit balances
    const subscription = await prisma.subscription.findFirst({
      where: { beneficiaryId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
        packageVersion: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          }
        },
        benefitBalances: {
          include: {
            benefit: {
              select: {
                id: true,
                name: true,
                unitLabel: true,
                description: true,
                benefitType: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: { subscription: null, benefits: [], recentLogs: [] },
      });
    }

    // Get recent package hours logs (last 30 entries)
    const recentLogs = await prisma.packageHoursLog.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { loggedAt: 'desc' },
      take: 30,
      include: {
        visit: {
          select: {
            encounterId: true,
            status: true,
            scheduledTime: true,
            checkInTime: true,
            checkOutTime: true,
            durationMinutes: true,
            careCompanion: { select: { name: true, ccType: true } },
          },
        },
      },
    });

    const benefits = subscription.benefitBalances.map((b) => {
      const remainingUnits = Math.max(0, b.totalUnits - b.usedUnits);
      const usagePercent = b.totalUnits > 0 ? Math.round((b.usedUnits / b.totalUnits) * 100) : 0;
      const isLowBalance = b.totalUnits > 0 && remainingUnits / b.totalUnits < 0.2;
      const isExhausted = b.totalUnits > 0 && remainingUnits === 0;

      return {
        benefitId: b.benefitId,
        benefitName: b.snapshotBenefitName || b.benefit?.name,
        unitLabel: b.snapshotUnitLabel || b.benefit?.unitLabel || 'units',
        benefitTypeName: b.benefit?.benefitType?.name || null,
        description: b.benefit?.description || null,
        totalUnits: b.totalUnits,
        usedUnits: b.usedUnits,
        remainingUnits,
        usagePercent,
        isLowBalance,
        isExhausted,
      };
    });

    const logs = recentLogs.map((l) => ({
      id: l.id,
      visitId: l.visitId || null,
      encounterId: l.visit?.encounterId || null,
      hoursConsumed: l.hoursConsumed,
      balanceBefore: l.balanceBefore,
      balanceAfter: l.balanceAfter,
      description: l.description,
      loggedAt: l.loggedAt,
      careCompanionName: l.visit?.careCompanion?.name || 'System',
      ccType: l.visit?.careCompanion?.ccType || null,
      visitStatus: l.visit?.status || null,
      scheduledTime: l.visit?.scheduledTime || null,
      actualMinutes: l.visit?.durationMinutes || null,
    }));

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          packageId: subscription.package?.id,
          packageName: subscription.packageVersion?.name || subscription.package?.name,
          packageType: subscription.packageType,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          isActive: subscription.isActive,
          hoursTotal: subscription.hoursTotal,
          hoursUsed: subscription.hoursUsed,
          hoursRemaining: Math.max(0, subscription.hoursTotal - subscription.hoursUsed),
          visitsTotal: subscription.visitsTotal,
          visitsCompleted: subscription.visitsCompleted,
        },
        benefits,
        recentLogs: logs,
      },
    });
  } catch (err) {
    console.error('GET /subscriptions/beneficiary/:id/utilization error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

