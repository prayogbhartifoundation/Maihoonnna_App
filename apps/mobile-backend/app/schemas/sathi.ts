import Joi from 'joi';

export const volunteerRegisterSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

export const volunteerLoginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required(),
});

export const volunteerProfileUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional().allow(null, ''),
  age: Joi.number().integer().min(18).max(100).optional(),
  gender: Joi.string().optional().allow(null, ''),
  previousExperience: Joi.string().optional().allow(null, ''),
  whyJoin: Joi.string().optional().allow(null, ''),
  address: Joi.string().optional().allow(null, ''),
  flatPlot: Joi.string().optional().allow(null, ''),
  streetArea: Joi.string().optional().allow(null, ''),
  landmark: Joi.string().optional().allow(null, ''),
  city: Joi.string().optional().allow(null, ''),
  state: Joi.string().optional().allow(null, ''),
  pincode: Joi.string().optional().allow(null, ''),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),
  interests: Joi.array().items(Joi.string()).optional(),
  profilePhoto: Joi.string().optional().allow(null, ''),
});

export const volunteerCheckinSchema = Joi.object({
  beneficiaryId: Joi.string().required(),
  assignmentId: Joi.string().required(),
  notes: Joi.string().optional().allow(''),
});

export const volunteerCheckoutSchema = Joi.object({
  notes: Joi.string().optional().allow(''),
});
