import { v4 as uuidv4 } from 'uuid';

export const generateUUID = (): string => uuidv4();

export const generateEncounterId = (): string =>
  `ENC-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export const generateTicketNumber = (prefix = 'TKT'): string =>
  `${prefix}-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export const generateRandomPhone = (): string =>
  `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

export const sendSuccess = (data: unknown, message = 'Success') => ({
  success: true,
  message,
  data,
});

export const sendError = (message: string, statusCode = 400) => ({
  success: false,
  message,
  statusCode,
});