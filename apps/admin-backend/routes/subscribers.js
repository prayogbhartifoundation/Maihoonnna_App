const express = require('express');
const router = express.Router();
const path = require('path');

const { prisma } = require('../lib/prisma');

// ── GET /api/subscribers ─────────────────────────────────────────────────────
// Fetches all users with role = 'subscriber' and their linked beneficiaries
router.get('/', async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const filterParams = { role: 'subscriber' };

    if (search) {
      filterParams.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const listQuery = {
      where: filterParams,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriberBeneficiaries: {
          select: { id: true, name: true, age: true },
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

    const subscribers = await prisma.user.findMany(listQuery);
    const total = await prisma.user.count({ where: filterParams });

    // Fetch subscriptions separately mapped by subscriber
    const subscriberIds = subscribers.map((s) => s.id);
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: { in: subscriberIds }, isActive: true },
      include: { package: { select: { name: true, type: true } } },
    });

    const subMap = {};
    subscriptions.forEach((s) => {
      if (!subMap[s.subscriberId]) subMap[s.subscriberId] = s;
    });

    const mapped = subscribers.map((s) => {
      const activeSub = subMap[s.id];
      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email || null,
        address: s.address || null,
        isActive: s.isActive,
        createdAt: s.createdAt,
        beneficiaryCount: s.subscriberBeneficiaries?.length || 0,
        beneficiaries: s.subscriberBeneficiaries || [],
        activePackage: activeSub?.package?.name || null,
        subscriptionType: activeSub?.package?.type || null,
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
    console.error('GET /subscribers error:', err);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch subscribers' });
  }
});

// ── GET /api/subscribers/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const s = await prisma.user.findUnique({
      where: { id: req.params.id, role: 'subscriber' },
      include: {
        subscriberBeneficiaries: {
          include: {
            primaryCC: true,
            secondaryCC: true,
            fieldManager: true,
          },
        },
      },
    });
    if (!s)
      return res
        .status(404)
        .json({ success: false, message: 'Subscriber not found' });

    // Fetch active subscription separately
    const sub = await prisma.subscription.findFirst({
      where: { subscriberId: s.id, isActive: true },
      include: { package: true },
    });

    res.json({
      success: true,
      data: {
        ...s,
        beneficiaries: s.subscriberBeneficiaries,
        subscriptions: sub ? [sub] : [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/subscribers/:id ─────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { 
      name, phone, email, age, location, latitude, longitude, 
      profilePhoto, isActive 
    } = req.body;

    const s = await prisma.user.findUnique({ where: { id, role: 'subscriber' } });
    if (!s) return res.status(404).json({ success: false, message: 'Subscriber not found' });

    let parsedAge = age !== undefined ? Number(age) : undefined;
    if (parsedAge !== undefined && isNaN(parsedAge)) parsedAge = s.age;

    // Build update object securely
    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (phone !== undefined) {
      // Check if another user has this phone
      if (phone !== s.phone) {
        const existingPhones = await prisma.user.findUnique({ where: { phone } });
        if (existingPhones) return res.status(400).json({ success: false, message: 'Phone number already in use by another user' });
      }
      dataToUpdate.phone = phone;
    }
    if (email !== undefined) {
      if (email !== s.email && email !== '') {
        const existingEmails = await prisma.user.findUnique({ where: { email } });
        if (existingEmails) return res.status(400).json({ success: false, message: 'Email already in use by another user' });
      }
      dataToUpdate.email = email === '' ? null : email;
    }
    if (parsedAge !== undefined) dataToUpdate.age = parsedAge;
    if (location !== undefined) dataToUpdate.location = location;
    if (latitude !== undefined) dataToUpdate.latitude = latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) dataToUpdate.longitude = longitude !== null ? Number(longitude) : null;
    if (profilePhoto !== undefined) dataToUpdate.profilePhoto = profilePhoto;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(`PUT /subscribers/:id error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
