import Joi from 'joi';

export const createEmergencySchema = Joi.object({
  beneficiaryId: Joi.string().uuid().required(),
  requestedBy: Joi.string().uuid().required(),
  description: Joi.string().optional(),
  locationLat: Joi.number().optional(),
  locationLng: Joi.number().optional(),
});

export const updateEmergencySchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'resolved').optional(),
  assignedTo: Joi.string().uuid().allow(null).optional(),
  resolvedAt: Joi.date().optional(),
  notes: Joi.array().items(Joi.object()).optional(),
});