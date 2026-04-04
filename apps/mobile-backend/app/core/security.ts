import jwt from 'jsonwebtoken';
import { config } from './config';

export interface TokenPayload {
  sub: string;
  role: string;
}

export const createToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
};