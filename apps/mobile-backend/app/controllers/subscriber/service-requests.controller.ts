import { Request, Response, NextFunction } from 'express';
import prisma from '../../core/database';
import { config } from '../../core/config';

export const createServiceRequest = async (req: Request, res: Response, _next: NextFunction) => {
  const userId = (req as any).userId;
  const { beneficiaryId, addressId, scheduledDate, notes } = req.body;

  // TODO: comment out after verifying location is received correctly
  console.log('\n🚑 [Service Request] Incoming request data:');
  console.log('   User ID     :', userId);
  console.log('   Address ID  :', addressId);
  console.log('   Scheduled   :', scheduledDate);
  console.log('   Notes       :', notes);
  console.log('─────────────────────────────────────────\n');

  if (!addressId || !scheduledDate) {
    return res.status(400).json({ success: false, message: 'Address and date are required.' });
  }


  // Get the beneficiary associated with this user
  let actualBeneficiaryId = beneficiaryId;
  const beneficiary = await prisma.beneficiary.findFirst({
    where: { userId },
  });

  if (!beneficiary) {
    return res.status(404).json({ success: false, message: 'Beneficiary profile not found.' });
  }
  actualBeneficiaryId = beneficiary.id;

  // Get address to ensure it exists and belongs to user
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found.' });
  }

  const appointment = await prisma.appointment.create({
    data: {
      beneficiaryId: actualBeneficiaryId,
      addressId,
      scheduledDate: new Date(scheduledDate),
      notes: notes || 'Care service request from subscriber',
      isServiceRequest: true,
      status: 'pending',
      bookedBy: userId,
    },
  });

  // Here you can add logic to notify Field Managers within MAX_SERVICE_RADIUS_KM
  // using Google Maps API for ETA.
  // For now, it's saved in the DB and can be queried by Field Managers.

  res.status(201).json({ success: true, appointment, message: 'Service request submitted successfully.' });
};

export const getServiceRequests = async (req: Request, res: Response, _next: NextFunction) => {
  const userId = (req as any).userId;

  const requests = await prisma.appointment.findMany({
    where: { 
      bookedBy: userId,
      isServiceRequest: true
    },
    include: {
      beneficiary: { select: { id: true, name: true, photo: true } },
      careCompanion: { select: { id: true, name: true, photo: true } },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, requests });
};
