const express = require('express');
const router = express.Router();
const path = require('path');
const { prisma } = require('../lib/prisma');

// GET /api/benefits — list all benefits (with type info)
router.get('/', async (req, res) => {
  const { activeOnly } = req.query;
  try {
    const where = {};
    if (activeOnly === 'true') where.isActive = true;

    const benefits = await prisma.benefit.findMany({
      where,
      orderBy: [{ benefitTypeId: 'asc' }, { displayOrder: 'asc' }],
      include: {
        benefitType: { select: { id: true, name: true, iconCode: true } },
      },
    });
    res.json({ success: true, data: benefits });
  } catch (err) {
    console.error('GET benefits error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/benefits/:id
router.get('/:id', async (req, res) => {
  try {
    const benefit = await prisma.benefit.findUnique({
      where: { id: req.params.id },
      include: { benefitType: true },
    });
    if (!benefit)
      return res
        .status(404)
        .json({ success: false, message: 'Benefit not found' });
    res.json({ success: true, data: benefit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/benefits — create
router.post('/', async (req, res) => {
  const {
    benefitTypeId,
    name,
    description,
    isChargeable,
    unitCost,
    unitLabel,
    defaultUnits,
    displayOrder,
  } = req.body;
  if (!benefitTypeId || !name) {
    return res
      .status(400)
      .json({ success: false, message: 'benefitTypeId and name are required' });
  }
  try {
    const benefit = await prisma.benefit.create({
      data: {
        benefitTypeId,
        name,
        description,
        isChargeable: isChargeable ?? false,
        unitCost: unitCost ?? null,
        unitLabel,
        defaultUnits: defaultUnits ?? 1,
        displayOrder: displayOrder ?? 0,
      },
      include: { benefitType: { select: { id: true, name: true } } },
    });
    res.status(201).json({ success: true, data: benefit });
  } catch (err) {
    console.error('POST benefits error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/benefits/:id — update
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    benefitTypeId,
    name,
    description,
    isChargeable,
    unitCost,
    unitLabel,
    defaultUnits,
    displayOrder,
    isActive,
  } = req.body;
  try {
    const benefit = await prisma.benefit.update({
      where: { id },
      data: {
        benefitTypeId,
        name,
        description,
        isChargeable,
        unitCost,
        unitLabel,
        defaultUnits,
        displayOrder,
        isActive,
      },
      include: { benefitType: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: benefit });
  } catch (err) {
    if (err.code === 'P2025')
      return res
        .status(404)
        .json({ success: false, message: 'Benefit not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/benefits/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    await prisma.benefit.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Benefit deactivated' });
  } catch (err) {
    if (err.code === 'P2025')
      return res
        .status(404)
        .json({ success: false, message: 'Benefit not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
