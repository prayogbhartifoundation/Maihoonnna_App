import Joi from 'joi';

export const sendOtpSchema = Joi.object({
  phone: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

export const checkLocationSchema = Joi.object({
  location: Joi.string().required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
});

export const registerPasswordSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().required(),
  age: Joi.number().min(18).max(120).required(),
  password: Joi.string().min(6).required(),
});

export const loginPasswordSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required(),
});