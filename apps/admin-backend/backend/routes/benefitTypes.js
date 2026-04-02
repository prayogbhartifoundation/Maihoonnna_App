const express = require('express');
const router = express.Router();
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

// GET /api/benefit-types — list all
router.get('/', async (req, res) => {
  try {
    const types = await prisma.benefitType.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { benefits: true } } },
    });
    res.json({ success: true, data: types });
  } catch (err) {
    console.error('GET benefit-types error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/benefit-types — create
router.post('/', async (req, res) => {
  const { name, description, iconCode, displayOrder } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name is required' });
  try {
    const type = await prisma.benefitType.create({
      data: { name, description, iconCode, displayOrder: displayOrder ?? 0 },
    });
    res.status(201).json({ success: true, data: type });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'A benefit type with this name already exists' });
    console.error('POST benefit-types error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/benefit-types/:id — update
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, iconCode, displayOrder, isActive } = req.body;
  try {
    const type = await prisma.benefitType.update({
      where: { id },
      data: { name, description, iconCode, displayOrder, isActive },
    });
    res.json({ success: true, data: type });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Benefit type not found' });
    console.error('PATCH benefit-types error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/benefit-types/:id — soft delete (deactivate)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.benefitType.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Benefit type deactivated' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Benefit type not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
