const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// ── GET /api/config ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' }
    });
    res.json({ success: true, data: configs });
  } catch (err) {
    console.error('GET /api/config error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch system configurations' });
  }
});

// ── PUT /api/config/:key ─────────────────────────────────────────────────────
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, group } = req.body;

    const updated = await prisma.systemConfig.update({
      where: { key },
      data: {
        value: String(value),
        ...(description !== undefined ? { description } : {}),
        ...(group !== undefined ? { group } : {})
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(`PUT /api/config/${req.params.key} error:`, err);
    res.status(500).json({ success: false, message: 'Failed to update system configuration' });
  }
});

module.exports = router;
