import prisma from '../../core/database';
import { generateUUID, generateTicketNumber } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

export const createEmergency = async (data: {
  beneficiaryId: string;
  requestedBy: string;
  description?: string;
  locationLat?: number;
  locationLng?: number;
}) => {
  return prisma.emergencyRequest.create({
    data: { id: generateUUID(), ticketNumber: generateTicketNumber('EMG'), ...data },
  });
};

export const getActiveEmergencies = async () => {
  return prisma.emergencyRequest.findMany({
    where: { status: { in: ['open', 'in_progress'] } },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateEmergency = async (
  emergencyId: string,
  updates: Prisma.EmergencyRequestUpdateInput
) => {
  const emergency = await prisma.emergencyRequest.findUnique({ where: { id: emergencyId } });
  if (!emergency) throw new Error('Emergency request not found');
  return prisma.emergencyRequest.update({ where: { id: emergencyId }, data: updates });
};