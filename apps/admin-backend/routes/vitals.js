const express = require('express');
const router = express.Router();
const path = require('path');

const { prisma } = require('../lib/prisma');

// GET /api/vitals — list all (supports ?activeOnly=true)
router.get('/', async (req, res) => {
  const { activeOnly } = req.query;
  try {
    const where = {};
    if (activeOnly === 'true') where.isActive = true;

    const vitals = await prisma.vitalDefinition.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: vitals });
  } catch (err) {
    console.error('GET vitals error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vitals/:id — get one
router.get('/:id', async (req, res) => {
  try {
    const vital = await prisma.vitalDefinition.findUnique({ where: { id: req.params.id } });
    if (!vital) return res.status(404).json({ success: false, message: 'Vital not found' });
    res.json({ success: true, data: vital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vitals — create
router.post('/', async (req, res) => {
  const { name, unit, description, iconCode, fieldKey, displayOrder } = req.body;
  if (!name || !fieldKey) {
    return res.status(400).json({ success: false, message: 'name and fieldKey are required' });
  }
  try {
    const vital = await prisma.vitalDefinition.create({
      data: {
        name,
        unit: unit ?? null,
        description: description ?? null,
        iconCode: iconCode ?? null,
        fieldKey,
        displayOrder: displayOrder ?? 0,
        isActive: true,
      },
    });
    res.status(201).json({ success: true, data: vital });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: `A vital with fieldKey "${fieldKey}" already exists` });
    }
    console.error('POST vitals error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/vitals/:id — update
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, unit, description, iconCode, fieldKey, displayOrder, isActive } = req.body;
  try {
    const vital = await prisma.vitalDefinition.update({
      where: { id },
      data: { name, unit, description, iconCode, fieldKey, displayOrder, isActive },
    });
    res.json({ success: true, data: vital });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Vital not found' });
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: `fieldKey already in use` });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/vitals/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vitalDefinition.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Vital deactivated' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Vital not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
