const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// ==========================================
// BEST PRACTICES
// ==========================================

// GET all
router.get('/best-practices', async (req, res) => {
  try {
    const items = await prisma.saathiBestPractice.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching best practices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch best practices' });
  }
});

// CREATE
router.post('/best-practices', async (req, res) => {
  try {
    const { title, description, icon, points, sortOrder, isActive } = req.body;
    const item = await prisma.saathiBestPractice.create({
      data: {
        title,
        description,
        icon,
        points: points || [],
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating best practice:', error);
    res.status(500).json({ success: false, message: 'Failed to create best practice' });
  }
});

// UPDATE
router.put('/best-practices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, points, sortOrder, isActive } = req.body;
    const item = await prisma.saathiBestPractice.update({
      where: { id },
      data: {
        title,
        description,
        icon,
        points,
        sortOrder: parseInt(sortOrder),
        isActive,
      },
    });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating best practice:', error);
    res.status(500).json({ success: false, message: 'Failed to update best practice' });
  }
});

// DELETE
router.delete('/best-practices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.saathiBestPractice.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting best practice:', error);
    res.status(500).json({ success: false, message: 'Failed to delete best practice' });
  }
});

// ==========================================
// SUGGESTED ACTIVITIES
// ==========================================

// GET all
router.get('/activities', async (req, res) => {
  try {
    const items = await prisma.saathiSuggestedActivity.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
});

// CREATE
router.post('/activities', async (req, res) => {
  try {
    const { title, duration, difficulty, sortOrder, isActive } = req.body;
    const item = await prisma.saathiSuggestedActivity.create({
      data: {
        title,
        duration,
        difficulty,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, message: 'Failed to create activity' });
  }
});

// UPDATE
router.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, difficulty, sortOrder, isActive } = req.body;
    const item = await prisma.saathiSuggestedActivity.update({
      where: { id },
      data: {
        title,
        duration,
        difficulty,
        sortOrder: parseInt(sortOrder),
        isActive,
      },
    });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ success: false, message: 'Failed to update activity' });
  }
});

// DELETE
router.delete('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.saathiSuggestedActivity.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ success: false, message: 'Failed to delete activity' });
  }
});

// ==========================================
// FAQS
// ==========================================

// GET all
router.get('/faqs', async (req, res) => {
  try {
    const items = await prisma.saathiFaq.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching faqs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch faqs' });
  }
});

// CREATE
router.post('/faqs', async (req, res) => {
  try {
    const { question, answer, sortOrder, isActive } = req.body;
    const item = await prisma.saathiFaq.create({
      data: {
        question,
        answer,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating faq:', error);
    res.status(500).json({ success: false, message: 'Failed to create faq' });
  }
});

// UPDATE
router.put('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, sortOrder, isActive } = req.body;
    const item = await prisma.saathiFaq.update({
      where: { id },
      data: {
        question,
        answer,
        sortOrder: parseInt(sortOrder),
        isActive,
      },
    });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating faq:', error);
    res.status(500).json({ success: false, message: 'Failed to update faq' });
  }
});

// DELETE
router.delete('/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.saathiFaq.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting faq:', error);
    res.status(500).json({ success: false, message: 'Failed to delete faq' });
  }
});

module.exports = router;
