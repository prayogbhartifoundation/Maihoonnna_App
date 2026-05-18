const express = require('express');
const router = express.Router();
const path = require('path');

const { prisma } = require('../lib/prisma');
const { checkCCAvailability } = require('../services/scheduling');
const { calculateDistance } = require('../utils/location');
const { notifyMany } = require('../services/notifications');

// ── GET /api/beneficiaries ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, searchBy, page, limit, sortBy, sortOrder = 'desc', filterBy = 'all', fieldManagerId } = req.query;
    const filterParams = {};

    if (fieldManagerId) {
      filterParams.fieldManagerId = fieldManagerId;
    }

    // RBAC Filtering
    if (req.user && req.user.role === 'field_manager') {
      filterParams.fieldManagerId = req.user.id;
    }

    if (filterBy === 'unassigned') {
      filterParams.fieldManagerId = null;
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

    // Fetch user's managed zones for distance calculation
    let managedZones = [];
    if (req.user && (req.user.role === 'operations_manager' || req.user.role === 'admin' || req.user.role === 'master_admin')) {
      const zoneQuery = { where: { isActive: true } };
      if (req.user.role === 'operations_manager') {
        zoneQuery.where.operationsManagerId = req.user.id;
      }
      managedZones = await prisma.zone.findMany({
        ...zoneQuery,
        select: { id: true, name: true, latitude: true, longitude: true, pincode: true }
      });
    }

    const listQuery = {
      where: filterParams,
      orderBy: sortBy && sortBy !== 'distance' ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
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

    // If sorting by distance, we'll need to fetch all (or more) and sort in-memory
    const isDistanceSort = sortBy === 'distance';
    
    if (page && limit && !isDistanceSort) {
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

    let mapped = beneficiaries.map((b) => {
      const activeSub = subMap[b.id];
      
      // Calculate distance to nearest managed zone
      let minDistance = null;
      let nearestZoneName = null;

      if (managedZones.length > 0 && b.latitude && b.longitude) {
        managedZones.forEach(zone => {
          if (zone.latitude && zone.longitude) {
            const dist = calculateDistance(b.latitude, b.longitude, zone.latitude, zone.longitude);
            if (minDistance === null || dist < minDistance) {
              minDistance = dist;
              nearestZoneName = zone.name;
            }
          }
        });
      }

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
        latitude: b.latitude,
        longitude: b.longitude,
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
        distance: minDistance ? parseFloat(minDistance.toFixed(2)) : null,
        nearestZone: nearestZoneName
      };
    });

    // Handle distance sorting
    if (isDistanceSort) {
      mapped.sort((a, b) => {
        const distA = a.distance === null ? Infinity : a.distance;
        const distB = b.distance === null ? Infinity : b.distance;
        return sortOrder === 'asc' ? distA - distB : distB - distA;
      });

      // Apply pagination after sorting
      if (page && limit) {
        const start = (Number(page) - 1) * Number(limit);
        mapped = mapped.slice(start, start + Number(limit));
      }
    }

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

    // If no matching zones, we'll fetch all active/pending staff (zoneId filter will be undefined)

    // Get CCs whose staffProfile.zoneId matches one of these zones
    const ccProfiles = await prisma.staffProfile.findMany({
      where: {
        role: 'care_companion',
        zoneId: zoneIds.length > 0 ? { in: zoneIds } : undefined,
        employmentStatus: { in: ['active', 'bgv_pending'] },
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
        employmentStatus: { in: ['active', 'bgv_pending'] },
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
// Side-effects on new primary CC assignment:
//   1. Notifies the CC        → "New Assignment"
//   2. Notifies the Beneficiary user → "Care Companion Assigned"
//   3. Notifies the Subscriber       → "A CC has been assigned to your family member"
//   4. Creates an upcoming Visit     → scheduled for 2 days from now at 10 AM
router.put('/:id/assign-staff', async (req, res) => {
  const { id } = req.params;
  const { primaryCcId, secondaryCcId, fieldManagerId } = req.body;
  try {
    // Fetch full beneficiary for notifications
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id },
      select: {
        name: true,
        primaryCcId: true,
        secondaryCcId: true,
        userId: true,
        subscriberId: true,
        address: true,
      },
    });

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    console.log(`[AssignStaff] Ben: ${id}, FM: ${fieldManagerId}, PrimaryCC: ${primaryCcId}, SecondaryCC: ${secondaryCcId}`);

    const data = {};
    let newPrimaryCC = null;     // { id, name, userId } of newly assigned primary CC
    let newSecondaryCcUserId = null;

    // ── Validate & track new primary CC ─────────────────────────────────────
    if (primaryCcId !== undefined) {
      if (primaryCcId) {
        const count = await prisma.beneficiary.count({
          where: { primaryCcId, isActive: true },
        });
        const cc = await prisma.careCompanion.findUnique({
          where: { id: primaryCcId },
          select: { id: true, name: true, userId: true, maxPrimaryBeneficiaries: true },
        });
        if (count >= (cc?.maxPrimaryBeneficiaries || 5)) {
          return res.status(400).json({
            success: false,
            message: `Care Companion ${cc?.name || ''} has reached maximum primary capacity (5)`,
          });
        }
        // Only treat as "new" if it wasn't already assigned
        if (beneficiary.primaryCcId !== primaryCcId && cc?.userId) {
          newPrimaryCC = cc;
        }
      }
      data.primaryCcId = primaryCcId || null;
    }

    // ── Validate & track new secondary CC ────────────────────────────────────
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
          return res.status(400).json({
            success: false,
            message: `Care Companion ${cc?.name || ''} has reached maximum secondary capacity (5)`,
          });
        }
        if (beneficiary.secondaryCcId !== secondaryCcId && cc?.userId) {
          newSecondaryCcUserId = cc.userId;
        }
      }
      data.secondaryCcId = secondaryCcId || null;
    }

    if (fieldManagerId !== undefined) data.fieldManagerId = fieldManagerId || null;

    // ── DB Transaction: update + activity log ────────────────────────────────
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

      await tx.activityLog.create({
        data: {
          userId: benUpdate.userId,
          type: 'TEAM',
          action: 'TEAM_EDITED',
          details: {
            entity: 'beneficiary',
            entityId: id,
            primaryCcId,
            secondaryCcId,
            fieldManagerId,
            updatedByRole: req.user?.role || 'system',
            updatedByName: req.user?.name || 'Admin',
          },
        },
      });

      return benUpdate;
    });

    // ── Post-transaction: notifications + upcoming visit ─────────────────────
    // (Outside transaction so a push failure never rolls back the DB update)
    if (newPrimaryCC) {
      const scheduledTime = new Date();
      scheduledTime.setDate(scheduledTime.getDate() + 2);
      scheduledTime.setHours(10, 0, 0, 0);

      // Build notification list
      const notifications = [
        // 1. Notify the Care Companion
        {
          userId: newPrimaryCC.userId,
          type: 'system',
          title: '👋 New Beneficiary Assignment',
          body: `You have been assigned as the Primary Care Companion for ${beneficiary.name}. Your first visit is scheduled for ${scheduledTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at 10 AM.`,
          data: { beneficiaryId: id, type: 'cc_assignment' },
        },
      ];

      // 2. Notify the Beneficiary (if they have a user account)
      if (beneficiary.userId) {
        notifications.push({
          userId: beneficiary.userId,
          type: 'system',
          title: '🤝 Care Companion Assigned',
          body: `${newPrimaryCC.name} has been assigned as your Care Companion and will visit you on ${scheduledTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at 10 AM.`,
          data: { ccId: newPrimaryCC.id, type: 'cc_assignment' },
        });
      }

      // 3. Notify the Subscriber (family member who enrolled)
      if (beneficiary.subscriberId && beneficiary.subscriberId !== beneficiary.userId) {
        notifications.push({
          userId: beneficiary.subscriberId,
          type: 'system',
          title: '✅ Care Companion Assigned',
          body: `${newPrimaryCC.name} has been assigned to take care of ${beneficiary.name}. First visit: ${scheduledTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at 10 AM.`,
          data: { beneficiaryId: id, ccId: newPrimaryCC.id, type: 'cc_assignment' },
        });
      }

      // 4. Notify secondary CC if newly assigned
      if (newSecondaryCcUserId) {
        notifications.push({
          userId: newSecondaryCcUserId,
          type: 'system',
          title: '👋 Secondary Assignment',
          body: `You have been assigned as the Secondary Care Companion for ${beneficiary.name}.`,
          data: { beneficiaryId: id, type: 'cc_assignment' },
        });
      }

      // Send all notifications (non-blocking)
      notifyMany(prisma, notifications).catch(err =>
        console.error('[AssignStaff] Notification batch error:', err.message)
      );

      // 5. Create an upcoming visit for the new CC
      const encounterId = `ENC-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      prisma.visit
        .create({
          data: {
            encounterId,
            beneficiaryId: id,
            careCompanionId: newPrimaryCC.id,
            scheduledTime,
            status: 'scheduled',
          },
        })
        .catch(err =>
          console.error('[AssignStaff] Failed to create upcoming visit:', err.message)
        );
    } else if (newSecondaryCcUserId) {
      // Only secondary CC changed — still notify them
      notifyMany(prisma, [
        {
          userId: newSecondaryCcUserId,
          type: 'system',
          title: '👋 Secondary Assignment',
          body: `You have been assigned as the Secondary Care Companion for ${beneficiary.name}.`,
          data: { beneficiaryId: id, type: 'cc_assignment' },
        },
      ]).catch(err => console.error('[AssignStaff] Secondary CC notification error:', err.message));
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('PUT /beneficiaries/:id/assign-staff error:', err);
    if (err.code === 'P2025')
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
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
    // Don't include relational fields in the core update — handle them separately
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    // Use a transaction to safely update core fields + relations
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update core beneficiary fields
      const ben = await tx.beneficiary.update({
        where: { id },
        data: dataToUpdate
      });

      // 2. Sync Medical Conditions (delete old links, create new ones)
      if (medicalConditions !== undefined && Array.isArray(medicalConditions)) {
        // Remove current condition links
        await tx.beneficiaryCondition.deleteMany({ where: { beneficiaryId: id } });

        // Re-link new conditions
        for (const condName of medicalConditions) {
          if (!condName) continue;
          let condition = await tx.medicalCondition.findFirst({
            where: { name: { equals: condName, mode: 'insensitive' } }
          });
          if (!condition) {
            condition = await tx.medicalCondition.create({
              data: { name: condName.trim(), slug: condName.trim().toLowerCase().replace(/\s+/g, '-'), category: 'General' }
            });
          }
          await tx.beneficiaryCondition.create({
            data: { beneficiaryId: id, conditionId: condition.id }
          });
        }
      }

      // 3. Sync Medications (Overwrite old with new)
      if (medications !== undefined && Array.isArray(medications)) {
        // Remove old medications (Cascade will handle adherence records)
        await tx.medication.deleteMany({ where: { beneficiaryId: id } });

        // Create new medications
        for (const m of medications) {
          if (!m || !m.name) continue;
          await tx.medication.create({
            data: {
              beneficiaryId: id,
              name: m.name,
              dosage: m.dosage || '',
              frequency: m.frequency || 'once_daily',
              timeSlots: m.timeSlots || [],
              setReminders: !!m.setReminders,
              startDate: m.startDate ? new Date(m.startDate) : new Date(),
              endDate: m.endDate ? new Date(m.endDate) : null,
              isActive: true,
            }
          });
        }
      }

      const changedFields = Object.keys(dataToUpdate).filter(key => b[key] !== dataToUpdate[key]);

      if (changedFields.length > 0 || medications !== undefined) {
        // Log who updated this beneficiary (The Admin)
        await tx.activityLog.create({
          data: {
            userId: req.user?.id || ben.userId, 
            type: 'PROFILE',
            action: 'PROFILE_UPDATED',
            details: {
              entity: 'beneficiary',
              entityId: id,
              beneficiaryName: ben.name,
              changes: changedFields,
              medicationsOverwritten: medications !== undefined,
              updatedBy: req.user?.name || 'Administrator'
            }
          }
        });
      }

      return ben;
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
        frequency: frequency || 'once_daily',
        timeSlots: timeSlots || [],
        setReminders: Boolean(setReminders),
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        isActive: true,
      }
    });

    res.json({ success: true, data: newMed });
  } catch (err) {
    console.error(`POST /beneficiaries/:id/medications error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/beneficiaries/:id/medications/:medicationId ───────────────────
// "Stop" a medication
router.delete('/:id/medications/:medicationId', async (req, res) => {
  try {
    const { medicationId } = req.params;
    await prisma.medication.update({
      where: { id: medicationId },
      data: { 
        isActive: false,
        endDate: new Date()
      }
    });
    res.json({ success: true, message: 'Medication stopped' });
  } catch (err) {
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
        data: { 
          name: name.trim(),
          slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
          category: 'General'
        }
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

// ── DELETE /api/beneficiaries/:id/conditions/:conditionId ─────────────────────
// "Remove" a condition
router.delete('/:id/conditions/:conditionId', async (req, res) => {
  try {
    const { id, conditionId } = req.params;
    await prisma.beneficiaryCondition.update({
      where: { 
        beneficiaryId_conditionId: { 
          beneficiaryId: id, 
          conditionId: conditionId 
        } 
      },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Condition removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
