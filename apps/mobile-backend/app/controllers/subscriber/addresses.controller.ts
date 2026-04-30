import { Request, Response, NextFunction } from 'express';
import prisma from '../../core/database';

export const createAddress = async (req: Request, res: Response, _next: NextFunction) => {
  const userId = (req as any).userId;
  const { label, addressLine, city, state, pincode, latitude, longitude, isDefault } = req.body;

  // TODO: comment out after verifying location is received correctly
  console.log('\n📍 [Address Created] Incoming location data:');
  console.log('   User ID    :', userId);
  console.log('   Address    :', addressLine);
  console.log('   City       :', city);
  console.log('   Pincode    :', pincode);
  console.log('   Latitude   :', latitude);
  console.log('   Longitude  :', longitude);
  console.log('─────────────────────────────────────────\n');

  if (!addressLine || !city || !state || !pincode) {
    return res.status(400).json({ success: false, message: 'Address line, city, state, and pincode are required.' });
  }

  // If new address is set as default, unset others
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label: label || 'Home',
      addressLine,
      city,
      state,
      pincode,
      latitude,
      longitude,
      isDefault: isDefault || false,
    },
  });

  res.status(201).json({ success: true, address });
};

export const getAddresses = async (req: Request, res: Response, _next: NextFunction) => {
  const userId = (req as any).userId;

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, addresses });
};
