import { Visit as PrismaVisit } from '@prisma/client';

export type Visit = PrismaVisit;

export interface Vitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  temperature?: number;
  oxygenLevel?: number;
  weight?: number;
  heartRate?: number;
}