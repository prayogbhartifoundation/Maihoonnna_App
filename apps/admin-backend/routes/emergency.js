const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// GET all emergency requests
router.get('/requests', async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.emergencyRequest.findMany({
      where,
      include: {
        beneficiary: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                profilePhoto: true,
                location: true,
                flatPlot: true,
                streetArea: true,
                landmark: true,
                city: true,
                state: true,
                pincode: true,
                latitude: true,
                longitude: true
              }
            },
            subscriber: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true
              }
            },
            primaryCC: {
              include: {
                user: {
                  select: { id: true, name: true, phone: true }
                }
              }
            },
            secondaryCC: {
              include: {
                user: {
                  select: { id: true, name: true, phone: true }
                }
              }
            },
            emergencyContacts: {
              select: {
                id: true,
                name: true,
                phone: true,
                relationship: true,
                isPrimary: true
              }
            },
            team: {
              include: {
                fieldManager: {
                  include: {
                    user: {
                      select: { id: true, name: true, phone: true }
                    }
                  }
                }
              }
            }
          }
        },
        requester: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Resolve Field Manager from Zone if not set directly on Team
    const zones = await prisma.zone.findMany({
      where: { fieldManagerId: { not: null } },
      include: {
        fieldManagerUser: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    const enrichedRequests = requests.map((reqItem) => {
      const b = reqItem.beneficiary;
      if (!b) return reqItem;

      let fmName = b.team?.fieldManager?.user?.name || b.team?.fieldManager?.name || null;
      let fmPhone = b.team?.fieldManager?.user?.phone || null;

      // Fallback: match by pincode to zone
      if (!fmName && (b.pincode || b.user?.pincode)) {
        const pin = (b.pincode || b.user?.pincode || '').trim();
        const matchingZone = zones.find((z) => Array.isArray(z.pincodes) && z.pincodes.includes(pin));
        if (matchingZone && matchingZone.fieldManagerUser) {
          fmName = matchingZone.fieldManagerUser.name;
          fmPhone = matchingZone.fieldManagerUser.phone;
        }
      }

      return {
        ...reqItem,
        beneficiary: {
          ...b,
          fieldManager: fmName ? { name: fmName, phone: fmPhone } : null
        }
      };
    });

    res.json({ success: true, data: enrichedRequests });
  } catch (error) {
    console.error('Error fetching emergency requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch emergency requests' });
  }
});

const { isEmergencyBenefit } = require('../utils/systemBenefits');

// UPDATE emergency request status
router.put('/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const existing = await prisma.emergencyRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Emergency request not found' });
    }

    let deductionNote = '';

    // If changing status to 'resolved' and it wasn't already resolved, deduct benefit unit from package
    if (status === 'resolved' && existing.status !== 'resolved') {
      const activeSubs = await prisma.subscription.findMany({
        where: {
          beneficiaryId: existing.beneficiaryId,
          isActive: true,
        },
        include: {
          benefitBalances: {
            include: {
              benefit: {
                include: { benefitType: true }
              }
            }
          }
        }
      });

      for (const sub of activeSubs) {
        if (sub.benefitBalances && sub.benefitBalances.length > 0) {
          const emrBalance = sub.benefitBalances.find((bal) => isEmergencyBenefit(bal.benefit));

          if (emrBalance) {
            const newUsedUnits = emrBalance.usedUnits + 1;
            await prisma.subscriptionBenefitBalance.update({
              where: { id: emrBalance.id },
              data: { usedUnits: newUsedUnits }
            });
            deductionNote = ` (1 Emergency Benefit unit deducted from package balance: ${newUsedUnits}/${emrBalance.totalUnits})`;
            console.log(`[EmergencyResolution] Deducted 1 Emergency unit for beneficiary ${existing.beneficiaryId}. Used: ${newUsedUnits}/${emrBalance.totalUnits}`);
            break;
          }
        }
      }
    }

    const currentNotes = Array.isArray(existing.notes) ? existing.notes : [];
    const updatedNotes = [
      ...currentNotes,
      {
        timestamp: new Date().toISOString(),
        note: `Status updated to ${status.toUpperCase()}${resolutionNotes ? `: ${resolutionNotes}` : ''}${deductionNote}`
      }
    ];

    const data = {
      status,
      notes: updatedNotes,
      ...(status === 'resolved' ? { resolvedAt: new Date(), resolutionNotes } : {})
    };

    const updated = await prisma.emergencyRequest.update({
      where: { id },
      data,
      include: {
        beneficiary: {
          include: {
            user: true,
            subscriber: true
          }
        }
      }
    });

    res.json({ success: true, data: updated, message: `Emergency request status updated to ${status}.${deductionNote}` });
  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(500).json({ success: false, message: 'Failed to update emergency status' });
  }
});

// ADD operational note to emergency request
router.post('/requests/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, author } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const existing = await prisma.emergencyRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Emergency request not found' });
    }

    const currentNotes = Array.isArray(existing.notes) ? existing.notes : [];
    const updatedNotes = [
      ...currentNotes,
      {
        timestamp: new Date().toISOString(),
        author: author || 'ERC Agent',
        note
      }
    ];

    const updated = await prisma.emergencyRequest.update({
      where: { id },
      data: { notes: updatedNotes }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error adding emergency note:', error);
    res.status(500).json({ success: false, message: 'Failed to add emergency note' });
  }
});

module.exports = router;
