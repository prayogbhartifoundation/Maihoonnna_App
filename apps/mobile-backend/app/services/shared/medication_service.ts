import prisma from '../../core/database';
import { generateUUID } from '../../utils/helpers';

export const getBeneficiaryMedications = async (beneficiaryId: string) => {
  return prisma.medication.findMany({ where: { beneficiaryId, isActive: true } });
};

export const createMedication = async (data: {
  beneficiaryId: string;
  name: string;
  dosage: string;
  frequency: string;
  timeSlots: string[];
  startDate: Date;
  endDate?: Date;
}) => {
  return prisma.medication.create({
    data: {
      id: generateUUID(),
      ...data,
      frequency: data.frequency as any,
    },
  });
};

export const createAdherenceRecord = async (data: {
  beneficiaryId: string;
  medicationId: string;
  scheduledTime: Date;
  taken: boolean;
  takenTime?: Date;
  recordedBy: string;
}) => {
  return prisma.medicationAdherence.create({ data: { id: generateUUID(), ...data } });
};