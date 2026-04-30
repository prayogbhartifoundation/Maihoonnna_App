const express = require('express');
const router = express.Router();
const path = require('path');

const { prisma } = require('../lib/prisma');
const { checkCCAvailability } = require('../services/scheduling');

// ── GET /api/beneficiaries ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, searchBy, page, limit } = req.query;
    const filterParams = {};

    // RBAC Filtering
    if (req.user && req.user.role === 'field_manager') {
      filterParams.fieldManagerId = req.user.id;
    }

    if (search) {
      if (searchBy === 'name') {
        filterParams.name = { contains: search, mode: 'insensitive' };
      } else if (searchBy === 'city') {
        filterParams.city = { contains: search, mode: 'insensitive' };
      } else if (searchBy === 'pincode') {
        filterParams.pincode = { contains: search };
      } else {
        filterParams.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { pincode: { contains: search } },
        ];
      }
    }

    const listQuery = {
      where: filterParams,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriber: {
          select: { name: true, phone: true, email: true },
        },
        primaryCC: {
          select: { id: true, name: true, zone: true, userId: true },
        },
        secondaryCC: {
          select: { id: true, name: true, zone: true, userId: true },
        },
        fieldManager: {
          select: { id: true, name: true },
        },
        emergencyContacts: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    };

    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      if (pageNum > 0 && limitNum > 0) {
        listQuery.skip = (pageNum - 1) * limitNum;
        listQuery.take = limitNum;
      }
    }

    const beneficiaries = await prisma.beneficiary.findMany(listQuery);
    const total = await prisma.beneficiary.count({ where: filterParams });

    const beneficiaryIds = beneficiaries.map((b) => b.id);
    const subscriptions = await prisma.subscription.findMany({
      where: { beneficiaryId: { in: beneficiaryIds }, isActive: true },
      include: { package: { select: { name: true } } },
    });
    const subMap = {};
    subscriptions.forEach((s) => {
      if (!subMap[s.beneficiaryId]) subMap[s.beneficiaryId] = s;
    });

    const mapped = beneficiaries.map((b) => {
      const activeSub = subMap[b.id];
      return {
        id: b.id,
        userId: b.userId,
        name: b.name,
        photo: b.photo,
        age: b.age,
        gender: b.gender,
        address: b.address,
        city: b.city,
        state: b.state,
        pincode: b.pincode,
        medicalConditions: b.medicalConditions || [],
        medications: b.medications || [],
        emotionalScore: b.emotionalScore,
        emergencyContacts: b.emergencyContacts,
        subscriberId: b.subscriberId,
        subscriberName: b.subscriber?.name || null,
        subscriberPhone: b.subscriber?.phone || null,
        primaryCcId: b.primaryCcId,
        secondaryCcId: b.secondaryCcId,
        fieldManagerId: b.fieldManagerId,
        careCompanion: b.primaryCC?.name || null,
        careCompanionZone: b.primaryCC?.zone || null,
        secondaryCareCompanion: b.secondaryCC?.name || null,
        fieldManager: b.fieldManager?.name || null,
        activePackage: activeSub?.package?.name || null,
        isActive: b.isActive,
        createdAt: b.createdAt,
      };
    });

    if (page && limit) {
      res.json({
        success: true,
        data: {
          data: mapped,
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } else {
      res.json({ success: true, data: mapped });
    }
  } catch (err) {
    console.error('GET /beneficiaries error:', err);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch beneficiaries' });
  }
});

