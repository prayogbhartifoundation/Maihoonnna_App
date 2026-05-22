import Joi from 'joi';

export const createMedicationSchema = Joi.object({
  beneficiaryId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().required(),
  timeSlots: Joi.array().items(Joi.string()).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional(),
});

export const createAdherenceSchema = Joi.object({
  beneficiaryId: Joi.string().uuid().required(),
  medicationId: Joi.string().uuid().required(),
  scheduledTime: Joi.date().required(),
  taken: Joi.boolean().default(false),
  takenTime: Joi.date().optional(),
  recordedBy: Joi.string().uuid().required(),
});