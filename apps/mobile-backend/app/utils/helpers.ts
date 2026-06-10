import { v4 as uuidv4 } from 'uuid';

export const generateUUID = (): string => uuidv4();

export const generateEncounterId = (): string =>
  `ENC-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

/**
 * Generates a human-readable Visit Code: V + 8 chars from a safe alphanumeric set.
 * Avoids visually ambiguous characters: O/0, I/1, S/5, B/8.
 * Format: VK7XM4RP — easy to read, type, and say aloud over the phone.
 */
const VISIT_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const generateVisitCode = (): string => {
  let code = 'V';
  for (let i = 0; i < 8; i++) {
    code += VISIT_CODE_CHARSET[Math.floor(Math.random() * VISIT_CODE_CHARSET.length)];
  }
  return code;
};

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