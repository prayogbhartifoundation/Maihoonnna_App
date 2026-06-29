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
  dob: Joi.string().optional(),
  dateOfBirth: Joi.string().optional(),
});

export const updateBeneficiarySchema = Joi.object({
  name: Joi.string().allow('', null).optional(),
  photo: Joi.string().allow('', null).optional(),
  age: Joi.number().integer().allow(null).optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  relationship: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  state: Joi.string().allow('', null).optional(),
  pincode: Joi.string().allow('', null).optional(),
  
  // Physician info
  primaryPhysicianName: Joi.string().allow('', null).optional(),
  primaryPhysicianPhone: Joi.string().allow('', null).optional(),
  primaryPhysicianSpec: Joi.string().allow('', null).optional(),
  
  // Social
  hobbiesInterests: Joi.array().items(Joi.string()).optional(),
  
  // Nested Data
  medicalConditions: Joi.array().items(Joi.string()).optional(),
  medications: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    timeSlots: Joi.array().items(Joi.string()).optional(),
    setReminders: Joi.boolean().optional(),
    instructions: Joi.string().allow('', null).optional(),
  })).optional(),
  
  vitalsData: Joi.object().pattern(Joi.string(), Joi.boolean()).optional(),
  isActive: Joi.boolean().optional(),
  emergencyContacts: Joi.array().items(Joi.object()).optional(),
  primaryCcId: Joi.string().uuid().allow(null).optional(),
  emotionalScore: Joi.number().min(0).max(10).optional(),
}).options({ allowUnknown: true }); // Allow extra fields so frontend changes don't cause 400 errors
