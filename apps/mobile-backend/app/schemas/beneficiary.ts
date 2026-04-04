import Joi from 'joi';

export const createBeneficiarySchema = Joi.object({
  subscriberId: Joi.string().uuid().required(),
  phone: Joi.string().required(), // Required so Beneficiary can log in
  name: Joi.string().required(),
  photo: Joi.string().optional(),
  age: Joi.number().integer().min(1).required(),
  gender: Joi.string().required(),
  address: Joi.string().required(),
  medicalConditions: Joi.array().items(Joi.string()).default([]),
  medications: Joi.array().items(Joi.string()).default([]),
  emergencyContacts: Joi.array().items(Joi.object()).default([]),
});

export const updateBeneficiarySchema = Joi.object({
  name: Joi.string().optional(),
  photo: Joi.string().optional(),
  age: Joi.number().integer().optional(),
  gender: Joi.string().optional(),
  address: Joi.string().optional(),
  medicalConditions: Joi.array().items(Joi.string()).optional(),
  medications: Joi.array().items(Joi.string()).optional(),
  emergencyContacts: Joi.array().items(Joi.object()).optional(),
  primaryCcId: Joi.string().uuid().allow(null).optional(),
  emotionalScore: Joi.number().min(0).max(10).optional(),
});