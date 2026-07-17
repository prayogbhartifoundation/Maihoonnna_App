const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// GET /api/volunteers — list volunteers with optional status filter
router.get('/', async (req, res) => {
  const { status } = req.query;
  try {
    const where = {};
    if (status) {
      if (status === 'verified') {
        where.applicationStatus = 'APPROVED';
      } else if (status === 'pending') {
        where.applicationStatus = { in: ['SUBMITTED', 'UNDER_REVIEW'] };
      } else {
        where.applicationStatus = status.toUpperCase();
      }
    }

    const volunteers = await prisma.volunteer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            beneficiary: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    res.json({ success: true, data: volunteers });
  } catch (err) {
    console.error('GET /api/volunteers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/volunteers/:id — detail view with credit ledger history
router.get('/:id', async (req, res) => {
  try {
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: {
          where: { isActive: true },
          include: { beneficiary: true }
        },
        visitLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { beneficiary: true }
        },
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found' });
    }

    res.json({ success: true, data: volunteer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/volunteers/:id/verify — approve application
router.patch('/:id/verify', async (req, res) => {
  try {
    const volunteer = await prisma.volunteer.update({
      where: { id: req.params.id },
      data: {
        applicationStatus: 'APPROVED',
        verifiedAt: new Date(),
        verifiedById: req.user ? req.user.id : null, // req.user is set by verifyToken middleware
      }
    });

    res.json({ success: true, data: volunteer, message: 'Volunteer profile verified successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Volunteer not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/volunteers/:id/reject — reject application
router.patch('/:id/reject', async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  }

  try {
    const volunteer = await prisma.volunteer.update({
      where: { id: req.params.id },
      data: {
        applicationStatus: 'REJECTED',
        rejectionReason,
        rejectedAt: new Date(),
      }
    });

    res.json({ success: true, data: volunteer, message: 'Volunteer application rejected' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Volunteer not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/volunteers/:id/assignments — assign a beneficiary (Many-to-Many)
router.post('/:id/assignments', async (req, res) => {
  const volunteerId = req.params.id;
  const { beneficiaryId } = req.body;

  if (!beneficiaryId) {
    return res.status(400).json({ success: false, message: 'beneficiaryId is required' });
  }

  try {
    const assignment = await prisma.volunteerAssignment.upsert({
      where: {
        volunteerId_beneficiaryId: { volunteerId, beneficiaryId }
      },
      update: {
        isActive: true,
      },
      create: {
        volunteerId,
        beneficiaryId,
        assignedById: req.user ? req.user.id : null,
        isActive: true,
      },
      include: {
        beneficiary: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({ success: true, data: assignment, message: 'Beneficiary assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/volunteers/:id/assignments/:beneficiaryId — remove assignment
router.delete('/:id/assignments/:beneficiaryId', async (req, res) => {
  const volunteerId = req.params.id;
  const { beneficiaryId } = req.params;

  try {
    await prisma.volunteerAssignment.update({
      where: {
        volunteerId_beneficiaryId: { volunteerId, beneficiaryId }
      },
      data: {
        isActive: false
      }
    });

    res.json({ success: true, message: 'Assignment removed successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
