import prisma from '../../core/database';
import { generateUUID, generateEncounterId } from '../../utils/helpers';
import { Prisma } from '@prisma/client';
import { Vitals } from '../../models/visit';

export const createVisit = async (data: {
  beneficiaryId: string;
  careCompanionId: string;
  scheduledTime: Date;
}) => {
  return prisma.visit.create({
    data: { id: generateUUID(), encounterId: generateEncounterId(), ...data },
  });
};

export const getVisit = async (visitId: string) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new Error('Visit not found');
  return visit;
};

export const getBeneficiaryVisits = async (beneficiaryId: string, limit = 50) => {
  return prisma.visit.findMany({
    where: { beneficiaryId },
    orderBy: { scheduledTime: 'desc' },
    take: limit,
  });
};

export const getCareCompanionVisits = async (ccId: string, date?: string) => {
  const where: Prisma.VisitWhereInput = { careCompanionId: ccId };
  if (date) {
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    where.scheduledTime = { gte: start, lte: end };
  }
  return prisma.visit.findMany({ where, orderBy: { scheduledTime: 'asc' } });
};

export const checkIn = async (data: { visitId: string; latitude: number; longitude: number }) => {
  return prisma.visit.update({
    where: { id: data.visitId },
    data: {
      checkInTime: new Date(),
      status: 'in_progress',
      locationLat: data.latitude,
      locationLng: data.longitude,
    },
  });
};

export const checkOut = async (data: {
  visitId: string;
  vitals?: Vitals;
  mood?: string;
  medicationAdherence: boolean;
  notes?: string;
}) => {
  const visit = await prisma.visit.update({
    where: { id: data.visitId },
    data: {
      checkOutTime: new Date(),
      status: 'completed',
      medicationAdherence: data.medicationAdherence,
      extraVitals: data.vitals ? (data.vitals as Prisma.InputJsonValue) : undefined,
      mood: data.mood as any,
      notes: data.notes,
    },
  });

  // Update emotional score if mood is sad/depressed
  if (data.mood === 'sad' || data.mood === 'depressed') {
    await prisma.beneficiary.update({
      where: { id: visit.beneficiaryId },
      data: { emotionalScore: data.mood === 'sad' ? 5.0 : 3.0 },
    });
  }

  return visit;
};

export const rateVisit = async (data: { visitId: string; rating: number; feedback?: string }) => {
  if (data.rating < 1 || data.rating > 5) throw new Error('Rating must be between 1 and 5');
  return prisma.visit.update({
    where: { id: data.visitId },
    data: { rating: data.rating, feedback: data.feedback },
  });
};