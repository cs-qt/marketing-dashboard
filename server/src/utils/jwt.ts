import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as any,
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.jwt.secret) as JWTPayload;
}

/** Cookie options for JWT */
export const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: (env.isProduction ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};