// ── GET /api/beneficiaries/available-staff?pincode=XXXXX ─────────────────────
// Returns CCs and FMs available in the zone matching the given pincode
router.get('/available-staff', async (req, res) => {
  const { pincode } = req.query;
  if (!pincode)
    return res
      .status(400)
      .json({ success: false, message: 'pincode is required' });

  try {
    // Find zone(s) matching the pincode
    const matchingZones = await prisma.zone.findMany({
      where: { pincode: String(pincode), isActive: true },
      select: { id: true, name: true, pincode: true },
    });

    let zoneIds = matchingZones.map((z) => z.id);

    if (req.user && req.user.role === 'field_manager' && req.user.zoneId) {
      zoneIds = zoneIds.filter((id) => id === req.user.zoneId);
    }

    if (zoneIds.length === 0) {
      return res.json({
        success: true,
        data: { careCompanions: [], fieldManagers: [], zones: [] },
      });
    }

    // Get CCs whose staffProfile.zoneId matches one of these zones
    const ccProfiles = await prisma.staffProfile.findMany({
      where: {
        role: 'care_companion',
        zoneId: zoneIds.length > 0 ? { in: zoneIds } : undefined,
        employmentStatus: 'active',
        user: { isActive: true },
      },
      include: {
        user: {
          include: {
            careCompanionProfile: {
              select: { id: true, name: true, zone: true, isAvailable: true },
            },
          },
        },
      },
    });

    // Get FMs whose staffProfile.zoneId matches
    const fmProfiles = await prisma.staffProfile.findMany({
      where: {
        role: 'field_manager',
        zoneId: zoneIds.length > 0 ? { in: zoneIds } : undefined,
        employmentStatus: 'active',
        user: { isActive: true },
      },
      include: {
        user: {
          include: {
            fieldManagerProfile: {
              select: { id: true, name: true, zone: true, isAvailable: true },
            },
          },
        },
      },
    });

    const careCompanions = await Promise.all(
      ccProfiles
        .filter((p) => p.user?.careCompanionProfile)
        .map(async (p) => {
          const baseInfo = {
            id: p.user.careCompanionProfile.id,
            userId: p.userId,
            name: p.user.careCompanionProfile.name || p.user?.name,
            zone: p.user.careCompanionProfile.zone,
            isAvailable: p.user.careCompanionProfile.isAvailable,
          };

          // If time and duration are provided, check real availability
          if (req.query.dateTime && req.query.duration) {
            const { isAvailable, reason } = await checkCCAvailability(
              baseInfo.id,
              new Date(req.query.dateTime),
              parseInt(req.query.duration)
            );
            return { ...baseInfo, isAvailable, reason };
          }

          return baseInfo;
        })
    );

    const fieldManagers = fmProfiles
      .filter((p) => p.user?.fieldManagerProfile)
      .map((p) => ({
        id: p.user.fieldManagerProfile.id,
        userId: p.userId,
        name: p.user.fieldManagerProfile.name || p.user?.name,
        zone: p.user.fieldManagerProfile.zone,
        isAvailable: p.user.fieldManagerProfile.isAvailable,
      }));

    res.json({
      success: true,
      data: { careCompanions, fieldManagers, zones: matchingZones },
    });
  } catch (err) {
    console.error('GET /beneficiaries/available-staff error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/beneficiaries/:id/assign-staff ───────────────────────────────────
// Body: { primaryCcId, secondaryCcId, fieldManagerId }  (all optional, null to unassign)
router.put('/:id/assign-staff', async (req, res) => {
  const { id } = req.params;
  const { primaryCcId, secondaryCcId, fieldManagerId } = req.body;
  try {
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id },
      select: { name: true, primaryCcId: true, secondaryCcId: true },
    });

    if (!beneficiary) {
      return res
        .status(404)
        .json({ success: false, message: 'Beneficiary not found' });
    }

    const data = {};
    let newPrimaryCcUserId = null;

    if (primaryCcId !== undefined) {
      if (primaryCcId) {
        // Check capacity
        const count = await prisma.beneficiary.count({
          where: { primaryCcId, isActive: true },
        });
        const cc = await prisma.careCompanion.findUnique({
          where: { id: primaryCcId },
          select: { name: true, userId: true, maxPrimaryBeneficiaries: true },
        });
        if (count >= (cc?.maxPrimaryBeneficiaries || 5)) {
          return res
            .status(400)
            .json({
              success: false,
              message: `Care Companion ${cc?.name || ''} has reached maximum primary capacity (5)`,
            });
        }

        if (beneficiary.primaryCcId !== primaryCcId && cc && cc.userId) {
          newPrimaryCcUserId = cc.userId;
        }
      }
      data.primaryCcId = primaryCcId || null;
    }

    let newSecondaryCcUserId = null;
    if (secondaryCcId !== undefined) {
      if (secondaryCcId) {
        const count = await prisma.beneficiary.count({
          where: { secondaryCcId, isActive: true },
        });
        const cc = await prisma.careCompanion.findUnique({
          where: { id: secondaryCcId },
          select: { name: true, userId: true, maxSecondaryBeneficiaries: true },
        });
        if (count >= (cc?.maxSecondaryBeneficiaries || 5)) {
          return res
            .status(400)
            .json({
              success: false,
              message: `Care Companion ${cc?.name || ''} has reached maximum secondary capacity (5)`,
            });
        }

        if (beneficiary.secondaryCcId !== secondaryCcId && cc && cc.userId) {
          newSecondaryCcUserId = cc.userId;
        }
      }
      data.secondaryCcId = secondaryCcId || null;
    }
    if (fieldManagerId !== undefined)
      data.fieldManagerId = fieldManagerId || null;

    const updated = await prisma.$transaction(async (tx) => {
      const benUpdate = await tx.beneficiary.update({
        where: { id },
        data,
        include: {
          user: { select: { id: true } },
          primaryCC: { select: { id: true, name: true, zone: true } },
          secondaryCC: { select: { id: true, name: true, zone: true } },
          fieldManager: { select: { id: true, name: true } },
        },
      });

      // Notify the newly assigned Primary CC
      if (newPrimaryCcUserId) {
        await tx.notification.create({
          data: {
            userId: newPrimaryCcUserId,
            type: 'system',
            title: 'New Assignment',
            body: `You have been assigned as the Primary Care Companion for beneficiary: ${beneficiary.name}.`,
          },
        });
      }

      // Notify the newly assigned Secondary CC
      if (newSecondaryCcUserId) {
        await tx.notification.create({
          data: {
            userId: newSecondaryCcUserId,
            type: 'system',
            title: 'New Assignment',
            body: `You have been assigned as the Secondary Care Companion for beneficiary: ${beneficiary.name}.`,
          },
        });
      }

      // Notify the Beneficiary when a primary CC is newly assigned
      if (newPrimaryCcUserId && benUpdate.user?.id) {
        const ccRecord = await tx.careCompanion.findUnique({
          where: { userId: newPrimaryCcUserId },
          select: { name: true },
        });
        await tx.notification.create({
          data: {
            userId: benUpdate.user.id,
            type: 'system',
            title: 'Care Companion Assigned',
            body: `Your care companion ${ccRecord?.name || 'a care companion'} has been assigned to you. They will be visiting you soon.`,
          },
        });
      }

      return benUpdate;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('PUT /beneficiaries/:id/assign-staff error:', err);
    if (err.code === 'P2025')
      return res
        .status(404)
        .json({ success: false, message: 'Beneficiary not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/beneficiaries/:id ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const b = await prisma.beneficiary.findUnique({
      where: { id: req.params.id },
      include: {
        subscriber: true,
        primaryCC: true,
        secondaryCC: true,
        fieldManager: true,
        emergencyContacts: true,
        visits: { orderBy: { scheduledTime: 'desc' }, take: 5 },
        medicationList: { where: { isActive: true } },
        conditions: { include: { condition: true }, where: { isActive: true } },
      },
    });
    if (!b)
      return res
        .status(404)
        .json({ success: false, message: 'Beneficiary not found' });
    
    // Map medicationList to medications for frontend compatibility
    b.medications = b.medicationList;

    const sub = await prisma.subscription.findFirst({
      where: { beneficiaryId: b.id, isActive: true },
      include: { package: true },
    });

    res.json({
      success: true,
      data: { ...b, subscriptions: sub ? [sub] : [] },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/beneficiaries/:id ───────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Extracted allowable fields from body
    // Using a whitelist prevents malicious overwriting of relational IDs
    const { 
      name, age, gender, address, city, state, pincode, relationship, 
      primaryPhysicianName, primaryPhysicianPhone, primaryPhysicianSpec, 
      emotionalScore, trackBloodPressure, trackHeartRate, trackBloodSugar,
      trackTemperature, trackOxygenSaturation, trackWeight, trackPainLevel,
      trackRespiratoryRate, medicalConditions, medications, isActive
    } = req.body;

    const b = await prisma.beneficiary.findUnique({ where: { id } });
    if (!b) return res.status(404).json({ success: false, message: 'Beneficiary not found' });

    let parsedAge = age !== undefined ? Number(age) : undefined;
    if (parsedAge !== undefined && isNaN(parsedAge)) parsedAge = b.age;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (parsedAge !== undefined) dataToUpdate.age = parsedAge;
    if (gender !== undefined) dataToUpdate.gender = gender;
    if (address !== undefined) dataToUpdate.address = address;
    if (city !== undefined) dataToUpdate.city = city;
    if (state !== undefined) dataToUpdate.state = state;
    if (pincode !== undefined) dataToUpdate.pincode = pincode;
    if (relationship !== undefined) dataToUpdate.relationship = relationship;
    if (primaryPhysicianName !== undefined) dataToUpdate.primaryPhysicianName = primaryPhysicianName;
    if (primaryPhysicianPhone !== undefined) dataToUpdate.primaryPhysicianPhone = primaryPhysicianPhone;
    if (primaryPhysicianSpec !== undefined) dataToUpdate.primaryPhysicianSpec = primaryPhysicianSpec;
    if (emotionalScore !== undefined) dataToUpdate.emotionalScore = Number(emotionalScore);
    if (trackBloodPressure !== undefined) dataToUpdate.trackBloodPressure = Boolean(trackBloodPressure);
    if (trackHeartRate !== undefined) dataToUpdate.trackHeartRate = Boolean(trackHeartRate);
    if (trackBloodSugar !== undefined) dataToUpdate.trackBloodSugar = Boolean(trackBloodSugar);
    if (trackTemperature !== undefined) dataToUpdate.trackTemperature = Boolean(trackTemperature);
    if (trackOxygenSaturation !== undefined) dataToUpdate.trackOxygenSaturation = Boolean(trackOxygenSaturation);
    if (trackWeight !== undefined) dataToUpdate.trackWeight = Boolean(trackWeight);
    if (trackPainLevel !== undefined) dataToUpdate.trackPainLevel = Boolean(trackPainLevel);
    if (trackRespiratoryRate !== undefined) dataToUpdate.trackRespiratoryRate = Boolean(trackRespiratoryRate);
    if (medicalConditions !== undefined) dataToUpdate.medicalConditions = medicalConditions;
    if (medications !== undefined) dataToUpdate.medications = medications;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updated = await prisma.beneficiary.update({
      where: { id },
      data: dataToUpdate
    });

    // Sync Vitals Configuration (New Relational System)
    const vitalFields = Object.keys(dataToUpdate).filter(k => k.startsWith('track'));
    if (vitalFields.length > 0) {
      const vitalDefs = await prisma.vitalDefinition.findMany();
      for (const field of vitalFields) {
        const isActive = dataToUpdate[field];
        let code = '';
        if (field === 'trackBloodPressure') code = 'BP'; 
        if (field === 'trackHeartRate') code = 'PULSE';
        if (field === 'trackBloodSugar') code = 'BLOOD_GLUCOSE';
        if (field === 'trackTemperature') code = 'TEMP';
        if (field === 'trackOxygenSaturation') code = 'SPO2';
        if (field === 'trackWeight') code = 'WEIGHT';
        if (field === 'trackPainLevel') code = 'PAIN';
        if (field === 'trackRespiratoryRate') code = 'RESP';
        
        if (code) {
          const def = vitalDefs.find(d => d.code === code);
          if (def) {
            await prisma.beneficiaryVitalConfig.upsert({
              where: {
                beneficiaryId_vitalDefinitionId_effectiveFrom: {
                  beneficiaryId: id,
                  vitalDefinitionId: def.id,
                  effectiveFrom: new Date(new Date().setHours(0,0,0,0))
                }
              },
              update: { isActive },
              create: {
                beneficiaryId: id,
                vitalDefinitionId: def.id,
                isActive,
                frequency: 'every_visit',
                effectiveFrom: new Date(new Date().setHours(0,0,0,0))
              }
            });
          }
        }
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(`PUT /beneficiaries/:id error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/beneficiaries/:id/medications ──────────────────────────────────
router.post('/:id/medications', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dosage, frequency, timeSlots, setReminders } = req.body;

    const b = await prisma.beneficiary.findUnique({ where: { id } });
    if (!b) return res.status(404).json({ success: false, message: 'Beneficiary not found' });

    const newMed = await prisma.medication.create({
      data: {
        beneficiaryId: id,
        name,
        dosage,
        frequency: frequency || 'daily',
        timeSlots: timeSlots || [],
        setReminders: Boolean(setReminders),
        startDate: new Date(),
        isActive: true,
      }
    });

    res.json({ success: true, data: newMed });
  } catch (err) {
    console.error(`POST /beneficiaries/:id/medications error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/beneficiaries/:id/conditions ───────────────────────────────────
router.post('/:id/conditions', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Condition name required' });

    // Check if condition exists globally
    let condition = await prisma.medicalCondition.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (!condition) {
      condition = await prisma.medicalCondition.create({
        data: { name: name.trim() }
      });
    }

    // Link it
    const linked = await prisma.beneficiaryCondition.upsert({
      where: { beneficiaryId_conditionId: { beneficiaryId: id, conditionId: condition.id } },
      update: { isActive: true },
      create: { beneficiaryId: id, conditionId: condition.id }
    });

    res.json({ success: true, data: linked });
  } catch (err) {
    console.error(`POST /beneficiaries/:id/conditions error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
