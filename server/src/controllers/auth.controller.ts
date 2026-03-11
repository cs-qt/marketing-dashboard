import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { signToken, cookieOptions } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { generateMagicLink, verifyMagicLink } from '../services/magicLink.service.js';
import { User } from '../models/index.js';
import { UserRole, AuthMethod } from '@expertmri/shared';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen.
 */
export function googleAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(
    req,
    res,
    next
  );
}

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback.
 */
export function googleCallback(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    'google',
    { session: false, failureRedirect: `${env.clientUrl}/login?error=auth_failed` },
    (err: any, user: any) => {
      if (err || !user) {
        logger.error('Google OAuth callback error:', err);
        return res.redirect(`${env.clientUrl}/login?error=auth_failed`);
      }

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.cookie('token', token, cookieOptions);
      res.redirect(`${env.clientUrl}/dashboard`);
    }
  )(req, res, next);
}

/**
 * POST /api/auth/magic-link
 * Send magic link email to reviewer.
 */
export async function requestMagicLink(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    await generateMagicLink(email);
    sendSuccess(res, null, 'Magic link sent! Check your email.');
  } catch (error: any) {
    logger.error('Magic link request error:', error);
    sendError(res, error.message || 'Failed to send magic link');
  }
}

/**
 * GET /api/auth/magic-link/verify?token=xxx
 * Verify magic link and set JWT cookie.
 */
export async function verifyMagicLinkToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.redirect(`${env.clientUrl}/login?error=invalid_token`);
      return;
    }

    const user = await verifyMagicLink(token);

    const jwtToken = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.cookie('token', jwtToken, cookieOptions);
    res.redirect(`${env.clientUrl}/dashboard`);
  } catch (error: any) {
    logger.error('Magic link verify error:', error);
    res.redirect(`${env.clientUrl}/login?error=invalid_token`);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }
  sendSuccess(res, {
    _id: req.user._id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
    role: req.user.role,
    authMethod: req.user.authMethod,
    isActive: req.user.isActive,
    createdAt: req.user.createdAt,
  });
}

/**
 * POST /api/auth/logout
 * Clear JWT cookie.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  sendSuccess(res, null, 'Logged out successfully');
}
