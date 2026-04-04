import Joi from 'joi';

export const createSubscriptionSchema = Joi.object({
  subscriberId: Joi.string().uuid().required(),
  beneficiaryId: Joi.string().uuid().required(),
  packageType: Joi.string().valid('silver', 'gold', 'platinum').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  visitsTotal: Joi.number().integer().min(1).required(),
});