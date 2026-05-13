import prisma from '../../core/database';
import { generateUUID } from '../../utils/helpers';
import { MedicationAdherenceManager } from './MedicationAdherenceManager';

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

/**
 * Instantiate MedicationAdherenceManager to get today's dynamic schedule.
 */
export const getTodayMedications = async (beneficiaryId: string) => {
  const manager = new MedicationAdherenceManager(beneficiaryId);
  return manager.getTodaySchedule();
};

/**
 * Instantiate MedicationAdherenceManager to log a dose adherence event.
 */
export const logAdherence = async (
  beneficiaryId: string,
  medicationId: string,
  scheduledTimeIso: string,
  taken: boolean,
  recordedBy: string
) => {
  const manager = new MedicationAdherenceManager(beneficiaryId);
  return manager.logAdherence(medicationId, scheduledTimeIso, taken, recordedBy);
};

/**
 * Instantiate MedicationAdherenceManager to get average scores and summary counts.
 */
export const getMedicationMetrics = async (beneficiaryId: string) => {
  const manager = new MedicationAdherenceManager(beneficiaryId);
  return manager.getOverallMetrics();
};