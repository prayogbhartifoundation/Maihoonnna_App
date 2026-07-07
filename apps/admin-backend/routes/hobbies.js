const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// GET /api/hobbies
router.get('/', async (req, res) => {
  const { activeOnly } = req.query;
  try {
    const where = {};
    if (activeOnly === 'true') where.isActive = true;
    const hobbies = await prisma.hobby.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: hobbies });
  } catch (err) {
    console.error('GET /hobbies error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
