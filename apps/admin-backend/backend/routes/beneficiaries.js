const express = require('express');
const router = express.Router();
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();

// ── GET /api/beneficiaries ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { search, searchBy, page, limit } = req.query;
        const filterParams = {};

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
                    { pincode: { contains: search } }
                ];
            }
        }

        const listQuery = {
            where: filterParams,
            orderBy: { createdAt: 'desc' },
            include: {
                subscriber: {
                    select: { name: true, phone: true, email: true }
                },
                primaryCC: {
                    select: { id: true, name: true, zone: true, userId: true }
                },
                secondaryCC: {
                    select: { id: true, name: true, zone: true, userId: true }
                },
                fieldManager: {
                    select: { id: true, name: true }
                },
                emergencyContacts: {
                    where: { isPrimary: true },
                    take: 1,
                }
            }
        };

        if (page && limit) {
             const pageNum = Number(page);
             const limitNum = Number(limit);
             if (pageNum > 0 && limitNum > 0) {
                 listQuery.skip = (pageNum - 1) * limitNum;
                 listQuery.take = limitNum;
             }
        }

        const [beneficiaries, total] = await Promise.all([
             prisma.beneficiary.findMany(listQuery),
             prisma.beneficiary.count({ where: filterParams })
        ]);

        const beneficiaryIds = beneficiaries.map(b => b.id);
        const subscriptions = await prisma.subscription.findMany({
            where: { beneficiaryId: { in: beneficiaryIds }, isActive: true },
            include: { package: { select: { name: true } } }
        });
        const subMap = {};
        subscriptions.forEach(s => { if (!subMap[s.beneficiaryId]) subMap[s.beneficiaryId] = s; });

        const mapped = beneficiaries.map(b => {
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

        const response = { success: true, data: mapped, total };
        
        if (page && limit) {
            response.page = Number(page);
            response.totalPages = Math.ceil(total / Number(limit));
        }

        res.json(response);
    } catch (err) {
        console.error('GET /beneficiaries error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch beneficiaries' });
    }
});

// ── GET /api/beneficiaries/available-staff?pincode=XXXXX ─────────────────────
// Returns CCs and FMs available in the zone matching the given pincode
router.get('/available-staff', async (req, res) => {
    const { pincode } = req.query;
    if (!pincode) return res.status(400).json({ success: false, message: 'pincode is required' });

    try {
        // Find zone(s) matching the pincode
        const matchingZones = await prisma.zone.findMany({
            where: { pincode: String(pincode), isActive: true },
            select: { id: true, name: true, pincode: true }
        });

        const zoneIds = matchingZones.map(z => z.id);

        // Get CCs whose staffProfile.zoneId matches one of these zones
        const ccProfiles = await prisma.staffProfile.findMany({
            where: {
                role: 'care_companion',
                zoneId: zoneIds.length > 0 ? { in: zoneIds } : undefined,
                employmentStatus: 'active',
            },
            include: {
                user: {
                    include: {
                        careCompanionProfile: {
                            select: { id: true, name: true, zone: true, isAvailable: true }
                        }
                    }
                }
            }
        });

        // Get FMs whose staffProfile.zoneId matches
        const fmProfiles = await prisma.staffProfile.findMany({
            where: {
                role: 'field_manager',
                zoneId: zoneIds.length > 0 ? { in: zoneIds } : undefined,
                employmentStatus: 'active',
            },
            include: {
                user: {
                    include: {
                        fieldManagerProfile: {
                            select: { id: true, name: true, zone: true, isAvailable: true }
                        }
                    }
                }
            }
        });

        const careCompanions = ccProfiles
            .filter(p => p.user?.careCompanionProfile)
            .map(p => ({
                id: p.user.careCompanionProfile.id,
                userId: p.userId,
                name: p.user.careCompanionProfile.name || p.user?.name,
                zone: p.user.careCompanionProfile.zone,
                isAvailable: p.user.careCompanionProfile.isAvailable,
            }));

        const fieldManagers = fmProfiles
            .filter(p => p.user?.fieldManagerProfile)
            .map(p => ({
                id: p.user.fieldManagerProfile.id,
                userId: p.userId,
                name: p.user.fieldManagerProfile.name || p.user?.name,
                zone: p.user.fieldManagerProfile.zone,
                isAvailable: p.user.fieldManagerProfile.isAvailable,
            }));

        res.json({
            success: true,
            data: { careCompanions, fieldManagers, zones: matchingZones }
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
        const data = {};
        if (primaryCcId !== undefined)   data.primaryCcId   = primaryCcId   || null;
        if (secondaryCcId !== undefined) data.secondaryCcId = secondaryCcId || null;
        if (fieldManagerId !== undefined) data.fieldManagerId = fieldManagerId || null;

        const updated = await prisma.beneficiary.update({
            where: { id },
            data,
            include: {
                primaryCC:    { select: { id: true, name: true, zone: true } },
                secondaryCC:  { select: { id: true, name: true, zone: true } },
                fieldManager: { select: { id: true, name: true } },
            }
        });
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /beneficiaries/:id/assign-staff error:', err);
        if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Beneficiary not found' });
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
                visits: { orderBy: { scheduledTime: 'desc' }, take: 5 }
            }
        });
        if (!b) return res.status(404).json({ success: false, message: 'Beneficiary not found' });

        const sub = await prisma.subscription.findFirst({
            where: { beneficiaryId: b.id, isActive: true },
            include: { package: true }
        });

        res.json({ success: true, data: { ...b, subscriptions: sub ? [sub] : [] } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
