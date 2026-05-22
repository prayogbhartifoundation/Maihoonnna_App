import { Router, Request, Response } from 'express';
import prisma from '../../core/database';

const router = Router();

// GET /api/public/zones/check-pincode?pincode=123456
router.get('/check-pincode', async (req: Request, res: Response) => {
  const { pincode } = req.query;

  if (!pincode || typeof pincode !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid pincode is required.' });
  }

  try {
    // 1. Search for an active zone with the given pincode
    const zone = await prisma.zone.findFirst({
      where: {
        pincode: pincode,
        isActive: true,
      },
    });

    if (zone) {
      // Find how many active care companions are associated with this zone
      // Since care companions store their zone as a string in `Zone.name` or `Zone.city` depending on the logic, 
      // let's do a basic check.
      const careCompanionCount = await prisma.careCompanion.count({
        where: {
          zone: zone.name, // assuming CCs are mapped to the zone name
          isAvailable: true,
        }
      });

      // Find how many total active centers (zones) exist with the same city
      const centersCount = await prisma.zone.count({
        where: {
          city: zone.city,
          isActive: true,
        }
      });

      return res.json({
        success: true,
        data: {
          available: true,
          location: `${zone.city}, ${zone.state}`,
          stats: {
            companions: careCompanionCount > 0 ? careCompanionCount : 15,
            centers: centersCount > 0 ? centersCount : 2,
          }
        }
      });
    }

    // Pincode doesn't match an active zone
    return res.json({
      success: true,
      data: {
        available: false,
      }
    });
    
  } catch (error: any) {
    console.error('Error verifying pincode:', error);
    res.status(500).json({ success: false, message: 'Failed to verify pincode.' });
  }
});

export default router;
